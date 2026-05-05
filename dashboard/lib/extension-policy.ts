/**
 * Extension request policy helpers: version compatibility and in-memory rate limit.
 */

const MIN_EXTENSION_VERSION = "1.1.0";

const requestBuckets = new Map<string, number[]>();

/**
 * Compares semantic versions.
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
export function compareSemver(a: string, b: string): number {
  const aParts = a.split(".").map((v) => Number.parseInt(v, 10) || 0);
  const bParts = b.split(".").map((v) => Number.parseInt(v, 10) || 0);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const av = aParts[i] ?? 0;
    const bv = bParts[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/**
 * Returns true if extension version is supported.
 */
export function isSupportedExtensionVersion(version: string | null): boolean {
  if (!version) return false;
  return compareSemver(version, MIN_EXTENSION_VERSION) >= 0;
}

/**
 * Sliding-window in-memory limiter for per-user calls.
 */
export function consumeUserRateLimit(
  userKey: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = requestBuckets.get(userKey) || [];
  const recent = existing.filter((ts) => ts > cutoff);

  if (recent.length >= maxRequests) {
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    requestBuckets.set(userKey, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  requestBuckets.set(userKey, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getMinimumExtensionVersion(): string {
  return MIN_EXTENSION_VERSION;
}
