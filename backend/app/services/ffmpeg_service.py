"""
FFmpeg and Media Processing Service.
Crucial Constraint 1: Implement yt-dlp in services/ffmpeg_service.py to download YouTube URLs
before FFmpeg audio extraction.
"""
import os
import sys
import subprocess
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.utils.ffmpeg_utils import extract_audio_from_video, probe_video_metadata, trim_video_clip
from app.utils.ffmpeg_paths import resolve_binary, ensure_ffmpeg_on_path

logger = logging.getLogger("reelreason.ffmpeg_service")

_UNAVAILABLE_PATTERNS = (
    "video unavailable",
    "private video",
    "has been removed",
    "does not exist",
    "sign in to confirm your age",
    "age-restricted",
    "members-only",
    "this video is not available",
    "went is-private",
    "account associated with this video",
)

_BOTCHECK_PATTERNS = (
    "sign in to confirm",
    "not a bot",
    "please sign in",
)


def _is_video_unavailable(err: Exception) -> bool:
    text = str(err).lower()
    return any(p in text for p in _UNAVAILABLE_PATTERNS)


def _friendly_unavailable_error(youtube_url: str) -> str:
    return (
        f"This YouTube video is unavailable (deleted, private, age-restricted or region-locked): "
        f"{youtube_url}. Please double-check the link, or upload the video file directly on the Upload page."
    )


class FFmpegService:
    def __init__(self):
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        # Make the resolved FFmpeg toolchain visible to yt-dlp's internal merge calls
        ensure_ffmpeg_on_path()

    def download_youtube_video(self, youtube_url: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Constraint 1: Uses yt-dlp to download YouTube video streams before FFmpeg processing.
        Returns dictionary with local video path, duration, and title.
        """
        target_dir = output_dir or settings.TEMP_DIR
        os.makedirs(target_dir, exist_ok=True)

        logger.info(f"Downloading YouTube video using yt-dlp: {youtube_url}")

        output_template = os.path.join(target_dir, "%(id)s.%(ext)s")

        # In mock mode, generate a dummy video if yt-dlp is not available or mock is requested
        if settings.is_mock_mode and ("sample" in youtube_url or "mock" in youtube_url or not youtube_url.startswith("http")):
            mock_video_path = os.path.join(target_dir, "sample_podcast.mp4")
            if not os.path.exists(mock_video_path):
                # Create a minimal valid mock file
                with open(mock_video_path, "wb") as f:
                    f.write(b"MOCK_VIDEO_DATA_REELREASON")
            return {
                "video_path": mock_video_path,
                "title": "Mastering Short-Form Video Strategy (Podcast Ep. 42)",
                "duration_seconds": 360,
                "video_id": "sample_video_id"
            }

        # 1. Try python yt_dlp module if installed
        # Client rotation helps on cloud/datacenter IPs where YouTube serves
        # bot-check pages to the default web client.
        _ydl_base_opts = {
            "format": "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best",
            "outtmpl": output_template,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "socket_timeout": 20,
            "retries": 3,
            "geo_bypass": True,
        }
        try:
            import yt_dlp
            last_error: Optional[Exception] = None
            for clients in (None, ["ios", "tv", "web_safari"], ["android"], ["web_embedded", "tv_embedded"]):
                ydl_opts = dict(_ydl_base_opts)
                if clients:
                    ydl_opts["extractor_args"] = {"youtube": {"player_client": clients}}
                try:
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        info = ydl.extract_info(youtube_url, download=True)
                    video_id = info.get("id", "yt_video")
                    title = info.get("title", "YouTube Video")
                    duration = int(info.get("duration", 0))
                    filename = ydl.prepare_filename(info)

                    # If merged format has different extension, check on disk
                    if not os.path.exists(filename):
                        candidate = os.path.join(target_dir, f"{video_id}.mp4")
                        if os.path.exists(candidate):
                            filename = candidate

                    return {
                        "video_path": filename,
                        "title": title,
                        "duration_seconds": duration,
                        "video_id": video_id
                    }
                except Exception as attempt_err:
                    last_error = attempt_err
                    if _is_video_unavailable(attempt_err):
                        # No point rotating clients: the video itself is gone/private.
                        break
                    continue
            if last_error and _is_video_unavailable(last_error):
                raise RuntimeError(_friendly_unavailable_error(youtube_url))
            raise last_error or RuntimeError("yt-dlp failed for an unknown reason")
        except ImportError:
            logger.info("yt_dlp python package not directly imported, attempting yt-dlp CLI subprocess")
        except RuntimeError:
            raise
        except Exception as e:
            logger.warning(f"yt_dlp library download error: {e}. Falling back to CLI subprocess.")

        # 2. Fallback to CLI command execution (run via the installed python module
        #    so it works on Windows even without a yt-dlp.exe on PATH)
        cmd = [
            sys.executable,
            "-m", "yt_dlp",
            "-f", "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best",
            "--no-playlist",
            "-o", output_template,
            youtube_url
        ]

        try:
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            # Find generated file in target directory
            files = [os.path.join(target_dir, f) for f in os.listdir(target_dir) if f.endswith((".mp4", ".mkv", ".webm"))]
            if files:
                newest = max(files, key=os.path.getmtime)
                meta = probe_video_metadata(newest)
                return {
                    "video_path": newest,
                    "title": os.path.basename(newest),
                    "duration_seconds": meta.get("duration_seconds", 300),
                    "video_id": "yt_cli_downloaded"
                }
            raise FileNotFoundError("Could not find downloaded video file after yt-dlp execution.")
        except subprocess.CalledProcessError as cli_err:
            stderr_tail = (cli_err.stderr or "")[-400:].strip()
            logger.error(f"yt-dlp CLI failed (code {cli_err.returncode}): {stderr_tail}")
            # In real mode a failed download must fail loudly: fabricating a mock
            # file would silently poison extraction, transcription, and clips.
            if not settings.is_mock_mode:
                if _is_video_unavailable(stderr_tail):
                    raise RuntimeError(_friendly_unavailable_error(youtube_url)) from None
                if any(p in stderr_tail.lower() for p in _BOTCHECK_PATTERNS):
                    raise RuntimeError(
                        "YouTube is asking this cloud server to sign in (bot protection on datacenter IPs). "
                        "Please upload the video file directly on the Upload page — uploads are not affected."
                    ) from None
                raise RuntimeError(f"YouTube download failed: {stderr_tail or cli_err}") from None
            mock_video_path = os.path.join(target_dir, "sample_podcast.mp4")
            with open(mock_video_path, "wb") as f:
                f.write(b"MOCK_FALLBACK_VIDEO_REELREASON")
            return {
                "video_path": mock_video_path,
                "title": "Short-Form Video Masterclass (Demo)",
                "duration_seconds": 360,
                "video_id": "demo_video"
            }
        except Exception as cli_err:
            logger.error(f"yt-dlp CLI failed: {cli_err}")
            if not settings.is_mock_mode:
                raise RuntimeError(f"YouTube download failed: {str(cli_err)[:300]}") from None
            mock_video_path = os.path.join(target_dir, "sample_podcast.mp4")
            with open(mock_video_path, "wb") as f:
                f.write(b"MOCK_FALLBACK_VIDEO_REELREASON")
            return {
                "video_path": mock_video_path,
                "title": "Short-Form Video Masterclass (Demo)",
                "duration_seconds": 360,
                "video_id": "demo_video"
            }

    def extract_audio(self, video_path: str, output_audio_path: Optional[str] = None) -> str:
        """
        Extracts speech audio track from video using FFmpeg.
        """
        if not output_audio_path:
            base, _ = os.path.splitext(video_path)
            output_audio_path = f"{base}_audio.mp3"

        if settings.is_mock_mode and not os.path.exists(video_path):
            with open(output_audio_path, "wb") as f:
                f.write(b"MOCK_AUDIO_DATA_FOR_WHISPER")
            return output_audio_path

        return extract_audio_from_video(video_path, output_audio_path)

    def trim_clip(self, video_path: str, start_sec: float, end_sec: float, output_path: str) -> str:
        """
        Cuts a video clip between start and end seconds.
        """
        return trim_video_clip(video_path, output_path, start_sec, end_sec)

    def generate_thumbnail(self, video_path: str, timestamp_sec: float, output_path: str) -> str:
        """
        Extracts a single frame as JPEG thumbnail.
        """
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        if settings.is_mock_mode and not os.path.exists(video_path):
            with open(output_path, "wb") as f:
                f.write(b"MOCK_THUMBNAIL_JPEG")
            return output_path

        cmd = [
            resolve_binary("ffmpeg"),
            "-y",
            "-ss", str(timestamp_sec),
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            output_path
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_path


ffmpeg_service = FFmpegService()
