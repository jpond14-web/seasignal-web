/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per IP address.
 *
 * For production at scale, replace with Upstash Redis or similar.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 60, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt,
      headers: {
        "X-RateLimit-Limit": String(config.limit),
        "X-RateLimit-Remaining": String(config.limit - 1),
        "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
      },
    };
  }

  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);
  const allowed = entry.count <= config.limit;

  return {
    allowed,
    limit: config.limit,
    remaining,
    resetAt: entry.resetAt,
    headers: {
      "X-RateLimit-Limit": String(config.limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.floor(entry.resetAt / 1000)),
    },
  };
}

/**
 * Extract a rate-limit key from the request (IP-based).
 */
export function rateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
}
