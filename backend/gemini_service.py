"""
All Gemini API calls live in this module. Nothing outside this file should
ever touch the `google-genai` client directly.

NOTE ON THE STRUCTURED-OUTPUT CALL SHAPE:
The current `google-genai` SDK configures JSON structured output via
`GenerateContentConfig(response_mime_type="application/json", response_schema=...)`,
NOT a `response_format={"text": {...}}` dict. That older-looking shape isn't
part of the SDK's public API, so this module uses the verified
`response_mime_type` / `response_schema` pattern instead — this is the one
part of the original spec that was adjusted to something that actually runs.
"""

import os

from google import genai
from google.genai import types

from content_extractors import extract_docx_text
from prompt_templates import build_generation_instructions
from schemas import DifficultyLevel, MCQTestPaper

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview")

# Lazily created so the app can still boot (e.g. for /api/health) even if
# GEMINI_API_KEY isn't set yet in a given environment.
_client: genai.Client | None = None


class GeminiGenerationError(Exception):
    """Raised when Gemini fails to produce a usable test paper after retries."""


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        # genai.Client() reads GEMINI_API_KEY from the environment automatically.
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
    """Assemble the leading `contents` parts (everything except the final
    instruction text) from whatever study material the user supplied.
    """
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
    """Call Gemini to produce a full MCQTestPaper, with one automatic retry
    if the first attempt returns malformed JSON, a schema mismatch, or the
    wrong question count.
    """
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

    for attempt in range(2):  # one initial attempt + one retry
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=MCQTestPaper,
                ),
            )

            test_paper = MCQTestPaper.model_validate_json(response.text)

            if len(test_paper.questions) != num_questions:
                raise GeminiGenerationError(
                    f"Expected {num_questions} questions but Gemini returned "
                    f"{len(test_paper.questions)}."
                )

            return test_paper

        except Exception as exc:  # noqa: BLE001 - deliberately broad, retried once
            last_error = exc
            continue

    raise GeminiGenerationError(
        "Gemini failed to generate a valid test paper after a retry."
    ) from last_error
