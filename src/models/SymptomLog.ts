import mongoose, { Schema, Document } from 'mongoose';

export interface ISymptomLog extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    date: Date;
    symptoms: string[];
    energyLevel: number; // 1-5
    notes?: string;
}

const SymptomLogSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        date: { type: Date, default: Date.now },
        symptoms: [{ type: String }],
        energyLevel: { type: Number, min: 1, max: 5, default: 3 },
        notes: { type: String },
    },
    { timestamps: true }
);

// Index for faster queries and 6-month data retention
SymptomLogSchema.index({ clientId: 1, date: -1 });
SymptomLogSchema.index({ date: 1 }, { expireAfterSeconds: 15552000 }); // 6 months

export default mongoose.models.SymptomLog || mongoose.model<ISymptomLog>('SymptomLog', SymptomLogSchema);
