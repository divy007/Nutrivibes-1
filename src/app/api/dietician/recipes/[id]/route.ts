import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Recipe from '@/models/Recipe';
import { linkRecipeToDietPlans } from '@/lib/recipe-sync';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        // For GET, we allow both Dieticians and Clients to view the recipe.
        // We find by ID only. If strict ownership is needed for dieticians, we could check that, 
        // but generally reading a recipe by ID should be fine for authenticated users in this context.
        const recipe = await Recipe.findById(id);

        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        return NextResponse.json(recipe);
    } catch (error) {
        console.error('Error fetching recipe:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        await connectDB();

        const cleanBody = {
            ...body,
            ...(typeof body.name === 'string' && { name: body.name.trim() }),
            ...(typeof body.cookingTime === 'string' && { cookingTime: body.cookingTime.trim() }),
            ...(typeof body.totalTime === 'string' && { totalTime: body.totalTime.trim() }),
            ...(typeof body.servingSize === 'string' && { servingSize: body.servingSize.trim() }),
            ...(typeof body.note === 'string' && { note: body.note.trim() }),
            ...(Array.isArray(body.ingredients) && {
                ingredients: body.ingredients
                    .flatMap((i: any) => typeof i === 'string' ? i.split(/[#\n]+/) : [])
                    .map((i: string) => i.trim())
                    .filter((i: string) => i !== '')
            }),
            ...(Array.isArray(body.instructions) && {
                instructions: body.instructions
                    .flatMap((i: any) => typeof i === 'string' ? i.split(/[#\n]+/) : [])
                    .map((i: string) => i.trim())
                    .filter((i: string) => i !== '')
            })
        };

        const recipe = await Recipe.findOneAndUpdate(
            { _id: id, dieticianId: user._id },
            cleanBody,
            { new: true, runValidators: true }
        );

        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        // Auto-link any matching food items in diet plans with updated recipe name
        linkRecipeToDietPlans(user._id, recipe).catch((err) => {
            console.error('Failed to auto-link updated recipe to diet plans:', err);
        });

        return NextResponse.json(recipe);
    } catch (error) {
        console.error('Error updating recipe:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();
        const recipe = await Recipe.findOneAndDelete({ _id: id, dieticianId: user._id });

        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
