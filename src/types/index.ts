export type FoodCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface FoodItem {
    id: string;
    name: string;
    category: FoodCategory;
    portion: string;
    description?: string;
    cuisine?: string;
    dietPref?: string;
    quantity?: string;
    isThyroidFriendly?: boolean;
    isWeightLossFriendly?: boolean;
    isDiabetesFriendly?: boolean;
}

export interface MealTiming {
    mealNumber: number;
    time: string;
}

export interface MealSlot {
    time: string;
    mealNumber: number;
    foodItems: FoodItem[];
}

export interface DayPlan {
    date: Date;
    meals: MealSlot[];
    status?: 'NO_DIET' | 'NOT_SAVED' | 'PUBLISHED';
}

export interface ClientInfo {
    id: string; // Friendly ID or fallback
    _id: string; // MongoDB ID for API calls
    clientId?: string;
    name: string;
    email?: string;
    age?: number;
    gender?: string;
    weight?: number; // in kg
    height?: number; // in cm
    idealWeight?: number;
    phone?: string;
    dob?: string | Date;
    city?: string;
    state?: string;
    country?: string;
    timeZone?: string;
    dietStatus?: string;
    createdAt?: string;
    updatedAt?: string;
    dietStartDate?: string;
    preferences: string;
    mealTimings?: MealTiming[];
    status?: string;
    counsellingProfile?: any;
    followUpHistory?: {
        _id?: string;
        date: string | Date;
        notes: string;
        updatedAt: string | Date;
    }[];
    assessment?: {
        categoryScores: {
            eat: number;
            lifestyle: number;
            mind: number;
            exercise: number;
        };
        totalScore: number;
        riskLevel: string;
    };
}

export interface WeekPlan {
    id: string;
    clientInfo: ClientInfo;
    startDate: Date;
    endDate: Date;
    days: DayPlan[];
}

// Authentication Interfaces

export interface User {
    _id: string;
    email: string;
    password: string;
    role: "DIETICIAN" | "CLIENT";
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface APIResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: Omit<User, 'password'>;
    token?: string;
}
