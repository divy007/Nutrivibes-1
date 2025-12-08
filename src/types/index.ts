export type FoodCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface FoodItem {
    id: string;
    name: string;
    category: FoodCategory;
    portion: string;
    description?: string;
    cuisine?: string;
    dietPref?: string;
    isThyroidFriendly?: boolean;
    isWeightLossFriendly?: boolean;
    isDiabetesFriendly?: boolean;
}

export interface MealSlot {
    time: string;
    mealNumber: number;
    foodItems: FoodItem[];
}

export interface DayPlan {
    date: Date;
    meals: MealSlot[];
}

export interface ClientInfo {
    name: string;
    age?: number;
    gender?: string;
    weight?: number; // in kg
    height?: number; // in cm
    preferences: string;
    phone?: string;
}

export interface WeekPlan {
    id: string;
    clientInfo: ClientInfo;
    startDate: Date;
    endDate: Date;
    days: DayPlan[];
}
