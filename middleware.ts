// This file must exist at the project root for Next.js middleware to work.
// Next.js requires `config` to be statically defined here (not re-exported).
export { proxy as middleware } from './src/proxy';

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
