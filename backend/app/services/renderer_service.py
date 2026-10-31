"""
Remotion Renderer Integration Service.
Dispatches structured rendering payloads to the external Node.js Remotion microservice,
tracks render lifecycle (queued -> processing -> completed/failed), and records results.
When the Remotion microservice is unreachable, falls back to an in-process FFmpeg
render: real 9:16 vertical cut with burned-in word-timestamped subtitles.
"""
import os
import uuid
import asyncio
import logging
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.config import settings
from app.models.reel_models import RemotionRenderJobPayload, SubtitleStyle
from app.services.supabase_service import supabase_service
from app.services.storage_service import storage_service
from app.utils.ffmpeg_utils import render_vertical_reel_with_subtitles, format_ass_timestamp
from app.utils.time_utils import format_seconds_to_timestamp

logger = logging.getLogger("reelreason.renderer")

ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Arial,56,&H00FFFFFF,&H00FFFFFF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,170,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

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
                    logger.warning(f"Remotion endpoint returned status {res.status_code}. Rendering locally with FFmpeg.")
                    await self._start_local_render(payload, record, clip, word_timestamps)
        except Exception as e:
            logger.warning(f"Remotion renderer connection failed: {e}. Rendering locally with FFmpeg.")
            await self._start_local_render(payload, record, clip, word_timestamps)

        return record

    async def _start_local_render(self, payload, record, clip, word_timestamps):
        """
        Schedules the in-process FFmpeg render as a background task so the HTTP
        request returns immediately; the rendered_reels row transitions
        processing -> completed/failed as the task finishes.
        """
        record["render_status"] = "processing"
        supabase_service.service_client.table("rendered_reels").update({
            "render_status": "processing"
        }).eq("id", record["id"]).execute()
        asyncio.ensure_future(self._render_locally(payload, record, clip, word_timestamps or []))

    async def _render_locally(self, payload, record, clip, word_timestamps):
        """
        Real render without Remotion: cuts the 9:16 vertical clip from the source
        video with FFmpeg, burns word-timestamped captions, uploads the MP4 and a
        thumbnail to Supabase Storage, and persists the public URLs.
        """
        reel_id = record["id"]
        clip_id = record["clip_id"]
        user_id = record["user_id"]
        project_id = record["project_id"]

        try:
            start_sec = float(clip.get("start_time", 0.0) or 0.0)
            end_sec = float(clip.get("end_time", start_sec + 30.0) or (start_sec + 30.0))
            os.makedirs(settings.TEMP_DIR, exist_ok=True)

            def _work():
                # 1. Resolve the source video locally (downloads from storage on first use)
                source_path = os.path.join(settings.TEMP_DIR, f"{project_id}_source.mp4")
                if not os.path.exists(source_path) or os.path.getsize(source_path) < 100_000:
                    video_url = payload.video_url
                    with httpx.Client(timeout=None, follow_redirects=True) as client:
                        with client.stream("GET", video_url) as resp:
                            resp.raise_for_status()
                            tmp_download = source_path + ".part"
                            with open(tmp_download, "wb") as f:
                                for chunk in resp.iter_bytes(chunk_size=1 << 20):
                                    f.write(chunk)
                            os.replace(tmp_download, source_path)

                # 2. Build the ASS caption file from real word timestamps inside the clip window
                ass_path = self._build_ass_subtitles(
                    word_timestamps, start_sec, end_sec,
                    out_path=os.path.join(settings.TEMP_DIR, f"subs_{reel_id}.ass")
                )

                # 3. Render the vertical clip (with captions; retries plain if libass fails)
                clip_path = os.path.join(settings.TEMP_DIR, f"{reel_id}_reel.mp4")
                try:
                    render_vertical_reel_with_subtitles(source_path, clip_path, start_sec, end_sec, ass_path)
                except RuntimeError as e:
                    logger.warning(f"Subtitled render failed ({str(e)[:200]}). Retrying without captions.")
                    render_vertical_reel_with_subtitles(source_path, clip_path, start_sec, end_sec, None)

                # 4. Thumbnail from the rendered vertical clip
                thumb_path = os.path.join(settings.TEMP_DIR, f"{reel_id}_thumb.jpg")
                from app.services.ffmpeg_service import ffmpeg_service
                ffmpeg_service.generate_thumbnail(clip_path, 1.0, thumb_path)

                # 5. Upload real assets to storage
                video_url_out = storage_service.upload_file(
                    bucket_name=settings.SUPABASE_RENDERED_BUCKET,
                    destination_path=f"{user_id}/{reel_id}.mp4",
                    local_file_path=clip_path,
                    content_type="video/mp4"
                )
                thumb_url_out = storage_service.upload_file(
                    bucket_name=settings.SUPABASE_THUMBNAIL_BUCKET,
                    destination_path=f"{user_id}/{reel_id}.jpg",
                    local_file_path=thumb_path,
                    content_type="image/jpeg"
                )
                return video_url_out, thumb_url_out

            video_url_out, thumb_url_out = await asyncio.to_thread(_work)

            supabase_service.service_client.table("rendered_reels").update({
                "render_status": "completed",
                "video_url": video_url_out,
                "thumbnail_url": thumb_url_out,
            }).eq("id", reel_id).execute()

            supabase_service.service_client.table("clip_suggestions").update({
                "status": "rendered"
            }).eq("id", clip_id).execute()
            logger.info(f"Local FFmpeg render completed for reel {reel_id}")

        except Exception as e:
            logger.error(f"Local FFmpeg render failed for reel {reel_id}: {str(e)[:400]}")
            supabase_service.service_client.table("rendered_reels").update({
                "render_status": "failed",
                "error_message": str(e)[:500],
            }).eq("id", reel_id).execute()
            supabase_service.service_client.table("clip_suggestions").update({
                "status": "suggested"
            }).eq("id", clip_id).execute()

    def _chunk_words(self, word_timestamps: List[dict], start_sec: float, end_sec: float):
        """
        Groups words inside the clip window into phrases of up to 4 words
        (or sentence terminators) for readable caption lines.
        """
        window = [
            w for w in word_timestamps
            if w.get("word") and float(w.get("end", 0)) > start_sec and float(w.get("start", 1e9)) < end_sec
        ]
        chunks, current = [], []
        for w in window:
            current.append(w)
            if len(current) >= 4 or w["word"].endswith((".", "!", "?")):
                chunks.append(current)
                current = []
        if current:
            chunks.append(current)
        return chunks

    def _build_ass_subtitles(self, word_timestamps, start_sec, end_sec, out_path) -> Optional[str]:
        """
        Writes an ASS caption file spanning the clip window (timestamps shifted to clip time).
        Returns None when no word timestamps exist (plain render, no captions).
        """
        chunks = self._chunk_words(word_timestamps or [], start_sec, end_sec)
        if not chunks:
            return None

        lines = []
        for chunk in chunks:
            s = float(chunk[0]["start"]) - start_sec
            e = float(chunk[-1]["end"]) - start_sec
            e = max(e, s + 0.4)
            text = " ".join(str(w["word"]).strip() for w in chunk)
            if text:
                lines.append(
                    f"Dialogue: 0,{format_ass_timestamp(s)},{format_ass_timestamp(e)},Caption,,0,0,0,,{text}"
                )
        if not lines:
            return None

        os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(ASS_HEADER + "\n".join(lines))
        return out_path


renderer_service = RendererService()
