'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Loader2, Activity, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientProfile {
    _id: string;
    name: string;
    email: string;
    weight?: number;
    height?: number;
    idealWeight?: number;
}

interface WeightLog {
    _id: string;
    weight: number;
    unit: string;
    date: string;
}

interface WaterData {
    currentGlasses: number;
    targetGlasses: number;
}

interface Assessment {
    _id: string;
    totalScore: number;
    riskLevel: string;
    categoryScores: {
        eat: number;
        lifestyle: number;
        mind: number;
        exercise: number;
    };
    date: string;
}

// Question Data extracted from images
const ASSESSMENT_QUESTIONS = [
    {
        id: 1,
        category: 'eat',
        question: 'How often do you consume Vegetables/Fruits?',
        options: [
            { label: 'Never', score: 0 },
            { label: '1xWeek', score: 5 },
            { label: '2-3xWeek', score: 15 },
            { label: 'Daily', score: 25 }
        ]
    },
    {
        id: 2,
        category: 'eat',
        question: 'How often do you consume Soft Drinks?',
        options: [
            { label: 'Never', score: 25 },
            { label: '1xWeek', score: 15 },
            { label: '2-3xWeek', score: 5 },
            { label: 'Daily', score: 0 }
        ]
    },
    {
        id: 3,
        category: 'eat',
        question: 'How often do you consume Packaged Foods (Maggi, Digestive Cookies)?',
        options: [
            { label: 'Never', score: 25 },
            { label: '1xWeek', score: 15 },
            { label: '2-3xWeek', score: 5 },
            { label: 'Daily', score: 0 }
        ]
    },
    {
        id: 4,
        category: 'eat',
        question: 'How often do you consume Processed Foods?',
        options: [
            { label: 'Never', score: 25 },
            { label: 'Rarely', score: 20 },
            { label: 'Sometimes', score: 10 },
            { label: 'Often', score: 5 },
            { label: 'Always', score: 0 }
        ]
    },
    {
        id: 5,
        category: 'eat',
        question: 'How often do you consume Fast Food (Samosa, Noodles, Burger, Momos)?',
        options: [
            { label: 'Never', score: 25 },
            { label: '1xWeek', score: 15 },
            { label: '2-3xWeek', score: 5 },
            { label: 'Daily', score: 0 }
        ]
    },
    {
        id: 6,
        category: 'eat',
        question: 'How often do you consume Tea/Coffee (20ml)?',
        options: [
            { label: 'Never', score: 25 },
            { label: '1xWeek', score: 20 },
            { label: '2-3xWeek', score: 10 },
            { label: '> 3X Day', score: 0 }
        ]
    },
    {
        id: 7,
        category: 'eat',
        question: 'How often do you consume Refined Oil?',
        options: [
            { label: 'Never', score: 25 },
            { label: '1-2xWeek', score: 15 },
            { label: '3-4xWeek', score: 5 },
            { label: 'Daily', score: 0 }
        ]
    },
    {
        id: 8,
        category: 'lifestyle',
        question: 'What is your daily water intake?',
        options: [
            { label: '1-4 Glasses', score: 5 },
            { label: '5-8 Glasses', score: 15 },
            { label: '8-12 Glasses', score: 25 },
            { label: '> 12 Glasses', score: 20 }
        ]
    },
    {
        id: 9,
        category: 'lifestyle',
        question: 'Do you read the ingredients on everything you consume?',
        options: [
            { label: 'Yes', score: 25 },
            { label: 'Sometimes', score: 15 },
            { label: 'No', score: 5 },
            { label: "Don't Care", score: 0 }
        ]
    },
    {
        id: 10,
        category: 'eat',
        question: 'How much sugar do you consume in a typical day? (1 Tbsp - 15 gm)',
        options: [
            { label: '0-2 Tbsp', score: 25 },
            { label: '2-3 Tbsp', score: 10 },
            { label: '> 3 Tbsp', score: 0 },
            { label: 'Sugar Free/Substitute', score: 20 }
        ]
    },
    {
        id: 11,
        category: 'lifestyle',
        question: 'Do you smoke?',
        options: [
            { label: 'Yes', score: 0 },
            { label: 'No', score: 25 },
            { label: 'I have quit', score: 15 }
        ]
    },
    {
        id: 12,
        category: 'lifestyle',
        question: 'Do you consume alcohol?',
        options: [
            { label: 'Yes', score: 0 },
            { label: 'No', score: 25 },
            { label: 'Socially', score: 15 }
        ]
    },
    {
        id: 13,
        category: 'lifestyle',
        question: 'When you start feeling unwell like a cold, you?',
        options: [
            { label: 'Take home remedy', score: 25 },
            { label: 'Take a Medicine', score: 10 },
            { label: 'Call the doctor', score: 5 },
            { label: 'Ignore it', score: 0 }
        ]
    },
    {
        id: 14,
        category: 'lifestyle',
        question: 'Do you use any of the following in your kitchen?',
        options: [
            { label: 'Plastic Storage Boxes', score: 5 },
            { label: 'Teflon Coating Cookware', score: 5 },
            { label: 'Aluminium Foil', score: 5 },
            { label: 'None of these', score: 25 }
        ]
    },
    {
        id: 15,
        category: 'lifestyle',
        question: 'How frequently do you fall sick?',
        options: [
            { label: 'Once a week', score: 0 },
            { label: 'Once a month', score: 5 },
            { label: 'Once in few months', score: 15 },
            { label: 'Once in a Year', score: 25 }
        ]
    },
    {
        id: 16,
        category: 'lifestyle',
        question: 'Do you have any of the following disease?',
        options: [
            { label: 'Diabetes/PCOD/Thyroid/Hypertension', score: 5 },
            { label: 'IBS/Constipation/Fatty Liver', score: 10 },
            { label: 'Arthiritis/Osteoperosis', score: 15 },
            { label: 'No', score: 25 }
        ]
    },
    {
        id: 17,
        category: 'lifestyle',
        question: 'Have you lost weight earlier?',
        options: [
            { label: 'Gained & Lost Several Times', score: 5 },
            { label: 'Gained and Lost Once', score: 15 },
            { label: 'Gained weight for the First Time', score: 25 }
        ]
    },
    {
        id: 18,
        category: 'mind',
        question: 'Do you feel low in energy or are often fatigue?',
        options: [
            { label: 'Never', score: 25 },
            { label: 'Rarely', score: 15 },
            { label: 'Occasionally', score: 5 },
            { label: 'Often', score: 0 }
        ]
    },
    {
        id: 19,
        category: 'mind',
        question: 'Are you stressed?',
        options: [
            { label: 'Yes, all the time', score: 0 },
            { label: 'Sometimes', score: 10 },
            { label: 'It comes and goes, no worries', score: 20 },
            { label: 'No, not really', score: 25 }
        ]
    },
    {
        id: 20,
        category: 'mind',
        question: 'How much sleep do you get?',
        options: [
            { label: '4-5 hours', score: 5 },
            { label: '6-7 hours', score: 15 },
            { label: '8-10hours', score: 25 },
            { label: '< 4 hours', score: 0 }
        ]
    },
    {
        id: 21,
        category: 'exercise',
        question: 'Do you exercise?',
        options: [
            { label: '2 Times a Week', score: 10 },
            { label: '3-4 Times a Week', score: 20 },
            { label: 'No', score: 0 },
            { label: '5 or more times a Week', score: 25 }
        ]
    },
    {
        id: 22,
        category: 'exercise',
        question: 'How is your general day like?',
        options: [
            { label: 'Sedentary (No Movement)', score: 0 },
            { label: 'Somewhat Active (Example Household chores etc.)', score: 15 },
            { label: 'Very Active (Example - On feet at work)', score: 25 }
        ]
    },
    {
        id: 23,
        category: 'exercise',
        question: 'Which of these do you prefer?',
        options: [
            { label: 'Running/Yoga', score: 25 },
            { label: 'Strength Training', score: 25 },
            { label: 'Cardio', score: 15 },
            { label: "Don't Exercise", score: 0 }
        ]
    }
];

export default function HealthAssessmentPage() {
    const { user } = useAuth(true);
    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
    const [waterData, setWaterData] = useState<WaterData | null>(null);
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(true);

    // Quiz State
    const [isQuizActive, setIsQuizActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [userAnswers, setUserAnswers] = useState<{ questionId: number, answerIndex: number, score: number }[]>([]);

    const fetchData = async () => {
        try {
            const [profileData, assessmentData] = await Promise.all([
                api.get<ClientProfile>('/api/clients/me'),
                api.get<Assessment>('/api/clients/me/health-assessment')
            ]);
            setProfile(profileData);
            setAssessment(assessmentData);
        } catch (error) {
            console.error('Failed to fetch assessment data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const handleAnswer = (answerIndex: number, score: number) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentStep] = { questionId: ASSESSMENT_QUESTIONS[currentStep].id, answerIndex, score };
        setUserAnswers(newAnswers);

        if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleSubmitAssessment = async () => {
        const categoryScores = { eat: 0, lifestyle: 0, mind: 0, exercise: 0 };
        let totalRawScore = 0;

        userAnswers.forEach((ans, idx) => {
            const question = ASSESSMENT_QUESTIONS[idx];
            categoryScores[question.category as keyof typeof categoryScores] += ans.score;
            totalRawScore += ans.score;
        });

        // Calculate a 0-100 score (approx 23 questions * 25 max score = 575 max)
        const totalScore = Math.round((totalRawScore / (ASSESSMENT_QUESTIONS.length * 25)) * 100);

        let riskLevel = 'Awesome';
        if (totalScore <= 30) riskLevel = 'Excessive Risk';
        else if (totalScore <= 40) riskLevel = 'Weak Areas';
        else if (totalScore <= 60) riskLevel = 'Serious';
        else if (totalScore <= 75) riskLevel = 'Improvement';
        else if (totalScore <= 89) riskLevel = 'Better';

        try {
            const result = await api.post<Assessment>('/api/clients/me/health-assessment', {
                answers: userAnswers,
                categoryScores,
                totalScore,
                riskLevel
            });
            setAssessment(result);
            setIsQuizActive(false);
            setCurrentStep(0);
            setUserAnswers([]);
        } catch (error) {
            console.error('Failed to submit assessment:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="text-center space-y-4">
                    <img
                        src="/brand-logo.png"
                        alt="NutriVibes"
                        className="h-20 w-auto mx-auto animate-pulse"
                    />
                    <Loader2 className="w-8 h-8 animate-spin text-brand-sage mx-auto" />
                </div>
            </div>
        );
    }

    const currentWeight = profile?.weight || 0;

    // Quiz Navigation / Progress
    const progress = ((currentStep + 1) / ASSESSMENT_QUESTIONS.length) * 100;

    return (
        <div className="min-h-full bg-slate-50 p-6 md:p-8">
            <AnimatePresence mode="wait">
                {!isQuizActive ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        {/* Header */}
                        <div>
                            <h1 className="text-4xl font-black text-brand-forest tracking-tight">Wellness Audit</h1>
                            <p className="text-slate-500 font-medium italic">Understand what's stopping you from reaching your goals.</p>
                        </div>

                        {/* Assessment Section */}
                        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl">
                            <div className="p-8 md:p-12 text-center space-y-8">
                                {assessment ? (
                                    <div className="space-y-6">
                                        <div className="relative inline-flex items-center justify-center">
                                            <div className="w-48 h-48 rounded-full border-[12px] border-slate-50 flex flex-col items-center justify-center">
                                                <span className="text-6xl font-black text-brand-forest">{assessment.totalScore}</span>
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Audit Score</span>
                                            </div>
                                            <svg className="absolute w-56 h-56 -rotate-90">
                                                <circle
                                                    cx="112"
                                                    cy="112"
                                                    r="100"
                                                    fill="transparent"
                                                    stroke="#f1f5f9"
                                                    strokeWidth="8"
                                                />
                                                <motion.circle
                                                    cx="112"
                                                    cy="112"
                                                    r="100"
                                                    fill="transparent"
                                                    stroke="var(--brand-sage)"
                                                    strokeWidth="8"
                                                    strokeDasharray="628"
                                                    initial={{ strokeDashoffset: 628 }}
                                                    animate={{ strokeDashoffset: 628 - (628 * (assessment.totalScore / 100)) }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black text-brand-forest tracking-tight">You are at {assessment.riskLevel}!</h3>
                                            <p className="text-slate-500 max-w-md mx-auto font-medium">
                                                Based on your habits, we've identified key areas to improve your wellbeing.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setIsQuizActive(true)}
                                            className="px-10 py-4 bg-brand-forest text-white rounded-2xl font-black hover:bg-brand-sage transition-all shadow-xl shadow-brand-forest/10 active:scale-95 flex items-center gap-2 mx-auto"
                                        >
                                            Retake Audit
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row items-center gap-12 text-left">
                                        <div className="flex-1 space-y-6">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-cream text-brand-earth rounded-full text-xs font-black uppercase tracking-wider">
                                                <Activity size={14} />
                                                Exclusive Insight
                                            </div>
                                            <h2 className="text-5xl font-black text-brand-forest leading-tight tracking-tight">
                                                How healthy <br /> are you really?
                                            </h2>
                                            <p className="text-slate-500 font-medium text-lg leading-relaxed italic">
                                                Take our 2-minute "Health Audit" to uncover habits impacting your goals and get personalized advice.
                                            </p>
                                            <button
                                                onClick={() => setIsQuizActive(true)}
                                                className="w-full md:w-auto px-10 py-5 bg-brand-sage text-white rounded-2xl font-black text-lg hover:bg-brand-forest transition-all shadow-xl shadow-brand-sage/20 active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                Start Audit
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                        <div className="w-full md:w-[320px] aspect-square rounded-[40px] bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 relative overflow-hidden flex items-center justify-center">
                                            {/* Placeholder for the female character image from screenshot */}
                                            <div className="text-slate-200 font-black text-9xl">?</div>
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                ) : (
                    <motion.div
                        key="quiz"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="max-w-2xl mx-auto h-[calc(100vh-160px)] flex flex-col"
                    >
                        {/* Quiz Header */}
                        <div className="flex items-center justify-between mb-12">
                            <button
                                onClick={() => setIsQuizActive(false)}
                                className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"
                            >
                                <ChevronLeft size={24} className="text-slate-600" />
                            </button>
                            <div className="text-center">
                                <h2 className="text-xl font-black text-brand-forest tracking-tight">Wellness Audit</h2>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                                    Step {currentStep + 1} of {ASSESSMENT_QUESTIONS.length}
                                </p>
                            </div>
                            <div className="w-12 h-12" /> {/* Spacer */}
                        </div>

                        {/* Progress Bar Segments (Eat, Lifestyle, Mind, Exercise) */}
                        <div className="grid grid-cols-4 gap-2 mb-16">
                            {['Eat', 'Lifestyle', 'Mind', 'Exercise'].map((cat, i) => {
                                const categories = ['eat', 'lifestyle', 'mind', 'exercise'];
                                const currentCategory = ASSESSMENT_QUESTIONS[currentStep].category;
                                const catIndex = categories.indexOf(currentCategory);
                                const isActive = i <= catIndex;
                                const isCurrent = i === catIndex;

                                return (
                                    <div key={cat} className="space-y-2">
                                        <div className={`h-2 rounded-full transition-all duration-500 ${isActive ? 'bg-brand-sage' : 'bg-slate-100'
                                            }`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest text-center block transition-colors ${isCurrent ? 'text-brand-sage' : 'text-slate-400'
                                            }`}>
                                            {cat}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Question Card */}
                        <div className="flex-1 flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-12"
                                >
                                    <h3 className="text-3xl font-black text-brand-forest text-center leading-tight tracking-tight">
                                        {ASSESSMENT_QUESTIONS[currentStep].question}
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4">
                                        {ASSESSMENT_QUESTIONS[currentStep].options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(idx, option.score)}
                                                className="w-full p-6 text-lg font-bold text-slate-600 bg-white border-2 border-slate-100 rounded-[24px] transition-all hover:border-brand-sage hover:text-brand-sage hover:shadow-xl hover:shadow-brand-sage/5 active:scale-[0.98]"
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-12 flex items-center justify-between gap-4">
                            <button
                                disabled={currentStep === 0}
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className={`px-8 py-4 font-bold rounded-2xl transition-all ${currentStep === 0 ? 'text-slate-300 pointer-events-none' : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                Back
                            </button>

                            {currentStep === ASSESSMENT_QUESTIONS.length - 1 ? (
                                <button
                                    onClick={handleSubmitAssessment}
                                    className="px-10 py-4 bg-brand-forest text-white rounded-2xl font-black shadow-xl shadow-brand-forest/10 hover:bg-brand-sage transition-all active:scale-95"
                                >
                                    Finish & See Result
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Next
                                    <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
