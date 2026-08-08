import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DietCalendar } from '@/components/dietician/plan/DietCalendar';

describe('DietCalendar Component with Customer View Preview', () => {
  const mockWeekPlan = {
    startDate: new Date('2024-01-01'),
    days: [
      {
        date: new Date('2024-01-01'),
        meals: [
          { mealNumber: 1, time: '07:00', foodItems: [{ name: 'Oatmeal', portion: '1 bowl', quantity: '1' }] },
          { mealNumber: 2, time: '09:00', foodItems: [{ name: 'Eggs', portion: '2 pcs', quantity: '2' }] },
        ],
        status: 'PUBLISHED',
      },
      {
        date: new Date('2024-01-02'),
        meals: [
          { mealNumber: 1, time: '07:00', foodItems: [{ name: 'Toast', portion: '2 slices', quantity: '2' }] },
        ],
        status: 'NOT_SAVED', // Unpublished day
      },
    ],
  };

  const onMealEdit = jest.fn();
  const onMealAdd = jest.fn();
  const onWeekChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Editor Mode by default and allows switching to Customer View', () => {
    render(
      <DietCalendar
        weekPlan={mockWeekPlan}
        onMealEdit={onMealEdit}
        onMealAdd={onMealAdd}
        onWeekChange={onWeekChange}
      />
    );

    // Default: Editor Mode active
    expect(screen.getByText('Editor Mode')).toBeInTheDocument();
    expect(screen.getByText('Customer View')).toBeInTheDocument();

    // Click "Customer View"
    const customerViewBtn = screen.getByText('Customer View');
    fireEvent.click(customerViewBtn);

    // Verify Customer View notice banner is rendered
    expect(screen.getByText(/Read-Only Customer View/i)).toBeInTheDocument();

    // Click "Editor Mode" to switch back
    const editorModeBtn = screen.getByText('Editor Mode');
    fireEvent.click(editorModeBtn);

    // Verify returning to Editor Mode grid
    expect(screen.getByText('Diet Plan')).toBeInTheDocument();
  });
});
