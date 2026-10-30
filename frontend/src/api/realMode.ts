/**
 * Real Backend Registry.
 * Tracks which local projects are mirrored against the FastAPI backend, and
 * probes backend availability so pages can operate in "real" vs "client demo" mode.
 * The demo path never breaks: when the backend is unreachable, everything runs locally.
 */

const REGISTRY_KEY = 'reelreason_real_projects_v1';

let availability: boolean | null = null;
let probePromise: Promise<boolean> | null = null;

/** True once a probe has succeeded (cached for the session). */
export function isBackendConfirmed(): boolean | null {
  return availability;
}

/** Probe the backend once; result is cached in-memory for the session. */
export async function ensureBackendProbed(probeFn: () => Promise<boolean>): Promise<boolean> {
  if (availability !== null) return availability;
  if (!probePromise) {
    probePromise = probeFn()
      .then((ok) => {
        availability = ok;
        return ok;
      })
      .catch(() => {
        availability = false;
        return false;
      });
  }
  return probePromise;
}

/** localStorage map: local project id → backend project id */
function loadRegistry(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function registerRealProject(localId: string, backendId: string): void {
  try {
    const map = loadRegistry();
    map[localId] = backendId;
    map[backendId] = backendId; // server-created projects referenced directly by uuid
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to persist backend project registry:', e);
  }
}

/** Mark a raw backend project id as server-backed (used when merging the server list). */
export function markRealProjectId(backendId: string): void {
  try {
    const map = loadRegistry();
    if (!map[backendId]) {
      map[backendId] = backendId;
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(map));
    }
  } catch (e) {
    console.warn('Failed to persist backend project registry:', e);
  }
}

export function getBackendProjectId(localId: string): string | undefined {
  return loadRegistry()[localId];
}

export function isRealProject(localId: string): boolean {
  return Boolean(loadRegistry()[localId]);
}

/** FastAPI clip ids are UUIDs; local simulated clips use `clip-…` prefixes. */
export function looksLikeBackendClipId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
