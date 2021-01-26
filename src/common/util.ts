export const msInDay = 86400 * 1000;

export function dateToMidnight(timestamp: number): number {
    const date = new Date(timestamp);
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);
    return date.getTime();
}
