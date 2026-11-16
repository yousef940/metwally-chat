/**
 * In-memory sliding-window rate limiter for server actions.
 * Protects message channels, chat requests, and reports from automated abuse.
 *
 * NOTE: the store lives in the memory of a single Node process. On serverless
 * platforms each instance keeps its own counters, so the limit is a best
 * effort there. The database-level rules (bans, under-18, anti-spam triggers)
 * remain the authoritative protection.
 */

interface RateLimitConfig {
  maxRequests: number; // Max allowed requests within window
  windowSeconds: number; // Time window in seconds
}

// In-memory record storage: key -> array of timestamps (ms)
const rateLimitStore = new Map<string, number[]>();

/** Maximum age of a stored timestamp before it is dropped (1 hour). */
const MAX_ENTRY_AGE_MS = 3_600_000;
/** How often stale entries are purged. */
const CLEANUP_INTERVAL_MS = 300_000;

/**
 * The cleanup timer is created once per process. It is stored on globalThis
 * so hot reloads in development do not pile up timers.
 */
function ensureCleanupTimer(): void {
  const globals = globalThis as typeof globalThis & {
    __sohbaRateLimitTimer?: ReturnType<typeof setInterval>;
  };

  if (globals.__sohbaRateLimitTimer) return;
  if (typeof setInterval !== "undefined") {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of rateLimitStore.entries()) {
        const valid = timestamps.filter((t) => now - t < MAX_ENTRY_AGE_MS);
        if (valid.length === 0) {
          rateLimitStore.delete(key);
        } else {
          rateLimitStore.set(key, valid);
        }
      }
    }, CLEANUP_INTERVAL_MS);

    // Never keep the process alive just for the cleanup timer.
    if (typeof timer === "object" && timer && "unref" in timer) {
      (timer as { unref: () => void }).unref();
    }

    globals.__sohbaRateLimitTimer = timer;
  }
}

ensureCleanupTimer();

export const RATE_LIMIT_PRESETS = {
  roomMessage: { maxRequests: 5, windowSeconds: 10 },
  directMessage: { maxRequests: 10, windowSeconds: 10 },
  chatRequest: { maxRequests: 3, windowSeconds: 300 }, // 3 requests per 5 minutes
  chatRequestResponse: { maxRequests: 20, windowSeconds: 300 },
  report: { maxRequests: 5, windowSeconds: 600 }, // 5 reports per 10 minutes
  block: { maxRequests: 20, windowSeconds: 3600 },
  passwordReset: { maxRequests: 3, windowSeconds: 900 }, // 3 per 15 minutes
  passwordUpdate: { maxRequests: 5, windowSeconds: 900 },
  signInAttempt: { maxRequests: 10, windowSeconds: 300 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMIT_PRESETS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/** Fallback used when an unknown action key is requested. */
const DEFAULT_CONFIG: RateLimitConfig = { maxRequests: 10, windowSeconds: 10 };

function resolveConfig(
  actionKey: string,
  customConfig?: RateLimitConfig
): RateLimitConfig {
  if (customConfig) {
    return {
      maxRequests:
        Number.isFinite(customConfig.maxRequests) && customConfig.maxRequests > 0
          ? Math.floor(customConfig.maxRequests)
          : DEFAULT_CONFIG.maxRequests,
      windowSeconds:
        Number.isFinite(customConfig.windowSeconds) && customConfig.windowSeconds > 0
          ? Math.floor(customConfig.windowSeconds)
          : DEFAULT_CONFIG.windowSeconds,
    };
  }

  if (actionKey in RATE_LIMIT_PRESETS) {
    return RATE_LIMIT_PRESETS[actionKey as RateLimitAction];
  }

  return DEFAULT_CONFIG;
}

/**
 * Checks and increments the rate limit for a specific user action.
 */
export function checkRateLimit(
  userId: string,
  actionKey: RateLimitAction | string,
  customConfig?: RateLimitConfig
): RateLimitResult {
  if (!userId || typeof userId !== "string") {
    return { allowed: false, remaining: 0, retryAfterSeconds: 60 };
  }

  const config = resolveConfig(actionKey, customConfig);

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const storeKey = `${userId}:${actionKey}`;

  const timestamps = rateLimitStore.get(storeKey) || [];

  // Filter timestamps within the current sliding window
  const activeTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (activeTimestamps.length >= config.maxRequests) {
    const oldestInWindow = activeTimestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Record this request
  activeTimestamps.push(now);
  rateLimitStore.set(storeKey, activeTimestamps);

  return {
    allowed: true,
    remaining: config.maxRequests - activeTimestamps.length,
  };
}

/**
 * Clears the counters of a single subject/action pair.
 * Useful after a legitimate flow (e.g. a successful sign-in).
 */
export function resetRateLimit(userId: string, actionKey: string): void {
  rateLimitStore.delete(`${userId}:${actionKey}`);
}
