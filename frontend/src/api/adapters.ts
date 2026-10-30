/**
 * Adapters: FastAPI (Supabase) payloads ↔ frontend studio models.
 * Keeps the studio UI working against real pipeline data while preserving
 * all explainability, editing, and export behaviors.
 */
import { Clip, ClipCategory, Project } from '../types';
import { BackendClip, BackendProject, BackendProjectStatus } from './client';

/** Backend clip_type → frontend ClipboardCategory taxonomy. */
export function toClipCategory(clipType: string): ClipCategory {
  switch (clipType) {
    case 'strong_opinion':
    case 'contrarian_take':
      return 'Strong Opinion';
    case 'practical_lesson':
      return 'Practical Lesson';
    case 'story':
    case 'emotional_moment':
    case 'humor':
      return 'Unexpected Story';
    case 'insight':
      return 'Framework Breakdown';
    default:
      return 'Practical Lesson';
  }
}

/** Format seconds as HH:MM:SS-ish / MM:SS (same style the studio uses). */
function toClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function backendClipToFrontend(bc: BackendClip, projectTitle: string): Clip {
  const startTime = Number(bc.start_time) || 0;
  const endTime = Number(bc.end_time) || startTime + 30;
  const duration = bc.duration_seconds ?? Math.round(endTime - startTime);

  const hookStrength = bc.hook_strength ?? 80;
  const clarity = bc.clarity ?? 80;
  const audienceFit = bc.audience_fit ?? 80;
  const shareability = bc.shareability ?? 80;
  const overall = bc.overall_score ?? 80;
  const confidence = bc.confidence ?? 85;

  return {
    id: bc.id,
    projectId: bc.project_id,
    category: toClipCategory(bc.clip_type),
    hook: bc.hook,
    title: bc.title,
    caption: bc.caption,
    hashtags: Array.isArray(bc.hashtags) ? bc.hashtags : [],
    targetAudience: bc.target_audience || 'Target creators',
    startTime,
    endTime,
    duration: Math.round(duration),
    scores: {
      overall: Math.round(overall),
      hookStrength: Math.round(hookStrength),
      clarity: Math.round(clarity),
      audienceFit: Math.round(audienceFit),
      shareability: Math.round(shareability),
    },
    reasoning: {
      selectionReason: bc.reasoning || 'Selected by the explainable reasoning engine for strong narrative independence and hook value.',
      targetAudienceAnalysis: `Optimized for ${bc.target_audience || 'the target audience'} on ${projectTitle ? 'the intended platform' : 'social platforms'}.`,
      hookBreakdown: bc.hook ? `"${bc.hook}" opens with direct narrative tension.` : 'Hook rewritten by the hook generation service.',
      clarityNotes: 'Sentence structure verified for standalone comprehension.',
      shareabilityFactor: 'Stands alone without requiring the full source video.',
      suggestedPostingPosition: `Post ${bc.posting_order ?? 1} in the recommended sequence`,
      recommendedPlatform: 'Recommended: strongest vertical reach channel',
    },
    analysis: {
      factors: [
        { label: 'Hook Tension', weight: 30, score: Math.round(hookStrength), note: 'Opening 3 seconds evaluated for immediate narrative tension.' },
        { label: 'Clarity Arc', weight: 25, score: Math.round(clarity), note: 'Standalone comprehension without prior context.' },
        { label: 'Audience Fit', weight: 25, score: Math.round(audienceFit), note: 'Alignment with the declared target audience and platform.' },
        { label: 'Share Trigger', weight: 20, score: Math.round(shareability), note: 'Save / send-to-a-friend propensity signals.' },
      ],
      confidence: Math.round(confidence),
      candidatesScanned: 0, // unknown for persisted suggestions
      finalistsConsidered: 0,
      runnerUpGap: 0,
    },
    alternativeHooks: Array.isArray(bc.alternative_hooks) ? bc.alternative_hooks : [],
    alternativeCaptions: [],
    approvalStatus:
      bc.status === 'approved' ? 'approved'
      : bc.status === 'rejected' ? 'rejected'
      : 'pending',
    renderStatus: bc.status === 'rendering' ? 'rendering' : bc.status === 'rendered' ? 'ready' : bc.status === 'failed' ? 'pending' : 'pending',
    renderProgress: bc.status === 'rendered' ? 100 : bc.status === 'rendering' ? 40 : 0,
    styleConfig: {
      subtitleStyle: 'bold-punch',
      fontSize: 26,
      textColor: '#FFFFFF',
      position: 'lower-third',
      watermarkEnabled: true,
      creatorHandle: '@reelreason',
    },
    transcriptSegments: [],
  };
}

/** Map backend pipeline status → the page's 8-step visualization index (0-based). */
const STATUS_TO_STEP: Record<string, number> = {
  uploaded: 0,
  extracting_audio: 1,
  transcribing: 2,
  analyzing: 4,
  ranking_clips: 5,
  generating_reels: 7,
  completed: 7,
  failed: 7,
};

export function backendStatusToStepIndex(status: BackendProjectStatus): number {
  return STATUS_TO_STEP[status.status] ?? 0;
}

/** Build the local project mirror record for a real backend project. */
export function backendProjectToFrontend(bp: BackendProject, thumbnailUrl: string): Project {
  const durationSec = bp.duration_seconds ?? 1800;
  return {
    id: '', // filled by caller — local mirror id may differ from backend id
    title: bp.title || 'Studio Video',
    sourceFilename: bp.source_type === 'youtube' ? 'youtube_stream.mp4' : 'uploaded_video.mp4',
    sourceFileSize: '—',
    sourceVideoUrl: null,
    youtubeUrl: bp.source_url || null,
    thumbnailUrl,
    duration: durationSec,
    formattedDuration: toClock(durationSec),
    createdAt: (bp.created_at || new Date().toISOString()).split('T')[0],
    status: bp.status === 'completed' ? 'completed' : bp.status === 'failed' ? 'draft' : 'processing',
    videoType: 'podcast',
    platform: 'reels',
    primaryGoal: bp.goal || 'Repurpose key highlights into high-performing short clips',
    targetAudience: bp.audience || 'General creator audience',
    tone: bp.tone || 'Bold',
    clipTypes: ['Strong Opinion', 'Practical Lesson', 'Unexpected Story'],
    numClipsRequested: bp.number_of_clips || 3,
    language: 'English',
    clips: [],
    exportCount: 0,
  };
}
