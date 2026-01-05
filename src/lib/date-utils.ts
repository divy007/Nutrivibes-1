import { startOfDay } from 'date-fns';

/**
 * Normalizes a date or date string to a UTC Date object at 00:00:0.000Z.
 * This ensures that a "day" is consistent across client and server timezones.
 */
export function normalizeDateUTC(dateInput?: string | Date): Date {
    if (!dateInput) return normalizeDateUTC(new Date());

    const date = new Date(dateInput);

    // Create a date in UTC at 00:00 of the given date's calendar day
    const normalized = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0, 0
    ));

    return normalized;
}

/**
 * Returns the current date as a YYYY-MM-DD string in the environmental timezone.
 */
export function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
