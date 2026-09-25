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
        if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
            return NextResponse.json({ error: 'Recipe name is required' }, { status: 400 });
        }

        await connectDB();

        const cleanData = {
            ...body,
            name: body.name.trim(),
            cookingTime: typeof body.cookingTime === 'string' ? body.cookingTime.trim() : body.cookingTime,
            totalTime: typeof body.totalTime === 'string' ? body.totalTime.trim() : body.totalTime,
            servingSize: typeof body.servingSize === 'string' ? body.servingSize.trim() : body.servingSize,
            note: typeof body.note === 'string' ? body.note.trim() : body.note,
            ingredients: Array.isArray(body.ingredients)
                ? body.ingredients.flatMap((i: any) => typeof i === 'string' ? i.split(/[#\n]+/) : []).map((i: string) => i.trim()).filter((i: string) => i !== '')
                : [],
            instructions: Array.isArray(body.instructions)
                ? body.instructions.flatMap((i: any) => typeof i === 'string' ? i.split(/[#\n]+/) : []).map((i: string) => i.trim()).filter((i: string) => i !== '')
                : [],
            dieticianId: user._id
        };

        const recipe = await Recipe.create(cleanData);

        return NextResponse.json(recipe, { status: 201 });
    } catch (error: any) {
        console.error('Error creating recipe:', error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
