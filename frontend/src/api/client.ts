/**
 * ReelReason FastAPI HTTP client.
 * Mirrors the backend contract (backend/app/routes):
 *   Projects:  POST /api/projects (multipart) · GET /api/projects · GET /api/projects/{id}
 *              DELETE /api/projects/{id} · POST /api/projects/{id}/analyze · GET /api/projects/{id}/status
 *   Clips:     GET /api/projects/{id}/clips · GET /api/clips/{id} · PATCH /api/clips/{id}
 *              POST /api/clips/{id}/approve|reject|regenerate-hook|regenerate-caption
 *   Reels:     POST /api/clips/{clip_id}/render · GET /api/reels/{reel_id}
 *   Users:     GET/PATCH /api/users/me
 * Auth: Authorization: Bearer <token>. In backend mock mode "demo-token" is accepted;
 * with real Supabase auth configured, call setAuthToken(session.access_token).
 */

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

export class ApiUnavailableError extends Error {
  constructor() {
    super('ReelReason backend is not reachable.');
    this.name = 'ApiUnavailableError';
  }
}

/* --------------------------- Auth token --------------------------- */

let authToken = 'demo-token';

export function setAuthToken(token: string | null | undefined): void {
  authToken = token && token.length > 0 ? token : 'demo-token';
}

export function getAuthToken(): string {
  return authToken;
}

/* --------------------------- Core fetch --------------------------- */

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 30000, ...fetchInit } = init;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchInit,
      headers: {
        ...(fetchInit.body instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${authToken}`,
        ...fetchInit.headers,
      },
      signal: controller.signal,
    });
  } catch {
    throw new ApiUnavailableError();
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = 'Request failed';
    try {
      const errBody = await res.json();
      detail = errBody?.detail || errBody?.message || detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`${detail} (${res.status})`);
  }

  const json = (await res.json()) as ApiEnvelope<T> | T;
  // All FastAPI routes wrap payloads in APIResponse { success, message, data }
  if (json && typeof json === 'object' && 'data' in (json as ApiEnvelope<T>)) {
    return (json as ApiEnvelope<T>).data;
  }
  return json as T;
}

/** Lightweight availability probe — any HTTP response means the API is up. */
export async function isBackendAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: controller.signal,
    });
    return res.status < 500 || res.status === 502;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------- Raw payload shapes --------------------------- */

export interface BackendProject {
  id: string;
  user_id: string;
  title: string | null;
  source_type: 'upload' | 'youtube';
  source_url: string | null;
  video_path: string | null;
  audio_path: string | null;
  duration_seconds: number | null;
  language: string | null;
  platform: string | null;
  audience: string | null;
  goal: string | null;
  tone: string | null;
  preferred_clip_types: string[] | null;
  number_of_clips: number;
  status: string;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BackendProjectStatus {
  project_id: string;
  status: string;
  progress_percentage: number;
  current_step: string;
  step_index: number;
  total_steps: number;
  error_message: string | null;
  estimated_time_remaining_seconds: number | null;
}

export interface BackendScores {
  hook_strength: number;
  clarity: number;
  audience_fit: number;
  shareability: number;
  overall_score: number;
  confidence: number;
}

interface BackendClipBase {
  id: string;
  project_id: string;
  segment_id: string | null;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  clip_type: string;
  hook: string;
  title: string;
  caption: string;
  hashtags: string[];
  target_audience: string | null;
  reasoning: string;
  status: string;
  posting_order: number | null;
  alternative_hooks: string[];
  subtitle_style: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export type BackendClip = BackendClipBase & Partial<BackendScores>;

export interface BackendReel {
  id: string;
  clip_id: string;
  project_id: string;
  user_id: string;
  render_status: 'queued' | 'processing' | 'completed' | 'failed';
  renderer_job_id: string | null;
  video_path: string | null;
  video_url: string | null;
  subtitle_url: string | null;
  thumbnail_url: string | null;
  aspect_ratio: string;
  error_message: string | null;
  updated_at: string | null;
}

/* --------------------------- Endpoints --------------------------- */

export interface CreateProjectInput {
  file?: File | null;
  youtubeUrl?: string | null;
  title?: string;
  platform: string;
  audience: string;
  goal: string;
  tone: string;
  numberOfClips: number;
  language: string;
}

export async function createProject(input: CreateProjectInput): Promise<BackendProject> {
  const form = new FormData();
  form.append('source_type', input.file ? 'upload' : 'youtube');
  if (input.youtubeUrl) form.append('source_url', input.youtubeUrl);
  if (input.title) form.append('title', input.title);
  form.append('platform', input.platform);
  form.append('audience', input.audience);
  form.append('goal', input.goal);
  form.append('tone', input.tone);
  form.append('number_of_clips', String(input.numberOfClips));
  form.append('language', input.language);
  form.append('auto_analyze', 'true');
  if (input.file) form.append('file', input.file);

  return apiFetch<BackendProject>('/api/projects', {
    method: 'POST',
    body: form,
    timeoutMs: 120000,
  });
}

export async function listProjects(): Promise<BackendProject[]> {
  return apiFetch<BackendProject[]>('/api/projects', { method: 'GET' });
}

export async function getProject(projectId: string): Promise<BackendProject> {
  return apiFetch<BackendProject>(`/api/projects/${projectId}`, { method: 'GET' });
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiFetch(`/api/projects/${projectId}`, { method: 'DELETE' });
}

export async function projectStatus(projectId: string): Promise<BackendProjectStatus> {
  return apiFetch<BackendProjectStatus>(`/api/projects/${projectId}/status`, { method: 'GET' });
}

export async function listProjectClips(
  projectId: string,
  opts: { clipType?: string; status?: string; sortBy?: 'score' | 'timestamp' | 'duration' } = {}
): Promise<BackendClip[]> {
  const params = new URLSearchParams();
  if (opts.clipType) params.set('clip_type', opts.clipType);
  if (opts.status) params.set('status', opts.status);
  if (opts.sortBy) params.set('sort_by', opts.sortBy);
  const qs = params.toString();
  return apiFetch<BackendClip[]>(`/api/projects/${projectId}/clips${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export interface ClipPatch {
  hook?: string;
  title?: string;
  caption?: string;
  hashtags?: string[];
  start_time?: number;
  end_time?: number;
  clip_type?: string;
  target_audience?: string;
}

export async function updateClip(clipId: string, patch: ClipPatch): Promise<BackendClip> {
  return apiFetch<BackendClip>(`/api/clips/${clipId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function approveClip(clipId: string): Promise<BackendClip> {
  return apiFetch<BackendClip>(`/api/clips/${clipId}/approve`, { method: 'POST' });
}

export async function rejectClip(clipId: string): Promise<BackendClip> {
  return apiFetch<BackendClip>(`/api/clips/${clipId}/reject`, { method: 'POST' });
}

export async function regenerateHook(clipId: string): Promise<{ clip_id: string; primary_hook: string; alternative_hooks: string[] }> {
  return apiFetch(`/api/clips/${clipId}/regenerate-hook`, { method: 'POST' });
}

export async function regenerateCaption(clipId: string): Promise<{ clip_id: string; title: string; caption: string; hashtags: string[] }> {
  return apiFetch(`/api/clips/${clipId}/regenerate-caption`, { method: 'POST' });
}

export async function requestRender(clipId: string): Promise<BackendReel> {
  return apiFetch<BackendReel>(`/api/clips/${clipId}/render`, { method: 'POST', timeoutMs: 60000 });
}

export async function getRenderStatus(reelId: string): Promise<BackendReel> {
  return apiFetch<BackendReel>(`/api/reels/${reelId}`, { method: 'GET' });
}

export interface BackendUser {
  id: string;
  email: string | null;
  full_name: string | null;
  creator_handle: string | null;
  default_platform: string | null;
  default_tone: string | null;
  default_audience: string | null;
  preferred_clip_types: string[] | null;
  default_number_of_clips: number | null;
}

export async function getCurrentUser(): Promise<BackendUser> {
  return apiFetch<BackendUser>('/api/users/me', { method: 'GET' });
}

export interface BackendProfilePatch {
  name?: string;
  default_platform?: string;
  default_audience?: string;
  default_tone?: string;
  preferred_clip_types?: string[];
  clips_per_video?: number;
}

export async function updateProfile(patch: BackendProfilePatch): Promise<BackendUser> {
  return apiFetch<BackendUser>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
