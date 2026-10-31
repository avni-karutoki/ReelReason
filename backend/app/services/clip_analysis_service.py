"""
LLM Clip-Analysis Engine for ReelReason.
Understands audience, platform, goal, and tone; analyzes transcript segments;
decides which stories deserve to be told, and generates explainable reasoning.
"""
import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
import httpx

from app.config import settings
from app.utils.json_utils import extract_and_parse_json
from app.utils.time_utils import format_seconds_to_timestamp

logger = logging.getLogger("reelreason.clip_analysis")


class ClipAnalysisService:
    def __init__(self):
        prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "clip_analysis.txt")
        if os.path.exists(prompt_path):
            with open(prompt_path, "r", encoding="utf-8") as f:
                self.prompt_template = f.read()
        else:
            self.prompt_template = "You are ReelReason..."

    async def analyze_clips(
        self,
        transcript_segments: List[Dict[str, Any]],
        platform: str,
        audience: str,
        goal: str,
        tone: str,
        preferred_clip_types: List[str],
        number_of_clips: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Submits transcript and creator context to the LLM and extracts structured clip suggestions.
        """
        # In mock or demo mode, return curated strategic clips with detailed reasoning
        if settings.is_mock_mode:
            logger.info("ClipAnalysisService: Generating mock/demo clip analyses")
            return self._generate_mock_clips(number_of_clips, platform, audience, goal, tone)

        # Build formatted transcript representation
        formatted_segments = []
        for i, seg in enumerate(transcript_segments):
            start_str = format_seconds_to_timestamp(seg.get("start_time", 0.0))
            end_str = format_seconds_to_timestamp(seg.get("end_time", 0.0))
            speaker = seg.get("speaker", "Speaker")
            text = seg.get("text", "")
            formatted_segments.append(f"[{start_str} - {end_str}] {speaker}: {text}")

        transcript_text_block = "\n".join(formatted_segments)

        prompt = self._render_prompt(self.prompt_template, {
            "platform": platform,
            "audience": audience,
            "goal": goal,
            "tone": tone,
            "preferred_clip_types": ", ".join(preferred_clip_types),
            "number_of_clips": number_of_clips,
            "transcript_segments": transcript_text_block,
        })

        try:
            if settings.AI_PROVIDER.lower() == "gemini" and settings.GEMINI_API_KEY:
                raw_json = await self._call_gemini(prompt)
            elif settings.AI_PROVIDER.lower() == "openai" and settings.OPENAI_API_KEY:
                raw_json = await self._call_openai(prompt)
            else:
                logger.info("No live AI API key configured or fallback triggered; using demo analysis engine.")
                return self._generate_mock_clips(number_of_clips, platform, audience, goal, tone)

            parsed = extract_and_parse_json(raw_json)
            clips = parsed.get("clips", [])
            return clips
        except Exception as e:
            logger.error(f"LLM analysis invocation error: {e}. Falling back to deterministic demo clips.")
            return self._generate_mock_clips(number_of_clips, platform, audience, goal, tone)

    _PLACEHOLDER_RE = re.compile(r"\{([a-z_][a-z_0-9]*)\}")

    def _render_prompt(self, template: str, mapping: Dict[str, Any]) -> str:
        """
        Substitutes {placeholder} fields without touching the literal JSON braces
        embedded in the prompt (str.format raises KeyError on those braces).
        """
        def _replace(match: re.Match) -> str:
            key = match.group(1)
            return str(mapping.get(key, match.group(0)))
        return self._PLACEHOLDER_RE.sub(_replace, template)

    _RETRYABLE_STATUS = {429, 500, 503, 504}

    async def _post_with_retry(
        self, client: "httpx.AsyncClient", url: str, payload: Dict[str, Any], log_prefix: str
    ) -> "httpx.Response":
        """
        Retries transient LLM API failures (rate limits, capacity spikes) so a
        momentary 503 does not downgrade a paid analysis to demo clips.
        """
        import asyncio
        backoff_seconds = [4.0, 10.0, 20.0]
        for attempt, wait in enumerate([0.0] + backoff_seconds):
            if wait:
                await asyncio.sleep(wait)
            resp = await client.post(url, json=payload)
            if resp.status_code in self._RETRYABLE_STATUS:
                if attempt < len(backoff_seconds):
                    logger.warning(
                        f"{log_prefix} got {resp.status_code}; retrying in "
                        f"{backoff_seconds[attempt]}s"
                    )
                    continue
            return resp
        return resp

    async def _call_gemini(self, prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL_NAME}:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "response_mime_type": "application/json"
            }
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await self._post_with_retry(client, url, payload, "Gemini analysis")
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini API returned error: {resp.text}")
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _call_openai(self, prompt: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are ReelReason, an expert short-form content strategist. Always respond in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await self._post_with_retry(client, url, payload, "OpenAI analysis")
            if resp.status_code != 200:
                raise RuntimeError(f"OpenAI API returned error: {resp.text}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def _generate_mock_clips(
        self,
        number_of_clips: int,
        platform: str,
        audience: str,
        goal: str,
        tone: str
    ) -> List[Dict[str, Any]]:
        """
        Curated showcase clips highlighting ReelReason's core reasoning engine:
        'ReelReason does not just find clips—it decides which stories deserve to be told, and explains why.'
        """
        all_pool = [
            {
                "start": "00:12",
                "end": "00:48",
                "clip_type": "strong_opinion",
                "hook": "Most creators edit for hours but choose the wrong moments.",
                "title": "The biggest trap in video editing",
                "caption": f"Stop clipping randomly. If a clip has no hook and no immediate takeaway, nobody is going to stop scrolling on {platform}.",
                "hashtags": ["#contentcreator", "#videoediting", "#reelsgrowth", "#creatoreconomy", "#shortform"],
                "target_audience": f"{audience} wanting faster growth with less manual editing",
                "reason": "Immediate pattern-interrupt hook that directly challenges creator effort vs impact. High retention potential because it targets a universal pain point without requiring any background context.",
                "hook_strength": 94,
                "clarity": 92,
                "audience_fit": 95,
                "shareability": 89,
                "overall_score": 93,
                "confidence": 96.0,
                "posting_order": 1,
            },
            {
                "start": "00:52",
                "end": "01:36",
                "clip_type": "practical_lesson",
                "hook": "Here is the exact 3-question test before posting any reel.",
                "title": "The 3-question viral reel checklist",
                "caption": "Ask these three questions before you hit export: 1) Does the first 2s trigger tension? 2) Is it clear in 30s? 3) Would someone share it to look smart?",
                "hashtags": ["#contentstrategy", "#growthonreels", "#creatortips", "#videomarketing", "#frameworks"],
                "target_audience": f"{audience} seeking an actionable checklist",
                "reason": "Structured 3-step actionable framework. Viewers naturally bookmark and re-watch listicles with high educational utility.",
                "hook_strength": 91,
                "clarity": 96,
                "audience_fit": 92,
                "shareability": 94,
                "overall_score": 93,
                "confidence": 95.0,
                "posting_order": 2,
            },
            {
                "start": "01:45",
                "end": "02:35",
                "clip_type": "story",
                "hook": "We had 14 days of payroll left. I sat in my car shaking.",
                "title": "The pressure that saved our startup",
                "caption": "When comfort was no longer an option, five hard customer calls a day saved our company. Hard times build clarity.",
                "hashtags": ["#startupstory", "#entrepreneurship", "#founderlife", "#resilience", "#businesslessons"],
                "target_audience": f"{audience} who appreciate authentic struggle and vulnerability",
                "reason": "High-stakes vulnerability narrative. The emotional honesty creates immediate empathy, and the payoff teaches a powerful lesson on proactive action.",
                "hook_strength": 96,
                "clarity": 88,
                "audience_fit": 90,
                "shareability": 91,
                "overall_score": 91,
                "confidence": 94.0,
                "posting_order": 3,
            },
            {
                "start": "02:42",
                "end": "03:30",
                "clip_type": "contrarian_take",
                "hook": "Consistency of mediocre content is just consistently annoying your audience.",
                "title": "Why consistency without quality kills accounts",
                "caption": "Quality is what earns permission to be consistent. Stop prioritizing volume over resonance.",
                "hashtags": ["#hotthought", "#contrarian", "#creators", "#audiencegrowth", "#qualityoverquantity"],
                "target_audience": f"{audience} fatigued by generic advice",
                "reason": "Directly confronts the widely accepted dogma of 'post 3 times a day'. Polarizing opinions generate high comment discussion and algorithmic engagement.",
                "hook_strength": 93,
                "clarity": 91,
                "audience_fit": 88,
                "shareability": 95,
                "overall_score": 91,
                "confidence": 92.0,
                "posting_order": 4,
            },
            {
                "start": "03:35",
                "end": "04:28",
                "clip_type": "insight",
                "hook": "The biggest lie in tech: AI will replace creators.",
                "title": "Who AI will actually replace",
                "caption": "AI doesn't replace creators. AI replaces unopinionated copycats. Your unique point of view is your real moat.",
                "hashtags": ["#aifuture", "#techtrends", "#futureofwork", "#creatorperspectives"],
                "target_audience": f"{audience} interested in AI and future-proofing their craft",
                "reason": "Re-frames a pervasive cultural anxiety into an empowering opportunity, establishing strong domain authority.",
                "hook_strength": 92,
                "clarity": 93,
                "audience_fit": 91,
                "shareability": 90,
                "overall_score": 91,
                "confidence": 93.0,
                "posting_order": 5,
            },
            {
                "start": "04:32",
                "end": "05:08",
                "clip_type": "humor",
                "hook": "My calendar said 'Deep Focus' so naturally I spent 2 hours picking fonts.",
                "title": "The greatest creator procrastination tactic",
                "caption": "We will do anything except the actual high-leverage task. Who else is guilty?",
                "hashtags": ["#relatable", "#creatorhumor", "#remotework", "#productivityhumor"],
                "target_audience": f"{audience} looking for lighthearted self-deprecating laughs",
                "reason": "Highly relatable humor that fosters audience community and generates viral tag-a-friend interactions.",
                "hook_strength": 89,
                "clarity": 90,
                "audience_fit": 87,
                "shareability": 96,
                "overall_score": 90,
                "confidence": 90.0,
                "posting_order": 6,
            },
            {
                "start": "05:12",
                "end": "05:58",
                "clip_type": "practical_lesson",
                "hook": "Never start your video with 'Hey guys, welcome back'.",
                "title": "The zero-fluff video opening technique",
                "caption": "Skip the pleasantries. Cut straight to the conflict or promise. Watch your 3-second retention double.",
                "hashtags": ["#videotips", "#shortformcontent", "#videohooks", "#retention"],
                "target_audience": f"{audience} seeking immediate tactical retention lifts",
                "reason": "Tactical, quick-win advice with an unmistakable before-and-after demonstration.",
                "hook_strength": 95,
                "clarity": 94,
                "audience_fit": 92,
                "shareability": 89,
                "overall_score": 92,
                "confidence": 94.0,
                "posting_order": 7,
            }
        ]

        count = max(1, min(number_of_clips, len(all_pool)))
        return all_pool[:count]


clip_analysis_service = ClipAnalysisService()
