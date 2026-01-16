import mongoose, { Schema, Document } from 'mongoose';

export interface IWeightLog extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    date: Date;
    weight: number;
    unit: 'kg' | 'lb';
}

const WeightLogSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        date: { type: Date, default: Date.now },
        weight: { type: Number, required: true },
        unit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
    },
    { timestamps: true }
);

// Index for faster queries and 6-month data retention
WeightLogSchema.index({ clientId: 1, date: -1 });
WeightLogSchema.index({ date: 1 }, { expireAfterSeconds: 15552000 }); // 6 months

export default mongoose.models.WeightLog || mongoose.model<IWeightLog>('WeightLog', WeightLogSchema);
