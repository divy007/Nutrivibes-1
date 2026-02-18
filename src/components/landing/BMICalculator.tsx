'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight } from 'lucide-react';

export default function BMICalculator() {
    const [height, setHeight] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [bmi, setBmi] = useState<number | null>(null);

    const calculateBMI = () => {
        if (height && weight) {
            const heightInMeters = Number(height) / 100;
            const bmiValue = Number(weight) / (heightInMeters * heightInMeters);
            setBmi(Number(bmiValue.toFixed(1)));
        }
    };

    const getBMIStatus = (value: number) => {
        if (value < 18.5) return { label: 'Underweight', color: 'text-blue-500', bg: 'bg-blue-500', width: '20%' };
        if (value < 25) return { label: 'Normal Weight', color: 'text-green-500', bg: 'bg-green-500', width: '50%' };
        if (value < 30) return { label: 'Overweight', color: 'text-orange-500', bg: 'bg-orange-500', width: '80%' };
        return { label: 'Obese', color: 'text-red-500', bg: 'bg-red-500', width: '100%' };
    };

    const status = bmi ? getBMIStatus(bmi) : null;

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                    <div className="mb-12 lg:mb-0">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-sage/10 text-brand-forest text-sm font-bold mb-6">
                            <Calculator className="w-4 h-4" />
                            <span>Check Your Health</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                            Know where you stand. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-forest to-brand-sage">Start your journey.</span>
                        </h2>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Calculate your Body Mass Index (BMI) to get a quick snapshot of your health status. It&apos;s the first step towards a healthier you.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-[2.5rem] p-8 lg:p-12 shadow-xl shadow-brand-forest/5 border border-gray-100">
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Height (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(Number(e.target.value))}
                                    placeholder="e.g. 175"
                                    className="w-full px-6 py-4 rounded-xl bg-white border border-gray-200 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-all font-bold text-lg text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(Number(e.target.value))}
                                    placeholder="e.g. 70"
                                    className="w-full px-6 py-4 rounded-xl bg-white border border-gray-200 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 outline-none transition-all font-bold text-lg text-gray-900"
                                />
                            </div>
                        </div>

                        <button
                            onClick={calculateBMI}
                            disabled={!height || !weight}
                            className="w-full py-4 rounded-xl bg-brand-forest text-white font-bold text-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8 shadow-lg shadow-brand-forest/20"
                        >
                            Calculate BMI
                        </button>

                        {bmi && status && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                            >
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-gray-500 font-medium">Your BMI</span>
                                    <span className="text-4xl font-black text-gray-900">{bmi}</span>
                                </div>
                                <div className={`text-lg font-bold ${status.color} mb-4`}>{status.label}</div>

                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6 relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: status.width }}
                                        className={`h-full ${status.bg} rounded-full absolute left-0 top-0 transition-all duration-1000`}
                                    />
                                    {/* Markers for underweight, normal, overweight */}
                                    <div className="absolute top-0 bottom-0 left-[18.5%] w-0.5 bg-white/50 z-10" />
                                    <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-white/50 z-10" />
                                    <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-white/50 z-10" />
                                </div>

                                <a
                                    href="#download"
                                    className="flex items-center justify-between group text-brand-forest font-bold hover:text-brand-dark transition-colors"
                                >
                                    <span>Get a plan for your goal</span>
                                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                                </a>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
