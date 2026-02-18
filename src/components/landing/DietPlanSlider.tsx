'use client';

import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DIET_PLANS, DietPlan } from '@/data/dietPlans';
import { motion } from 'framer-motion';

export default function DietPlanSlider() {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        loop: false,
        skipSnaps: false,
        dragFree: true
    });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <section className="py-24 bg-gray-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-sage/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-brand-forest/5 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-sm font-bold text-brand-forest uppercase tracking-[0.2em] mb-3">Our Specialized Plans</h2>
                        <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                            Tailored nutrition for <br />
                            <span className="relative inline-block">every goal.
                                <span className="absolute bottom-2 left-0 w-full h-3 bg-brand-sage/30 -z-10 rounded-sm"></span>
                            </span>
                        </h3>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3">
                        <button
                            onClick={scrollPrev}
                            className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-brand-forest hover:text-white hover:border-brand-forest transition-all shadow-sm hover:shadow-md active:scale-95"
                            aria-label="Previous slide"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-brand-forest hover:text-white hover:border-brand-forest transition-all shadow-sm hover:shadow-md active:scale-95"
                            aria-label="Next slide"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Slider */}
                <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
                    <div className="flex gap-6 py-4 pl-1">
                        {DIET_PLANS.map((plan, index) => (
                            <div className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0" key={plan.id}>
                                <motion.div
                                    whileHover={{ y: -8 }}
                                    className="h-full bg-white rounded-[2rem] p-8 shadow-xl shadow-brand-forest/5 border border-gray-100 flex flex-col justify-between group hover:shadow-2xl hover:shadow-brand-forest/10 transition-all duration-300"
                                >
                                    <div>
                                        <div className={`w-14 h-14 ${plan.color} rounded-2xl flex items-center justify-center mb-6 text-white font-bold text-xl shadow-lg opacity-90 group-hover:scale-110 transition-transform duration-300`}>
                                            {plan.title.charAt(0)}
                                        </div>
                                        <h4 className="text-2xl font-bold text-gray-900 mb-3">{plan.title}</h4>
                                        <p className="text-gray-500 leading-relaxed font-medium mb-6">
                                            {plan.description}
                                        </p>
                                        <ul className="space-y-3 mb-8">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                                    <CheckCircle2 className="w-4 h-4 text-brand-forest flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <a
                                        href="#download"
                                        className="w-full py-3 rounded-xl bg-gray-50 text-gray-900 font-bold text-center group-hover:bg-brand-forest group-hover:text-white transition-colors duration-300"
                                    >
                                        Get Started
                                    </a>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
