# ReelReason — Purposeful Video Repurposing Studio

> Transform long videos into purposeful, engaging vertical reels with explainable AI moment selection, stronger hooks, and customizable caption overlays.

Built as a high-end, 100% client-side frontend prototype with an Electric Cyber-Studio design system, dynamic audio visualizers, and realistic workflow simulations ready for team integration and GitHub push.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build & Verify
```bash
npm run build
npm run lint
```

---

## 🎨 Electric Studio Design System

ReelReason features an electric studio theme designed for modern AI creative software:

- **Flagship Dark Canvas (Obsidian):** `#07080D`
- **Studio Card Surfaces:** `#0E101A` & `#141724`
- **Primary Brand Accent (Electric Indigo/Violet):** `#6366F1` ➔ `#8B5CF6`
- **Cyber Highlight Accent (Neon Cyan):** `#22D3EE` / `#06B6D4`
- **High-Virality Indicator (Emerald):** `#10B981` / `#34D399`
- **Borders & Outlines:** `rgba(255, 255, 255, 0.08)` with glowing violet/cyan active focus
- **Clean Slate Light Mode:** `#F8FAFC` canvas with `#FFFFFF` cards and `#E2E8F0` hairline borders
- **Typography:** Inter (headings & body) + JetBrains Mono (metrics, timestamps, tags)

---

## 🗺️ Completed Pages & Routes

1. **`/` — Landing Page:**
   - Hero with interactive sample masterclasses (Podcast, Keynote, Tutorial)
   - Real-time preview card with glowing score pills (Hook Strength 97%, Retention 95%, Virality 94%)
   - 4-step workflow breakdown with glowing gradient numerals
   - Purposeful clipping vs generic AI slop comparison
   - Before-and-after video transformation showcase
   - Multi-creator use cases (Podcasts, Education, Founders, etc.)

2. **`/upload` — Upload Studio:**
   - Drag-and-drop local video upload (MP4, MOV, WEBM) with animated dashed border
   - Real-time client-side video preview via `URL.createObjectURL`
   - Quick sample preset buttons (Podcast, Keynote, Tutorial)
   - Creator Context intake: Platform, Audience, Tone, Goal, Language, Clip Categories, Reel Count
   - Privacy guarantee (no server file upload)

3. **`/project/:id/processing` — Simulated Analysis Pipeline:**
   - 8-step pipeline visualization with glowing progress bar and live ETA countdown
   - Fast-forward turbo mode for instant testing
   - Cancel and skip-to-dashboard handlers

4. **`/project/:id/clips` — Clip Recommendations Dashboard:**
   - Video metadata header & strategic posting sequence advice
   - Virality and retention metric scorecards
   - Slide-out **"Why this clip?" Reasoning Drawer** with algorithmic explanation
   - Filtering by category and approval status; sorting by score, duration, and timestamp
   - Inline 9:16 preview modal with audio visualizer, 1-click Approval & Rejection, and direct Edit triggers

5. **`/project/:id/clips/:clipId` — 3-Column Clip Studio Editor:**
   - **Left Column:** Live 9:16 vertical reel preview player with animated audio visualizer waves, subtitle overlays, watermark toggle, and segment trimmer
   - **Center Column:** Editable Hook (with 1-click alternative cycling), Title, Caption, Hashtags, Start/End timestamp validation, and Subtitle styling (Bold Punch, Clean Editorial, Minimal Lower, Karaoke Pop)
   - **Right Column:** Scorecards, retention warning advisories, and alternative hooks with 1-click application

6. **`/project/:id/export` — Export & Publishing Hub:**
   - Approved clips list & simulated rendering progress with gradient fill
   - Synchronized `.SRT` subtitle file generation and direct browser download
   - Complete reel package (.txt bundle) download
   - 1-click clipboard copy for optimized captions, hashtags, and titles
   - Local raw MP4 asset download when a user uploads their own file

7. **`/projects` — Project History Library:**
   - Search by title, platform, or audience
   - Filter by status (All, Completed, Processing, Draft)
   - Interactive studio project cards with duration, clip counts, approved counts, and dates
   - Project deletion with confirmation modal

8. **`/settings` — Creator Settings & Preferences:**
   - Profile management with creator avatar
   - Brand Kit: handle, accent color picker, font options, watermark toggle, subtitle preset
   - AI discovery preferences (default platform, tone, audience, categories, clip count)
   - Appearance switcher (Electric Obsidian, Cool Slate, System theme)
   - Danger zone for clearing browser storage

---

## 🛡️ Architecture & Backend Integration Points

### 100% Frontend Only
- **Zero backend code:** No Node.js server routes, no Express endpoints, no database connection, no FFmpeg binary dependencies.
- **Client-Side Persistence:** Lightweight project metadata and preferences are stored in `localStorage` under `reelreason_projects_v1` and `reelreason_settings_v1`.
- **In-Memory File Safety:** User-uploaded video files are previewed via browser `URL.createObjectURL` and never uploaded to any remote server.

### Ready for Teammates to Connect Backend APIs:
1. **Video Ingestion & Transcription:**
   - In `src/pages/UploadPage.tsx` (`handleSubmit`), replace the local `createProject` call with an HTTP `POST /api/projects` endpoint uploading `FormData` containing the file and creator context.
2. **Analysis & Pipeline Polling:**
   - In `src/pages/ProcessingPage.tsx`, replace the simulated timer with Server-Sent Events (SSE) or polling `GET /api/projects/:id/status` until the 8 steps return complete.
3. **Clip Retrieval & AI Generation:**
   - In `src/context/ProjectContext.tsx`, hook `getProject` to `GET /api/projects/:id` to retrieve real transcription segments, LLM-generated hooks, and retention scores.
4. **Video Rendering (FFmpeg):**
   - In `src/pages/ExportPage.tsx` (`simulateClipRender`), wire the button to call `POST /api/projects/:id/clips/:clipId/render` to trigger remote video cropping and caption burning.
