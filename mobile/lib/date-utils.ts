export function getLocalDateString(date: Date = new Date()): string {
    return date.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
