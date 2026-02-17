import { format, parseISO, isToday, isYesterday, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

/**
 * Convert a JS Date or Firestore Timestamp to a display string.
 */
export const formatDate = (dateOrTimestamp) => {
    const date = toDate(dateOrTimestamp);
    if (!date) return '';

    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
};

/**
 * Convert a Firestore Timestamp or ISO string to a JS Date.
 */
export const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();
    if (value?.seconds) return new Date(value.seconds * 1000);
    if (typeof value === 'string') return parseISO(value);
    return null;
};

/**
 * Get today's date as an ISO date string (YYYY-MM-DD) for input[type=date].
 */
export const todayISO = () => format(new Date(), 'yyyy-MM-dd');

/**
 * Convert a date input value (YYYY-MM-DD) to a Firestore Timestamp.
 */
export const dateInputToTimestamp = (dateString) => {
    if (!dateString) return null;
    return Timestamp.fromDate(new Date(dateString + 'T12:00:00'));
};
