"""
Speech-to-Text Transcription Service with Provider Abstraction.
Supports Google Gemini (gemini transcribe models), OpenAI Whisper API, AssemblyAI,
and Demo/Mock transcription with word-level timestamps.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
import asyncio
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


class GeminiTranscriptionProvider(TranscriptionProvider):
    """
    Speech-to-text through Google's dedicated transcribe model (default
    gemini-3.5-transcribe) via the Interactions API in verbatim mode — the only
    Gemini surface that returns word-level time alignments (word_info
    annotations with second-based string offsets like "0.400s").

    Audio is uploaded with Gemini's resumable Files API and passed to the
    Interactions API by URI. Temporary provider-side copies are deleted after
    each interaction.
    """

    ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"
    FILES_ENDPOINT = "https://generativelanguage.googleapis.com/upload/v1beta/files"
    _MIME_BY_EXT = {
        ".mp3": "audio/mp3",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
        ".aac": "audio/mp4",
        ".ogg": "audio/ogg",
        ".opus": "audio/opus",
        ".flac": "audio/flac",
        ".webm": "audio/webm",
    }

    async def transcribe(self, audio_file_path: str, language: str = "English") -> Dict[str, Any]:
        logger.info(f"GeminiTranscriptionProvider transcribing: {audio_file_path}")
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured")

        model = settings.GEMINI_TRANSCRIBE_MODEL or "gemini-3.5-transcribe"
        mime_type = self._mime_type(audio_file_path)
        file_name: Optional[str] = None
        language_codes = {
            "english": ["en-US"],
            "hindi": ["hi-IN"],
        }.get(language.strip().lower(), [])
        transcription_config: Dict[str, Any] = {
            "mode": {
                "type": "verbatim",
                "timestamp_granularities": ["word"],
            }
        }
        if language_codes:
            transcription_config["language_codes"] = language_codes

        async with httpx.AsyncClient(timeout=600.0) as client:
            try:
                file_uri, file_name = await self._upload_audio(client, audio_file_path, mime_type)
                payload = {
                    "model": model,
                    "input": [{"type": "audio", "uri": file_uri, "mime_type": mime_type}],
                    "generation_config": {
                        "transcription_config": transcription_config,
                    },
                    "store": False,
                }
                resp = await client.post(
                    self.ENDPOINT,
                    headers={"x-goog-api-key": settings.GEMINI_API_KEY},
                    json=payload,
                )
                if resp.status_code != 200:
                    raise RuntimeError(f"Gemini transcription API error: {resp.text}")
                data = resp.json()
            finally:
                if file_name:
                    await self._delete_uploaded_file(client, file_name)

        text, annotations = self._extract_output(data)

        words: List[Dict[str, Any]] = []
        for a in annotations:
            if a.get("type") != "word_info":
                continue
            start = self._parse_offset(a.get("start_offset"))
            end = self._parse_offset(a.get("end_offset"))
            if start is None or end is None:
                continue
            words.append({
                "word": (a.get("text") or "").strip(),
                "start": round(start, 2),
                "end": round(end, 2),
            })

        if not text.strip():
            raise RuntimeError("Gemini transcription returned no transcript text")

        segments = self._build_segments(text, words, annotations)

        return {
            "provider": "gemini_transcribe",
            "language": language,
            "full_text": text,
            "word_timestamps": words,
            "segment_timestamps": segments,
            "raw_response": data,
        }

    async def _upload_audio(
        self,
        client: httpx.AsyncClient,
        audio_file_path: str,
        mime_type: str,
    ) -> Tuple[str, str]:
        size = os.path.getsize(audio_file_path)
        start = await client.post(
            self.FILES_ENDPOINT,
            headers={
                "x-goog-api-key": settings.GEMINI_API_KEY or "",
                "X-Goog-Upload-Protocol": "resumable",
                "X-Goog-Upload-Command": "start",
                "X-Goog-Upload-Header-Content-Length": str(size),
                "X-Goog-Upload-Header-Content-Type": mime_type,
            },
            json={"file": {"display_name": os.path.basename(audio_file_path)}},
        )
        if start.status_code not in (200, 201):
            raise RuntimeError(f"Gemini file upload could not start: {start.text}")

        upload_url = start.headers.get("x-goog-upload-url")
        if not upload_url:
            raise RuntimeError("Gemini file upload did not return an upload URL")

        async def file_chunks():
            with open(audio_file_path, "rb") as audio_file:
                while True:
                    chunk = await asyncio.to_thread(audio_file.read, 1024 * 1024)
                    if not chunk:
                        break
                    yield chunk

        upload = await client.post(
            upload_url,
            headers={
                "Content-Length": str(size),
                "X-Goog-Upload-Offset": "0",
                "X-Goog-Upload-Command": "upload, finalize",
            },
            content=file_chunks(),
        )
        if upload.status_code not in (200, 201):
            raise RuntimeError(f"Gemini audio upload failed: {upload.text}")

        uploaded_file = upload.json().get("file", {})
        file_uri = uploaded_file.get("uri")
        file_name = uploaded_file.get("name")
        if not file_uri or not file_name:
            if file_name:
                await self._delete_uploaded_file(client, file_name)
            raise RuntimeError("Gemini audio upload returned an incomplete file record")
        return file_uri, file_name

    async def _delete_uploaded_file(self, client: httpx.AsyncClient, file_name: str) -> None:
        try:
            response = await client.delete(
                f"https://generativelanguage.googleapis.com/v1beta/{file_name}",
                headers={"x-goog-api-key": settings.GEMINI_API_KEY or ""},
            )
            if response.status_code not in (200, 204):
                logger.warning("Gemini temporary audio cleanup returned HTTP %s", response.status_code)
        except Exception as exc:
            logger.warning("Gemini temporary audio cleanup failed: %s", exc)

    def _mime_type(self, audio_file_path: str) -> str:
        ext = os.path.splitext(audio_file_path)[1].lower()
        return self._MIME_BY_EXT.get(ext, "audio/mp3")

    def _extract_output(self, data: Dict[str, Any]) -> Tuple[str, List[Dict[str, Any]]]:
        text = ""
        annotations: List[Dict[str, Any]] = []
        for step in data.get("steps", []):
            for block in step.get("content", []):
                if block.get("type") == "text":
                    text = text or block.get("text", "")
                    annotations.extend(block.get("annotations", []))
        return text, annotations

    def _parse_offset(self, raw: Optional[str]) -> Optional[float]:
        if raw is None:
            return None
        try:
            return float(str(raw).rstrip("s"))
        except (TypeError, ValueError):
            return None

    def _build_segments(
        self,
        text: str,
        words: List[Dict[str, Any]],
        annotations: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Groups word annotations into sentence-level segments (the Interactions
        API returns per-word annotations; sentence boundaries fall on terminal
        punctuation in each word's own text).
        """
        if not words:
            if text:
                return [{"start": 0.0, "end": 0.0, "text": text}]
            return []

        segments: List[Dict[str, Any]] = []
        current: List[Dict[str, Any]] = []
        char_ranges = [a for a in annotations if a.get("type") == "word_info"]

        for i, w in enumerate(words):
            current.append(w)
            bare = w["word"].rstrip("…\"')]\u201d”")
            is_last = i == len(words) - 1
            sentence_end = bare and bare[-1] in ".!?"
            if sentence_end or is_last:
                w_first = current[0]
                w_last = current[-1]
                if char_ranges and len(char_ranges) == len(words):
                    try:
                        seg_text = text[char_ranges[i - len(current) + 1]["start_index"]:char_ranges[i]["end_index"]]
                    except (KeyError, IndexError):
                        seg_text = " ".join(x["word"] for x in current)
                else:
                    seg_text = " ".join(x["word"] for x in current)
                segments.append({
                    "start": w_first["start"],
                    "end": w_last["end"],
                    "text": seg_text.strip(),
                })
                current = []

        return segments


def get_transcription_service() -> TranscriptionProvider:
    provider = get_transcription_provider_name()
    if provider == "gemini" and settings.TRANSCRIPTION_PROVIDER.strip().lower() == "mock":
        logger.warning("Using Gemini transcription in production instead of a mock transcription setting")
    if provider == "mock":
        return MockTranscriptionProvider()
    elif provider == "gemini":
        return GeminiTranscriptionProvider()
    elif provider == "openai":
        return OpenAIWhisperProvider()
    elif provider == "assemblyai":
        return AssemblyAIProvider()
    raise ValueError(f"Unsupported transcription provider: {provider}")


def get_transcription_provider_name() -> str:
    """Resolve the provider, preventing production Gemini deployments from silently mocking."""
    configured = settings.TRANSCRIPTION_PROVIDER.strip().lower()
    if settings.is_mock_mode:
        return "mock"
    if (
        configured == "mock"
        and settings.ENVIRONMENT.lower() == "production"
        and settings.AI_PROVIDER.lower() == "gemini"
    ):
        return "gemini"
    return configured


def is_transcription_provider_ready() -> bool:
    provider = get_transcription_provider_name()
    if provider == "gemini":
        return bool(settings.GEMINI_API_KEY)
    if provider == "openai":
        return bool(settings.OPENAI_API_KEY)
    if provider == "assemblyai":
        return bool(settings.ASSEMBLYAI_API_KEY)
    return False
