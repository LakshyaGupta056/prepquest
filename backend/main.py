"""
FastAPI entrypoint for PrepQuest.

Serves the built React app (frontend/dist) as static files and exposes the
small JSON API the frontend calls under /api/*. Designed to run as a single
Render web service — one process, one port, no separate frontend host.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Loads GEMINI_API_KEY / GEMINI_MODEL from a local .env for development.
# On Render, environment variables are injected directly and this is a no-op.
load_dotenv()

from gemini_service import GeminiGenerationError, generate_test
from prompt_templates import MAX_PASTED_TEXT_CHARS
from schemas import DifficultyLevel, MCQTestPaper

app = FastAPI(title="PrepQuest API")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".txt"}
VALID_DIFFICULTIES = {"same", "harder", "much_harder"}


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/generate-test")
async def api_generate_test(
    exam_name: str = Form(...),
    difficulty: str = Form(...),
    num_questions: int = Form(...),
    pasted_text: str | None = Form(None),
    topic_name: str | None = Form(None),
    uploaded_file: UploadFile | None = File(None),
):
    # --- validation -------------------------------------------------------
    if difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(
            status_code=400,
            detail=f"difficulty must be one of {sorted(VALID_DIFFICULTIES)}",
        )

    if not (1 <= num_questions <= 100):
        raise HTTPException(
            status_code=400, detail="num_questions must be between 1 and 100"
        )

    pasted_text = (pasted_text or "").strip() or None
    topic_name = (topic_name or "").strip() or None
    exam_name = exam_name.strip()

    if not exam_name:
        raise HTTPException(status_code=400, detail="exam_name is required")

    has_file = uploaded_file is not None and bool(uploaded_file.filename)

    if not any([pasted_text, topic_name, has_file]):
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of: pasted text, a topic/exam reference, "
            "or an uploaded file.",
        )

    if pasted_text and len(pasted_text) > MAX_PASTED_TEXT_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Pasted text is too long (max {MAX_PASTED_TEXT_CHARS:,} characters). "
            "Please trim it and try again.",
        )

    uploaded_file_bytes: bytes | None = None
    uploaded_file_ext: str | None = None

    if has_file:
        uploaded_file_ext = Path(uploaded_file.filename).suffix.lower()
        if uploaded_file_ext not in ALLOWED_UPLOAD_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{uploaded_file_ext}'. Allowed: "
                f"{sorted(ALLOWED_UPLOAD_EXTENSIONS)}",
            )

        uploaded_file_bytes = await uploaded_file.read()
        if len(uploaded_file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is too large (max 10 MB).",
            )

    # --- generation ---------------------------------------------------
    try:
        test_paper: MCQTestPaper = generate_test(
            exam_name=exam_name,
            difficulty=difficulty,  # type: ignore[arg-type]
            num_questions=num_questions,
            pasted_text=pasted_text,
            topic_name=topic_name,
            uploaded_file_bytes=uploaded_file_bytes,
            uploaded_file_ext=uploaded_file_ext,
        )
    except GeminiGenerationError as exc:
        return JSONResponse(
            status_code=502,
            content={
                "error": "Couldn't generate your test — try again in a moment.",
                "detail": str(exc),
            },
        )
    except ValueError as exc:
        # e.g. an unreadable .docx
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - final safety net, never leak a stack trace
        return JSONResponse(
            status_code=502,
            content={
                "error": "Couldn't generate your test — try again in a moment.",
                "detail": "Unexpected error while contacting Gemini.",
            },
        )

    return {"test": test_paper.model_dump()}


# ---------------------------------------------------------------------------
# Static frontend hosting
#
# The frontend is built at deploy time into frontend/dist. We serve its
# assets directly and fall back to index.html for any non-API route so
# React Router's client-side routes survive a hard refresh.
# ---------------------------------------------------------------------------

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="frontend-assets",
    )

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
