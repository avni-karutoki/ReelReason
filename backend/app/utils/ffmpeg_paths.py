"""
Binary resolution for FFmpeg toolchain (ffmpeg, ffprobe, yt-dlp).

Search order:
1. FFMPEG_DIR setting (any directory containing the executables)
2. Vendored tools directory  `<backend_root>/tools/ffmpeg/bin`  (static builds
   extracted from a portable FFmpeg zip — works without a system install)
3. System PATH (bare executable name)

`get_ffmpeg_bin_dir()` also lets callers prepend the directory to PATH so
third-party tools that shell out to ffmpeg (e.g. yt-dlp stream merging) work.
"""
import os
import shutil
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger("reelreason.ffmpeg_paths")

_RESOLVED_BIN_DIR: Optional[str] = None


def _candidate_dirs() -> list:
    dirs = []
    if settings.FFMPEG_DIR:
        dirs.append(settings.FFMPEG_DIR)
    # backend root = repo/backend  (app/utils/ffmpeg_paths.py -> up 3)
    backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    dirs.append(os.path.join(backend_root, "tools", "ffmpeg", "bin"))
    dirs.append(os.path.join(backend_root, "tools", "ffmpeg"))
    return dirs


def find_ffmpeg_bin_dir() -> Optional[str]:
    """Returns the first directory that actually contains ffmpeg(.exe), else None."""
    global _RESOLVED_BIN_DIR
    if _RESOLVED_BIN_DIR and os.path.isdir(_RESOLVED_BIN_DIR):
        return _RESOLVED_BIN_DIR
    for d in _candidate_dirs():
        if d and shutil.which("ffmpeg", path=d):
            _RESOLVED_BIN_DIR = d
            logger.info(f"FFmpeg resolved at: {d}")
            return d
    if shutil.which("ffmpeg"):
        return None  # system PATH fallback is fine — no explicit dir needed
    logger.warning("FFmpeg not found: neither FFMPEG_DIR, vendored tools dir, nor system PATH contain it")
    return None


def resolve_binary(name: str) -> str:
    """
    Returns an absolute path to the given binary (ffmpeg/ffprobe) when found in
    the project-local toolchain, otherwise the bare name (resolved via PATH by
    subprocess).
    """
    bin_dir = find_ffmpeg_bin_dir()
    if bin_dir:
        exe = os.path.join(bin_dir, f"{name}.exe" if os.name == "nt" else name)
        if os.path.isfile(exe):
            return exe
        candidate = os.path.join(bin_dir, name)
        if os.path.isfile(candidate):
            return candidate
    return name


def ensure_ffmpeg_on_path() -> None:
    """
    Prepends the resolved FFmpeg bin dir to PATH for this process so libraries
    that invoke `ffmpeg` internally (yt-dlp merges, etc.) can find it.
    Safe to call multiple times.
    """
    bin_dir = find_ffmpeg_bin_dir()
    if bin_dir:
        path_env = os.environ.get("PATH", "")
        if bin_dir not in path_env.split(os.pathsep):
            os.environ["PATH"] = bin_dir + os.pathsep + path_env
