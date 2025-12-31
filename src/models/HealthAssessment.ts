import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthAssessment extends Document {
    clientId: mongoose.Types.ObjectId;
    date: Date;
    answers: {
        questionId: number;
        answerIndex: number;
        score: number;
    }[];
    categoryScores: {
        eat: number;
        lifestyle: number;
        mind: number;
        exercise: number;
    };
    totalScore: number;
    riskLevel: string; // e.g., 'Excessive Risk', 'Scope for Improvement', 'Awesome'
}

const HealthAssessmentSchema: Schema = new Schema({
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: Date, default: Date.now },
    answers: [
        {
            questionId: { type: Number, required: true },
            answerIndex: { type: Number, required: true },
            score: { type: Number, required: true }
        }
    ],
    categoryScores: {
        eat: { type: Number, required: true },
        lifestyle: { type: Number, required: true },
        mind: { type: Number, required: true },
        exercise: { type: Number, required: true }
    },
    totalScore: { type: Number, required: true },
    riskLevel: { type: String, required: true }
}, {
    timestamps: true
});

// Ensure we only keep the latest assessment per client for simplicity, 
// or allow multiple and fetch latest. Let's allow multiple for history.
export default mongoose.models.HealthAssessment || mongoose.model<IHealthAssessment>('HealthAssessment', HealthAssessmentSchema);
