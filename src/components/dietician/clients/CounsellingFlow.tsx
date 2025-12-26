'use client';

import React, { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Search,
    Check,
    Square
} from 'lucide-react';

interface CounsellingFlowProps {
    onClose: () => void;
    onFinish: (data: any) => void;
    initialData?: {
        gender?: string;
        maritalStatus?: string;
        age?: number;
        country?: string;
        state?: string;
        city?: string;
        height?: number;
        weight?: number;
        workType?: string;
        shiftType?: string;
        staying?: string;
        placeOfWork?: string;
        smoking?: string;
        alcohol?: string;
        medicalConditions?: string[];
        stressLevel?: string;
        medicalGoal?: string;
        emotionalEating?: string;
    };
}

const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];

const COUNTRIES = [
    'India', 'USA', 'UK', 'Australia', 'Canada', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle of Man', 'Israel', 'Italy'
];

const STATES = [
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Orissa', 'Pondicherry', 'Punjab', 'Gujarat', 'Rajasthan', 'Delhi', 'Karnataka'
];

const CITIES = [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Kalyan-Dombivali', 'Vasai-Virar', 'Solapur', 'Ahmedabad', 'Surat', 'Rajkot', 'Bangalore'
];

const WORK_TYPES = [
    'Sitting Job', 'Standing Job', 'Homemaker', 'Traveling', 'Student Life'
];

const SHIFT_TYPES = [
    'Day Shift', 'Night Shift', 'Changing Shift'
];

const STAYING_OPTIONS = [
    'Home', 'Hostel/PG'
];

const PLACE_OF_WORK_OPTIONS = [
    'Home', 'Office/Study Place', 'Traveling'
];

const SMOKING_OPTIONS = ['Never', 'Occasional', 'Regular', 'Quit'];
const ALCOHOL_OPTIONS = ['Never', 'Occasional', 'Regular', 'Quit'] as const;

const MEDICAL_CONDITIONS = [
    'Diabetes', 'Hypertension', 'Hypothyroidism', 'Hyperthyroidism',
    'Irritable Bowel Syndrome (IBS)', 'Gut disorders', 'Fatty liver',
    'Cardiovascular disease', 'Hyperlipidemia (High Cholesterol)',
    'Anxiety & Depression', 'Gout', 'Kidney Stones',
    'Gastro esophageal reflux disease (GERD)', 'Cancer', 'Others',
    'No medical condition'
];

const DEFICIENCIES = [
    'Vitamin D', 'Iron', 'TSH', 'T3/T4', 'Vitamin B12', 'Calcium', 'Magnesium',
    'Folate', 'Zinc', 'Vitamin C', 'Vitamin A', 'Iodine', 'Selenium', 'Biotin',
    'Vitamin E', 'Others', 'No deficiencies'
];

const SURGERIES = [
    'Hysterectomy (Uterus removal)', 'Fistulectomy (Fistula repair)', 'Hernia Repair',
    'Hemorrhoidectomy', 'Liposuction', 'IUD implant (Merina implant)',
    'Tumor Removal', 'Cancer', 'Others', 'No surgery'
];

const LOSE_WEIGHT_REASONS = [
    'Be Fit', 'Look good', 'Occasions (Wedding, Party, Photo Shoot)',
    'Boost self confidence', 'Medication reduction', 'Want to Fit in my old clothes',
    'Health Improvement', 'Improve Physical Performance'
];

const PREVIOUS_DIETS = [
    'Keto', 'Intermittent Fasting', 'Calorie Restrictive', 'Fitelo Diet',
    'Paleo Diet', 'Vegan', 'High Protein diet', 'Low carb diet',
    'Low fat diet', 'Gluten free', 'DASH diet', 'Balanced diet',
    'Grainfree diet', 'Herbalife', 'Crash diet', 'VLCC diet',
    'Not followed any diet'
];

const ALCOHOL_TYPES = [
    'Cocktail', 'Whisky', 'Rum', 'Beer', 'Wine', 'Vodka', 'Gin', 'Tequila'
];

const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const STRESS_LEVELS = [
    'Low', 'Medium', 'High'
];

const MEDICAL_GOALS = [
    'Weight Loss', 'Weight Gain', 'Disease Management', 'Muscle Gain', 'Healthy Lifestyle', 'Better Energy'
];

const EMOTIONAL_EATING_OPTIONS = [
    'Yes', 'No', 'Sometimes'
];

export const CounsellingFlow: React.FC<CounsellingFlowProps> = ({ onClose, onFinish, initialData }) => {
    const [step, setStep] = useState(1);
    const [medicationModal, setMedicationModal] = useState(false);
    const [newMed, setNewMed] = useState({
        type: 'Medicine',
        name: '',
        dosage: '',
        unit: 'Mg',
        frequency: '',
        freqUnit: 'Day'
    });

    const [formData, setFormData] = useState({
        gender: initialData?.gender || 'Male',
        maritalStatus: initialData?.maritalStatus || 'Single',
        age: initialData?.age || '',
        country: initialData?.country || 'India',
        state: initialData?.state || 'Maharashtra',
        city: initialData?.city || 'Mumbai',
        height: initialData?.height || '',
        weight: initialData?.weight || '',
        heightUnit: 'Cm',
        weightUnit: 'Kg',
        workType: initialData?.workType || '',
        shiftType: initialData?.shiftType || '',
        staying: initialData?.staying || '',
        placeOfWork: initialData?.placeOfWork || '',
        smoking: initialData?.smoking || 'Never',
        cigarettesPerDay: '',
        alcohol: initialData?.alcohol || 'Never',
        alcoholFrequency: 'Weekly',
        alcoholTypes: [] as string[],
        medicalConditions: initialData?.medicalConditions || [],
        otherMedicalCondition: '',
        deficiencies: [] as string[],
        otherDeficiency: '',
        surgeries: [] as string[],
        otherSurgery: '',
        medications: [] as any[],
        medicalReport: null as File | null,
        stressLevel: initialData?.stressLevel || 'Low',
        medicalGoal: initialData?.medicalGoal || 'Weight Loss',
        loseWeightReasons: [] as string[],
        emotionalEating: initialData?.emotionalEating || 'No',
        previousDiets: [] as string[],
        noMeatDays: [] as string[],
        fastDays: [] as string[],
        cheatMeals: 'No',
        dietStartDate: new Date().toISOString().split('T')[0]
    });

    const totalSteps = 31;

    // Sections:
    // 1-12: DEMOGRAPHICS
    // 13-17: MEDICAL HISTORY
    // 18-21: HEALTH GOALS
    // 22: DIETARY HISTORY
    // 23-30: LIFESTYLE & PREFERENCES
    const getSectionTitle = () => {
        if (step <= 12) return "Demographics & Basic Info";
        if (step <= 17) return "Medical History";
        if (step <= 21) return "Health Goals";
        if (step <= 22) return "Dietary History";
        return "Lifestyle & Preferences";
    };

    const handleNext = () => {
        // Skip smoking details if not smoking
        if (step === 23 && (formData.smoking === 'Never' || formData.smoking === 'Quit')) {
            setStep(25);
            return;
        }
        // Skip alcohol details if not drinking
        if (step === 25 && (formData.alcohol === 'Never' || formData.alcohol === 'Quit')) {
            setStep(28);
            return;
        }

        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            onFinish(formData);
        }
    };

    const handleBack = () => {
        // Handle skipped steps
        if (step === 25 && (formData.smoking === 'Never' || formData.smoking === 'Quit')) {
            setStep(23);
            return;
        }
        if (step === 28 && (formData.alcohol === 'Never' || formData.alcohol === 'Quit')) {
            setStep(25);
            return;
        }

        if (step > 1) {
            setStep(step - 1);
        } else {
            onClose();
        }
    };

    const OptionButton = ({ label, value, field }: { label: string, value: string, field: string }) => (
        <button
            onClick={() => setFormData({ ...formData, [field]: value })}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between font-bold ${(formData as any)[field] === value
                ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${(formData as any)[field] === value ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                    }`}>
                    {(formData as any)[field] === value && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span>{label}</span>
            </div>
            {(formData as any)[field] === value && <Check size={18} strokeWidth={3} />}
        </button>
    );

    const MultiSelectToggle = ({ item, field, otherField }: { item: string, field: keyof typeof formData, otherField?: keyof typeof formData }) => {
        const list = formData[field] as string[];
        const isSelected = list.includes(item);
        const toggle = () => {
            const newList = isSelected
                ? list.filter(i => i !== item)
                : [...list, item];
            setFormData({ ...formData, [field]: newList });
        };

        return (
            <button
                onClick={toggle}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 font-bold ${isSelected
                    ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100'
                    }`}
            >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300 bg-white'
                    }`}>
                    {isSelected && <Check size={14} strokeWidth={4} className="text-white" />}
                </div>
                <span>{item}</span>
            </button>
        );
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">What is your Gender ?</h2>
                        <div className="w-full flex flex-col gap-3">
                            {GENDERS.map(option => (
                                <OptionButton key={option} label={option} value={option} field="gender" />
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">What is your Marital Status ?</h2>
                        <div className="w-full flex flex-col gap-3">
                            {MARITAL_STATUSES.map(option => (
                                <OptionButton key={option} label={option} value={option} field="maritalStatus" />
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12">
                        <h2 className="text-xl font-bold text-slate-800">What is your Age ?</h2>
                        <div className="w-full">
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                className="w-full p-4 text-center text-2xl font-bold border-b-2 border-slate-200 focus:border-orange-500 outline-none bg-transparent transition-colors"
                                placeholder="0"
                            />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12">
                        <h2 className="text-xl font-bold text-slate-800">What is your Country ?</h2>
                        <div className="w-full relative">
                            <select
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full p-4 text-left text-lg font-bold border rounded-lg border-slate-200 focus:border-orange-500 outline-none bg-white appearance-none cursor-pointer"
                            >
                                {COUNTRIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Search size={18} />
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronRight className="rotate-90 text-slate-400" />
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12">
                        <h2 className="text-xl font-bold text-slate-800">What is your height ?</h2>
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                            {['Cm', 'Feet'].map(unit => (
                                <button
                                    key={unit}
                                    onClick={() => setFormData({ ...formData, heightUnit: unit })}
                                    className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${formData.heightUnit === unit
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {unit}
                                </button>
                            ))}
                        </div>
                        <div className="w-full">
                            <input
                                type="number"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                className="w-full p-4 text-center text-2xl font-bold border-b-2 border-slate-200 focus:border-orange-500 outline-none bg-transparent transition-colors"
                                placeholder="000.00"
                            />
                        </div>
                    </div>
                );
            case 6:
                const bmi = (() => {
                    const h = parseFloat(formData.height as string);
                    const w = parseFloat(formData.weight as string);
                    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return null;

                    let weightKg = w;
                    if (formData.weightUnit === 'Lbs') {
                        weightKg = w * 0.453592;
                    }

                    let heightMeters = h;
                    if (formData.heightUnit === 'Cm') {
                        heightMeters = h / 100;
                    } else if (formData.heightUnit === 'Feet') {
                        heightMeters = h * 0.3048;
                    }

                    const val = weightKg / (heightMeters * heightMeters);
                    let category = "";
                    let color = "text-slate-400";

                    if (val < 18.5) { category = "Underweight"; color = "text-blue-500"; }
                    else if (val < 25) { category = "Normal"; color = "text-emerald-500"; }
                    else if (val < 30) { category = "Overweight"; color = "text-orange-500"; }
                    else { category = "Obese"; color = "text-rose-500"; }

                    return { value: val.toFixed(1), category, color };
                })();

                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12">
                        <h2 className="text-xl font-bold text-slate-800">What is your weight ?</h2>
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                            {['Kg', 'Lbs'].map(unit => (
                                <button
                                    key={unit}
                                    onClick={() => setFormData({ ...formData, weightUnit: unit })}
                                    className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${formData.weightUnit === unit
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {unit}
                                </button>
                            ))}
                        </div>
                        <div className="w-full">
                            <input
                                type="number"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                className="w-full p-4 text-center text-2xl font-bold border-b-2 border-slate-200 focus:border-orange-500 outline-none bg-transparent transition-colors"
                                placeholder="000"
                            />
                        </div>

                        {bmi && (
                            <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-300">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Calculated BMI</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-orange-600">{bmi.value}</span>
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full bg-slate-100 ${bmi.color}`}>
                                        {bmi.category}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 7:
                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12">
                        <h2 className="text-xl font-bold text-slate-800">What is your State/Province ?</h2>
                        <div className="w-full relative">
                            <select
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="w-full p-4 text-left text-lg font-bold border rounded-lg border-slate-200 focus:border-orange-500 outline-none bg-white appearance-none cursor-pointer"
                            >
                                {STATES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronRight className="rotate-90 text-slate-400" />
                            </div>
                        </div>
                    </div>
                );
            case 8:
                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12">
                        <h2 className="text-xl font-bold text-slate-800">What is your City/Town/District ?</h2>
                        <div className="w-full relative">
                            <select
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full p-4 text-left text-lg font-bold border rounded-lg border-slate-200 focus:border-orange-500 outline-none bg-white appearance-none cursor-pointer"
                            >
                                {CITIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronRight className="rotate-90 text-slate-400" />
                            </div>
                        </div>
                    </div>
                );
            case 9:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">What is your Type of Work ?</h2>
                        <div className="w-full flex flex-col gap-3">
                            {WORK_TYPES.map(type => (
                                <OptionButton key={type} label={type} value={type} field="workType" />
                            ))}
                        </div>
                    </div>
                );
            case 10:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">What is your shift type ?</h2>
                        <div className="w-full flex flex-col gap-3">
                            {SHIFT_TYPES.map(type => (
                                <OptionButton key={type} label={type} value={type} field="shiftType" />
                            ))}
                        </div>
                    </div>
                );
            case 11:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">Where are you Staying ?</h2>
                        <div className="w-full flex flex-col gap-3">
                            {STAYING_OPTIONS.map(option => (
                                <OptionButton key={option} label={option} value={option} field="staying" />
                            ))}
                        </div>
                    </div>
                );
            case 12:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">What is your Place of work ?</h2>
                        <div className="w-full flex flex-col gap-3">
                            {PLACE_OF_WORK_OPTIONS.map(option => (
                                <OptionButton key={option} label={option} value={option} field="placeOfWork" />
                            ))}
                        </div>
                    </div>
                );
            case 13:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Medical Conditions</h2>
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {MEDICAL_CONDITIONS.map(condition => (
                                <MultiSelectToggle key={condition} item={condition} field="medicalConditions" />
                            ))}
                        </div>
                        {formData.medicalConditions.includes('Others') && (
                            <div className="w-full mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <textarea
                                    value={formData.otherMedicalCondition}
                                    onChange={(e) => setFormData({ ...formData, otherMedicalCondition: e.target.value })}
                                    placeholder="Specify other conditions..."
                                    className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[100px] text-slate-700 font-medium"
                                />
                            </div>
                        )}
                    </div>
                );
            case 14:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Deficiencies</h2>
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {DEFICIENCIES.map(item => (
                                <MultiSelectToggle key={item} item={item} field="deficiencies" />
                            ))}
                        </div>
                        {formData.deficiencies.includes('Others') && (
                            <div className="w-full mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <textarea
                                    value={formData.otherDeficiency}
                                    onChange={(e) => setFormData({ ...formData, otherDeficiency: e.target.value })}
                                    placeholder="Specify other deficiencies..."
                                    className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[100px] text-slate-700 font-medium"
                                />
                            </div>
                        )}
                    </div>
                );
            case 15:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Surgeries</h2>
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {SURGERIES.map(item => (
                                <MultiSelectToggle key={item} item={item} field="surgeries" />
                            ))}
                        </div>
                        {formData.surgeries.includes('Others') && (
                            <div className="w-full mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <textarea
                                    value={formData.otherSurgery}
                                    onChange={(e) => setFormData({ ...formData, otherSurgery: e.target.value })}
                                    placeholder="Specify other surgeries..."
                                    className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[100px] text-slate-700 font-medium"
                                />
                            </div>
                        )}
                    </div>
                );
            case 16:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Medicine or Supplement</h2>
                        <div className="w-full space-y-4">
                            {formData.medications.map((med, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center group">
                                    <div>
                                        <div className="text-xs font-bold text-orange-500 uppercase">{med.type}</div>
                                        <div className="font-bold text-slate-700">{med.name}</div>
                                        <div className="text-sm text-slate-500">{med.dosage} {med.unit}, {med.frequency} times a {med.freqUnit}</div>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, medications: formData.medications.filter((_, i) => i !== idx) })}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all font-bold text-xs uppercase"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setMedicationModal(true)}
                                className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-orange-500 hover:text-orange-500 font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">+</span> Add Medicine or Supplement
                            </button>
                        </div>

                        {medicationModal && (
                            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <h3 className="font-bold text-slate-800 uppercase tracking-tight">Enter Details</h3>
                                        <button onClick={() => setMedicationModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Type</label>
                                            <select
                                                value={newMed.type}
                                                onChange={(e) => setNewMed({ ...newMed, type: e.target.value })}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                                            >
                                                <option>Medicine</option>
                                                <option>Supplement</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Name</label>
                                            <input
                                                type="text"
                                                value={newMed.name}
                                                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                                                placeholder="Enter name"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dosage</label>
                                                <input
                                                    type="text"
                                                    value={newMed.dosage}
                                                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Unit</label>
                                                <select
                                                    value={newMed.unit}
                                                    onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                                                >
                                                    <option>Mg</option>
                                                    <option>Mcg</option>
                                                    <option>IU</option>
                                                    <option>Gm</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Frequency</label>
                                                <input
                                                    type="text"
                                                    value={newMed.frequency}
                                                    onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Frequency Unit</label>
                                                <select
                                                    value={newMed.freqUnit}
                                                    onChange={(e) => setNewMed({ ...newMed, freqUnit: e.target.value })}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                                                >
                                                    <option>Day</option>
                                                    <option>Week</option>
                                                    <option>Month</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (newMed.name) {
                                                    setFormData({ ...formData, medications: [...formData.medications, newMed] });
                                                    setNewMed({ type: 'Medicine', name: '', dosage: '', unit: 'Mg', frequency: '', freqUnit: 'Day' });
                                                    setMedicationModal(false);
                                                }
                                            }}
                                            className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 17:
                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12">
                        <h2 className="text-xl font-bold text-slate-800">Medical report</h2>
                        <div className="w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-center group hover:border-orange-500 hover:bg-orange-50/10 transition-all cursor-pointer relative">
                            <input
                                type="file"
                                onChange={(e) => setFormData({ ...formData, medicalReport: e.target.files?.[0] || null })}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                                <Search size={24} />
                            </div>
                            <div className="font-bold text-slate-700">
                                {formData.medicalReport ? formData.medicalReport.name : 'Choose file to upload'}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tight">Png/Jpg/Pdf (Max limit 5 MB)</div>
                        </div>
                    </div>
                );
            case 18:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">What is your stress level ?</h2>
                        <div className="w-full flex flex-col gap-3">
                            {STRESS_LEVELS.map(option => (
                                <OptionButton key={option} label={option} value={option} field="stressLevel" />
                            ))}
                        </div>
                    </div>
                );
            case 19:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">Primary Health Goal</h2>
                        <div className="w-full flex flex-col gap-3">
                            {MEDICAL_GOALS.map(option => (
                                <OptionButton key={option} label={option} value={option} field="medicalGoal" />
                            ))}
                        </div>
                    </div>
                );
            case 20:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Why you want to lose weight?</h2>
                        <div className="w-full space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {LOSE_WEIGHT_REASONS.map(item => (
                                <MultiSelectToggle key={item} item={item} field="loseWeightReasons" />
                            ))}
                        </div>
                    </div>
                );
            case 21:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">Emotional Eating</h2>
                        <div className="w-full flex flex-col gap-3">
                            {EMOTIONAL_EATING_OPTIONS.map(option => (
                                <OptionButton key={option} label={option} value={option} field="emotionalEating" />
                            ))}
                        </div>
                    </div>
                );
            case 22:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Type of diet(s) followed previously</h2>
                        <div className="w-full space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {PREVIOUS_DIETS.map(item => (
                                <MultiSelectToggle key={item} item={item} field="previousDiets" />
                            ))}
                        </div>
                    </div>
                );
            case 23:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">Tobacco Consumption</h2>
                        <div className="w-full flex flex-col gap-3">
                            {SMOKING_OPTIONS.map(option => (
                                <OptionButton key={option} label={option} value={option} field="smoking" />
                            ))}
                        </div>
                    </div>
                );
            case 24:
                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12">
                        <h2 className="text-xl font-bold text-slate-800">How many cigarettes you smoke in a day ?</h2>
                        <div className="w-full">
                            <input
                                type="number"
                                value={formData.cigarettesPerDay}
                                onChange={(e) => setFormData({ ...formData, cigarettesPerDay: e.target.value })}
                                className="w-full p-4 text-center text-2xl font-bold border-b-2 border-slate-200 focus:border-orange-500 outline-none bg-transparent transition-colors"
                                placeholder="0"
                            />
                        </div>
                    </div>
                );
            case 25:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">Drinking Habit</h2>
                        <div className="w-full flex flex-col gap-3">
                            {['Never', 'Occasional', 'Regular', 'Quit'].map(option => (
                                <OptionButton key={option} label={option} value={option} field="alcohol" />
                            ))}
                        </div>
                    </div>
                );
            case 26:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Alcohol type</h2>
                        <div className="w-full grid grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {ALCOHOL_TYPES.map(item => (
                                <MultiSelectToggle key={item} item={item} field="alcoholTypes" />
                            ))}
                        </div>
                    </div>
                );
            case 27:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto py-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">Frequency of alcohol</h2>
                        <div className="w-full flex flex-col gap-3">
                            {['Daily', 'Weekly', 'Monthly'].map(option => (
                                <OptionButton key={option} label={option} value={option} field="alcoholFrequency" />
                            ))}
                        </div>
                    </div>
                );
            case 28:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">No meat Days</h2>
                        <div className="w-full grid grid-cols-2 gap-3">
                            {DAYS_OF_WEEK.map(item => (
                                <MultiSelectToggle key={item} item={item} field="noMeatDays" />
                            ))}
                        </div>
                    </div>
                );
            case 29:
                return (
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-8">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Fast Days</h2>
                        <div className="w-full grid grid-cols-2 gap-3">
                            {DAYS_OF_WEEK.map(item => (
                                <MultiSelectToggle key={item} item={item} field="fastDays" />
                            ))}
                        </div>
                    </div>
                );
            case 31:
                return (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-12 text-center">
                        <h2 className="text-xl font-bold text-slate-800">When would you like to start your diet?</h2>
                        <div className="w-full">
                            <input
                                type="date"
                                value={formData.dietStartDate}
                                onChange={(e) => setFormData({ ...formData, dietStartDate: e.target.value })}
                                className="w-full p-4 text-center text-xl font-bold border-b-2 border-slate-200 focus:border-orange-500 outline-none bg-transparent transition-colors cursor-pointer"
                            />
                        </div>
                        <p className="text-sm text-slate-400 font-medium mt-4">This date will be used to plan your weekly diet schedule.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const getDotsCount = () => {
        if (step <= 12) return 12;
        if (step <= 17) return 5;
        if (step <= 21) return 4;
        if (step <= 22) return 1;
        return 9; // 23 to 31
    };

    const getCurrentDotStep = () => {
        if (step <= 12) return step;
        if (step <= 17) return step - 12;
        if (step <= 21) return step - 17;
        if (step <= 22) return step - 21;
        return step - 22;
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="p-2 hover:bg-slate-50 rounded-full text-slate-600 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Counselling Session</span>
                    <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{getSectionTitle()}</h1>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Progress Bar */}
            <div className="px-12 py-6">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    {Array.from({ length: getDotsCount() }, (_, i) => i + 1).map((s) => (
                        <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${s <= getCurrentDotStep() ? 'bg-orange-500' : 'bg-slate-200'
                                }`} />
                            {s < getDotsCount() && (
                                <div className={`h-1 flex-1 mx-1.5 rounded-full transition-all duration-300 ${s < getCurrentDotStep() ? 'bg-orange-500' : 'bg-slate-100'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="px-12 pb-12 min-h-[450px] flex flex-col">
                <div className="flex-1">
                    {renderStep()}
                </div>

                <div className="flex flex-col items-center gap-4 mt-8">
                    <button
                        onClick={handleNext}
                        className="w-full max-w-md bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {step === totalSteps ? 'Finish' : 'Next'}
                        <ArrowRight size={18} />
                    </button>
                    {step > 1 && (
                        <button
                            onClick={handleBack}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                        >
                            Back
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
