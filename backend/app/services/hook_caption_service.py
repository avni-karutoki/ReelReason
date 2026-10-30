"""
Hook and Caption Generation Service.
Specialized LLM utilities for regenerating alternative hooks, platform-native captions,
and searchable hashtag sets.
"""
import os
import logging
from typing import Dict, Any, List
import httpx
from app.config import settings
from app.utils.json_utils import extract_and_parse_json

logger = logging.getLogger("reelreason.hook_caption")


class HookCaptionService:
    async def regenerate_hooks(
        self,
        clip_id: str,
        current_hook: str,
        clip_text: str,
        platform: str = "Instagram Reels",
        audience: str = "Creators",
        tone: str = "Bold"
    ) -> Dict[str, Any]:
        """Generates 1 primary hook and 3 diverse alternative hook angles."""
        if settings.is_mock_mode or not (settings.OPENAI_API_KEY or settings.GEMINI_API_KEY):
            return {
                "clip_id": clip_id,
                "primary_hook": f"Stop scrolling if you want to grow on {platform}.",
                "alternative_hooks": [
                    "The single biggest mistake most creators make every week.",
                    "Here is the 3-question test before posting any reel.",
                    "Why consistency without quality is killing your reach."
                ]
            }

        prompt = (
            f"You are ReelReason's viral hook optimizer.\n"
            f"Current Hook: \"{current_hook}\"\n"
            f"Transcript snippet: \"{clip_text}\"\n"
            f"Target Platform: {platform}\n"
            f"Audience: {audience}\n"
            f"Tone: {tone}\n\n"
            f"Generate a strong primary hook and 3 distinct alternative hooks (Contrarian, Question, Story).\n"
            f"Return JSON: {{\"primary_hook\": \"string\", \"alternative_hooks\": [\"hook1\", \"hook2\", \"hook3\"]}}"
        )

        try:
            raw_json = await self._call_ai(prompt)
            parsed = extract_and_parse_json(raw_json)
            return {
                "clip_id": clip_id,
                "primary_hook": parsed.get("primary_hook", current_hook),
                "alternative_hooks": parsed.get("alternative_hooks", [])
            }
        except Exception as e:
            logger.error(f"Error regenerating hook: {e}")
            return {
                "clip_id": clip_id,
                "primary_hook": current_hook,
                "alternative_hooks": [
                    "Stop editing randomly—use this framework instead.",
                    "The fastest way to test your reel before posting.",
                    "Why most creators waste hours choosing the wrong clip."
                ]
            }

    async def regenerate_caption(
        self,
        clip_id: str,
        title: str,
        hook: str,
        clip_text: str,
        platform: str = "Instagram Reels",
        audience: str = "Creators",
        tone: str = "Bold",
        goal: str = "Views"
    ) -> Dict[str, Any]:
        """Generates platform-tailored caption, title, and 5-10 hashtags."""
        if settings.is_mock_mode or not (settings.OPENAI_API_KEY or settings.GEMINI_API_KEY):
            return {
                "clip_id": clip_id,
                "title": f"The {title or 'Secret Strategy'}",
                "caption": f"Stop clipping randomly. Ask these three questions before turning any long video into a reel for {audience}. Double tap if you needed this reminder!",
                "hashtags": ["#contentcreation", "#reelsgrowth", "#creatoreconomy", "#shortformvideo", "#videoediting"]
            }

        prompt = (
            f"You are ReelReason's social copy expert.\n"
            f"Title: {title}\nHook: {hook}\nClip Text: \"{clip_text}\"\n"
            f"Platform: {platform}\nAudience: {audience}\nTone: {tone}\nGoal: {goal}\n\n"
            f"Return JSON: {{\"title\": \"string\", \"caption\": \"string\", \"hashtags\": [\"#tag1\", \"#tag2\", \"#tag3\", \"#tag4\", \"#tag5\"]}}"
        )

        try:
            raw_json = await self._call_ai(prompt)
            parsed = extract_and_parse_json(raw_json)
            return {
                "clip_id": clip_id,
                "title": parsed.get("title", title),
                "caption": parsed.get("caption", "Stop clipping randomly. Focus on stories that matter."),
                "hashtags": parsed.get("hashtags", ["#reelreason", "#shortform", "#creator"])
            }
        except Exception as e:
            logger.error(f"Error regenerating caption: {e}")
            return {
                "clip_id": clip_id,
                "title": title,
                "caption": "Quality is what earns permission to be consistent. Save this for your next recording session.",
                "hashtags": ["#contentcreator", "#videoediting", "#reelsgrowth"]
            }

    async def _call_ai(self, prompt: str) -> str:
        if settings.AI_PROVIDER.lower() == "gemini" and settings.GEMINI_API_KEY:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL_NAME}:generateContent?key={settings.GEMINI_API_KEY}"
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.5, "response_mime_type": "application/json"}
                })
                return res.json()["candidates"][0]["content"]["parts"][0]["text"]
        elif settings.OPENAI_API_KEY:
            url = "https://api.openai.com/v1/chat/completions"
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}, json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.5
                })
                return res.json()["choices"][0]["message"]["content"]
        raise RuntimeError("No AI API provider configured")


hook_caption_service = HookCaptionService()
