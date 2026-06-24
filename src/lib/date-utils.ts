import { startOfDay } from 'date-fns';

// Constants
const APP_TIMEZONE = 'UTC';

/**
 * Normalizes a date or date string to a UTC Date object at 00:00:0.000Z
 * corresponding to the start of the day in the application's timezone (IST).
 * 
 * Example: '2026-01-04T18:30:00Z' (Jan 5 IST) -> '2026-01-05T00:00:00Z'
 */
export function normalizeDateUTC(dateInput?: string | Date): Date {
    if (!dateInput) return normalizeDateUTC(new Date());

    const date = new Date(dateInput);

    // Get the YYYY-MM-DD string in the application's timezone
    // 'en-CA' gives YYYY-MM-DD format
    const dateString = date.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    // Create a new UTC date from this string, effectively "flooring" to the day boundary
    const normalized = new Date(dateString + 'T00:00:00.000Z');

    // Safety check - should not happen with valid inputs
    if (isNaN(normalized.getTime())) {
        // Fallback just in case, though highly unlikely with en-CA + known timezone
        return new Date(dateString);
    }

    return normalized;
}

/**
 * Returns the current date as a YYYY-MM-DD string in the application's timezone.
 */
export function getLocalDateString(date: Date = new Date()): string {
    return date.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Re-anchors a diet plan's days array to start on the target date.
 * If a day in the new range exists in the original plan, its meals and status are copied.
 * Otherwise, the day is initialized as a blank day.
 */
export function reanchorDietPlan(dietPlan: any, targetDate: Date): any {
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const planDateStr = new Date(dietPlan.weekStartDate).toISOString().split('T')[0];

    const daysArray = Array.isArray(dietPlan.days) ? dietPlan.days : [];
    const firstDay = daysArray[0];
    const firstDayDateStr = firstDay && firstDay.date ? new Date(firstDay.date).toISOString().split('T')[0] : null;

    if (planDateStr === targetDateStr) {
        // If the plan is for the requested week start, but the days array is misaligned (e.g. due to legacy timezone bugs),
        // we heal the day dates in place to align with the expected indices.
        if (firstDayDateStr !== targetDateStr && daysArray.length === 7) {
            const plainPlan = typeof dietPlan.toObject === 'function' ? dietPlan.toObject() : dietPlan;
            const healedDays = plainPlan.days.map((day: any, i: number) => {
                const expectedDate = new Date(targetDate);
                expectedDate.setDate(expectedDate.getDate() + i);
                return {
                    ...day,
                    date: expectedDate
                };
            });
            return {
                ...plainPlan,
                days: healedDays
            };
        }
        return dietPlan;
    }

    const newDays = [];
    const dayMap = new Map();

    // Map existing days by their YYYY-MM-DD date string
    for (const day of daysArray) {
        if (day.date) {
            const dateStr = new Date(day.date).toISOString().split('T')[0];
            dayMap.set(dateStr, day);
        }
    }

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(targetDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        const existingDay = dayMap.get(dateStr);
        if (existingDay) {
            newDays.push({
                date: currentDate,
                status: existingDay.status || 'NO_DIET',
                meals: existingDay.meals || []
            });
        } else {
            newDays.push({
                date: currentDate,
                status: 'NO_DIET',
                meals: []
            });
        }
    }

    // Return plain object
    const plainPlan = typeof dietPlan.toObject === 'function' ? dietPlan.toObject() : dietPlan;
    return {
        ...plainPlan,
        weekStartDate: targetDate,
        days: newDays
    };
}

/**
 * Parses a date input (which could be an ISO string, a date-only string, or a Date object)
 * into a local Date object at 00:00:00 in the browser/runtime's local timezone.
 * This prevents timezone offsets from shifting the date by a day.
 */
export function parseToLocalDate(dateInput?: string | Date | null): Date {
    if (!dateInput) return new Date();

    if (dateInput instanceof Date) {
        return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }

    // It's a string. Split by T to isolate the date portion, then split by -
    const datePart = dateInput.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-based month
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }

    // Fallback
    const parsed = new Date(dateInput);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

