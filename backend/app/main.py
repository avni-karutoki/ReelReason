"""
ReelReason FastAPI Main Application Entry Point.
AI-Powered Engine that transforms long videos into purposeful, ready-to-post vertical reels
with explainable reasoning.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.routes import projects, transcripts, clips, reels, feedback, users
from app.utils.ffmpeg_paths import ensure_ffmpeg_on_path

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
# Third-party transport libraries log every HTTP frame at DEBUG (hpack/httpcore);
# keep them at INFO so server logs stay readable even in debug mode.
for _noisy in ("hpack", "httpcore", "httpx", "httpx._main", "urllib3"):
    logging.getLogger(_noisy).setLevel(logging.INFO)
logger = logging.getLogger("reelreason.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info(f"Starting {settings.APP_NAME} in '{settings.ENVIRONMENT}' environment (AI_PROVIDER={settings.AI_PROVIDER})")
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    # Make vendored/system FFmpeg visible to all subprocesses (ffmpeg, ffprobe, yt-dlp merges)
    ensure_ffmpeg_on_path()
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


# Initialize FastAPI App
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "ReelReason Backend API: From hours of content to reels worth watching.\n\n"
        "ReelReason does not just find clips—it decides which stories deserve to be told, and explains why."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "message": exc.detail,
            "path": str(request.url.path)
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        errors.append({"field": loc, "message": err.get("msg", "Invalid value"), "code": err.get("type", "value_error")})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation error",
            "message": "Invalid request parameters",
            "details": errors
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.method} {request.url.path}: {exc}")
    # Never expose internal stack traces or secrets in responses
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing your request. Please try again or check logs."
        }
    )


# Root and Health Check Endpoints
@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "tagline": "ReelReason: From hours of content to reels worth watching.",
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "mock_mode": settings.is_mock_mode,
        "ai_provider": settings.AI_PROVIDER,
        "transcription_provider": settings.TRANSCRIPTION_PROVIDER
    }


# Mount API Routers
app.include_router(projects.router)
app.include_router(transcripts.router)
app.include_router(clips.router)
app.include_router(reels.router)
app.include_router(feedback.router)
app.include_router(users.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
