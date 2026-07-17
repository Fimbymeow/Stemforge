export const SYNC_REQUEST_TIMEOUT_MS = 15_000;
export const SYNC_VISIBLE_INTERVAL_MS = 10 * 60_000;
export const SYNC_VISIBILITY_REFRESH_MS = 5 * 60_000;
export const SYNC_LOCAL_CHANGE_DEBOUNCE_MS = 2_000;

const RETRY_DELAYS_MS = [5_000, 15_000, 60_000, 5 * 60_000, 15 * 60_000] as const;

export function progressSyncRetryDelay(consecutiveFailures: number, random = Math.random()) {
  const index = Math.max(0, Math.min(RETRY_DELAYS_MS.length - 1, consecutiveFailures - 1));
  const base = RETRY_DELAYS_MS[index];
  const boundedRandom = Math.max(0, Math.min(1, random));
  const jitter = 0.8 + boundedRandom * 0.4;
  return Math.round(base * jitter);
}

export function nextProgressSyncRetryAt(consecutiveFailures: number, now = Date.now(), random = Math.random()) {
  return new Date(now + progressSyncRetryDelay(consecutiveFailures, random)).toISOString();
}
