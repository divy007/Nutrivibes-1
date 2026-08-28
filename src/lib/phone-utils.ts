/**
 * Normalizes a phone number to standard format (+<country><digits>).
 * Removes any leading zero after the country code.
 * E.g., +610401491544 -> +61401491544
 * E.g., 0401491544 -> +61401491544
 */
export function normalizePhoneNumber(phone?: string): string {
    if (!phone) return '';

    // Remove all whitespace, dashes, parentheses, dots
    let cleaned = phone.replace(/[\s\-().]/g, '');

    // If it doesn't start with '+', normalize local formats
    if (!cleaned.startsWith('+')) {
        if (cleaned.startsWith('04') && cleaned.length === 10) {
            // Australian local mobile: convert 0401... to +61401...
            cleaned = '+61' + cleaned.substring(1);
        } else if (cleaned.startsWith('0') && cleaned.length === 10) {
            // Indian local mobile: convert 0987... to +91987...
            cleaned = '+91' + cleaned.substring(1);
        } else {
            // Fallback: prepend '+'
            cleaned = '+' + cleaned;
        }
    }

    // Strip leading zero after country codes to prevent duplicates
    if (cleaned.startsWith('+610')) {
        cleaned = '+61' + cleaned.substring(4);
    } else if (cleaned.startsWith('+910')) {
        cleaned = '+91' + cleaned.substring(4);
    }

    return cleaned;
}
