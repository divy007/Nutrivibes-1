import mongoose, { Schema, Document } from 'mongoose';

export interface IStepLog extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    date: Date;
    steps: number;
    targetSteps: number;
}

const StepLogSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        date: { type: Date, required: true },
        steps: { type: Number, default: 0 },
        targetSteps: { type: Number, default: 10000 },
    },
    { timestamps: true }
);

// Unique compound index so a client has only one step log per date
StepLogSchema.index({ clientId: 1, date: 1 }, { unique: true });
// Automatically clean up step log entries older than 6 months (15552000 seconds)
StepLogSchema.index({ date: 1 }, { expireAfterSeconds: 15552000 });

export default mongoose.models.StepLog || mongoose.model<IStepLog>('StepLog', StepLogSchema);
