import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CounsellingFlow } from '@/components/dietician/clients/CounsellingFlow';

// Mock framer-motion to avoid animation-related failures in JSDOM
jest.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef(({ children, className, onClick, ...props }: any, ref: any) => (
            <div ref={ref} className={className} onClick={onClick} {...props}>{children}</div>
        )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
    ChevronLeft: () => <svg data-testid="chevron-left" />,
    ChevronRight: () => <svg data-testid="chevron-right" />,
    ArrowRight: () => <svg data-testid="arrow-right" />,
    Search: () => <svg data-testid="search" />,
    Check: () => <svg data-testid="check" />,
    Square: () => <svg data-testid="square" />,
    CreditCard: () => <svg data-testid="credit-card" />
}));

// Mock API Client
jest.mock('@/lib/api-client', () => ({
    api: {
        get: jest.fn().mockResolvedValue([]),
        post: jest.fn().mockResolvedValue({ success: true })
    }
}));

describe('CounsellingFlow Component', () => {
    const defaultProps = {
        onClose: jest.fn(),
        onFinish: jest.fn(),
        initialData: {
            dietStartDate: '2026-06-18'
        }
    };

    it('should display correct min and max constraints on the Diet Start date picker (step 31)', async () => {
        const { container } = render(<CounsellingFlow {...defaultProps} />);

        // Click Next button repeatedly until we see the step 31 heading.
        // We wrap each click in its own act() to force React to flush state updates and re-render.
        let safetyCounter = 0;
        while (!screen.queryByText('When should the diet plan start?') && safetyCounter < 45) {
            const nextButton = screen.getByRole('button', { name: /Next/i });
            await act(async () => {
                fireEvent.click(nextButton);
            });
            safetyCounter++;
        }

        expect(screen.getByText('When should the diet plan start?')).toBeInTheDocument();

        // Locate the Diet Start date picker (input type="date")
        const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
        expect(dateInput).toBeInTheDocument();

        // Verify min and max boundaries
        // min should be 365 days ago from today
        const expectedMinDateStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        expect(dateInput.min).toBe(expectedMinDateStr);

        // max should be 60 days in the future from today
        const expectedMaxDateStr = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        expect(dateInput.max).toBe(expectedMaxDateStr);
    });
});
