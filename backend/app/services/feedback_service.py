"""
Clip Feedback Service.
Records user interactions (approved, rejected, edited, rendered, downloaded)
in public.clip_feedback to refine clip-ranking intelligence.
"""
import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from app.services.supabase_service import supabase_service

logger = logging.getLogger("reelreason.feedback")


class FeedbackService:
    async def record_feedback(
        self,
        clip_id: str,
        user_id: str,
        feedback_type: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Records feedback event in public.clip_feedback."""
        record_id = str(uuid.uuid4())
        record = {
            "id": record_id,
            "clip_id": clip_id,
            "user_id": user_id,
            "feedback_type": feedback_type,
            "notes": notes,
            "created_at": datetime.utcnow().isoformat()
        }

        try:
            supabase_service.service_client.table("clip_feedback").insert(record).execute()
            logger.info(f"Recorded feedback '{feedback_type}' for clip {clip_id} by user {user_id}")
            return record
        except Exception as e:
            logger.error(f"Failed to record feedback: {e}")
            return record


feedback_service = FeedbackService()
