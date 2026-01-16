import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Plan from '@/models/Plan';

export async function GET() {
    await connectDB();
    try {
        // Cleanup old named plans to avoid duplicates
        await Plan.deleteMany({ name: { $regex: 'Cure & Reverse', $options: 'i' } });

        const plans = [
            // Holistic Wellness (Renamed from Cure & Reverse)
            {
                name: 'Holistic Wellness - 3 Months',
                durationMonths: 3,
                price: 5000,
                description: '3 Month Validity, Dedicated Clinical Nutritionist, 12 Dietitian Counsellings',
                features: [
                    '3 Month Validity',
                    'Dedicated Clinical Nutritionist',
                    '12 Dietitian Counsellings',
                    'Dedicated customer support'
                ],
                isRecommended: false
            },
            {
                name: 'Holistic Wellness - 6 Months',
                durationMonths: 6,
                price: 9000,
                description: '6 Month Validity, Dedicated Clinical Nutritionist, 24 Counsellings, 15 Pause Days',
                features: [
                    '6 Month Validity',
                    'Dedicated Clinical Nutritionist',
                    '24 Dietitian Counsellings',
                    '15 Pause Days'
                ],
                isRecommended: true // Specially recommended as requested
            },
            {
                name: 'Holistic Wellness - 9 Months',
                durationMonths: 9,
                price: 12000,
                description: '9 Month Validity, 36 Counsellings, 30 Pause Days, Skin & Hair Care',
                features: [
                    '9 Month Validity',
                    'Dedicated Clinical Nutritionist',
                    '36 Dietitian Counsellings',
                    '30 Pause Days',
                    'Exclusive care for hair and skin'
                ],
                isRecommended: false
            },
            {
                name: 'Holistic Wellness - 12 Months',
                durationMonths: 12,
                price: 15000,
                description: '1 Year Validity, 48 Counsellings, 45 Pause Days, Skin & Hair Care',
                features: [
                    '12 Month Validity',
                    'Dedicated Clinical Nutritionist',
                    '48 Dietitian Counsellings',
                    '45 Pause Days',
                    'Exclusive care for hair and skin'
                ],
                isRecommended: false
            },
            // Wedding Plans (Premium pricing)
            {
                name: 'Wedding Glow - 3 Months',
                durationMonths: 3,
                price: 7000,
                description: 'Metabolism Boosting, Maintenance & Detox, Skin & Hair Diets',
                features: [
                    '3 Month Validity',
                    'Dedicated Diet Coach',
                    'Metabolism Boosting + Correction',
                    'Maintenance & Detox Plan',
                    'Skin & Hair Diets (Biotin & Keratin Rich)',
                    'Collagen Boosting & Anti-Oxidant Rich Diets',
                    'Improve Skin glow'
                ],
                isRecommended: false
            },
            {
                name: 'Wedding Glow - 6 Months',
                durationMonths: 6,
                price: 12000,
                description: 'Extended Wedding Prep, Detox for Parties, Advanced Skin & Hair Care',
                features: [
                    '6 Month Validity',
                    'Dedicated Diet Coach',
                    'Metabolism Boosting + Correction',
                    'Maintenance & Detox Plan for Parties',
                    'Skin & Hair Diets (Biotin & Keratin Rich)',
                    'Collagen Boosting & Anti-Oxidant Rich Diets',
                    'Improve Skin glow'
                ],
                isRecommended: false
            }
        ];

        // Upsert based on name
        for (const plan of plans) {
            await Plan.findOneAndUpdate(
                { name: plan.name },
                plan,
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ message: 'Plans seeded successfully', count: plans.length });
    } catch (error) {
        console.error('Failed to seed plans:', error);
        return NextResponse.json({ error: 'Failed to seed plans' }, { status: 500 });
    }
}
