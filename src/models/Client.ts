import mongoose, { Schema, Document } from 'mongoose';

export const PRIMARY_GOALS = [
    'Weight Loss',
    'Weight Gain',
    'Muscle Building',
    'PCOD/PCOS Management',
    'Diabetes Management',
    'General Wellness',
    'Other'
] as const;

export type PrimaryGoal = typeof PRIMARY_GOALS[number];

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
    counselingDate?: Date;
    cycleLength?: number; // default 28
    averagePeriodDuration?: number; // default 5
    notes?: string;
    followUpHistory?: {
        date: Date;
        notes: string;
        updatedAt: Date;
    }[];
    mealTimings?: { mealNumber: number; time: string }[];
    status: 'LEAD' | 'NEW' | 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'DELETED';
    registrationSource: 'DIETICIAN' | 'MOBILE_APP';
    pausedUntil?: Date;
    isProfileComplete: boolean;
    counsellingProfile?: {
        medicalConditions?: string[];
        medications?: string;
        bloodReport?: string;
        familyHistory?: string;
        dietaryPreferences?: string;
        allergies?: string;
        stapleFood?: string;
        alcoholFrequency?: string;
        smokingFrequency?: string;
        sleepTime?: string;
        wakeTime?: string;
        occupation?: string;
        stressLevel?: string;
        exerciseType?: string;
        exerciseFrequency?: string;
        exerciseDuration?: string;
    };
    primaryGoal?: PrimaryGoal;
    dieticianId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
}

const ClientSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: false, unique: true, sparse: true }, // Email is now optional
        phone: { type: String, unique: true, sparse: true },
        dob: { type: Date },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        city: { type: String },
        state: { type: String },
        age: { type: Number },
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
        counselingDate: { type: Date },
        cycleLength: { type: Number, default: 28 },
        averagePeriodDuration: { type: Number, default: 5 },
        notes: { type: String },
        followUpHistory: [{
            date: { type: Date, default: Date.now },
            notes: String,
            updatedAt: { type: Date, default: Date.now }
        }],
        mealTimings: [{
            mealNumber: Number,
            time: String
        }],
        status: { type: String, enum: ['LEAD', 'NEW', 'ACTIVE', 'INACTIVE', 'PAUSED', 'DELETED'], default: 'NEW' },
        registrationSource: { type: String, enum: ['DIETICIAN', 'MOBILE_APP'], default: 'DIETICIAN' },
        pausedUntil: { type: Date },
        isProfileComplete: { type: Boolean, default: false },
        counsellingProfile: {
            medicalConditions: [String],
            otherMedicalCondition: String,
            medications: [{
                type: String,
                name: String,
                dosage: String,
                unit: String,
                frequency: String,
                freqUnit: String
            }],
            medicalReport: String, // Store URL or Filename
            // Demographics & Lifestyle
            country: String,
            heightUnit: String,
            weightUnit: String,
            maritalStatus: String,
            workType: String,
            shiftType: String,
            staying: String,
            placeOfWork: String,
            smoking: String,
            cigarettesPerDay: String,
            alcohol: String,
            alcoholTypes: [String],
            alcoholFrequency: String,
            // Medical & Health
            deficiencies: [String],
            otherDeficiency: String,
            surgeries: [String],
            otherSurgery: String,
            stressLevel: String,
            medicalGoal: String,
            loseWeightReasons: [String],
            emotionalEating: String,
            // Dietary
            previousDiets: [String],
            noMeatDays: [String],
            fastDays: [String],
            cheatMeals: String,
            // Previous fields that might be useful
            bloodReport: String,
            familyHistory: String,
            dietaryPreferences: String,
            allergies: String,
            stapleFood: String,
            sleepTime: String,
            wakeTime: String,
            occupation: String, // mapped to workType? or keep separate?
            exerciseType: String,
            exerciseFrequency: String,
            exerciseDuration: String
        },
        primaryGoal: {
            type: String,
            enum: PRIMARY_GOALS,
            required: false
        },
        dieticianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

// Index for faster lookups
ClientSchema.index({ userId: 1 });
ClientSchema.index({ dieticianId: 1 });

// Force model refresh for schema changes in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Client) {
    delete (mongoose as any).models.Client;
}

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
