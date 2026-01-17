import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    dieticianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['WEIGHT_LOG', 'WATER_LOG', 'MEASUREMENT_LOG', 'SYMPTOM_LOG', 'PERIOD_LOG', 'PROFILE_UPDATE']
    },
    description: {
        type: String,
        required: true
    },
    // Optional: Store the new value (e.g., "75kg", "8 glasses") for quick display
    value: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for fetching dietician's feed efficiently
ActivityLogSchema.index({ dieticianId: 1, timestamp: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
