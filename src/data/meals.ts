export const MEAL_SLOTS = [
    { time: '06:30', label: 'Early Morning' },
    { time: '09:30', label: 'Breakfast' },
    { time: '11:30', label: 'Lunch' },
    { time: '15:30', label: 'Afternoon' },
    { time: '17:00', label: 'Evening Snack' },
    { time: '19:30', label: 'Dinner' },
    { time: '22:30', label: 'Bedtime' }
];

export const MEAL_TIMES = MEAL_SLOTS.map(slot => slot.time);

export const MEAL_LABELS: Record<string, string> = MEAL_SLOTS.reduce((acc, slot) => {
    acc[slot.time] = slot.label;
    return acc;
}, {} as Record<string, string>);
