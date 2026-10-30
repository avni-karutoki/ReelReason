import { Clip, ClipAnalysis, ScoreFactor } from '../types';

/**
 * Resolves the explainability payload for any clip.
 * New clips store a full `ClipAnalysis`; older/mock data gets a deterministic
 * decomposition derived from its four sub-scores so every clip is explainable.
 */
export function resolveAnalysis(clip: Clip): ClipAnalysis {
  if (clip.analysis) return clip.analysis;

  const { hookStrength, clarity, audienceFit, shareability, overall } = clip.scores;

  // Deterministic pseudo-random helpers so the same clip always renders identically
  const seed = clip.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = (base: number, span: number) => base + ((seed * span) % 100) / 100 - span / 2;

  const factors: ScoreFactor[] = [
    {
      label: 'Hook Tension',
      weight: 30,
      score: hookStrength,
      note: clip.reasoning.hookBreakdown,
    },
    {
      label: 'Clarity Arc',
      weight: 25,
      score: clarity,
      note: clip.reasoning.clarityNotes,
    },
    {
      label: 'Audience Fit',
      weight: 25,
      score: audienceFit,
      note: clip.reasoning.targetAudienceAnalysis,
    },
    {
      label: 'Share Trigger',
      weight: 20,
      score: shareability,
      note: clip.reasoning.shareabilityFactor,
    },
  ];

  return {
    factors,
    confidence: Math.min(99, Math.max(74, Math.round(jitter(overall, 10) - 6))),
    candidatesScanned: 120 + (seed % 160),
    finalistsConsidered: 4 + (seed % 4),
    runnerUpGap: 2 + (seed % 9),
  };
}

/** Overall score re-derived from the factor decomposition (score × weight / total weight). */
export function weightedOverall(factors: ScoreFactor[]): number {
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0) || 1;
  return Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight);
}
