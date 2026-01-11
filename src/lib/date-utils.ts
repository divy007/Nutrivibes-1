import { startOfDay } from 'date-fns';

/**
 * Normalizes a date or date string to a UTC Date object at 00:00:0.000Z.
 * This ensures that a "day" is consistent across client and server timezones.
 */
export function normalizeDateUTC(dateInput?: string | Date): Date {
    if (!dateInput) return normalizeDateUTC(new Date());

    const date = new Date(dateInput);

    // Shift by +5.5 hours to align with IST (Indian Standard Time)
    // 5.5 hours = 5.5 * 60 * 60 * 1000 = 19800000 ms
    // This allows identifying the "IST Day" even when server is in UTC
    const shiftedDate = new Date(date.getTime() + 19800000);

    // Create a date in UTC at 00:00 of the shifted date
    const normalized = new Date(Date.UTC(
        shiftedDate.getUTCFullYear(),
        shiftedDate.getUTCMonth(),
        shiftedDate.getUTCDate(),
        0, 0, 0, 0
    ));

    return normalized;
}

/**
 * Returns the current date as a YYYY-MM-DD string in the environmental timezone.
 */
export function getLocalDateString(date: Date = new Date()): string {
    // Shift by +5.5 hours for IST
    const shiftedDate = new Date(date.getTime() + 19800000);

    // Use UTC methods on the shifted date to get IST day components
    const year = shiftedDate.getUTCFullYear();
    const month = String(shiftedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(shiftedDate.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
