import { proxy } from './src/proxy';

export function middleware(request: Parameters<typeof proxy>[0]) {
	return proxy(request);
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
