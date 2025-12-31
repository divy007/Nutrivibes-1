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
        }]
    },
    { timestamps: true }
);

// Index for faster queries
MealLogSchema.index({ clientId: 1, date: 1, category: 1 });

export default mongoose.models.MealLog || mongoose.model<IMealLog>('MealLog', MealLogSchema);
