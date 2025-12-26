import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected routes and their required roles
const protectedRoutes = {
    '/dietician': ['DIETICIAN'],
    '/client': ['CLIENT'],
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the current path needs protection
    const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
        pathname.startsWith(route)
    );

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    const token = request.cookies.get('token')?.value || ''; // Adjust cookie name if needed

    // Check for Authorization header if cookie is missing (optional, mostly for APIs)
    // const authHeader = request.headers.get('Authorization');
    // const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    // const finalToken = token || tokenFromHeader;

    // NOTE: For client-side navigation, we usually rely on cookies. 
    // If you are using local storage for tokens, middleware cannot access it directly.
    // Ensure your login flow sets a cookie named 'token' or similar.

    // However, the current auth implementation in lib/auth.ts might be using localStorage on client side
    // and headers for API calls. NEXT.JS MIDDLEWARE CANNOT ACCESS LOCAL STORAGE.
    // If the app uses localStorage only, we cannot use Middleware for page protection efficiently
    // without setting a cookie.

    // Let's verify how the app currently handles auth persistence.
    // useAuth hook uses getAuthToken which usually reads from localStorage.

    // DECISION:
    // Since the existing implementation (LoginForm.tsx, useAuth.ts) seems to rely on client-side state/localStorage,
    // and I cannot easily change it to cookies without refactoring the whole auth flow (which might be out of scope or risky),
    // I might have to stick to client-side checks for now OR introduce a cookie setting mechanism in the login route.

    // WAITING: I will create this file BUT I must double check if I should enforce cookies.
    // The prompt asked for "JWT middleware" and "Role-based route protection".
    // Middleware protection IS the standard way in Next.js.
    // I will assume I should add cookie setting to the Login API or Client Login page.
    // BUT the Login API `src/app/api/auth/login/route.ts` returns the token in JSON, it doesn't set a cookie.

    // FOR NOW, I will implement the middleware assuming a 'token' cookie exists.
    // I will ALSO need to update the Login API or Frontend to set this cookie.
    // Since changing API might be affecting mobile apps (if any), I'll check if I can set cookie in the Login Component login success handler.
    // Actually, setting cookie in Server Action or API Route is better.
    // I will update the middleware to redirect to login if no token found.

    // WAIT: I'll write the middleware code but I might need to update the login flow to set the cookie.
    // Let's stick to writing the file first.

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        // loginUrl.searchParams.set('callbackUrl', pathname); // Optional
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
            // Redirect to appropriate dashboard or unauthorized page
            if (userRole === 'DIETICIAN') {
                return NextResponse.redirect(new URL('/dietician/dashboard', request.url));
            } else if (userRole === 'CLIENT') {
                return NextResponse.redirect(new URL('/client/profile', request.url));
            } else {
                return NextResponse.redirect(new URL('/login', request.url));
            }
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
