import mongoose from 'mongoose';

const DietPlanSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    weekStartDate: { type: Date, required: true },
    lastViewedByClientAt: { type: Date },
    days: [{
        date: Date,
        status: { type: String, enum: ['NO_DIET', 'NOT_SAVED', 'PUBLISHED'], default: 'NO_DIET' },
        meals: [{
            time: String,
            mealNumber: Number,
            foodItems: [mongoose.Schema.Types.Mixed]
        }]
    }]
}, { timestamps: true });

// Index for faster lookups
DietPlanSchema.index({ clientId: 1, weekStartDate: 1 });
DietPlanSchema.index({ clientId: 1, 'days.date': 1 }); // Optimize date-based lookups

export default mongoose.models.DietPlan || mongoose.model('DietPlan', DietPlanSchema);
