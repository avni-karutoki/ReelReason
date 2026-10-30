export type VideoType = 'podcast' | 'keynote' | 'tutorial' | 'interview' | 'vlog' | 'panel';
export type TargetPlatform = 'reels' | 'shorts' | 'facebook_reels' | 'linkedin';
export type ClipCategory = 'Strong Opinion' | 'Practical Lesson' | 'Unexpected Story' | 'Framework Breakdown' | 'Counter-Intuitive Truth';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type RenderStatus = 'pending' | 'rendering' | 'ready';
export type SubtitleStyle = 'bold-punch' | 'clean-editorial' | 'minimal-bottom' | 'karaoke-pop';
export type SubtitlePosition = 'top' | 'middle' | 'lower-third';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface ClipStyleConfig {
  subtitleStyle: SubtitleStyle;
  fontSize: number;
  textColor: string;
  position: SubtitlePosition;
  watermarkEnabled: boolean;
  creatorHandle: string;
}

export interface ClipScores {
  overall: number; // e.g. 94
  hookStrength: number; // e.g. 96
  clarity: number; // e.g. 91
  audienceFit: number; // e.g. 95
  shareability: number; // e.g. 92
}

export interface ClipReasoning {
  selectionReason: string;
  targetAudienceAnalysis: string;
  hookBreakdown: string;
  clarityNotes: string;
  shareabilityFactor: string;
  suggestedPostingPosition: string;
  recommendedPlatform: string;
  retentionWarning?: string;
}

/* Explainable AI scoring internals (optional — falls back to derived defaults) */
export interface ScoreFactor {
  label: string;      // e.g. "Hook Tension"
  weight: number;     // % contribution to overall score, e.g. 28
  score: number;      // 0-100 initial strength
  note: string;       // plain-English explanation of the signal
}

export interface ClipAnalysis {
  factors: ScoreFactor[];
  /** Algorithm confidence in this selection, 0-100 */
  confidence: number;
  /** Sliding windows scanned across the transcript */
  candidatesScanned: number;
  /** Windows that reached the final ranking stage */
  finalistsConsidered: number;
  /** How this window compares: overall score minus runner-up */
  runnerUpGap: number;
}

export interface Clip {
  id: string;
  projectId: string;
  category: ClipCategory;
  hook: string;
  title: string;
  caption: string;
  hashtags: string[];
  targetAudience: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  duration: number; // in seconds
  scores: ClipScores;
  reasoning: ClipReasoning;
  analysis?: ClipAnalysis;
  alternativeHooks: string[];
  alternativeCaptions: string[];
  approvalStatus: ApprovalStatus;
  renderStatus: RenderStatus;
  renderProgress: number; // 0-100
  styleConfig: ClipStyleConfig;
  transcriptSegments: TranscriptSegment[];
}

export interface Project {
  id: string;
  title: string;
  sourceFilename: string;
  sourceFileSize: string;
  sourceVideoUrl: string | null;
  youtubeUrl?: string | null;
  thumbnailUrl: string;
  duration: number; // in seconds
  formattedDuration: string;
  createdAt: string;
  status: 'processing' | 'completed' | 'draft';
  videoType: VideoType;
  platform: TargetPlatform;
  primaryGoal: string;
  targetAudience: string;
  tone: string;
  clipTypes: ClipCategory[];
  numClipsRequested: number;
  language: 'English' | 'Hindi' | 'Hinglish';
  clips: Clip[];
  exportCount: number;
}

export interface UserSettings {
  displayName: string;
  email: string;
  avatarUrl: string;
  creatorHandle: string;
  brandColor: string;
  fontPreference: string;
  watermarkEnabled: boolean;
  defaultSubtitleStyle: SubtitleStyle;
  defaultPlatform: TargetPlatform;
  defaultAudience: string;
  defaultTone: string;
  preferredClipTypes: ClipCategory[];
  defaultNumberClips: number;
  theme: 'light' | 'dark' | 'system';
}
