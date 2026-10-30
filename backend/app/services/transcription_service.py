"""
Speech-to-Text Transcription Service with Provider Abstraction.
Supports OpenAI Whisper API, AssemblyAI, and Demo/Mock transcription with word-level timestamps.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import os
import json
import logging
import httpx
from app.config import settings
from app.models.transcript_models import WordTimestamp

logger = logging.getLogger("reelreason.transcription")


class TranscriptionProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_file_path: str, language: str = "English") -> Dict[str, Any]:
        """Transcribes audio and returns full text with word and segment timestamps."""
        pass


class OpenAIWhisperProvider(TranscriptionProvider):
    async def transcribe(self, audio_file_path: str, language: str = "English") -> Dict[str, Any]:
        logger.info(f"OpenAIWhisperProvider transcribing: {audio_file_path}")
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured")

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
        }

        # Request verbose_json with word timestamps
        async with httpx.AsyncClient(timeout=180.0) as client:
            with open(audio_file_path, "rb") as f:
                files = {"file": (os.path.basename(audio_file_path), f, "audio/mp3")}
                data = {
                    "model": settings.OPENAI_WHISPER_MODEL or "whisper-1",
                    "response_format": "verbose_json",
                    "timestamp_granularities[]": ["word", "segment"]
                }
                
                resp = await client.post("https://api.openai.com/v1/audio/transcriptions", headers=headers, files=files, data=data)
                if resp.status_code != 200:
                    raise RuntimeError(f"OpenAI Whisper API error: {resp.text}")
                
                raw = resp.json()
                
                # Format standardized word timestamps
                words: List[Dict[str, Any]] = []
                for w in raw.get("words", []):
                    words.append({
                        "word": w.get("word", "").strip(),
                        "start": round(float(w.get("start", 0.0)), 2),
                        "end": round(float(w.get("end", 0.0)), 2),
                    })

                segments: List[Dict[str, Any]] = []
                for s in raw.get("segments", []):
                    segments.append({
                        "start": round(float(s.get("start", 0.0)), 2),
                        "end": round(float(s.get("end", 0.0)), 2),
                        "text": s.get("text", "").strip(),
                    })

                return {
                    "provider": "openai_whisper",
                    "language": raw.get("language", language),
                    "full_text": raw.get("text", ""),
                    "word_timestamps": words,
                    "segment_timestamps": segments,
                    "raw_response": raw
                }


class AssemblyAIProvider(TranscriptionProvider):
    async def transcribe(self, audio_file_path: str, language: str = "English") -> Dict[str, Any]:
        logger.info(f"AssemblyAIProvider transcribing: {audio_file_path}")
        if not settings.ASSEMBLYAI_API_KEY:
            raise ValueError("ASSEMBLYAI_API_KEY is not configured")

        headers = {"authorization": settings.ASSEMBLYAI_API_KEY}

        async with httpx.AsyncClient(timeout=240.0) as client:
            # 1. Upload audio
            with open(audio_file_path, "rb") as f:
                upload_resp = await client.post("https://api.assemblyai.com/v2/upload", headers=headers, content=f.read())
            upload_url = upload_resp.json().get("upload_url")

            # 2. Submit transcription job
            transcript_req = {
                "audio_url": upload_url,
                "auto_chapters": True,
                "speaker_labels": True,
            }
            sub_resp = await client.post("https://api.assemblyai.com/v2/transcript", headers=headers, json=transcript_req)
            transcript_id = sub_resp.json().get("id")

            # 3. Poll for completion
            polling_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
            import asyncio
            for _ in range(60):
                await asyncio.sleep(3)
                poll_resp = await client.get(polling_url, headers=headers)
                status_data = poll_resp.json()
                if status_data.get("status") == "completed":
                    words = [
                        {
                            "word": w.get("text"),
                            "start": round(float(w.get("start", 0)) / 1000.0, 2),
                            "end": round(float(w.get("end", 0)) / 1000.0, 2),
                        }
                        for w in status_data.get("words", [])
                    ]
                    segments = [
                        {
                            "start": round(float(c.get("start", 0)) / 1000.0, 2),
                            "end": round(float(c.get("end", 0)) / 1000.0, 2),
                            "text": c.get("headline", "") + ": " + c.get("summary", ""),
                        }
                        for c in status_data.get("chapters", [])
                    ]
                    return {
                        "provider": "assemblyai",
                        "language": language,
                        "full_text": status_data.get("text", ""),
                        "word_timestamps": words,
                        "segment_timestamps": segments,
                        "raw_response": status_data
                    }
                elif status_data.get("status") == "error":
                    raise RuntimeError(f"AssemblyAI transcription failed: {status_data.get('error')}")

            raise TimeoutError("AssemblyAI transcription timed out")


class MockTranscriptionProvider(TranscriptionProvider):
    """
    Demo/Mock transcription provider returning rich, timestamped transcript data
    for podcasts/lectures without consuming API credits.
    """
    async def transcribe(self, audio_file_path: str, language: str = "English") -> Dict[str, Any]:
        logger.info("MockTranscriptionProvider: Returning sample realistic podcast transcript with word timestamps")
        
        sample_segments = [
            {
                "start": 12.0,
                "end": 48.5,
                "text": "Most creators edit for hours and hours, but they choose the completely wrong moments to turn into reels. If you spend forty minutes clipping something that has no hook and no takeaway, nobody is going to stop scrolling. You have to ask yourself three questions before you export."
            },
            {
                "start": 52.0,
                "end": 96.0,
                "text": "Here is the exact three-question test I use. Question one: does the first two seconds trigger tension or curiosity? Question two: can someone who has never heard of you understand the insight in thirty seconds? And question three: would someone send this to a friend to look smart? If it's not a triple yes, delete it."
            },
            {
                "start": 105.0,
                "end": 155.2,
                "text": "When we were bootstrapping our startup back in 2021, we almost ran out of payroll. We had fourteen days of runway left. I remember sitting in my car outside the office shaking. But that pressure forced us to stop doing what felt comfortable and make five hard customer calls a day. That single week saved the company."
            },
            {
                "start": 162.0,
                "end": 210.0,
                "text": "Everyone talks about consistency on social media, but consistency of mediocre content is just consistently annoying your audience. Quality is what earns permission to be consistent. If your video doesn't deliver a concrete lesson or emotional resonance, posting it every day won't help you grow."
            },
            {
                "start": 215.0,
                "end": 268.0,
                "text": "Let's be real—the biggest lie in tech right now is that AI will replace creators. AI doesn't replace creators; AI replaces unopinionated copycats. If you have a unique point of view and battle-tested experience, AI is simply the multiplier that gives you ten extra hands."
            }
        ]

        full_text = " ".join([s["text"] for s in sample_segments])
        
        # Build synthetic word timestamps
        words: List[Dict[str, Any]] = []
        for s in sample_segments:
            seg_words = s["text"].split()
            seg_dur = s["end"] - s["start"]
            step = seg_dur / max(1, len(seg_words))
            for i, w in enumerate(seg_words):
                w_start = round(s["start"] + (i * step), 2)
                w_end = round(w_start + step * 0.9, 2)
                words.append({"word": w, "start": w_start, "end": w_end})

        return {
            "provider": "mock_whisper",
            "language": language,
            "full_text": full_text,
            "word_timestamps": words,
            "segment_timestamps": sample_segments,
            "raw_response": {"status": "mock_success"}
        }


def get_transcription_service() -> TranscriptionProvider:
    provider = settings.TRANSCRIPTION_PROVIDER.lower()
    if settings.is_mock_mode or provider == "mock":
        return MockTranscriptionProvider()
    elif provider == "openai":
        return OpenAIWhisperProvider()
    elif provider == "assemblyai":
        return AssemblyAIProvider()
    return MockTranscriptionProvider()
