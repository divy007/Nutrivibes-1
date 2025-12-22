import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    age: { type: Number },
    gender: { type: String },
    dietaryPreferences: { type: [String], default: [] },
    targetCalories: { type: Number },
    notes: { type: String },
    status: { type: String, enum: ['active', 'paused'], default: 'active' },
    dieticianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
