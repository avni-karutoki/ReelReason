# ReelReason Backend: AI Systems Architecture & API Engine

> **ReelReason: From hours of content to reels worth watching.**  
> *ReelReason does not just find clips—it decides which stories deserve to be told, and explains why.*

Production-grade, modular backend service built with **Python 3.10+**, **FastAPI**, **Supabase** (PostgreSQL, Auth, Storage, RLS), **FFmpeg**, **yt-dlp**, and **Gemini / Whisper / Remotion** integrations.

---

## 🌟 Core System Architecture

```text
 ┌───────────────────────┐         ┌─────────────────────────┐
 │   User / Frontend     │         │   YouTube / MP4 Upload  │
 └──────────┬────────────┘         └────────────┬────────────┘
            │                                   │
            ▼                                   ▼
 ┌───────────────────────────────────────────────────────────┐
 │                   FastAPI Gateway Router                  │
 │      • BackgroundTasks Non-Blocking Execution            │
 │      • Supabase JWT Authentication & RLS                  │
 └──────────────────────┬────────────────────────────────────┘
                        │
                        ▼
 ┌───────────────────────────────────────────────────────────┐
 │              22-Step Orchestration Pipeline               │
 ├───────────────────────────────────────────────────────────┤
 │ 1. Source Retrieval (yt-dlp YouTube / Video Upload)       │
 │ 2. Audio Extraction (FFmpeg Mono 16kHz)                   │
 │ 3. Speech Transcription (Whisper API / AssemblyAI)       │
 │ 4. Text Processing (Filler-Word Cleaning & Segmentation) │
 │ 5. Explainable Reasoning Engine (Gemini / GPT)            │
 │ 6. Scoring, Penalties & Diversity Allocation              │
 │ 7. Remotion 9:16 Vertical Renderer Dispatch               │
 └──────────────────────┬────────────────────────────────────┘
                        │
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Supabase   │ │ LLM AI Model │ │   Remotion   │
│  PostgreSQL  │ │   (Gemini)   │ │ 9:16 Render  │
│  & Storage   │ │              │ │ Microservice │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🚀 Crucial Implementation Constraints Implemented

1. **YouTube Downloads (`services/ffmpeg_service.py`):**
   - Implemented `yt-dlp` in `services/ffmpeg_service.py` (`download_youtube_video`) to download YouTube and Shorts URLs into local MP4 streams prior to FFmpeg audio extraction.
2. **Supabase User Trigger (`schema.sql`):**
   - Included `AFTER INSERT ON auth.users` trigger (`on_auth_user_created`) and `handle_new_user()` PL/pgSQL function to auto-populate `public.users` immediately upon account creation, preventing foreign key constraints on project creation.
3. **Async Tasks (`app/routes/projects.py`):**
   - Utilizes FastAPI `BackgroundTasks` in route handlers (`create_project` and `trigger_analysis`) to guarantee non-blocking HTTP responses while long-running audio extraction, transcription, and reasoning execute asynchronously.
4. **Timestamp Parsing (`utils/time_utils.py`):**
   - Implemented `parse_timestamp_to_seconds()` to parse `"MM:SS"`, `"HH:MM:SS"`, or millisecond timestamps from LLM outputs into exact `float` seconds before Supabase database insertion.
5. **Zero Code Truncation:**
   - 100% complete files, all imports declared, zero `# TODO` or `pass` placeholders.

---

## 🗄️ Database & Storage Architecture

### PostgreSQL Tables (`backend/schema.sql`)
- `public.users`: Extended creator profile, platform defaults, preferred clip types.
- `public.video_projects`: Projects with creator context, status state machine, media paths.
- `public.transcripts`: Full speech transcript, word-level and segment-level timestamps.
- `public.transcript_segments`: Cleaned semantic segments bounded between 20s and 90s.
- `public.clip_suggestions`: Strategic clips, explainable reasoning ("Why this clip?"), 5-parameter score breakdown, and posting order.
- `public.rendered_reels`: Render queue status (`queued` -> `processing` -> `completed`), Remotion job ID, and vertical MP4 URLs.
- `public.clip_feedback`: Creator feedback signals (`approved`, `rejected`, `edited`, `rendered`, `downloaded`).
- `public.job_logs`: Complete pipeline audit trail.

### Supabase Storage Buckets
- `reelreason-videos`: Source uploaded videos.
- `reelreason-audio`: Extracted 16kHz audio files.
- `reelreason-rendered`: Rendered vertical 9:16 MP4 reels.
- `reelreason-thumbnails`: Generated clip preview frames.

---

## 📐 Scoring Formula & Diversity Balancing

ReelReason calculates clip suitability using a weighted multi-factor formula:
$$\text{overall\_score} = 0.30 \times \text{hook} + 0.25 \times \text{clarity} + 0.20 \times \text{audience\_fit} + 0.15 \times \text{shareability} + 0.10 \times \text{confidence}$$

### Strategic Penalties
- Slow Hook Penalty (-15 pts): Penalizes generic openers like "So basically...", "Welcome back...".
- Excessive Duration Penalty (-15 pts): Penalizes clips exceeding 90 seconds.
- Insufficient Duration Penalty (-20 pts): Penalizes incomplete thoughts under 20 seconds.
- Type Mismatch Penalty (-10 pts): Penalizes clips outside the creator's preferred archetype.

### Duplicate-Idea Detection
Compares token Jaccard similarity across candidate titles and hooks. Any clip exceeding 45% semantic similarity is dropped in favor of the higher-scoring clip.

### Diversity Archetype Distribution
- **3 Clips:** 1 Strong Opinion, 1 Practical Lesson, 1 Story / Emotional Moment.
- **5 Clips:** 1 Opinion, 1 Lesson, 1 Story, 1 Emotional Moment, 1 Contrarian Take / Insight.
- **7 Clips:** Adds Humor clip and supplementary Lesson / Insight.

---

## 🎬 Remotion Renderer Integration Contract

When a user requests rendering (`POST /api/clips/{clip_id}/render`), the backend formats and dispatches the following JSON payload:

```json
{
  "render_job_id": "render_9a8b7c6d5e",
  "clip_id": "90e9d6bf-4638-4e89-98e3-53d9e0339d67",
  "project_id": "67f08833-2895-46aa-b2b7-a87071dbd318",
  "video_url": "https://storage.reelreason.ai/reelreason-videos/user123/project.mp4",
  "start_time": "00:12",
  "end_time": "00:48",
  "aspect_ratio": "9:16",
  "hook": "Most creators edit for hours but choose the wrong moments.",
  "title": "The biggest trap in video editing",
  "caption": "Stop clipping randomly. Ask these three questions first.",
  "hashtags": ["#contentcreator", "#videoediting", "#reelsgrowth"],
  "creator_handle": "@reelreason",
  "subtitle_style": {
    "font": "Inter",
    "font_size": 42,
    "color": "#FFFFFF",
    "highlight_color": "#7C3AED",
    "position": "bottom"
  },
  "word_timestamps": [
    { "word": "Most", "start": 12.0, "end": 12.3 },
    { "word": "creators", "start": 12.4, "end": 12.8 },
    { "word": "edit", "start": 12.9, "end": 13.2 }
  ]
}
```

---

## 🛠️ Mock / Demo Mode

To develop, evaluate, and demo without API keys or usage fees:
```env
AI_PROVIDER=mock
ENVIRONMENT=demo
```
In mock mode:
- Instant realistic transcript with word-level timestamps.
- Curated showcase clips demonstrating explainable reasoning.
- Simulated non-blocking pipeline progression with realistic time delays.
- Immediate Remotion preview reel URLs.

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/projects` | Creates project (upload or YouTube) & queues background processing |
| `GET` | `/api/projects` | Lists all projects for authenticated user |
| `GET` | `/api/projects/{id}` | Gets project details & ownership verification |
| `DELETE`| `/api/projects/{id}` | Deletes project and associated storage |
| `POST` | `/api/projects/{id}/analyze` | Manually triggers/retries 22-step pipeline in background |
| `GET` | `/api/projects/{id}/status` | Polls progress percentage (0-100%) and current step |
| `GET` | `/api/projects/{id}/transcript` | Full transcript + timestamped semantic segments |
| `GET` | `/api/projects/{id}/clips` | Returns ranked clips with filters & sorting |
| `GET` | `/api/clips/{id}` | Single clip details with explainable reasoning |
| `PATCH`| `/api/clips/{id}` | Edits hook, title, caption, hashtags, timestamps |
| `POST` | `/api/clips/{id}/approve` | Marks clip approved |
| `POST` | `/api/clips/{id}/reject` | Marks clip rejected |
| `POST` | `/api/clips/{id}/regenerate-hook` | Generates 3 alternative viral hook angles |
| `POST` | `/api/clips/{id}/regenerate-caption`| Regenerates platform-tailored caption & hashtags |
| `POST` | `/api/clips/{id}/render` | Queues 9:16 vertical render via Remotion |
| `GET` | `/api/reels/{id}` | Returns render status & final MP4 URL |
| `GET` | `/api/reels/{id}/download` | Secure redirect / download of final MP4 |
| `GET` | `/api/projects/{id}/reels` | Lists all rendered reels for project |
| `POST` | `/api/clips/{id}/feedback` | Records user interaction signals |
| `GET` | `/api/users/me` | Creator profile & defaults |
| `PATCH`| `/api/users/me` | Updates creator defaults |

---

## ⚙️ Local Setup Instructions

1. **Clone & Install Dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials or leave AI_PROVIDER=mock for instant demo
   ```

3. **Apply Database Schema:**
   - In your Supabase Dashboard -> SQL Editor, run `backend/schema.sql`.

4. **Run FastAPI Server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Run Test Suite:**
   ```bash
   pytest
   ```
