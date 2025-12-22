import { NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt'; // Uncomment when next-auth is fully set up

export async function middleware() {
    // const path = request.nextUrl.pathname;

    // placeholder logic until next-auth is configured with secret
    // const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    // const isAuth = !!token;

    // const _isAuthPage = path.startsWith('/login');
    // const _isDashboardPage = path.startsWith('/dietician') || path.startsWith('/client');

    // Logic:
    // If user is accessing dashboard and not logged in -> redirect to login
    // If user is accessing login and is logged in -> redirect to dashboard

    // For now, pass through to allow development setup
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dietician/:path*',
        '/client/:path*',
        '/login',
    ],
};
