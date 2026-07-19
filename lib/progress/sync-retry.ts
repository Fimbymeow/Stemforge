export const SYNC_REQUEST_TIMEOUT_MS = 15_000;
export const SYNC_VISIBLE_INTERVAL_MS = 10 * 60_000;
export const SYNC_VISIBILITY_REFRESH_MS = 5 * 60_000;
export const SYNC_LOCAL_CHANGE_DEBOUNCE_MS = 2_000;

const RETRY_DELAYS_MS = [5_000, 15_000, 60_000, 5 * 60_000, 15 * 60_000] as const;
const MIN_RETRY_AFTER_MS = 1_000;
const MAX_RETRY_AFTER_MS = 15 * 60_000;

export function progressSyncRetryDelay(consecutiveFailures: number, random = Math.random()) {
  const index = Math.max(0, Math.min(RETRY_DELAYS_MS.length - 1, consecutiveFailures - 1));
  const base = RETRY_DELAYS_MS[index];
  const boundedRandom = Math.max(0, Math.min(1, random));
  const jitter = 0.8 + boundedRandom * 0.4;
  return Math.round(base * jitter);
}

export function retryAfterDelay(value: string | null, now = Date.now()) {
  if (!value) return null;
  const seconds = Number(value);
  const delay = Number.isFinite(seconds) && seconds >= 0
    ? seconds * 1_000
    : Date.parse(value) - now;
  if (!Number.isFinite(delay) || delay < 0) return null;
  return Math.max(MIN_RETRY_AFTER_MS, Math.min(MAX_RETRY_AFTER_MS, Math.round(delay)));
}

export function nextProgressSyncRetryAt(
  consecutiveFailures: number,
  now = Date.now(),
  random = Math.random(),
  serverDelayMs: number | null = null,
) {
  const localDelay = progressSyncRetryDelay(consecutiveFailures, random);
  const delay = serverDelayMs === null ? localDelay : Math.max(localDelay, Math.min(MAX_RETRY_AFTER_MS, serverDelayMs));
  return new Date(now + delay).toISOString();
}
