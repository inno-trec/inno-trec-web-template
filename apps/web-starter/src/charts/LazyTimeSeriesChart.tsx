import { lazy, Suspense } from 'react';
import type { Point, TimeSeriesChartProps } from './TimeSeriesChart';

// ECharts is large, so it loads only when a page shows a chart. The rest of the tool does not wait for it.
const Chart = lazy(() => import('./TimeSeriesChart').then((m) => ({ default: m.TimeSeriesChart })));

/** TimeSeriesChart, loaded on demand. While it loads, an empty box of the same height holds its place. */
export function LazyTimeSeriesChart<P extends Point>(props: TimeSeriesChartProps<P>) {
  return (
    <Suspense fallback={<div style={{ height: props.height ?? 320 }} />}>
      <Chart {...(props as unknown as TimeSeriesChartProps<Point>)} />
    </Suspense>
  );
}
