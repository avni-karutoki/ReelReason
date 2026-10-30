"""
Analyze Worker for running video processing pipeline asynchronously.
"""
import asyncio
import logging
from app.services.pipeline_service import pipeline_service

logger = logging.getLogger("reelreason.analyze_worker")


async def run_analyze_job(project_id: str, user_id: str):
    """Worker entry point invoked by FastAPI BackgroundTasks or standalone worker."""
    logger.info(f"Analyze Worker received job for project_id: {project_id}")
    try:
        result = await pipeline_service.run_pipeline(project_id=project_id, user_id=user_id)
        logger.info(f"Analyze Worker completed project {project_id}: {result}")
        return result
    except Exception as e:
        logger.error(f"Analyze Worker failed on project {project_id}: {e}")
        return {"error": str(e), "project_id": project_id}
