import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Save, Loader2, Trash2, Pencil, Ban } from 'lucide-react';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';

interface CounsellingDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientData: any;
    onUpdate: () => void;
}

const SECTIONS = [
    { id: 'demographics', title: 'Demographics & Basic Info' },
    { id: 'medical', title: 'Medical History' },
    { id: 'dietary', title: 'Dietary History' },
    { id: 'lifestyle', title: 'Lifestyle' },
    { id: 'goals', title: 'Health Goals' }
];

export function CounsellingDrawer({ isOpen, onClose, clientId, clientData, onUpdate }: CounsellingDrawerProps) {
    const [activeSection, setActiveSection] = useState<string | null>('demographics');
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Initial Form State
    const [formData, setFormData] = useState({
        // Demographics
        gender: '',
        maritalStatus: '',
        age: '',
        country: '',
        state: '',
        city: '',
        height: '',
        weight: '',
        heightUnit: 'Cm',
        weightUnit: 'Kg',
        workType: '',
        shiftType: '',
        staying: '',
        placeOfWork: '',
        dietStartDate: '',

        // Medical
        medicalConditions: [] as string[],
        otherMedicalCondition: '',
        deficiencies: [] as string[],
        otherDeficiency: '',
        surgeries: [] as string[],
        otherSurgery: '',
        medications: [] as any[], // {type, name, dosage, unit, frequency, freqUnit}

        // Lifestyle
        smoking: 'Never',
        cigarettesPerDay: '',
        alcohol: 'Never',
        alcoholTypes: [] as string[],
        alcoholFrequency: '',
        stressLevel: '',
        emotionalEating: '',

        // Dietary
        previousDiets: [] as string[],
        noMeatDays: [] as string[],
        fastDays: [] as string[],
        cheatMeals: '',

        // Goals
        medicalGoal: '',
        loseWeightReasons: [] as string[]
    });

    // Populate data when Drawer opens
    useEffect(() => {
        if (isOpen && clientData) {
            const profile = clientData.counsellingProfile || {};
            setFormData({
                gender: clientData.gender || '',
                maritalStatus: profile.maritalStatus || '',
                age: clientData.age || '',
                country: profile.country || '',
                state: clientData.state || '',
                city: clientData.city || '',
                height: clientData.height || '',
                weight: clientData.weight || '',
                heightUnit: profile.heightUnit || 'Cm',
                weightUnit: profile.weightUnit || 'Kg',
                workType: profile.workType || '',
                shiftType: profile.shiftType || '',
                staying: profile.staying || '',
                placeOfWork: profile.placeOfWork || '',
                dietStartDate: clientData.dietStartDate ? format(new Date(clientData.dietStartDate), 'yyyy-MM-dd') : '',

                medicalConditions: profile.medicalConditions || [],
                otherMedicalCondition: profile.otherMedicalCondition || '',
                deficiencies: profile.deficiencies || [],
                otherDeficiency: profile.otherDeficiency || '',
                surgeries: profile.surgeries || [],
                otherSurgery: profile.otherSurgery || '',
                medications: profile.medications || [],

                smoking: profile.smoking || 'Never',
                cigarettesPerDay: profile.cigarettesPerDay || '',
                alcohol: profile.alcohol || 'Never',
                alcoholTypes: profile.alcoholTypes || [],
                alcoholFrequency: profile.alcoholFrequency || '',
                stressLevel: profile.stressLevel || '',
                emotionalEating: profile.emotionalEating || '',

                previousDiets: profile.previousDiets || [],
                noMeatDays: profile.noMeatDays || [],
                fastDays: profile.fastDays || [],
                cheatMeals: profile.cheatMeals || '',

                medicalGoal: profile.medicalGoal || '',
                loseWeightReasons: profile.loseWeightReasons || []
            });
        }
    }, [isOpen, clientData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch(`/api/clients/${clientId}`, {
                age: formData.age,
                height: formData.height,
                weight: formData.weight,
                gender: formData.gender,
                city: formData.city,
                state: formData.state,
                dietStartDate: formData.dietStartDate,
                counsellingProfile: {
                    ...formData,
                    // Remove root level fields from nested profile to avoid duplication if desired, 
                    // but keeping them doesn't hurt as they are ignored by generic spread if not in schema.
                    // Actually, we should selectively reconstruct the profile object to be clean.
                    country: formData.country,
                    heightUnit: formData.heightUnit,
                    weightUnit: formData.weightUnit,
                    maritalStatus: formData.maritalStatus,
                    workType: formData.workType,
                    shiftType: formData.shiftType,
                    staying: formData.staying,
                    placeOfWork: formData.placeOfWork,
                    medicalConditions: formData.medicalConditions,
                    otherMedicalCondition: formData.otherMedicalCondition,
                    deficiencies: formData.deficiencies,
                    otherDeficiency: formData.otherDeficiency,
                    surgeries: formData.surgeries,
                    otherSurgery: formData.otherSurgery,
                    medications: formData.medications,
                    smoking: formData.smoking,
                    cigarettesPerDay: formData.cigarettesPerDay,
                    alcohol: formData.alcohol,
                    alcoholTypes: formData.alcoholTypes,
                    alcoholFrequency: formData.alcoholFrequency,
                    stressLevel: formData.stressLevel,
                    emotionalEating: formData.emotionalEating,
                    previousDiets: formData.previousDiets,
                    noMeatDays: formData.noMeatDays,
                    fastDays: formData.fastDays,
                    cheatMeals: formData.cheatMeals,
                    medicalGoal: formData.medicalGoal,
                    loseWeightReasons: formData.loseWeightReasons
                }
            });
            onUpdate();
            setIsEditing(false); // Exit edit mode on save
            alert('Counselling data saved successfully');
        } catch (error) {
            console.error('Failed to save counselling data:', error);
            alert('Failed to save data');
        } finally {
            setSaving(false);
        }
    };

    const toggleSection = (id: string) => {
        setActiveSection(activeSection === id ? null : id);
    };

    // Helper for simple text inputs
    const InputField = ({ label, field, placeholder, type = 'text', readOnly = false }: any) => {
        const val = (formData as any)[field];
        if (!isEditing) {
            return (
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
                    <p className="text-sm font-medium text-slate-800 break-words py-2 border-b border-transparent">{val || <span className="text-slate-300">-</span>}</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
                <input
                    type={type}
                    value={val}
                    onChange={readOnly ? undefined : (e) => setFormData({ ...formData, [field]: e.target.value })}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    className={`p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none ${readOnly ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                />
            </div>
        );
    };

    // Helper for pills/multi-select
    const MultiSelect = ({ label, field, options }: any) => {
        const selectedValues = (formData as any)[field] as string[];

        if (!isEditing) {
            return (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
                    <div className="text-sm font-medium text-slate-800 break-words py-1">
                        {selectedValues.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedValues.map(v => (
                                    <span key={v} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold border border-slate-200">{v}</span>
                                ))}
                            </div>
                        ) : <span className="text-slate-300">-</span>}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
                <div className="flex flex-wrap gap-2">
                    {options.map((opt: string) => {
                        const selected = (formData as any)[field].includes(opt);
                        return (
                            <button
                                key={opt}
                                onClick={() => {
                                    const list = (formData as any)[field] as string[];
                                    const newList = selected ? list.filter(i => i !== opt) : [...list, opt];
                                    setFormData({ ...formData, [field]: newList });
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${selected ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Medication Helper
    const [newMed, setNewMed] = useState({ type: 'Medicine', name: '', dosage: '', unit: 'Mg', frequency: '', freqUnit: 'Day' });
    const addMedication = () => {
        if (newMed.name) {
            setFormData({ ...formData, medications: [...formData.medications, newMed] });
            setNewMed({ type: 'Medicine', name: '', dosage: '', unit: 'Mg', frequency: '', freqUnit: 'Day' });
        }
    };
    const removeMedication = (idx: number) => {
        setFormData({ ...formData, medications: formData.medications.filter((_, i) => i !== idx) });
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Counselling Profile</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span>{clientData?.name}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{format(new Date(), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                            >
                                <Pencil size={14} />
                                Edit
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg text-sm font-bold transition-colors"
                            >
                                <Ban size={14} />
                                Cancel
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50">

                    {/* Demographics Section */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection('demographics')}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <span className="font-bold text-slate-700">Demographics & Basic Info</span>
                            {activeSection === 'demographics' ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                        </button>

                        {activeSection === 'demographics' && (
                            <div className="p-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Age" field="age" type="number" />
                                    <InputField label="Gender" field="gender" />
                                    <InputField label="Country" field="country" />
                                    <InputField label="Diet Start" field="dietStartDate" type="date" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded-lg">
                                    <div className="flex gap-2 items-end">
                                        <InputField label="Height" field="height" type="number" />
                                        {isEditing ? <div className="pb-2"><select className="p-2 border rounded text-xs font-bold bg-white" value={formData.heightUnit} onChange={(e) => setFormData({ ...formData, heightUnit: e.target.value })}><option>Cm</option><option>Feet</option></select></div> : <span className="text-sm font-bold text-slate-500 pb-3">{formData.heightUnit}</span>}
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <InputField label="Weight" field="weight" type="number" />
                                        {isEditing ? <div className="pb-2"><select className="p-2 border rounded text-xs font-bold bg-white" value={formData.weightUnit} onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}><option>Kg</option><option>Lbs</option></select></div> : <span className="text-sm font-bold text-slate-500 pb-3">{formData.weightUnit}</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="City" field="city" />
                                    <InputField label="State" field="state" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Marital Status" field="maritalStatus" placeholder="Single, Married..." />
                                    <InputField label="Staying At" field="staying" placeholder="Home, Hostel..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Work Type" field="workType" placeholder="Sitting, Standing..." />
                                    <InputField label="Shift Type" field="shiftType" placeholder="Day, Night..." />
                                </div>
                                <InputField label="Place of Work" field="placeOfWork" placeholder="Home, Office..." />
                            </div>
                        )}
                    </div>

                    {/* Medical Section */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection('medical')}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <span className="font-bold text-slate-700">Medical History</span>
                            {activeSection === 'medical' ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                        </button>

                        {activeSection === 'medical' && (
                            <div className="p-4 border-t border-slate-100 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <MultiSelect
                                    label="Conditions"
                                    field="medicalConditions"
                                    options={['Diabetes', 'Hypertension', 'Thyroid', 'PCOS', 'Cholesterol', 'None']}
                                />
                                <InputField label="Other Conditions" field="otherMedicalCondition" placeholder="Specific details..." />

                                <MultiSelect
                                    label="Deficiencies"
                                    field="deficiencies"
                                    options={['Vitamin D', 'B12', 'Iron', 'Calcium', 'None']}
                                />

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Medications & Supplements</label>
                                    <div className="space-y-2 mb-3">
                                        {formData.medications.length === 0 && !isEditing && <p className="text-sm text-slate-500 italic">None</p>}
                                        {formData.medications.map((med, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                <div>
                                                    <span className="text-xs font-bold text-orange-500 mr-2">{med.type}</span>
                                                    <span className="font-medium text-slate-700">{med.name}</span>
                                                    <span className="text-xs text-slate-400 ml-2">({med.dosage} {med.unit}, {med.frequency}x/{med.freqUnit})</span>
                                                </div>
                                                {isEditing && <button onClick={() => removeMedication(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>}
                                            </div>
                                        ))}
                                    </div>
                                    {isEditing && (
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    className="p-2 rounded border border-slate-200 text-sm"
                                                    value={newMed.type}
                                                    onChange={e => setNewMed({ ...newMed, type: e.target.value })}
                                                >
                                                    <option>Medicine</option>
                                                    <option>Supplement</option>
                                                </select>
                                                <input
                                                    className="p-2 rounded border border-slate-200 text-sm"
                                                    placeholder="Name"
                                                    value={newMed.name}
                                                    onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                <input className="p-2 rounded border border-slate-200 text-sm" placeholder="Dose" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} />
                                                <select className="p-2 rounded border border-slate-200 text-sm" value={newMed.unit} onChange={e => setNewMed({ ...newMed, unit: e.target.value })}><option>Mg</option><option>Mcg</option><option>IU</option></select>
                                                <input className="p-2 rounded border border-slate-200 text-sm" placeholder="Freq" value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} />
                                                <select className="p-2 rounded border border-slate-200 text-sm" value={newMed.freqUnit} onChange={e => setNewMed({ ...newMed, freqUnit: e.target.value })}><option>Day</option><option>Week</option></select>
                                            </div>
                                            <button onClick={addMedication} className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded text-xs font-bold transition-colors">Add Medication</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Lifestyle Section */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection('lifestyle')}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <span className="font-bold text-slate-700">Lifestyle</span>
                            {activeSection === 'lifestyle' ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                        </button>

                        {activeSection === 'lifestyle' && (
                            <div className="p-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Stress Level" field="stressLevel" placeholder="Low, Medium, High" />
                                    <InputField label="Emotional Eating" field="emotionalEating" placeholder="Yes/No" />
                                </div>
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Smoking" field="smoking" placeholder="Never/Regular..." />
                                        {(formData.smoking !== 'Never' || isEditing) && <InputField label="Cigarettes/Day" field="cigarettesPerDay" />}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Alcohol" field="alcohol" placeholder="Never/Socially..." />
                                        {(formData.alcohol !== 'Never' || isEditing) && <InputField label="Frequency" field="alcoholFrequency" />}
                                    </div>
                                    {(formData.alcohol !== 'Never' || isEditing) && (
                                        <MultiSelect label="Alcohol Types" field="alcoholTypes" options={['Beer', 'Wine', 'Whisky', 'Vodka', 'Cocktail']} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dietary Section */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection('dietary')}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <span className="font-bold text-slate-700">Dietary History</span>
                            {activeSection === 'dietary' ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                        </button>

                        {activeSection === 'dietary' && (
                            <div className="p-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <MultiSelect label="Previous Diets" field="previousDiets" options={['Keto', 'Intermittent Fasting', 'Vegan', 'Low Carb', 'None']} />
                                <MultiSelect label="No Meat Days" field="noMeatDays" options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']} />
                                <MultiSelect label="Fasting Days" field="fastDays" options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']} />
                                <InputField label="Cheat Meals" field="cheatMeals" placeholder="Yes/No, Frequency..." />
                            </div>
                        )}
                    </div>

                    {/* Goals Section */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection('goals')}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <span className="font-bold text-slate-700">Health Goals</span>
                            {activeSection === 'goals' ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                        </button>

                        {activeSection === 'goals' && (
                            <div className="p-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <InputField label="Primary Goal" field="medicalGoal" placeholder="Weight Loss, Muscle Gain..." />
                                <MultiSelect label="Reasons for Weight Loss" field="loseWeightReasons" options={['Health', 'Appearance', 'Confidence', 'Event', 'Fitness']} />
                            </div>
                        )}
                    </div>


                </div>

                {/* Footer Actions */}
                {isEditing && (
                    <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-orange-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
