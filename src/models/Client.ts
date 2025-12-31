import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
    name: string;
    email: string;
    phone?: string;
    dob?: Date;
    gender?: 'male' | 'female' | 'other';
    city?: string;
    state?: string;
    height?: number;
    weight?: number;
    chest?: number;
    arms?: number;
    waist?: number;
    hips?: number;
    thigh?: number;
    idealWeight?: number;
    targetCalories?: number;
    dietStartDate?: Date;
    notes?: string;
    mealTimings?: { mealNumber: number; time: string }[];
    status: 'NEW' | 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'DELETED';
    pausedUntil?: Date;
    isProfileComplete: boolean;
    dieticianId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
}

const ClientSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, unique: true, sparse: true },
        dob: { type: Date },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        city: { type: String },
        state: { type: String },
        height: { type: Number },
        weight: { type: Number },
        chest: { type: Number },
        arms: { type: Number },
        waist: { type: Number },
        hips: { type: Number },
        thigh: { type: Number },
        idealWeight: { type: Number },
        dietaryPreferences: { type: [String], default: [] },
        targetCalories: { type: Number },
        dietStartDate: { type: Date },
        notes: { type: String },
        mealTimings: [{
            mealNumber: Number,
            time: String
        }],
        status: { type: String, enum: ['NEW', 'ACTIVE', 'INACTIVE', 'PAUSED', 'DELETED'], default: 'NEW' },
        pausedUntil: { type: Date },
        isProfileComplete: { type: Boolean, default: false },
        dieticianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
