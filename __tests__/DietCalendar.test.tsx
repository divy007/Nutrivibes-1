import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DietCalendar } from '@/components/dietician/plan/DietCalendar';

test('renders dynamic meal slots with correct labels and formatted times', () => {
  const mockWeekPlan = {
    startDate: new Date('2024-01-01'),
    days: [
      {
        date: new Date('2024-01-01'),
        meals: [
          { mealNumber: 1, time: '07:00', foodItems: [{ name: 'Apple', portion: '1 serving', quantity: '2' }] },
          { mealNumber: 3, time: '11:30', foodItems: [] },
          { mealNumber: 4, time: '13:30', foodItems: [] },
        ],
        status: 'PUBLISHED',
      },
    ],
  };

  const onMealEdit = jest.fn();
  const onMealAdd = jest.fn();
  const onWeekChange = jest.fn();

  render(
    <DietCalendar weekPlan={mockWeekPlan} onMealEdit={onMealEdit} onMealAdd={onMealAdd} onWeekChange={onWeekChange} />
  );

  // Expect slots for meals 1-6 (max of existing meals and default 6)
  for (let i = 1; i <= 6; i++) {
    const slotLabel = screen.getByText(new RegExp(`^#${i}`));
    expect(slotLabel).toBeInTheDocument();
  }

  // Verify formatted time for slot 1 (07:00 => 07:00 AM)
  expect(screen.getByText('07:00 AM')).toBeInTheDocument();
  // Verify meal name mapping for slot 1 (Early Morning)
  expect(screen.getByText(/Early Morning/)).toBeInTheDocument();

  // Check that edit button appears for slot 1 (has food)
  const editBtn = screen.getAllByTitle('Edit Meal')[0];
  fireEvent.click(editBtn);
  expect(onMealEdit).toHaveBeenCalledWith(expect.any(Date), '07:00', expect.any(Array));

  // Check that add button appears for slot 2 (no food)
  const addBtn = screen.getAllByTitle('Add Food')[0];
  fireEvent.click(addBtn);
  expect(onMealAdd).toHaveBeenCalledWith(expect.any(Date), '02:00');
});
