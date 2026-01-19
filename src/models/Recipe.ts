import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
    name: string;
    cookingTime?: string;
    totalTime?: string;
    language: string;
    instructions: string[];
    ingredients: string[];
    servingSize?: string;
    note?: string;
    dieticianId: mongoose.Schema.Types.ObjectId;
}

const RecipeSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        cookingTime: { type: String },
        totalTime: { type: String },
        language: { type: String, default: 'English' },
        instructions: { type: [String], default: [] },
        ingredients: { type: [String], default: [] },
        servingSize: { type: String },
        note: { type: String },
        dieticianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

// Index for faster lookups by dietician
RecipeSchema.index({ dieticianId: 1 });

// Force model refresh for schema changes in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Recipe) {
    delete (mongoose as any).models.Recipe;
}

export default mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);
