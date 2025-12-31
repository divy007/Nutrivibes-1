import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowUp extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    dieticianId: mongoose.Schema.Types.ObjectId;
    date: Date;
    timing: string;
    category: string;
    meetLink?: string;
    status: 'Pending' | 'Completed' | 'Rescheduled';
    notes?: string;
}

const FollowUpSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        dieticianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        timing: { type: String, required: true },
        category: { type: String, default: 'Diet' },
        meetLink: { type: String },
        status: { type: String, enum: ['Pending', 'Completed', 'Rescheduled'], default: 'Pending' },
        notes: { type: String },
    },
    { timestamps: true }
);

// Index for faster lookups
FollowUpSchema.index({ clientId: 1, date: 1 });
FollowUpSchema.index({ dieticianId: 1, date: 1 });

export default mongoose.models.FollowUp || mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
