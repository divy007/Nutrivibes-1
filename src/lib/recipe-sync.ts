import Recipe from '@/models/Recipe';
import DietPlan from '@/models/DietPlan';
import Client from '@/models/Client';

/**
 * Normalizes a recipe name for comparison:
 * - Trims whitespace
 * - Converts to lower case
 * - Replaces consecutive whitespace with a single space
 */
export function normalizeRecipeName(name: string): string {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Syncs a diet plan object (or Mongoose doc) with all recipes belonging to a dietician.
 * Matches any food item missing recipeId (or whose recipeId might be outdated) by name.
 * 
 * If any food items are upgraded to link to a recipe, and the plan has an _id,
 * updates the plan in the database in the background.
 * 
 * @param dietPlan The diet plan object or document to enrich
 * @param dieticianId The dietician's User ID
 * @returns The enriched diet plan object
 */
export async function syncDietPlanWithRecipes(dietPlan: any, dieticianId: any): Promise<any> {
    if (!dietPlan || !dieticianId) return dietPlan;

    try {
        const recipes = await Recipe.find({ dieticianId }).select('_id name').lean();
        if (!recipes || recipes.length === 0) return dietPlan;

        const recipeMap = new Map<string, string>();
        for (const r of recipes) {
            if (r.name) {
                recipeMap.set(normalizeRecipeName(r.name), r._id.toString());
            }
        }

        const plainPlan = typeof dietPlan.toObject === 'function' ? dietPlan.toObject() : dietPlan;
        const days = plainPlan.days || [];
        let modified = false;

        for (const day of days) {
            if (!Array.isArray(day.meals)) continue;
            for (const meal of day.meals) {
                if (!Array.isArray(meal.foodItems)) continue;
                for (const item of meal.foodItems) {
                    if (!item || !item.name) continue;
                    const normalized = normalizeRecipeName(item.name);
                    const matchedRecipeId = recipeMap.get(normalized);

                    if (matchedRecipeId) {
                        if (item.recipeId !== matchedRecipeId || !item.isRecipe) {
                            item.recipeId = matchedRecipeId;
                            item.isRecipe = true;
                            modified = true;
                        }
                    }
                }
            }
        }

        // If modified and has _id, persist asynchronously so DB is permanently healed
        if (modified && plainPlan._id) {
            DietPlan.findByIdAndUpdate(plainPlan._id, { days: plainPlan.days }).catch((err) => {
                console.error('Failed to auto-heal DietPlan with recipe links:', err);
            });
        }

        return plainPlan;
    } catch (err) {
        console.error('Error in syncDietPlanWithRecipes:', err);
        return dietPlan;
    }
}

/**
 * Automatically links a newly created or updated recipe to all existing diet plans
 * belonging to clients of the dietician where food item names match the recipe name.
 * 
 * @param dieticianId The dietician's User ID
 * @param recipe The recipe object containing _id and name
 */
export async function linkRecipeToDietPlans(dieticianId: any, recipe: { _id: any; name: string }): Promise<number> {
    if (!dieticianId || !recipe || !recipe.name) return 0;

    try {
        const normalizedName = normalizeRecipeName(recipe.name);
        const recipeIdStr = recipe._id.toString();

        // Find all clients for this dietician
        const clients = await Client.find({ dieticianId }).select('_id').lean();
        if (!clients || clients.length === 0) return 0;

        const clientIds = clients.map(c => c._id);

        // Find all diet plans for these clients
        const plans = await DietPlan.find({ clientId: { $in: clientIds } });
        let updatedCount = 0;

        for (const plan of plans) {
            let planModified = false;
            const days = plan.days || [];

            for (const day of days) {
                if (!Array.isArray(day.meals)) continue;
                for (const meal of day.meals) {
                    if (!Array.isArray(meal.foodItems)) continue;
                    for (const item of meal.foodItems) {
                        if (!item || !item.name) continue;
                        if (normalizeRecipeName(item.name) === normalizedName) {
                            if (item.recipeId !== recipeIdStr || !item.isRecipe) {
                                item.recipeId = recipeIdStr;
                                item.isRecipe = true;
                                planModified = true;
                            }
                        }
                    }
                }
            }

            if (planModified) {
                await DietPlan.findByIdAndUpdate(plan._id, { days: plan.days });
                updatedCount++;
            }
        }

        return updatedCount;
    } catch (err) {
        console.error('Error linking recipe to diet plans:', err);
        return 0;
    }
}
