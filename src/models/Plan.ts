import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
    name: string;
    durationMonths: number;
    price: number;
    description?: string;
    features: string[];
    isActive: boolean;
    isRecommended: boolean;
}

const PlanSchema = new Schema(
    {
        name: { type: String, required: true },
        durationMonths: { type: Number, required: true },
        price: { type: Number, required: true },
        description: { type: String },
        features: [{ type: String }],
        isActive: { type: Boolean, default: true },
        isRecommended: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
