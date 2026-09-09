# PrepQuest

PrepQuest is a gamified, AI-powered mock-test generator for competitive exam
aspirants (GATE, UGC-NET, JEE, GRE, UPSC, CSIR-NET, and more). Give it your
notes, an uploaded file, or just an exam/topic name, and it uses the Gemini
API to build a full MCQ paper — deliberately harder than the real exam — that
you take inside a game-like test interface, complete with GATE-style
negative marking, a question palette, and an instant results/analytics
screen with full worked solutions.

The app is fully stateless: no database, no accounts. A display name in
`localStorage` just greets you and labels your cumulative XP. Everything
about a given test — including the answer key — lives in the browser's
memory for that session only.

## Tech stack

- **Backend:** Python, FastAPI, served with `uvicorn`
- **Frontend:** React (Vite), hand-written CSS Modules
- **AI:** Google Gemini API via the `google-genai` SDK
- **Deployment:** Render, as a single Python web service — the React app is
  built at deploy time and served as static files directly by FastAPI, so
  there's one URL, one service, and no CORS setup

## Repository structure

```
prepquest/
├── backend/            FastAPI app, Gemini integration, Pydantic schemas
├── frontend/            React (Vite) app
├── render.yaml           Render Blueprint
├── .env.example
└── .gitignore
```

## Local development

Run the backend and frontend as two separate processes. The Vite dev
server proxies `/api/*` to the local FastAPI server (see
`frontend/vite.config.js`), so there's no CORS configuration to worry about.

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
```

Create a `.env` file at the repo root (copy `.env.example`) with your Gemini
API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-pro-preview
```

Then run the API:

```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). API calls
made from the frontend are proxied to `http://localhost:8000`.

### 3. Production-style local run (single service, like Render)

```bash
cd frontend && npm install && npm run build
cd ../backend && pip install -r requirements.txt
uvicorn main:app
```

This serves the built frontend and the API from one process at
`http://localhost:8000`.

## Deploying to Render

**Option A — Blueprint (recommended):**

1. Push this repo to GitHub.
2. In the Render dashboard, choose **New → Blueprint** and point it at the
   repo. Render will read `render.yaml` and create the web service with the
   correct build/start commands automatically.
3. Once created, open the service's **Environment** tab and set
   `GEMINI_API_KEY` to your key. `GEMINI_MODEL` is already set in
   `render.yaml`, but you can override it there too.
4. Deploy. That's it — no other configuration is needed.

**Option B — Manual web service:**

1. **New → Web Service**, connect the repo, environment = Python.
2. Build command:
   ```
   cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
   ```
3. Start command:
   ```
   cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) under the
   **Environment** tab.

## Getting a Gemini API key

Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

`gemini-3.1-pro-preview` (the default model) currently requires a Google
Cloud project with billing enabled — there is no free tier for this
specific preview model as of mid-2026. If you'd rather use a free-tier
model, swap the `GEMINI_MODEL` environment variable (e.g. to
`gemini-3-flash-preview`) — it's a one-line env var change, both locally
and in the Render dashboard, and requires no code changes.

## Notes on the Gemini integration

`backend/gemini_service.py` is the only file that touches the `google-genai`
client. Structured JSON output is requested via
`GenerateContentConfig(response_mime_type="application/json", response_schema=MCQTestPaper)`
— the SDK's current, documented mechanism for constrained JSON output
(there's no `response_format` parameter in the SDK's public API). A failed
or malformed generation is retried once automatically before the endpoint
returns a friendly `502` error to the frontend.

## API

- `POST /api/generate-test` — `multipart/form-data`: `exam_name`,
  `difficulty` (`same` | `harder` | `much_harder`), `num_questions`,
  optional `pasted_text`, optional `topic_name`, optional `uploaded_file`
  (`.pdf`, `.docx`, `.png`, `.jpg`/`.jpeg`, `.txt`, max 10 MB). Returns the
  full `MCQTestPaper` JSON, including correct answers and solutions — the
  frontend holds this in memory for the session only.
- `GET /api/health` — `{"status": "ok"}`, used for Render health checks.
- Everything else is served by the built React app, with a catch-all so
  client-side routes survive a hard refresh.
