import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'NutriVibes Server is reachable',
        time: new Date().toISOString(),
        ipHint: '192.168.1.17'
    });
}
