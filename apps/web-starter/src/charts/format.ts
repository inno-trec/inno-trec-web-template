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
