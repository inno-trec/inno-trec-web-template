/** Number and date formats shared by the pages, so every page writes them the same way. */
const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });

/** Uses a real minus sign (−) for negative values, as the design system does. */
export const formatNumber = (n: number) => numberFormat.format(Math.abs(n) < 0.05 ? 0 : n).replace('-', '−');

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

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** A calendar day "YYYY-MM-DD" as "31 March 2027". */
export const formatDate = (day: string) => dateFormat.format(Date.parse(day));
