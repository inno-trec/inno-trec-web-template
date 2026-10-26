/**
 * Number and time formats shared by charts and tables.
 * Times are shown in the reader's time zone; `TIME_ZONE` names it so a page can say which one.
 */
const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });
const timeFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const hourFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Uses a real minus sign (−) for negative values, as the design system does. */
export const formatNumber = (n: number) => numberFormat.format(Math.abs(n) < 0.05 ? 0 : n).replace('-', '−');
export const formatTime = (ms: number) => timeFormat.format(ms);
export const formatHour = (ms: number) => hourFormat.format(ms);
export const formatDay = (ms: number) => dayFormat.format(ms);
