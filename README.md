# ReelReason — From hours of content to reels worth watching

> **ReelReason does not just find clips — it decides which stories deserve to be told, and explains why.**

Full-stack AI video repurposing studio. Upload a long video (or link a YouTube one), and the engine transcribes it, discovers high-retention moments, scores them with an explainable weighted model, and renders ready-to-post 9:16 vertical reels.

```
├── frontend/   React 19 + Vite + Tailwind studio (screens, editor, exports)
└── backend/    FastAPI engine (transcription, explainable analysis, Remotion render)
```

---

## Running the full stack locally

### 1. Backend (FastAPI on :8000)

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows  (Linux/macOS: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env           # fill in Supabase/AI credentials
uvicorn main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

**Configuring credentials:** `backend/.env` needs your Supabase project URL + keys,
and AI providers (`AI_PROVIDER=mock` works without keys; `gemini`/`openai` need API
keys; transcription via `openai` Whisper or `assemblyai`).

### 2. Frontend (Vite on :3000)

```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

Point the frontend at the backend with `VITE_API_URL` in `frontend/.env`
(see `frontend/.env.example`). If the backend is unreachable, the studio runs in a
fully client-side demo mode, so it never breaks.

---

## How the pieces fit

```text
Upload / YouTube URL ──► POST /api/projects ──► Background pipeline
                                                 ├─ yt-dlp / upload → FFmpeg audio → Whisper transcript
                                                 ├─ Gemini reasoning → weighted explainable clip scoring
                                                 └─ Remotion 9:16 render dispatch (queued → completed)
Studio polls GET /api/projects/{id}/status ──► clips surface in the dashboard ──► render & export
```

The frontend keeps an offline-resistant local mirror (localStorage) of backend
state, so navigation, editing, approvals, and deletions keep working and are
written through to the API when possible.

See `backend/README.md` for the complete architecture and API contract.
