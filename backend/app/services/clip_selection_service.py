"""
Clip Selection, Scoring, Penalty Calculation, Deduplication, and Diversity Optimization Service.
Enforces the 5-parameter weighted scoring formula:
  overall_score = 0.30*hook_strength + 0.25*clarity + 0.20*audience_fit + 0.15*shareability + 0.10*confidence
Applies strategic penalties, removes semantically duplicate ideas, and balances clip diversity.
"""
from typing import List, Dict, Any, Set
import logging
import re
from difflib import SequenceMatcher
from app.utils.time_utils import parse_timestamp_to_seconds

logger = logging.getLogger("reelreason.clip_selection")


class ClipSelectionService:
    def calculate_overall_score(
        self,
        hook_strength: int,
        clarity: int,
        audience_fit: int,
        shareability: int,
        confidence: float
    ) -> int:
        """
        Calculates normalized overall score using official ReelReason formula:
        overall_score = 0.30*hook + 0.25*clarity + 0.20*fit + 0.15*share + 0.10*confidence
        """
        score = (
            (0.30 * hook_strength) +
            (0.25 * clarity) +
            (0.20 * audience_fit) +
            (0.15 * shareability) +
            (0.10 * confidence)
        )
        return int(round(max(0.0, min(100.0, score))))

    def apply_penalties(
        self,
        clip: Dict[str, Any],
        preferred_types: List[str]
    ) -> Dict[str, Any]:
        """
        Applies penalty rules:
        - Penalize clips that start slowly
        - Penalize incomplete thoughts or trailing intros
        - Penalize clips > 90 seconds or < 20 seconds
        - Penalize clips that do not match preferred types
        """
        updated = dict(clip)
        penalty = 0

        # 1. Duration penalties
        try:
            start_sec = parse_timestamp_to_seconds(clip.get("start", "00:00"))
            end_sec = parse_timestamp_to_seconds(clip.get("end", "00:30"))
            duration = end_sec - start_sec

            if duration > 90.0:
                penalty += 15  # Excessive duration penalty
            elif duration < 20.0:
                penalty += 20  # Too brief for coherent thought

            # Ideal 30-60 bonus
            if 30.0 <= duration <= 60.0:
                updated["overall_score"] = min(100, updated.get("overall_score", 80) + 3)
        except Exception:
            pass

        # 2. Hook weakness penalty (e.g. "So basically", "Um, yeah")
        hook_text = clip.get("hook", "").lower()
        if any(weak in hook_text for weak in ["so basically", "welcome back", "in this video", "hello everyone"]):
            penalty += 15

        # 3. Preferred clip type mismatch
        clip_type = clip.get("clip_type", "")
        if preferred_types and clip_type not in preferred_types:
            penalty += 10

        # Adjust score
        raw_score = updated.get("overall_score") or self.calculate_overall_score(
            updated.get("hook_strength", 80),
            updated.get("clarity", 80),
            updated.get("audience_fit", 80),
            updated.get("shareability", 80),
            updated.get("confidence", 80.0)
        )

        updated["overall_score"] = max(10, raw_score - penalty)
        return updated

    def detect_and_remove_duplicate_ideas(self, clips: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Compares clip titles, hooks, and summaries using token Jaccard similarity.
        If semantic overlap > 0.45, keeps only the higher scoring clip.
        """
        if not clips:
            return []

        # Sort descending by score first
        sorted_clips = sorted(clips, key=lambda c: c.get("overall_score", 0), reverse=True)
        unique_clips: List[Dict[str, Any]] = []

        for candidate in sorted_clips:
            candidate_tokens = self._extract_token_set(
                f"{candidate.get('title', '')} {candidate.get('hook', '')} {candidate.get('reason', '')}"
            )
            candidate_text = self._normalize_idea_text(
                f"{candidate.get('title', '')} {candidate.get('hook', '')} {candidate.get('reason', '')}"
            )

            is_duplicate = False
            for accepted in unique_clips:
                accepted_tokens = self._extract_token_set(
                    f"{accepted.get('title', '')} {accepted.get('hook', '')} {accepted.get('reason', '')}"
                )
                accepted_text = self._normalize_idea_text(
                    f"{accepted.get('title', '')} {accepted.get('hook', '')} {accepted.get('reason', '')}"
                )

                similarity = self._jaccard_similarity(candidate_tokens, accepted_tokens)
                paraphrase_similarity = SequenceMatcher(None, candidate_text, accepted_text).ratio()
                if similarity > 0.45 or paraphrase_similarity >= 0.72:
                    logger.info(
                        f"Duplicate idea detected between '{candidate.get('title')}' and '{accepted.get('title')}' "
                        f"(token overlap {similarity:.2f}, text similarity {paraphrase_similarity:.2f}). "
                        "Dropping lower-scoring clip."
                    )
                    is_duplicate = True
                    break

            if not is_duplicate:
                unique_clips.append(candidate)

        return unique_clips

    def _normalize_idea_text(self, text: str) -> str:
        """Normalize whitespace and punctuation before comparing idea wording."""
        return " ".join(re.findall(r"[a-z0-9]+", text.lower()))

    def balance_diversity(
        self,
        clips: List[Dict[str, Any]],
        target_count: int,
        preferred_types: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Balances clip distribution across diverse content angles:
        For 3 clips: 1 strong opinion, 1 practical lesson, 1 story/emotion
        For 5 clips: 1 opinion, 1 lesson, 1 story, 1 emotional moment, 1 contrarian take/insight
        For 7 clips: adds humor and additional lesson/insight.
        """
        if not clips:
            return []

        # Group clips by type
        by_type: Dict[str, List[Dict[str, Any]]] = {}
        for c in clips:
            ctype = c.get("clip_type", "insight")
            by_type.setdefault(ctype, []).append(c)

        # Define ideal archetype order
        if target_count <= 3:
            ideal_archetypes = ["strong_opinion", "practical_lesson", "story"]
        elif target_count <= 5:
            ideal_archetypes = ["strong_opinion", "practical_lesson", "story", "emotional_moment", "contrarian_take"]
        else:
            ideal_archetypes = ["strong_opinion", "practical_lesson", "story", "emotional_moment", "contrarian_take", "humor", "insight"]

        selected: List[Dict[str, Any]] = []
        used_ids = set()

        # Phase 1: Try to pick best clip for each ideal archetype
        for archetype in ideal_archetypes:
            candidates = by_type.get(archetype, [])
            for cand in candidates:
                cand_key = f"{cand.get('start')}_{cand.get('end')}_{cand.get('hook')}"
                if cand_key not in used_ids:
                    selected.append(cand)
                    used_ids.add(cand_key)
                    break
            if len(selected) >= target_count:
                break

        # Phase 2: If we still need more clips, fill with remaining highest scoring clips
        if len(selected) < target_count:
            all_remaining = sorted(
                clips,
                key=lambda c: c.get("overall_score", 0),
                reverse=True
            )
            for cand in all_remaining:
                cand_key = f"{cand.get('start')}_{cand.get('end')}_{cand.get('hook')}"
                if cand_key not in used_ids:
                    selected.append(cand)
                    used_ids.add(cand_key)
                if len(selected) >= target_count:
                    break

        # Assign strategic posting orders (order 1 to N)
        for idx, clip in enumerate(selected, start=1):
            clip["posting_order"] = idx

        return selected

    def _extract_token_set(self, text: str) -> Set[str]:
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        stopwords = {"the", "and", "that", "this", "with", "have", "from", "your", "what", "will", "about"}
        return set(w for w in words if w not in stopwords)

    def _jaccard_similarity(self, set1: Set[str], set2: Set[str]) -> float:
        if not set1 or not set2:
            return 0.0
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        return float(intersection) / float(union) if union > 0 else 0.0


clip_selection_service = ClipSelectionService()
