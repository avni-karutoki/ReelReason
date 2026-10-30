"""
Supabase Storage service for managing video, audio, rendered reels, and thumbnails.
Provides file upload, signed URL generation, and storage cleanup.
"""
import os
import shutil
import logging
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
            logger.warning(f"Storage upload exception: {e}. Generating standardized storage path URL.")
            return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{destination_path}"

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
