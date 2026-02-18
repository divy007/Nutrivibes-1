export interface DietPlan {
    id: string;
    title: string;
    description: string;
    color: string;
    features: string[];
}

export const DIET_PLANS: DietPlan[] = [
    {
        id: 'weight-loss',
        title: "Weight Loss",
        description: "Achieve your ideal weight with sustainable calorie-deficit plans that don't compromise on taste or energy.",
        color: "bg-emerald-500",
        features: ["Calorie Tracking", "Balanced Macros", "Sustainable Results"]
    },
    {
        id: 'muscle-gain',
        title: "Muscle Gain",
        description: "High-protein focused plans designed to fuel your workouts, aid recovery, and build lean muscle mass.",
        color: "bg-blue-500",
        features: ["High Protein", "Pre/Post Workout Meals", "Strength Focus"]
    },
    {
        id: 'pcod-pcos',
        title: "PCOD/PCOS",
        description: "Specialized nutrition to help balance hormones, manage insulin resistance, and alleviate symptoms.",
        color: "bg-purple-500",
        features: ["Hormone Balance", "Low GR/GI", "Anti-inflammatory"]
    },
    {
        id: 'thyroid',
        title: "Thyroid Care",
        description: "Dietary strategies rich in essential nutrients to support thyroid function and boost metabolism.",
        color: "bg-amber-500",
        features: ["Iodine Rich", "Metabolism Boost", "Energy Focus"]
    },
    {
        id: 'diabetes',
        title: "Diabetes Mgmt",
        description: "Stable blood sugar management through fiber-rich, scientifically backed meal planning.",
        color: "bg-rose-500",
        features: ["Sugar Control", "Fiber Rich", "Heart Healthy"]
    },
    {
        id: 'post-pregnancy',
        title: "Post Pregnancy",
        description: "Nourishing plans for new mothers to recover strength and manage weight safely.",
        color: "bg-pink-500",
        features: ["Lactation Support", "Energy Restoration", "Safe Weight Loss"]
    }
];
