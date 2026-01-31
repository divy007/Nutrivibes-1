import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    planId?: mongoose.Schema.Types.ObjectId; // Optional if custom plan
    planName: string; // Snapshot of plan name or custom name
    startDate: Date;
    endDate: Date;
    amountPaid: number;
    totalAmount: number;
    status: 'ASSIGNED' | 'ACTIVE' | 'EXPIRED' | 'PENDING_PAYMENT' | 'COMPLETED' | 'PAUSED';
    pauseDaysUsed: number;
    extraPaidPauseDays: number;
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
    pauseRequests: {
        requestDate: Date;
        startDate: Date;
        durationDays: number;
        reason?: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
    }[];
    planHistory: {
        changedAt: Date;
        action: 'ASSIGN' | 'UPGRADE' | 'RENEW';
        oldPlanId?: mongoose.Schema.Types.ObjectId;
        newPlanId: mongoose.Schema.Types.ObjectId;
        oldPlanName?: string;
        newPlanName: string;
        oldAmount?: number;
        newAmount: number;
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
            enum: ['ASSIGNED', 'ACTIVE', 'EXPIRED', 'PENDING_PAYMENT', 'COMPLETED', 'PAUSED'],
            default: 'ASSIGNED'
        },
        pauseDaysUsed: { type: Number, default: 0 },
        extraPaidPauseDays: { type: Number, default: 0 },
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
        }],
        pauseRequests: [{
            requestDate: { type: Date, default: Date.now },
            startDate: { type: Date, required: true },
            durationDays: { type: Number, required: true },
            reason: { type: String },
            status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
        }],
        planHistory: [{
            changedAt: { type: Date, default: Date.now },
            action: { type: String, enum: ['ASSIGN', 'UPGRADE', 'RENEW'], required: true },
            oldPlanId: { type: Schema.Types.ObjectId, ref: 'Plan' },
            newPlanId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
            oldPlanName: { type: String },
            newPlanName: { type: String, required: true },
            oldAmount: { type: Number },
            newAmount: { type: Number, required: true }
        }]
    },
    { timestamps: true }
);

// Helper to check status updates? Maybe.
// Index for quick lookups
SubscriptionSchema.index({ clientId: 1, status: 1 });

// Force model reload - delete cached version if it exists
if (mongoose.models.Subscription) {
    delete mongoose.models.Subscription;
}

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
