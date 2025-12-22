import mongoose from 'mongoose';

const DietPlanSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    weekStartDate: { type: Date, required: true },
    days: [{
        date: Date,
        meals: [{
            time: String,
            items: [{
                foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
                portion: String
            }]
        }]
    }]
}, { timestamps: true });

export default mongoose.models.DietPlan || mongoose.model('DietPlan', DietPlanSchema);
