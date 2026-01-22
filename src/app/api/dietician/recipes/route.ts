import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Recipe from '@/models/Recipe';

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        await connectDB();

        const query: any = { dieticianId: user._id };
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const [recipes, total] = await Promise.all([
            Recipe.find(query)
                .select('-ingredients -instructions -note')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Recipe.countDocuments(query)
        ]);

        return NextResponse.json({
            recipes,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        await connectDB();

        const recipe = await Recipe.create({
            ...body,
            dieticianId: user._id
        });

        return NextResponse.json(recipe, { status: 201 });
    } catch (error) {
        console.error('Error creating recipe:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
