import { NextRequest, NextResponse } from 'next/server';
import { resolveRateLimitRoute, getRateLimitPolicy, RATE_LIMIT_WINDOW_SECONDS } from '@/lib/rateLimit';

/**
 * In-memory rate limit store (for development/single-instance deployments)
 * For production with multiple instances, replace with Redis
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, { resetAt }] of rateLimitStore.entries()) {
    if (resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Check rate limit for a given key
 * Returns { allowed: boolean; remaining: number; resetAt: number }
 */
function checkRateLimit(key: string, maxRequests: number, windowSeconds: number) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    const resetAt = now + windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  // Increment existing entry
  entry.count++;
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return { allowed, remaining, resetAt: entry.resetAt };
}

/**
 * Middleware for rate limiting and security
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Apply rate limiting to API routes
  const rateLimitRoute = resolveRateLimitRoute(pathname);
  if (rateLimitRoute) {
    const policy = getRateLimitPolicy(rateLimitRoute, method);
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anon';
    const key = `rl:${rateLimitRoute}:${ip}`;

    const limit = checkRateLimit(key, policy.maxRequests, RATE_LIMIT_WINDOW_SECONDS);

    // If rate limit exceeded, return 429
    if (!limit.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(policy.maxRequests),
          'X-RateLimit-Remaining': String(limit.remaining),
          'X-RateLimit-Reset': new Date(limit.resetAt).toISOString(),
          'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      });
    }

    // Add rate limit headers to successful response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(policy.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(limit.remaining));
    response.headers.set('X-RateLimit-Reset', new Date(limit.resetAt).toISOString());
    return response;
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware applies to
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (auth page)
     */
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ],
};
