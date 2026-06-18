import { normalizeDateUTC, getLocalDateString, reanchorDietPlan } from '@/lib/date-utils';

describe('date-utils', () => {
    describe('normalizeDateUTC', () => {
        it('should normalize a date string to 00:00:00.000Z in UTC', () => {
            const dateStr = '2026-06-18T10:15:30Z';
            const normalized = normalizeDateUTC(dateStr);
            expect(normalized.toISOString()).toBe('2026-06-18T00:00:00.000Z');
        });

        it('should normalize a Date object to 00:00:00.000Z in UTC', () => {
            const dateObj = new Date('2026-06-18T15:20:00Z');
            const normalized = normalizeDateUTC(dateObj);
            expect(normalized.toISOString()).toBe('2026-06-18T00:00:00.000Z');
        });

        it('should fallback to today if no date is provided', () => {
            const normalized = normalizeDateUTC();
            expect(normalized).toBeInstanceOf(Date);
            expect(normalized.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
        });
    });

    describe('getLocalDateString', () => {
        it('should return a YYYY-MM-DD string', () => {
            const date = new Date('2026-06-18T12:00:00Z');
            const dateStr = getLocalDateString(date);
            expect(dateStr).toBe('2026-06-18');
        });
    });

    describe('reanchorDietPlan', () => {
        const dummyDietPlan = {
            weekStartDate: new Date('2026-06-15T00:00:00.000Z'),
            days: [
                {
                    date: new Date('2026-06-15T00:00:00.000Z'),
                    status: 'PUBLISHED',
                    meals: [{ mealNumber: 1, time: '08:00', foodItems: [{ name: 'Apple' }] }]
                },
                {
                    date: new Date('2026-06-16T00:00:00.000Z'),
                    status: 'PUBLISHED',
                    meals: [{ mealNumber: 2, time: '13:00', foodItems: [{ name: 'Salad' }] }]
                },
                {
                    date: new Date('2026-06-17T00:00:00.000Z'),
                    status: 'NO_DIET',
                    meals: []
                },
                {
                    date: new Date('2026-06-18T00:00:00.000Z'),
                    status: 'NO_DIET',
                    meals: []
                },
                {
                    date: new Date('2026-06-19T00:00:00.000Z'),
                    status: 'NO_DIET',
                    meals: []
                },
                {
                    date: new Date('2026-06-20T00:00:00.000Z'),
                    status: 'NO_DIET',
                    meals: []
                },
                {
                    date: new Date('2026-06-21T00:00:00.000Z'),
                    status: 'NO_DIET',
                    meals: []
                }
            ]
        };

        it('should return the original plan unchanged if the week start date matches the target date', () => {
            const targetDate = new Date('2026-06-15T00:00:00.000Z');
            const result = reanchorDietPlan(dummyDietPlan, targetDate);
            expect(result).toEqual(dummyDietPlan);
        });

        it('should correctly shift and map existing days to their new week dates when start shifts', () => {
            const targetDate = new Date('2026-06-16T00:00:00.000Z'); // Shifted forward by 1 day
            const result = reanchorDietPlan(dummyDietPlan, targetDate);

            expect(result.weekStartDate).toEqual(targetDate);
            expect(result.days.length).toBe(7);

            // Day 0 of new week (2026-06-16) should get Day 1 of old week's meals
            expect(result.days[0].date.toISOString().split('T')[0]).toBe('2026-06-16');
            expect(result.days[0].status).toBe('PUBLISHED');
            expect(result.days[0].meals[0].foodItems[0].name).toBe('Salad');

            // Day 6 of new week (2026-06-22) was not in old week, should be initialized to blank
            expect(result.days[6].date.toISOString().split('T')[0]).toBe('2026-06-22');
            expect(result.days[6].status).toBe('NO_DIET');
            expect(result.days[6].meals.length).toBe(0);
        });
    });
});
