import mongoose, { Schema, Document } from 'mongoose';

export interface IMealLog extends Document {
    clientId: mongoose.Schema.Types.ObjectId;
    date: Date;
    category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Evening Snack' | 'Early Morning';
    items: {
        name: string;
        quantity: string;
        calories?: number;
    }[];
}

const MealLogSchema = new Schema(
    {
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
        date: { type: Date, required: true },
        category: {
            type: String,
            enum: ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack', 'Early Morning'],
            required: true
        },
        items: [{
            name: { type: String, required: true },
            quantity: { type: String, required: true },
            calories: { type: Number }
        }],
        // DateWithDiet / Mindful Eating Fields
        hungerLevel: { type: Number, min: 1, max: 10 }, // 1 (Starving) - 10 (Full)
        satisfactionLevel: { type: Number, min: 1, max: 10 }, // 1 (Unhappy) - 10 (Satisfied)
        emotionalState: { type: String }, // e.g., 'Happy', 'Stressed', 'Bored'
        isTreat: { type: Boolean, default: false }, // "Treat Date" flag
        chewCount: { type: Number }, // Optional mindfulness metric
    },
    { timestamps: true }
);

// Index for faster queries and 6-month data retention
MealLogSchema.index({ clientId: 1, date: 1, category: 1 });
MealLogSchema.index({ clientId: 1, date: 1, createdAt: -1 }); // Optimize dashboard "latest meals" query
MealLogSchema.index({ date: 1 }, { expireAfterSeconds: 15552000 }); // 6 months

export default mongoose.models.MealLog || mongoose.model<IMealLog>('MealLog', MealLogSchema);
