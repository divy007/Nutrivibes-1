import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    planId?: mongoose.Schema.Types.ObjectId; // Optional if custom plan
    planName: string; // Snapshot of plan name or custom name
    startDate: Date;
    endDate: Date;
    amountPaid: number;
    totalAmount: number;
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING_PAYMENT' | 'COMPLETED' | 'PAUSED';
    pauseHistory: {
        startDate: Date;
        endDate?: Date;
        reason?: string;
    }[];
    paymentHistory: {
        date: Date;
        amount: number;
        method: 'CASH' | 'UPI' | 'BANK_TRANSFER';
        note?: string;
    }[];
}

const SubscriptionSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
        planName: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        amountPaid: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['ACTIVE', 'EXPIRED', 'PENDING_PAYMENT', 'COMPLETED', 'PAUSED'],
            default: 'PENDING_PAYMENT'
        },
        pauseHistory: [{
            startDate: { type: Date, required: true },
            endDate: { type: Date },
            reason: { type: String }
        }],
        paymentHistory: [{
            date: { type: Date, default: Date.now },
            amount: { type: Number, required: true },
            method: { type: String, enum: ['CASH', 'UPI', 'BANK_TRANSFER'], default: 'CASH' },
            note: { type: String }
        }]
    },
    { timestamps: true }
);

// Helper to check status updates? Maybe.
// Index for quick lookups
SubscriptionSchema.index({ clientId: 1, status: 1 });

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
