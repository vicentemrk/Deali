export const RATE_LIMIT_WINDOW_SECONDS = 60;

export type RateLimitRoute = 'offers' | 'stores' | 'categories' | 'promotions';

export type RateLimitPolicy = {
  maxRequests: number;
};

const ROUTE_POLICIES: Record<RateLimitRoute, { read: number; write: number }> = {
  offers: { read: 90, write: 30 },
  stores: { read: 180, write: 40 },
  categories: { read: 180, write: 40 },
  promotions: { read: 120, write: 30 },
};

export function resolveRateLimitRoute(pathname: string): RateLimitRoute | null {
  if (pathname.startsWith('/api/offers')) return 'offers';
  if (pathname.startsWith('/api/stores')) return 'stores';
  if (pathname.startsWith('/api/categories')) return 'categories';
  if (pathname.startsWith('/api/promotions')) return 'promotions';
  return null;
}

export function getRateLimitPolicy(route: RateLimitRoute, method: string): RateLimitPolicy {
  const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  const maxRequests = isWriteMethod ? ROUTE_POLICIES[route].write : ROUTE_POLICIES[route].read;
  return { maxRequests };
}
