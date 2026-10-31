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

### 3. Token & credential checklist (what makes it "real")

| Token / credential | Where you get it | Used for | Files |
|---|---|---|---|
| **Supabase Project URL + Anon Key** | supabase.com → New Project → Settings → API | Real accounts (sign up / login) + all database reads/writes | `backend/.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and `frontend/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
| **Supabase JWT Secret** | Supabase → Settings → API → JWT Settings | Backend verifies session tokens | `backend/.env` (`SUPABASE_JWT_SECRET`) |
| **Database schema** | Run `backend/schema.sql` in the Supabase SQL editor | Creates 8 tables, RLS policies, storage buckets, and the auto-user trigger | Supabase SQL editor |
| **Gemini API Key** | aistudio.google.com → Get API key | Real explainable clip analysis + hooks/captions (`AI_PROVIDER=gemini`) and real speech-to-text with word-level timestamps (`TRANSCRIPTION_PROVIDER=gemini`) — one key covers both. `GEMINI_FALLBACK_MODELS` lists backup analysis models used when the primary hits capacity (e.g. `gemini-3.5-flash,gemini-3.5-flash-lite`) | `backend/.env` (`GEMINI_API_KEY`, optional `AI_MODEL_NAME`, `GEMINI_TRANSCRIBE_MODEL`, `GEMINI_FALLBACK_MODELS`) |
| **Transcription key** | Alternatively an OpenAI platform key (`TRANSCRIPTION_PROVIDER=openai`) or AssemblyAI — set to `mock` to skip | Speech-to-text with word timestamps | `backend/.env` |
| **Frontend API URL** | — | Points the studio at the backend | `frontend/.env` (`VITE_API_URL`) |

> ⚙️ **Fastest working path:** create the Supabase project + run `schema.sql`, copy its URL/anon/service keys into both `.env` files, and leave `AI_PROVIDER=mock` + `TRANSCRIPTION_PROVIDER=mock` first — the entire upload → pipeline → clips → render flow works end-to-end. Adding the Gemini key upgrades it to real AI analysis and real transcription (both from one key).
> The storage buckets (`reelreason-videos`, `-audio`, `-rendered`, `-thumbnails`) are created by `schema.sql`; confirm in Supabase → Storage.

---

## How the pieces fit

```text
Upload / YouTube URL ──► POST /api/projects ──► Background pipeline
                                                 ├─ yt-dlp / upload → FFmpeg audio → transcript (Gemini or Whisper, word timestamps)
                                                 ├─ Gemini reasoning → weighted explainable clip scoring
                                                 └─ 9:16 render (Remotion microservice, or built-in FFmpeg renderer with
                                                    burned-in word-timed captions when Remotion isn't connected)
Studio polls GET /api/projects/{id}/status ──► clips surface in the dashboard ──► render & export
```

The frontend keeps an offline-resistant local mirror (localStorage) of backend
state, so navigation, editing, approvals, and deletions keep working and are
written through to the API when possible.

See `backend/README.md` for the complete architecture and API contract.
