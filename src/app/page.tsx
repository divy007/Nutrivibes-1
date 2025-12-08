'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Users, Menu } from 'lucide-react';
import { ClientHeader } from '@/components/ClientHeader';
import { MealCard } from '@/components/MealCard';
import { AddFoodModal } from '@/components/AddFoodModal';
import { WeekPlan, ClientInfo, FoodItem, DayPlan, MealSlot } from '@/types';
import { exportToPDF, exportToExcel } from '@/utils/export';

import { MEAL_TIMES } from '@/data/meals';

// --- Constants ---
const DEFAULT_CLIENT: ClientInfo = {
  name: "",
  preferences: ""
};

// --- Helper to Generate a Blank Week Plan ---
const generateWeekPlan = (startDate: Date, client: ClientInfo): WeekPlan => {
  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const meals: MealSlot[] = MEAL_TIMES.map((time, idx) => ({
      time,
      mealNumber: idx + 1,
      foodItems: []
    }));
    days.push({ date, meals });
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    clientInfo: client,
    startDate,
    endDate: addDays(startDate, 6),
    days
  };
};

export default function DietPlannerPage() {
  // --- State ---
  // Initialize specific requested date: Dec 2, 2025 (Tuesday)
  // Adjusting to start of that week or strictly starting Dec 2? 
  // User asked for "7 days from Dec 2-8, 2025". Dec 2 2025 is a Tuesday.
  // Let's stick to the requested range exactly.
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date(2025, 11, 2)); // Month is 0-indexed: 11 = Dec

  const [clientInfo, setClientInfo] = useState<ClientInfo>(DEFAULT_CLIENT);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(() => generateWeekPlan(currentWeekStart, clientInfo));

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    dayIndex: number | null;
    mealIndex: number | null;
    existingItems: FoodItem[];
    mealTime: string;
  }>({
    isOpen: false,
    dayIndex: null,
    mealIndex: null,
    existingItems: [],
    mealTime: ''
  });

  // Sidebar toggle for mobile/responsive
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // --- Updates when week changes ---
  useEffect(() => {
    setWeekPlan(generateWeekPlan(currentWeekStart, clientInfo));
  }, [currentWeekStart, clientInfo]);

  useEffect(() => {
    setWeekPlan(prev => ({
      ...prev,
      clientInfo
    }));
  }, [clientInfo]);

  // --- Handlers ---

  const handleClientInfoChange = (info: ClientInfo) => {
    setClientInfo(info);
  };

  const handleWeekNavigation = (direction: 'PREV' | 'NEXT') => {
    setCurrentWeekStart(prev => direction === 'PREV' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  const handleAddFood = (dayIndex: number, mealIndex: number, time: string) => {
    setModalState({
      isOpen: true,
      dayIndex,
      mealIndex,
      existingItems: [],
      mealTime: time
    });
  };

  const handleEditFood = (dayIndex: number, mealIndex: number, existingItems: FoodItem[], time: string) => {
    setModalState({
      isOpen: true,
      dayIndex,
      mealIndex,
      existingItems,
      mealTime: time
    });
  };

  const handleCloseModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveFood = (selectedItems: FoodItem[]) => {
    const { dayIndex, mealIndex } = modalState;
    if (dayIndex === null || mealIndex === null) return;

    setWeekPlan(prevPlan => {
      const newDays = [...prevPlan.days];
      const newMeals = [...newDays[dayIndex].meals];
      newMeals[mealIndex] = {
        ...newMeals[mealIndex],
        foodItems: selectedItems
      };
      newDays[dayIndex] = { ...newDays[dayIndex], meals: newMeals };
      return { ...prevPlan, days: newDays };
    });

    handleCloseModal();
  };

  const handleExportPDF = async () => {
    await exportToPDF(weekPlan, clientInfo);
  };

  const handleExportExcel = () => {
    exportToExcel(weekPlan, clientInfo);
  };

  return (
    <div className="flex min-h-screen bg-[#fdfbf7] font-sans">

      {/* Sidebar (Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <span className="text-xl font-bold bg-gradient-to-r from-[#2d6a4f] to-[#d4a373] bg-clip-text text-transparent">
            NutriVibes
          </span>
        </div>

        <div className="p-4 space-y-1">
          <NavItem icon={<Calendar size={20} />} label="Diet Plans" active />
          <NavItem icon={<Users size={20} />} label="Clients" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="bg-gradient-to-r from-[#1b4332] to-[#9c6644] text-white shadow-md">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-1 hover:bg-white/10 rounded"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-lg font-semibold tracking-wide">Diet Planner</h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Right side actions removed as requested */}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto">

            {/* Client Info */}
            <ClientHeader
              clientInfo={clientInfo}
              onClientInfoChange={handleClientInfoChange}
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
            />
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <button
                onClick={() => handleWeekNavigation('PREV')}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-3">
                <Calendar className="text-[#9c6644] w-5 h-5" />
                <span className="font-semibold text-slate-700 text-lg">
                  {format(currentWeekStart, 'MMM d, yyyy')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
                </span>
              </div>

              <button
                onClick={() => handleWeekNavigation('NEXT')}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Weekly Planner Grid */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[1000px] flex flex-col gap-4">

                {/* 1. Day Headers Row */}
                <div className="grid grid-cols-7 gap-4">
                  {weekPlan.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm sticky top-0 z-10">
                      <div className="text-sm font-bold text-slate-800 uppercase">
                        {format(day.date, 'EEEE')}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {format(day.date, 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Meal Rows */}
                {weekPlan.days.length > 0 && MEAL_TIMES.map((time, mealIndex) => (
                  <div key={time} className="grid grid-cols-7 gap-4">
                    {weekPlan.days.map((day, dayIndex) => {
                      const meal = day.meals.find(m => m.time === time);
                      // Fallback if meal not found (shouldn't happen with correct initialization)
                      if (!meal) return <div key={`${dayIndex}-${time}`} />;

                      return (
                        <MealCard
                          key={`${dayIndex}-${mealIndex}`}
                          mealNumber={meal.mealNumber}
                          time={meal.time}
                          foodItems={meal.foodItems}
                          onAddFood={() => handleAddFood(dayIndex, mealIndex, meal.time)}
                          onEdit={() => handleEditFood(dayIndex, mealIndex, meal.foodItems, meal.time)}
                        />
                      );
                    })}
                  </div>
                ))}

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      <AddFoodModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onAdd={handleSaveFood}
        existingItems={modalState.existingItems}
        mealTime={modalState.mealTime}
        mealCategory="Mixed" // passing a generic category or derive from time if needed
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Simple Nav Item Component
function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${active
          ? 'bg-[#faedcd] text-[#8B4513]'
          : 'text-slate-600 hover:bg-[#e9edc9] hover:text-[#1b4332]'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
