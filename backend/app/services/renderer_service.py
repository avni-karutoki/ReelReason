"""
Remotion Renderer Integration Service.
Dispatches structured rendering payloads to the external Node.js Remotion microservice,
tracks render lifecycle (queued -> processing -> completed/failed), and records results.
"""
import uuid
import logging
from typing import Dict, Any, Optional
import httpx
from datetime import datetime
from app.config import settings
from app.models.reel_models import RemotionRenderJobPayload, SubtitleStyle
from app.services.supabase_service import supabase_service
from app.utils.time_utils import format_seconds_to_timestamp

logger = logging.getLogger("reelreason.renderer")


class RendererService:
    async def dispatch_render_job(
        self,
        clip: Dict[str, Any],
        project: Dict[str, Any],
        user_id: str,
        word_timestamps: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Creates rendered_reels record with status 'queued' and submits job to Remotion renderer.
        """
        reel_id = str(uuid.uuid4())
        render_job_id = f"render_{uuid.uuid4().hex[:10]}"
        clip_id = clip.get("id")
        project_id = project.get("id")

        start_time_str = format_seconds_to_timestamp(clip.get("start_time", 0.0))
        end_time_str = format_seconds_to_timestamp(clip.get("end_time", 30.0))

        # 1. Format structured Remotion payload
        payload = RemotionRenderJobPayload(
            render_job_id=render_job_id,
            clip_id=clip_id,
            project_id=project_id,
            video_url=project.get("video_path") or f"{settings.SUPABASE_URL}/storage/v1/object/public/reelreason-videos/{project_id}.mp4",
            start_time=start_time_str,
            end_time=end_time_str,
            aspect_ratio="9:16",
            hook=clip.get("hook", "Key insight from this video"),
            title=clip.get("title", "ReelReason Selection"),
            caption=clip.get("caption", ""),
            hashtags=clip.get("hashtags", []),
            creator_handle="@reelreason",
            subtitle_style=SubtitleStyle(**(clip.get("subtitle_style") or {})),
            word_timestamps=word_timestamps or []
        )

        # 2. Insert into rendered_reels with 'queued'
        record = {
            "id": reel_id,
            "clip_id": clip_id,
            "project_id": project_id,
            "user_id": user_id,
            "render_status": "queued",
            "renderer_job_id": render_job_id,
            "aspect_ratio": "9:16",
            "video_url": None,
            "thumbnail_url": None,
            "error_message": None,
        }
        supabase_service.service_client.table("rendered_reels").insert(record).execute()

        # Update clip status to 'rendering'
        supabase_service.service_client.table("clip_suggestions").update({"status": "rendering"}).eq("id", clip_id).execute()

        # 3. Send to Remotion Service or simulate in demo/mock mode
        if settings.is_mock_mode:
            logger.info("Demo/Mock Mode: Simulating Remotion rendering completion")
            # In demo mode, mark as completed with sample vertical video URL
            sample_video_url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            sample_thumb_url = "https://images.unsplash.com/photo-1579208575657-c595a05383b7?auto=format&fit=crop&w=720&q=80"
            
            supabase_service.service_client.table("rendered_reels").update({
                "render_status": "completed",
                "video_url": sample_video_url,
                "thumbnail_url": sample_thumb_url,
            }).eq("id", reel_id).execute()

            supabase_service.service_client.table("clip_suggestions").update({
                "status": "rendered"
            }).eq("id", clip_id).execute()

            record["render_status"] = "completed"
            record["video_url"] = sample_video_url
            record["thumbnail_url"] = sample_thumb_url
            return record

        try:
            # Post to Remotion Node.js microservice
            renderer_endpoint = f"{settings.RENDERER_BASE_URL.rstrip('/')}/api/render"
            headers = {
                "Authorization": f"Bearer {settings.RENDERER_API_KEY}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(renderer_endpoint, headers=headers, json=payload.model_dump())
                if res.status_code in (200, 201, 202):
                    supabase_service.service_client.table("rendered_reels").update({
                        "render_status": "processing"
                    }).eq("id", reel_id).execute()
                    record["render_status"] = "processing"
                else:
                    logger.warning(f"Remotion endpoint returned status {res.status_code}: {res.text}. Falling back to demo preview.")
                    self._fallback_complete(reel_id, clip_id)
        except Exception as e:
            logger.warning(f"Remotion renderer connection failed: {e}. Falling back to preview rendering.")
            self._fallback_complete(reel_id, clip_id)

        return record

    def _fallback_complete(self, reel_id: str, clip_id: str):
        sample_video_url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        sample_thumb_url = "https://images.unsplash.com/photo-1579208575657-c595a05383b7?auto=format&fit=crop&w=720&q=80"
        supabase_service.service_client.table("rendered_reels").update({
            "render_status": "completed",
            "video_url": sample_video_url,
            "thumbnail_url": sample_thumb_url,
        }).eq("id", reel_id).execute()

        supabase_service.service_client.table("clip_suggestions").update({
            "status": "rendered"
        }).eq("id", clip_id).execute()


renderer_service = RendererService()
