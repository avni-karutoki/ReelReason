# ReelReason API — production backend image.
# Self-contained FastAPI + Uvicorn container with FFmpeg for the in-process
# vertical reel renderer. No secrets are baked into the image: supply every
# runtime config (Supabase keys, GEMINI_API_KEY, ALLOWED_ORIGINS, ...) via
# environment variables (Render/Railway/Fly/Cloud Run all support this).
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# ffmpeg/ffprobe power the local render fallback (real 9:16 cut + burned-in
# captions); curl is used by the container healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first so code changes don't bust this layer.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (see .dockerignore for what is excluded).
COPY . .

# Runtime workspace for clip cuts, subtitle files and thumbnails.
RUN mkdir -p /tmp/reelreason

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f "http://localhost:${PORT:-8000}/health" || exit 1

# PORT env var can override the default listening port.
CMD ["sh", "-c", "exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
