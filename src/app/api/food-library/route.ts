import { NextResponse } from 'next/server';
import { foodItems } from '@/data/foodItems';

export async function GET() {
    // Currently serving static data, can be upgraded to DB later
    return NextResponse.json(foodItems);
}
