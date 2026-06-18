import { calculateCycleStatus } from '../lib/cycle-utils';

describe('calculateCycleStatus', () => {
    test('should calculate period phase for day 1-5', () => {
        const lastPeriodStart = new Date('2026-06-10T12:00:00Z');
        const referenceDate = new Date('2026-06-12T12:00:00Z'); // Day 3

        const status = calculateCycleStatus(lastPeriodStart, 28, referenceDate);

        expect(status.dayOfCycle).toBe(3);
        expect(status.phase).toBe('PERIOD');
        expect(status.daysUntilNextPeriod).toBe(26);
    });

    test('should calculate follicular phase for day 6-13', () => {
        const lastPeriodStart = new Date('2026-06-10T12:00:00Z');
        const referenceDate = new Date('2026-06-18T12:00:00Z'); // Day 9

        const status = calculateCycleStatus(lastPeriodStart, 28, referenceDate);

        expect(status.dayOfCycle).toBe(9);
        expect(status.phase).toBe('FOLLICULAR');
    });

    test('should calculate ovulation phase for day 14', () => {
        const lastPeriodStart = new Date('2026-06-10T12:00:00Z');
        const referenceDate = new Date('2026-06-23T12:00:00Z'); // Day 14

        const status = calculateCycleStatus(lastPeriodStart, 28, referenceDate);

        expect(status.dayOfCycle).toBe(14);
        expect(status.phase).toBe('OVULATION');
    });

    test('should calculate luteal phase for day 15-28', () => {
        const lastPeriodStart = new Date('2026-06-10T12:00:00Z');
        const referenceDate = new Date('2026-07-02T12:00:00Z'); // Day 23

        const status = calculateCycleStatus(lastPeriodStart, 28, referenceDate);

        expect(status.dayOfCycle).toBe(23);
        expect(status.phase).toBe('LUTEAL');
        expect(status.daysUntilNextPeriod).toBe(6);
    });

    test('should handle custom cycle length correctly', () => {
        const lastPeriodStart = new Date('2026-06-10T00:00:00Z');
        const referenceDate = new Date('2026-06-30T00:00:00Z'); // Day 21 of a 30-day cycle

        const status = calculateCycleStatus(lastPeriodStart, 30, referenceDate);

        expect(status.dayOfCycle).toBe(21);
        expect(status.daysUntilNextPeriod).toBe(10);
    });

    test('should calculate period phase based on custom averagePeriodDuration', () => {
        const lastPeriodStart = new Date('2026-06-10T12:00:00Z');
        const referenceDate = new Date('2026-06-16T12:00:00Z'); // Day 7

        // Custom averagePeriodDuration is 7, so day 7 is still PERIOD
        const statusWith7 = calculateCycleStatus(lastPeriodStart, 28, referenceDate, 7);
        expect(statusWith7.phase).toBe('PERIOD');

        // Custom averagePeriodDuration is 4, so day 7 is FOLLICULAR
        const statusWith4 = calculateCycleStatus(lastPeriodStart, 28, referenceDate, 4);
        expect(statusWith4.phase).toBe('FOLLICULAR');
    });

    test('should transition to follicular phase immediately after logged endDate', () => {
        const lastPeriodStart = new Date('2026-06-10T12:00:00Z');
        const referenceDate = new Date('2026-06-13T12:00:00Z'); // Day 4 (usually PERIOD with default duration of 5)
        const lastPeriodEnd = new Date('2026-06-12T12:00:00Z'); // Ended on day 3

        const status = calculateCycleStatus(lastPeriodStart, 28, referenceDate, 5, lastPeriodEnd);

        expect(status.dayOfCycle).toBe(4);
        expect(status.phase).toBe('FOLLICULAR');
    });
});
