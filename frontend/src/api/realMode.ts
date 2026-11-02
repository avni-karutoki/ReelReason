/**
 * Real Backend Registry.
 * Tracks which local projects are mirrored against the FastAPI backend, and
 * probes backend availability so pages can operate in "real" vs "client demo" mode.
 * The demo path never breaks: when the backend is unreachable, everything runs locally.
 */

const REGISTRY_KEY = 'reelreason_real_projects_v1';

let availability: boolean | null = null;
let probePromise: Promise<boolean> | null = null;
/** Timestamp of the last failed probe; failures are retried after a short backoff (cold starts). */
let lastFailureAt = 0;
const FAILURE_BACKOFF_MS = 20_000;

/** True once a probe has succeeded (cached for the session). */
export function isBackendConfirmed(): boolean | null {
  return availability;
}

/**
 * Probe the backend. True results are cached for the session; false results are
 * retried after a short backoff so a Render free-tier cold start (>30s wake-up)
 * still eventually flips the studio into real mode.
 */
export async function ensureBackendProbed(probeFn: () => Promise<boolean>): Promise<boolean> {
  if (availability === true) return true;
  if (availability === false && Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
    return false;
  }
  if (!probePromise) {
    probePromise = probeFn()
      .then((ok) => {
        if (ok) {
          availability = true;
        } else {
          availability = false;
          lastFailureAt = Date.now();
        }
        return ok;
      })
      .catch(() => {
        availability = false;
        lastFailureAt = Date.now();
        return false;
      })
      .finally(() => {
        probePromise = null;
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
