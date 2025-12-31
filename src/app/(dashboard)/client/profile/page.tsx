'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuthToken, setAuthToken } from '@/lib/api-client';
import { Loader2, Save } from 'lucide-react';
import { INDIAN_STATES, getCitiesByState } from '@/lib/indian-locations';

interface ClientProfile {
    name: string;
    email: string;
    phone?: string;
    city?: string;
    state?: string;
    dob?: string;
    gender?: string;
    height?: number; // cm
    weight?: number; // kg
    isProfileComplete: boolean;
}

export default function ClientProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ClientProfile | null>(null);

    // Unit toggle states
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('ft');
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');

    // Display values (for unit conversion inputs)
    const [heightFt, setHeightFt] = useState('');
    const [heightIn, setHeightIn] = useState('');
    const [weightLbs, setWeightLbs] = useState('');
    const [displayHeightCm, setDisplayHeightCm] = useState('');
    const [displayWeightKg, setDisplayWeightKg] = useState('');


    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get<ClientProfile>('/api/clients/me');
                setProfile(data);

                // Initialize display values if data exists
                if (data.height) {
                    setDisplayHeightCm(data.height.toString());
                    const totalInches = data.height / 2.54;
                    setHeightFt(Math.floor(totalInches / 12).toString());
                    setHeightIn(Math.round(totalInches % 12).toString());
                }
                if (data.weight) {
                    setDisplayWeightKg(data.weight.toString());
                    setWeightLbs(Math.round(data.weight * 2.20462).toString());
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // Clear city when state changes
    useEffect(() => {
        if (profile && profile.state) {
            const cities = getCitiesByState(profile.state);
            // If current city is not in the new state's cities, clear it
            if (profile.city && !cities.includes(profile.city)) {
                setProfile({ ...profile, city: '' });
            }
        }
    }, [profile?.state]);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            // Calculate final metric values based on current unit selection/input
            let finalHeight = profile.height;
            let finalWeight = profile.weight;

            if (heightUnit === 'ft') {
                const ft = parseFloat(heightFt) || 0;
                const inches = parseFloat(heightIn) || 0;
                finalHeight = (ft * 12 + inches) * 2.54;
            } else {
                finalHeight = parseFloat(displayHeightCm) || 0;
            }

            if (weightUnit === 'lbs') {
                const lbs = parseFloat(weightLbs) || 0;
                finalWeight = lbs / 2.20462;
            } else {
                finalWeight = parseFloat(displayWeightKg) || 0;
            }

            // Update profile with metric values
            const updatePayload = {
                ...profile,
                height: finalHeight,
                weight: finalWeight,
            };

            console.log('Sending update payload:', updatePayload);
            const token = getAuthToken();
            console.log('Client Profile Page - Auth Token:', token);

            const response = await fetch('/api/clients/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Update failed:', errorData);
                throw new Error(errorData.details || errorData.error || 'Failed to update profile');
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);

            // Check for new token in response header
            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                setAuthToken(newToken);
            }

            if (updatedProfile.isProfileComplete) {
                // Redirect to dashboard
                router.push('/client/dashboard');
            } else {
                alert('Profile saved partially. Please complete all fields to proceed.');
            }

        } catch (error) {
            console.error('Failed to save profile:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save profile.';
            alert(`Failed to save profile: ${errorMessage}`);
        } finally {
            setSaving(false);
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

    if (!profile) return <div className="p-8 text-center">Failed to load profile.</div>;

    return (
        <div className="max-w-3xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-brand-forest tracking-tight">Complete Your Profile</h1>
                <p className="text-slate-500 font-medium italic mt-2">Please verify your details to continue.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                {/* Read-only Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                        <div className="text-gray-900 font-medium">{profile.name}</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                        <div className="text-gray-900 font-medium">{profile.email}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Mobile Number</label>
                        <div className="text-gray-900 font-medium">{profile.phone || 'N/A'}</div>
                    </div>
                </div>

                {/* Editable Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                        <select
                            value={profile.state || ''}
                            onChange={(e) => setProfile({ ...profile, state: e.target.value, city: '' })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white"
                        >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            City <span className="text-red-500">*</span>
                            {!profile.state && <span className="text-xs text-gray-500 ml-1">(Select state first)</span>}
                        </label>
                        <select
                            value={profile.city || ''}
                            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                            disabled={!profile.state}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select City</option>
                            {profile.state && getCitiesByState(profile.state).map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            value={profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''}
                            onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                            value={profile.gender || ''}
                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white"
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Height with Unit Toggle */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Height</label>
                            <div className="flex bg-gray-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setHeightUnit('ft')}
                                    className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${heightUnit === 'ft' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    ft/in
                                </button>
                                <button
                                    onClick={() => setHeightUnit('cm')}
                                    className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${heightUnit === 'cm' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    cm
                                </button>
                            </div>
                        </div>
                        {heightUnit === 'ft' ? (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={heightFt}
                                    onChange={(e) => setHeightFt(e.target.value)}
                                    placeholder="Ft"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white"
                                />
                                <input
                                    type="number"
                                    value={heightIn}
                                    onChange={(e) => setHeightIn(e.target.value)}
                                    placeholder="In"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white"
                                />
                            </div>
                        ) : (
                            <input
                                type="number"
                                value={displayHeightCm}
                                onChange={(e) => setDisplayHeightCm(e.target.value)}
                                placeholder="Height in cm"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white"
                            />
                        )}
                    </div>

                    {/* Weight with Unit Toggle */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Weight</label>
                            <div className="flex bg-gray-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setWeightUnit('lbs')}
                                    className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${weightUnit === 'lbs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    lbs
                                </button>
                                <button
                                    onClick={() => setWeightUnit('kg')}
                                    className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${weightUnit === 'kg' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    kg
                                </button>
                            </div>
                        </div>
                        {weightUnit === 'lbs' ? (
                            <input
                                type="number"
                                value={weightLbs}
                                onChange={(e) => setWeightLbs(e.target.value)}
                                placeholder="Weight in lbs"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white"
                            />
                        ) : (
                            <input
                                type="number"
                                value={displayWeightKg}
                                onChange={(e) => setDisplayWeightKg(e.target.value)}
                                placeholder="Weight in kg"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332] outline-none text-gray-900 bg-white"
                            />
                        )}
                    </div>

                    {/* Calculated BMI Display */}
                    <div className="md:col-span-2 p-6 bg-brand-cream rounded-[24px] border border-brand-clay/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-earth font-black shadow-sm">
                                BMI
                            </div>
                            <div>
                                <div className="text-sm font-black text-brand-forest">Calculated Body Mass Index</div>
                                <div className="text-xs text-brand-sage font-bold">Based on your current height and weight</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-brand-earth">
                                {(() => {
                                    let h = 0;
                                    let w = 0;

                                    if (heightUnit === 'ft') {
                                        const ft = parseFloat(heightFt) || 0;
                                        const inches = parseFloat(heightIn) || 0;
                                        h = (ft * 12 + inches) * 2.54;
                                    } else {
                                        h = parseFloat(displayHeightCm) || 0;
                                    }

                                    if (weightUnit === 'lbs') {
                                        const lbs = parseFloat(weightLbs) || 0;
                                        w = lbs / 2.20462;
                                    } else {
                                        w = parseFloat(displayWeightKg) || 0;
                                    }

                                    if (h > 0 && w > 0) {
                                        const hm = h / 100;
                                        return (w / (hm * hm)).toFixed(1);
                                    }
                                    return 'N/A';
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-brand-sage hover:bg-brand-forest text-white px-10 py-3 rounded-xl font-black flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-sage/20 active:scale-95"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
