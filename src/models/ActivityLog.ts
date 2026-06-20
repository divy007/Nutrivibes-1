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
        enum: ['WEIGHT_LOG', 'WATER_LOG', 'MEASUREMENT_LOG', 'SYMPTOM_LOG', 'PERIOD_LOG', 'PROFILE_UPDATE', 'STEPS_LOG']
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
        default: Date.now
    }
});

// Index for fetching dietician's feed efficiently
ActivityLogSchema.index({ dieticianId: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
