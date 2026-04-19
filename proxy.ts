import type { NextRequest } from 'next/server';
import { proxy as applyProxy } from './src/proxy';

export function proxy(request: NextRequest) {
  return applyProxy(request);
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
