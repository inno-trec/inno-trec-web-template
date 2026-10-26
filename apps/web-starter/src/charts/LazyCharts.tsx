import { lazy, Suspense } from 'react';
import type { BarChartProps } from './BarChart';
import type { Point, TimeSeriesChartProps } from './TimeSeriesChart';

// ECharts is large, so it loads only when a page shows a chart. The rest of the tool does not wait for it.
const TimeSeries = lazy(() => import('./TimeSeriesChart').then((m) => ({ default: m.TimeSeriesChart })));
const Bars = lazy(() => import('./BarChart').then((m) => ({ default: m.BarChart })));

/** TimeSeriesChart, loaded on demand. While it loads, an empty box of the same height holds its place. */
export function LazyTimeSeriesChart<P extends Point>(props: TimeSeriesChartProps<P>) {
  return (
    <Suspense fallback={<div style={{ height: props.height ?? 320 }} />}>
      <TimeSeries {...(props as unknown as TimeSeriesChartProps<Point>)} />
    </Suspense>
  );
}

/** BarChart, loaded on demand. */
export function LazyBarChart(props: BarChartProps) {
  return (
    <Suspense fallback={<div style={{ height: props.height ?? 56 + props.categories.length * 44 }} />}>
      <Bars {...props} />
    </Suspense>
  );
}
