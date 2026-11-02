"""
Supabase Storage service for managing video, audio, rendered reels, and thumbnails.
Provides file upload, signed URL generation, storage cleanup, and local source resolution.
"""
import os
import shutil
import logging
import httpx
from typing import Optional
from app.config import settings
from app.services.supabase_service import supabase_service

logger = logging.getLogger("reelreason.storage")


class StorageService:
    def __init__(self):
        os.makedirs(settings.TEMP_DIR, exist_ok=True)

    def upload_file(
        self,
        bucket_name: str,
        destination_path: str,
        local_file_path: str,
        content_type: str = "video/mp4"
    ) -> str:
        """
        Uploads a local file to the designated Supabase Storage bucket.
        Returns the public or storage path URL.
        """
        if not os.path.exists(local_file_path):
            raise FileNotFoundError(f"Local file does not exist: {local_file_path}")

        # In mock mode or when Supabase client is mock, return structured simulated URL
        if settings.is_mock_mode:
            logger.info(f"Mock upload: {local_file_path} -> bucket '{bucket_name}', path '{destination_path}'")
            return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{destination_path}"

        try:
            with open(local_file_path, "rb") as f:
                file_bytes = f.read()

            supabase_service.service_client.storage.from_(bucket_name).upload(
                path=destination_path,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )

            # Get public or signed URL
            public_url = supabase_service.service_client.storage.from_(bucket_name).get_public_url(destination_path)
            return public_url
        except Exception as e:
            logger.error(f"Storage upload FAILED for {bucket_name}/{destination_path}: {e}")
            if settings.is_mock_mode:
                return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{destination_path}"
            # Never return a URL for a file that was not actually stored: downstream
            # renders would 404/400 with an unexplainable error much later.
            raise

    def download_source_video(self, source_url: str, filename: str) -> str:
        """
        Downloads a remote video (e.g. a Supabase Storage public URL) into TEMP_DIR
        and returns the local path. FFmpeg/ffprobe subprocesses require a real file
        on disk; uploaded projects persist video_path as a Storage URL, so the
        pipeline must materialize it locally before extraction/rendering.
        Uses a stable Project-scoped filename and caches across pipeline retries.
        """
        destination = os.path.join(settings.TEMP_DIR, filename)
        if os.path.exists(destination) and os.path.getsize(destination) > 100_000:
            return destination

        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        tmp_download = destination + ".part"
        with httpx.Client(timeout=None, follow_redirects=True) as client:
            with client.stream("GET", source_url) as resp:
                resp.raise_for_status()
                with open(tmp_download, "wb") as f:
                    for chunk in resp.iter_bytes(chunk_size=1 << 20):
                        f.write(chunk)
        os.replace(tmp_download, destination)
        logger.info(f"Downloaded source video {source_url} -> {destination} ({os.path.getsize(destination)} bytes)")
        return destination

    def get_signed_url(self, bucket_name: str, file_path: str, expires_in_seconds: int = 3600) -> str:
        """Generates a secure, time-limited signed URL for private bucket objects."""
        if settings.is_mock_mode:
            return f"https://reelreason.ai/storage/{bucket_name}/{file_path}?token=mock_signed_token"

        try:
            res = supabase_service.service_client.storage.from_(bucket_name).create_signed_url(
                path=file_path,
                expires_in=expires_in_seconds
            )
            return res.get("signedURL") or res.get("signed_url", "")
        except Exception as e:
            logger.error(f"Error creating signed URL: {e}")
            return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"

    def delete_file(self, bucket_name: str, file_path: str) -> bool:
        """Deletes a file from Supabase Storage."""
        if settings.is_mock_mode:
            return True
        try:
            supabase_service.service_client.storage.from_(bucket_name).remove([file_path])
            return True
        except Exception as e:
            logger.error(f"Failed to delete file from storage: {e}")
            return False


storage_service = StorageService()
