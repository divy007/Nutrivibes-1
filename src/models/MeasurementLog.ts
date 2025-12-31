import mongoose, { Schema, Document } from 'mongoose';

export interface IMeasurementLog extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    date: Date;
    chest: number;
    arms: number;
    waist: number;
    hips: number;
    thigh: number;
    unit: string;
}

const MeasurementLogSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        date: { type: Date, default: Date.now },
        chest: { type: Number, required: true },
        arms: { type: Number, required: true },
        waist: { type: Number, required: true },
        hips: { type: Number, required: true },
        thigh: { type: Number, required: true },
        unit: { type: String, default: 'inch' },
    },
    { timestamps: true }
);

// Index for faster queries
MeasurementLogSchema.index({ clientId: 1, date: -1 });

export default mongoose.models.MeasurementLog || mongoose.model<IMeasurementLog>('MeasurementLog', MeasurementLogSchema);
