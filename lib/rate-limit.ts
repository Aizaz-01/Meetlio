interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Clean server-side in-memory rate limiter.
 * @param key Unique key (e.g. IP + endpoint route)
 * @param limit Maximum requests allowed in window
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 min)
 */
export function checkRateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60 * 1000
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    const remainingMs = record.resetAt - now;
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(remainingMs / 1000),
    };
  }

  record.count += 1;
  const remainingMs = record.resetAt - now;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: Math.ceil(remainingMs / 1000),
  };
}

/**
 * Extracts client IP address safely from Request headers.
 */
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return '127.0.0.1';
}
