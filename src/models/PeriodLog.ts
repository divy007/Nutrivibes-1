import mongoose, { Schema, Document } from 'mongoose';

export interface IPeriodLog extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    startDate: Date;
    endDate?: Date;
    flowIntensity?: 'LOW' | 'MEDIUM' | 'HIGH';
    symptoms?: string[];
    notes?: string;
}

const PeriodLogSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        flowIntensity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
        symptoms: [{ type: String }],
        notes: { type: String },
    },
    { timestamps: true }
);

// Index for faster queries and 6-month data retention
PeriodLogSchema.index({ clientId: 1, startDate: -1 });
PeriodLogSchema.index({ startDate: 1 }, { expireAfterSeconds: 15552000 }); // 6 months

export default mongoose.models.PeriodLog || mongoose.model<IPeriodLog>('PeriodLog', PeriodLogSchema);
