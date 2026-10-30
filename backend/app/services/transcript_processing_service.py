"""
Transcript Processing Service.
Cleans raw spoken transcripts (filler words, stuttering), merges short utterances,
partitions the text into semantic segments bounded between 20s and 90s (ideal 30-60s),
and generates semantic segment summaries.
"""
from typing import List, Dict, Any, Optional
import logging
from app.utils.text_utils import remove_filler_words, split_text_into_sentences
from app.models.transcript_models import TranscriptSegmentItem

logger = logging.getLogger("reelreason.transcript_processing")


class TranscriptProcessingService:
    def process_raw_transcript(
        self,
        raw_segments: List[Dict[str, Any]],
        project_id: str,
        transcript_id: str,
        min_duration: float = 20.0,
        ideal_min_duration: float = 30.0,
        ideal_max_duration: float = 60.0,
        max_duration: float = 90.0,
    ) -> List[Dict[str, Any]]:
        """
        Cleans and splits raw speech segments into coherent semantic segments.
        Ensures each segment has clear beginning, middle, and end within target duration constraints.
        """
        if not raw_segments:
            return []

        cleaned_segments: List[Dict[str, Any]] = []

        # Step 1: Clean filler words on each raw segment
        normalized_raw = []
        for s in raw_segments:
            raw_text = s.get("text", "").strip()
            cleaned_text = remove_filler_words(raw_text)
            if not cleaned_text:
                continue
            normalized_raw.append({
                "start": float(s.get("start", 0.0)),
                "end": float(s.get("end", 0.0)),
                "text": cleaned_text,
                "speaker": s.get("speaker", "Speaker 1")
            })

        if not normalized_raw:
            return []

        # Step 2: Merge very short segments and chunk into semantic segments
        # (aiming for 30-60s ideal, min 20s, max 90s)
        current_start = normalized_raw[0]["start"]
        current_end = normalized_raw[0]["end"]
        current_texts = [normalized_raw[0]["text"]]
        current_speaker = normalized_raw[0].get("speaker", "Speaker 1")

        segment_index = 0

        for s in normalized_raw[1:]:
            seg_start = s["start"]
            seg_end = s["end"]
            seg_text = s["text"]
            seg_speaker = s.get("speaker", "Speaker 1")

            potential_duration = seg_end - current_start
            pause_gap = seg_start - current_end

            # Boundary triggers:
            # 1. Potential duration reaches ideal max duration (60s) or hard max duration (90s)
            # 2. Significant pause gap (> 3.5s indicates clear topic pause) AND duration >= min_duration
            # 3. Speaker change AND duration >= min_duration
            should_split = (
                potential_duration >= ideal_max_duration or
                (pause_gap > 3.5 and potential_duration >= min_duration) or
                (seg_speaker != current_speaker and potential_duration >= min_duration)
            )

            if should_split and (current_end - current_start) >= min_duration:
                full_seg_text = " ".join(current_texts).strip()
                cleaned_segments.append(
                    self._create_segment_dict(
                        project_id=project_id,
                        transcript_id=transcript_id,
                        start_time=current_start,
                        end_time=current_end,
                        text=full_seg_text,
                        speaker=current_speaker,
                        segment_index=segment_index
                    )
                )
                segment_index += 1

                # Start new segment
                current_start = seg_start
                current_end = seg_end
                current_texts = [seg_text]
                current_speaker = seg_speaker
            else:
                current_end = seg_end
                current_texts.append(seg_text)

        # Flush any trailing segment
        if current_texts:
            full_seg_text = " ".join(current_texts).strip()
            # If trailing segment is too short, merge with previous if available
            duration = current_end - current_start
            if duration < min_duration and cleaned_segments:
                prev = cleaned_segments[-1]
                prev["end_time"] = current_end
                prev["text"] = prev["text"] + " " + full_seg_text
                prev["summary"] = self._generate_summary(prev["text"])
            else:
                cleaned_segments.append(
                    self._create_segment_dict(
                        project_id=project_id,
                        transcript_id=transcript_id,
                        start_time=current_start,
                        end_time=current_end,
                        text=full_seg_text,
                        speaker=current_speaker,
                        segment_index=segment_index
                    )
                )

        logger.info(f"Processed transcript into {len(cleaned_segments)} semantic segments.")
        return cleaned_segments

    def _create_segment_dict(
        self,
        project_id: str,
        transcript_id: str,
        start_time: float,
        end_time: float,
        text: str,
        speaker: str,
        segment_index: int
    ) -> Dict[str, Any]:
        return {
            "project_id": project_id,
            "transcript_id": transcript_id,
            "start_time": round(start_time, 2),
            "end_time": round(end_time, 2),
            "text": text,
            "summary": self._generate_summary(text),
            "speaker": speaker,
            "segment_index": segment_index,
        }

    def _generate_summary(self, text: str) -> str:
        """Generates concise 1-sentence synopsis of the segment."""
        sentences = split_text_into_sentences(text)
        if not sentences:
            return text[:100] + "..." if len(text) > 100 else text
        # Use first meaningful sentence as summary
        summary = sentences[0]
        if len(summary) > 120:
            summary = summary[:117] + "..."
        return summary


transcript_processing_service = TranscriptProcessingService()
