import { startOfDay } from 'date-fns';

// Constants
const APP_TIMEZONE = 'Asia/Kolkata';

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
