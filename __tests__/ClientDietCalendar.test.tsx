import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientDietCalendar } from '@/components/client/ClientDietCalendar';

test('client calendar renders dynamic meals with correct names and times', () => {
  const mockWeekPlan = {
    weekStartDate: new Date('2024-01-01'),
    days: [
      {
        date: new Date('2024-01-01'),
        meals: [
          { mealNumber: 1, time: '07:00', foodItems: [{ name: 'Egg', portion: '2 pcs' }] },
          { mealNumber: 4, time: '13:30', foodItems: [] },
        ],
        status: 'PUBLISHED',
      },
    ],
  };

  const onWeekChange = jest.fn();

  render(<ClientDietCalendar weekPlan={mockWeekPlan} onWeekChange={onWeekChange} loading={false} />);

  // Should render slots for at least 6 meals
  for (let i = 1; i <= 6; i++) {
    expect(screen.getByText(new RegExp(`^#${i}`))).toBeInTheDocument();
  }

  // Check formatted time for slot 1
  expect(screen.getByText('07:00 AM')).toBeInTheDocument();
  // Check meal name mapping
  expect(screen.getByText(/Early Morning/)).toBeInTheDocument();
  // Ensure food item appears for slot 1
  expect(screen.getByText('Egg')).toBeInTheDocument();
});
