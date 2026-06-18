import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CounsellingDrawer } from '@/components/dietician/client/CounsellingDrawer';

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
    X: () => <svg data-testid="x-icon" />,
    Pencil: () => <svg data-testid="pencil-icon" />,
    Ban: () => <svg data-testid="ban-icon" />,
    Save: () => <svg data-testid="save-icon" />,
    ChevronDown: () => <svg data-testid="chevron-down" />,
    ChevronRight: () => <svg data-testid="chevron-right" />,
    Plus: () => <svg data-testid="plus-icon" />,
    Trash2: () => <svg data-testid="trash-icon" />,
    Loader2: () => <svg data-testid="loader-icon" />
}));

// Mock API Client
jest.mock('@/lib/api-client', () => ({
    api: {
        patch: jest.fn().mockResolvedValue({ success: true })
    }
}));

describe('CounsellingDrawer Component', () => {
    const mockClientData = {
        name: 'Jane Doe',
        createdAt: '2026-06-15T00:00:00.000Z',
        dietStartDate: '2026-06-18T00:00:00.000Z',
        age: 25,
        gender: 'female',
        height: 165,
        heightUnit: 'Cm',
        weight: 60,
        weightUnit: 'Kg',
        counsellingProfile: {
            medications: []
        }
    };

    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        clientId: '69ae3fca09498bdf8fdf9d45',
        clientData: mockClientData,
        onUpdate: jest.fn()
    };

    it('should not render anything when isOpen is false', () => {
        const { container } = render(<CounsellingDrawer {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render client name and details when isOpen is true', () => {
        render(<CounsellingDrawer {...defaultProps} />);
        
        // Assert client name is rendered in header
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        
        // Assert section toggle button exists
        expect(screen.getByText('Demographics & Basic Info')).toBeInTheDocument();
    });

    it('should display correct min and max constraints on the Diet Start date picker when editing', () => {
        const { container } = render(<CounsellingDrawer {...defaultProps} />);

        // 1. Click "Edit" to switch to editing mode
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        // 2. Locate the Diet Start date picker (input type="date")
        const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
        expect(dateInput).toBeInTheDocument();

        // 3. Verify min and max boundaries
        // min should be 365 days ago from today
        const expectedMinDateStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        expect(dateInput.min).toBe(expectedMinDateStr);

        // max should be 60 days in the future from today
        const expectedMaxDateStr = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        expect(dateInput.max).toBe(expectedMaxDateStr);
    });
});
