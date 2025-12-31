import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected routes and their required roles
const protectedRoutes = {
    '/dietician': ['DIETICIAN'],
    '/client': ['CLIENT'],
};

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the current path needs protection
    const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
        pathname.startsWith(route)
    );

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    let token = '';

    if (pathname.startsWith('/dietician')) {
        token = request.cookies.get('token_dietician')?.value || '';
    } else if (pathname.startsWith('/client')) {
        token = request.cookies.get('token_client')?.value || '';
    }

    if (!token) {
        // Fallback or legacy check? No, strict enforcement.
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userRole = payload.role as string;

        // Check role access
        const requiredRoles = Object.entries(protectedRoutes).find(([route]) =>
            pathname.startsWith(route)
        )?.[1];

        if (requiredRoles && !requiredRoles.includes(userRole)) {
            // Unauthorized - Invalid Role
            // Redirect to login to prevent confusion and force fresh authentication
            return NextResponse.redirect(new URL('/login', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Middleware auth error:', error);
        // Token invalid or expired
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (public login page)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
    ],
};
