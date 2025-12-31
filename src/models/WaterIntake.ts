import mongoose, { Schema, Document } from 'mongoose';

export interface IWaterIntake extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    date: Date;
    currentGlasses: number;
    targetGlasses: number;
}

const WaterIntakeSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        date: { type: Date, required: true },
        currentGlasses: { type: Number, default: 0 },
        targetGlasses: { type: Number, default: 8 },
    },
    { timestamps: true }
);

// Unique index to ensure one record per client per day
WaterIntakeSchema.index({ clientId: 1, date: 1 }, { unique: true });

export default mongoose.models.WaterIntake || mongoose.model<IWaterIntake>('WaterIntake', WaterIntakeSchema);
