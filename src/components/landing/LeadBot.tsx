'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, ChevronRight, Phone } from 'lucide-react';

const QUESTIONS = [
    {
        id: 'goal',
        question: "What's your primary health goal?",
        options: ["Weight Loss", "PCOS / PCOS Management", "Muscle Gain", "Therapeutic Diet (Thyroid/Diabetes/BP)"]
    },
    {
        id: 'activity',
        question: "How active is your lifestyle?",
        options: ["Sedentary (6-8 hours sitting)", "Moderately Active (Light walk/Exercise)", "Very Active (Daily Heavy Workout)"]
    },
    {
        id: 'diet',
        question: "What's your dietary preference?",
        options: ["Vegetarian", "Non-Vegetarian", "Eggetarian / Jain"]
    }
];

export default function LeadBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleOptionSelect = (option: string) => {
        const currentQ = QUESTIONS[step];
        setAnswers(prev => ({ ...prev, [currentQ.id]: option }));

        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            setIsFinished(true);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [step, isFinished, isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-gray-100 text-gray-600' : 'bg-brand-forest text-white'
                    }`}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={32} />}
                {!isOpen && (
                    <span className="absolute -top-2 -right-2 bg-brand-sage text-brand-forest text-[10px] font-black px-2 py-1 rounded-full border-2 border-white animate-bounce">
                        START
                    </span>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-20 right-0 w-[320px] md:w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-brand-forest p-6 text-white text-center">
                            <h3 className="font-bold text-lg">Dt. Mansi&apos;s Assistant</h3>
                            <p className="text-xs text-brand-sage font-medium">Online to help you transform</p>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                            {/* Static Welcome */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center text-brand-forest flex-shrink-0">
                                    <User size={16} />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm leading-relaxed text-gray-700">
                                    Hello! I&apos;m here to help you get started. Answer 3 quick questions to find the best plan for you.
                                </div>
                            </div>

                            {/* Question Flow */}
                            {QUESTIONS.map((q, qIdx) => (
                                qIdx <= step && (
                                    <div key={q.id} className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center text-brand-forest flex-shrink-0">
                                                <User size={16} />
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm leading-relaxed text-gray-700 font-medium">
                                                {q.question}
                                            </div>
                                        </div>

                                        {answers[q.id] ? (
                                            <div className="flex justify-end">
                                                <div className="bg-brand-forest text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-sm font-bold">
                                                    {answers[q.id]}
                                                </div>
                                            </div>
                                        ) : (
                                            qIdx === step && (
                                                <div className="grid grid-cols-1 gap-2 pl-11">
                                                    {q.options.map((option) => (
                                                        <motion.button
                                                            key={option}
                                                            whileHover={{ scale: 1.02, x: 5 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleOptionSelect(option)}
                                                            className="text-left p-3 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:border-brand-forest hover:text-brand-forest transition-all shadow-sm flex justify-between items-center group"
                                                        >
                                                            <span>{option}</span>
                                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )
                            ))}

                            {/* Final Message */}
                            {isFinished && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center text-brand-forest flex-shrink-0">
                                            <User size={16} />
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm leading-relaxed text-gray-700">
                                            Excellent choice! For a <strong>{answers.goal}</strong> goal, Dt. Mansi has a specialized plan. Click below to start your transformation with a direct consultation.
                                        </div>
                                    </div>

                                    <div className="pl-11 space-y-3">
                                        <a
                                            href="https://wa.me/919824359944?text=Hi, I want to start my transformation journey!"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-4 rounded-xl bg-[#25D366] text-white font-black text-center text-sm shadow-xl shadow-green-200 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                                        >
                                            <Phone size={18} />
                                            WHATSAPP NOW
                                        </a>
                                        <a
                                            href="#download"
                                            onClick={() => setIsOpen(false)}
                                            className="w-full block py-4 rounded-xl bg-brand-forest text-white font-black text-center text-sm shadow-xl shadow-brand-forest/20 hover:scale-[1.02] transition-transform"
                                        >
                                            DOWNLOAD APP
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
