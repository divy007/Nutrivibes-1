import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Plan from '@/models/Plan';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return all active plans. Both Dietician and Client might need to see them (though mostly Dietician)
        // Sort by price ascending
        const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
        return NextResponse.json(plans);
    } catch (error) {
        console.error('Failed to fetch plans:', error);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, durationMonths, price, description, features } = body;

        if (!name || !durationMonths || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newPlan = await Plan.create({
            name,
            durationMonths,
            price,
            description,
            features
        });

        return NextResponse.json(newPlan, { status: 201 });
    } catch (error) {
        console.error('Failed to create plan:', error);
        return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        const updatedPlan = await Plan.findByIdAndUpdate(
            _id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedPlan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        return NextResponse.json(updatedPlan);
    } catch (error) {
        console.error('Failed to update plan:', error);
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        // Soft delete: Just set isActive to false
        const deletedPlan = await Plan.findByIdAndUpdate(
            id,
            { $set: { isActive: false } },
            { new: true }
        );

        if (!deletedPlan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Failed to delete plan:', error);
        return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
    }
}
