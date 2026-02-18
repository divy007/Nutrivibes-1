'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQS = [
    {
        question: "Is the diet vegetative or non-vegetative?",
        answer: "Our diet plans are 100% personalized. Whether you are vegetarian, non-vegetarian, vegan, or eggetarian, we craft the plan specifically around your preferences and lifestyle."
    },
    {
        question: "Will I have to cook separate meals for myself?",
        answer: "Not necessarily! We focus on 'Ghar Ka Khana' (home-cooked food). We integrate your family's regular meals into your diet plan with portion control and minor tweaks, so you don't feel isolated."
    },
    {
        question: "How do I communicate with the dietician?",
        answer: "You get direct access! Through our DateWithDiet app (and WhatsApp), you can chat with Dt. Mansi Anajwala for queries, feedback, and motivation throughout your journey."
    },
    {
        question: "Are there any cheat days allowed?",
        answer: "We believe in sustainable lifestyle changes, not starvation. We include flexible meal options and guide you on how to enjoy your favorite foods in moderation without derailing your progress."
    },
    {
        question: "Do I need to go to a gym?",
        answer: "Exercise is recommended but not mandatory for weight loss. Your diet plays the biggest role (80%). If you can't hit the gym, we provide home workout suggestions or simple walking goals."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 bg-gray-50 relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-bold mb-6 shadow-sm">
                        <HelpCircle className="w-4 h-4" />
                        <span>Common Questions</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
                        Got questions? <br />
                        We&apos;ve got <span className="text-brand-forest">answers.</span>
                    </h2>
                </div>

                <div className="space-y-4">
                    {FAQS.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 md:p-8 text-left"
                            >
                                <span className={`text-lg md:text-xl font-bold ${openIndex === index ? 'text-brand-forest' : 'text-gray-900'} transition-colors`}>
                                    {faq.question}
                                </span>
                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openIndex === index ? 'bg-brand-forest text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {openIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </span>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="px-6 md:px-8 pb-8 text-gray-600 leading-relaxed text-lg">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
