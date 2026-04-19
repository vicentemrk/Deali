import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Redis } from '@upstash/redis';
import { isAdminUser } from '@/lib/adminAuth';
import { getRequestId, logApiError, logApiWarn } from '@/lib/logger';
import {
  RATE_LIMIT_WINDOW_SECONDS,
  getRateLimitPolicy,
  resolveRateLimitRoute,
  type RateLimitRoute,
} from '@/lib/rateLimit';

function sanitizeEnv(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  return trimmed.replace(/^['\"]+|['\"]+$/g, '');
}

const redisUrl = sanitizeEnv(process.env.UPSTASH_REDIS_REST_URL);
const redisToken = sanitizeEnv(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = redisUrl.startsWith('https://') && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

async function checkRateLimit(
  request: NextRequest,
  route: RateLimitRoute,
  requestId: string
): Promise<{ limited: boolean; remaining: number; resetSeconds: number; limit: number }> {
  const policy = getRateLimitPolicy(route, request.method);

  if (!redis) {
    return {
      limited: false,
      remaining: policy.maxRequests,
      resetSeconds: RATE_LIMIT_WINDOW_SECONDS,
      limit: policy.maxRequests,
    };
  }

  const ip = getClientIp(request);
  const windowBucket = Math.floor(Date.now() / 1000 / RATE_LIMIT_WINDOW_SECONDS);
  const key = `ratelimit:${ip}:${route}:${request.method}:${windowBucket}`;

  try {
    const total = await redis.incr(key);
    if (total === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS + 1);
    }

    const remaining = Math.max(0, policy.maxRequests - total);
    return {
      limited: total > policy.maxRequests,
      remaining,
      resetSeconds: RATE_LIMIT_WINDOW_SECONDS,
      limit: policy.maxRequests,
    };
  } catch (error) {
    logApiError('proxy_rate_limit_error', error, {
      requestId,
      path: request.nextUrl.pathname,
      method: request.method,
      route,
    });
    return {
      limited: false,
      remaining: policy.maxRequests,
      resetSeconds: RATE_LIMIT_WINDOW_SECONDS,
      limit: policy.maxRequests,
    };
  }
}

export async function proxy(request: NextRequest) {
  const requestId = getRequestId(request);
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set('x-request-id', requestId);

  const isApiAdmin = request.nextUrl.pathname.startsWith('/api/admin');
  const isAdmin = request.nextUrl.pathname.startsWith('/admin');
  const publicRoute = resolveRateLimitRoute(request.nextUrl.pathname);

  // Auth check EARLY for admin routes (before body parsing in handlers)
  // This prevents DoS attacks via large payloads on unauthenticated requests
  if ((isApiAdmin || isAdmin) && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    if (isApiAdmin) {
      const response = NextResponse.json(
        { error: true, code: 'SUPABASE_INIT_FAILED', message: 'Supabase configuration missing' },
        { status: 500 }
      );
      response.headers.set('X-Request-Id', requestId);
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    response.headers.set('X-Request-Id', requestId);
    return response;
  }

  // Auth check for admin routes BEFORE other processing
  if (isApiAdmin || isAdmin) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {
            // Noop for middleware
          },
          remove() {
            // Noop for middleware
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!isAdminUser(user)) {
      if (isApiAdmin) {
        const response = NextResponse.json({ error: true, code: 'FORBIDDEN', message: 'Admin role required' }, { status: 403 });
        response.headers.set('X-Request-Id', requestId);
        return response;
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      response.headers.set('X-Request-Id', requestId);
      return response;
    }

    // Auth passed, continue with request
    const response = NextResponse.next({
      request: {
        headers: forwardHeaders,
      },
    });
    response.headers.set('X-Request-Id', requestId);
    return response;
  }

  const baseResponse = NextResponse.next({
    request: {
      headers: forwardHeaders,
    },
  });
  baseResponse.headers.set('X-Request-Id', requestId);

  if (publicRoute) {
    const rateLimit = await checkRateLimit(request, publicRoute, requestId);

    if (rateLimit.limited) {
      logApiWarn('proxy_rate_limit_exceeded', {
        requestId,
        path: request.nextUrl.pathname,
        method: request.method,
        route: publicRoute,
      });

      const response = NextResponse.json(
        {
          error: true,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again in a minute.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetSeconds),
          },
        }
      );
      response.headers.set('X-Request-Id', requestId);
      return response;
    }

    baseResponse.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    baseResponse.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    baseResponse.headers.set('X-RateLimit-Reset', String(rateLimit.resetSeconds));
  }

  if (!isApiAdmin && !isAdmin) {
    return baseResponse;
  }

  // This point should not be reached as admin requests are handled above
  return baseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/offers/:path*',
    '/api/stores/:path*',
    '/api/categories/:path*',
    '/api/promotions/:path*',
  ],
};
