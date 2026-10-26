import { BROWSER_TIME_ZONE } from '../time/zone';

/**
 * Number and time formats shared by charts and tables.
 * Times are shown in the community's time zone, which the backend sends with the data.
 */
const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });

/** Uses a real minus sign (−) for negative values, as the design system does. */
export const formatNumber = (n: number) => numberFormat.format(Math.abs(n) < 0.05 ? 0 : n).replace('-', '−');

const cache = new Map<string, Intl.DateTimeFormat>();
function format(kind: 'time' | 'hour' | 'day', timeZone: string) {
  const key = `${kind}|${timeZone}`;
  let f = cache.get(key);
  if (!f) {
    const clock = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const;
    const options: Intl.DateTimeFormatOptions =
      kind === 'time' ? { day: 'numeric', month: 'short', ...clock } : kind === 'hour' ? clock : { weekday: 'short', day: 'numeric', month: 'short' };
    f = new Intl.DateTimeFormat('en-GB', { ...options, timeZone });
    cache.set(key, f);
  }
  return f;
}

/** "26 Oct, 14:30" */
export const formatTime = (ms: number, timeZone = BROWSER_TIME_ZONE) => format('time', timeZone).format(ms);
/** "14:00" */
export const formatHour = (ms: number, timeZone = BROWSER_TIME_ZONE) => format('hour', timeZone).format(ms);
/** "Mon 26 Oct" */
export const formatDay = (ms: number, timeZone = BROWSER_TIME_ZONE) => format('day', timeZone).format(ms);

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "15 minutes ago", "yesterday", "3 days ago". An empty value reads "Never". */
export function formatRelative(time: string | null) {
  if (!time) return 'Never';
  const seconds = (Date.parse(time) - Date.now()) / 1000;
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [['minute', 60], ['hour', 3600], ['day', 86400], ['month', 2592000]];
  let [unit, size] = steps[0];
  for (const step of steps) if (Math.abs(seconds) >= step[1]) [unit, size] = step;
  if (Math.abs(seconds) < 60) return 'Just now';
  return relative.format(Math.round(seconds / size), unit);
}

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** A calendar day "YYYY-MM-DD" as "March 2024". */
export const formatMonth = (day: string) => monthFormat.format(Date.parse(day));
/** A calendar day "YYYY-MM-DD" as "31 March 2027". */
export const formatDate = (day: string) => dateFormat.format(Date.parse(day));

/** Quantities as "100 kWh, 25 kW". */
export const formatQuantities = (list: Array<{ value: number; unit: string }>) =>
  list.length === 0 ? '—' : list.map((q) => `${formatNumber(q.value)} ${q.unit}`).join(', ');
