// test/fixtures/seedPlan.ts
export const seedPlan = {
  week: 1,
  days: [
    {
      day: 'Monday',
      meals: [
        { name: 'Breakfast', time: '08:00', foods: [{ name: 'Oatmeal', calories: 150 }] },
        { name: 'Lunch', time: '13:00', foods: [{ name: 'Grilled Chicken Salad', calories: 350 }] },
        { name: 'Dinner', time: '19:00', foods: [{ name: 'Salmon with Veggies', calories: 400 }] },
      ],
    },
    {
      day: 'Tuesday',
      meals: [
        { name: 'Breakfast', time: '08:00', foods: [{ name: 'Greek Yogurt', calories: 120 }] },
        { name: 'Lunch', time: '13:00', foods: [{ name: 'Quinoa Bowl', calories: 320 }] },
        { name: 'Dinner', time: '19:00', foods: [{ name: 'Stir‑fried Tofu', calories: 380 }] },
      ],
    },
    // You can repeat or add more days as needed for deterministic testing
  ],
};
