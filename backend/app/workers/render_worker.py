"""
Render Worker for managing rendering jobs and polling Remotion status.
"""
import logging
from app.services.renderer_service import renderer_service

logger = logging.getLogger("reelreason.render_worker")


async def run_render_job(clip: dict, project: dict, user_id: str):
    """Worker entry point for dispatching and tracking rendering jobs."""
    logger.info(f"Render Worker received job for clip_id: {clip.get('id')}")
    try:
        result = await renderer_service.dispatch_render_job(
            clip=clip,
            project=project,
            user_id=user_id
        )
        return result
    except Exception as e:
        logger.error(f"Render Worker error on clip {clip.get('id')}: {e}")
        return {"error": str(e)}
