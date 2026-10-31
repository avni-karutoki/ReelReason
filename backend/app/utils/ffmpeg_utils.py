"""
FFmpeg low-level execution utilities for audio extraction, duration probing, and video trimming.
"""
import subprocess
import os
import json
import logging
from typing import Dict, Any, Optional

from app.utils.ffmpeg_paths import resolve_binary

logger = logging.getLogger("reelreason.ffmpeg_utils")


def probe_video_metadata(video_path: str) -> Dict[str, Any]:
    """
    Uses ffprobe to extract duration, dimensions, codecs, and stream properties.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at: {video_path}")

    cmd = [
        resolve_binary("ffprobe"),
        "-v", "error",
        "-show_entries", "format=duration,size,bit_rate:stream=width,height,codec_type,codec_name",
        "-of", "json",
        video_path
    ]

    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        data = json.loads(result.stdout)
        
        duration = float(data.get("format", {}).get("duration", 0.0))
        video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
        
        return {
            "duration_seconds": int(round(duration)),
            "duration_float": duration,
            "width": video_stream.get("width"),
            "height": video_stream.get("height"),
            "codec": video_stream.get("codec_name"),
            "raw": data
        }
    except Exception as e:
        logger.warning(f"ffprobe extraction fallback: {e}")
        # Return fallback metadata if ffprobe fails or is not available
        return {
            "duration_seconds": 60,
            "duration_float": 60.0,
            "width": 1920,
            "height": 1080,
            "codec": "h264",
            "raw": {}
        }


def extract_audio_from_video(video_path: str, output_audio_path: str) -> str:
    """
    Extracts high-quality mono 16kHz MP3 or WAV audio stream suitable for Whisper/AssemblyAI.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Input video file not found at: {video_path}")

    os.makedirs(os.path.dirname(os.path.abspath(output_audio_path)), exist_ok=True)

    # -vn: disable video, -acodec: mp3 or pcm, -ar: 16000 (ideal for Whisper), -ac 1 (mono)
    cmd = [
        resolve_binary("ffmpeg"),
        "-y",               # overwrite output
        "-i", video_path,   # input file
        "-vn",              # no video
        "-acodec", "libmp3lame",
        "-ac", "1",         # mono channel
        "-ar", "16000",     # 16kHz sampling
        "-b:a", "64k",      # efficient bitrate
        output_audio_path
    ]

    logger.info(f"Extracting audio: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        logger.error(f"FFmpeg audio extraction error: {result.stderr}")
        raise RuntimeError(f"FFmpeg failed to extract audio: {result.stderr}")

    return output_audio_path


def trim_video_clip(
    input_video_path: str,
    output_clip_path: str,
    start_seconds: float,
    end_seconds: float
) -> str:
    """
    Trims a section of video from start_seconds to end_seconds.
    Uses precise re-encoding to preserve keyframes.
    """
    if not os.path.exists(input_video_path):
        raise FileNotFoundError(f"Input video not found: {input_video_path}")

    os.makedirs(os.path.dirname(os.path.abspath(output_clip_path)), exist_ok=True)
    duration = max(0.1, end_seconds - start_seconds)

    cmd = [
        resolve_binary("ffmpeg"),
        "-y",
        "-ss", str(start_seconds),
        "-i", input_video_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-strict", "experimental",
        output_clip_path
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg video trim error: {result.stderr}")

    return output_clip_path


def format_ass_timestamp(seconds: float) -> str:
    """
    Formats seconds (float) as an ASS subtitle timestamp: H:MM:SS.CC
    """
    seconds = max(0.0, seconds)
    hours = int(seconds // 3600)
    minutes = int(seconds % 3600 // 60)
    total_cents = round((seconds % 60) * 100)
    return f"{hours}:{minutes:02d}:{total_cents // 100:02d}.{total_cents % 100:02d}"


def render_vertical_reel_with_subtitles(
    input_video_path: str,
    output_clip_path: str,
    start_seconds: float,
    end_seconds: float,
    ass_path: Optional[str] = None
) -> str:
    """
    Renders a 9:16 vertical single-composition reel (720x1280) from the source video,
    optionally burning ASS subtitle captions onto the frames. Re-encodes H.264/AAC
    for lossless playback in every browser/player.
    """
    if not os.path.exists(input_video_path):
        raise FileNotFoundError(f"Input video not found: {input_video_path}")

    # Absolutize so the (optionally relocated) subprocess cwd cannot break relative paths
    input_video_path = os.path.abspath(input_video_path)
    output_clip_path = os.path.abspath(output_clip_path)
    if ass_path:
        ass_path = os.path.abspath(ass_path)
        if not os.path.exists(ass_path):
            ass_path = None
    os.makedirs(os.path.dirname(output_clip_path), exist_ok=True)
    duration = max(0.1, end_seconds - start_seconds)

    filters = ["crop=ih*9/16:ih", "scale=720:1280", "setsar=1"]
    if ass_path and os.path.exists(ass_path):
        # Use the subtitle file's bare filename with ffmpeg's cwd set to its folder,
        # avoiding Windows drive-letter escaping issues in the filter argument.
        filters.append(f"ass={os.path.basename(ass_path)}")

    cmd = [
        resolve_binary("ffmpeg"),
        "-y",
        "-ss", str(start_seconds),
        "-i", input_video_path,
        "-t", str(duration),
        "-vf", ",".join(filters),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        output_clip_path
    ]

    workdir = os.path.dirname(os.path.abspath(ass_path)) if ass_path else None
    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=workdir
    )
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg vertical reel render error: {result.stderr[-2000:]}")

    return output_clip_path
