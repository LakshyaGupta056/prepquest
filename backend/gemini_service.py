"""
All Gemini API calls live in this module. Nothing outside this file should
ever touch the `google-genai` client directly.
"""

import os

from google import genai
from google.genai import types

from content_extractors import extract_docx_text
from prompt_templates import build_generation_instructions
from schemas import DifficultyLevel, MCQTestPaper

# FIX 1: Use the correct, incredibly fast production model
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

_client: genai.Client | None = None

class GeminiGenerationError(Exception):
    """Raised when Gemini fails to produce a usable test paper after retries."""

def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client()
    return _client

_DOCX_EXTENSIONS = {".docx"}
_INLINE_MIME_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}

def _build_content_parts(
    pasted_text: str | None,
    uploaded_file_bytes: bytes | None,
    uploaded_file_ext: str | None,
) -> list:
    parts: list = []

    if uploaded_file_bytes is not None and uploaded_file_ext is not None:
        ext = uploaded_file_ext.lower()
        if ext in _DOCX_EXTENSIONS:
            extracted_text = extract_docx_text(uploaded_file_bytes)
            parts.append(f"Study content extracted from an uploaded document:\n{extracted_text}")
        elif ext in _INLINE_MIME_TYPES:
            parts.append(
                types.Part.from_bytes(
                    data=uploaded_file_bytes,
                    mime_type=_INLINE_MIME_TYPES[ext],
                )
            )
        elif ext == ".txt":
            parts.append(
                "Study content from an uploaded text file:\n"
                + uploaded_file_bytes.decode("utf-8", errors="replace")
            )
        else:
            raise ValueError(f"Unsupported uploaded file type: {ext}")

    if pasted_text:
        parts.append("Additional study notes:\n" + pasted_text)

    return parts

def generate_test(
    exam_name: str,
    difficulty: DifficultyLevel,
    num_questions: int,
    pasted_text: str | None,
    topic_name: str | None,
    uploaded_file_bytes: bytes | None,
    uploaded_file_ext: str | None,
) -> MCQTestPaper:
    client = _get_client()

    content_parts = _build_content_parts(pasted_text, uploaded_file_bytes, uploaded_file_ext)
    has_uploaded_content = bool(content_parts)

    instructions = build_generation_instructions(
        exam_name=exam_name,
        difficulty=difficulty,
        num_questions=num_questions,
        topic_name=topic_name,
        has_uploaded_content=has_uploaded_content,
    )

    contents = [*content_parts, instructions]
    last_error: Exception | None = None

    for attempt in range(2): 
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=MCQTestPaper,
                    temperature=0.2, # FIX 2: Lower temperature for strict, predictable JSON formatting
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True), # FIX 3: Silences the SDK bug warning
                ),
            )

            test_paper = MCQTestPaper.model_validate_json(response.text)

            if len(test_paper.questions) != num_questions:
                raise GeminiGenerationError(
                    f"Expected {num_questions} questions but Gemini returned "
                    f"{len(test_paper.questions)}."
                )

            return test_paper

        except Exception as exc: 
            last_error = exc
            continue

    raise GeminiGenerationError(
        f"Gemini API rejected the configuration. Details: {str(last_error)}"
    ) from last_error