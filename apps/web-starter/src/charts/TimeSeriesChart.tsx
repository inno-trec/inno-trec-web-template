import { colors, fontFamily } from '@inno-trec/tokens';
import { LineChart, type LineSeriesOption } from 'echarts/charts';
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from 'echarts/components';
import { init, use, type ComposeOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef, useState } from 'react';
import { BROWSER_TIME_ZONE, zoneOffset } from '../time/zone';
import { formatNumber, formatTime } from './format';

// Load only the parts of ECharts this chart uses. Add others (BarChart, DataZoomComponent…) when you need them.
use([LineChart, GridComponent, LegendComponent, TooltipComponent, AriaComponent, CanvasRenderer]);

type Option = ComposeOption<LineSeriesOption | GridComponentOption | LegendComponentOption | TooltipComponentOption>;

export interface Point {
  /** Milliseconds since 1970 (UTC). */
  time: number;
  /** Estimated values are drawn dashed and marked "estimated" in the tooltip. */
  estimated?: boolean;
}

export interface SeriesSpec<P extends Point> {
  name: string;
  /** A series token from @inno-trec/tokens, for example colors['series-pv']. Never pick colors by order. */
  color: string;
  /** Return null for a missing reading: the line shows a gap, never a zero. */
  value: (point: P) => number | null;
}

export interface TimeSeriesChartProps<P extends Point> {
  points: P[];
  series: SeriesSpec<P>[];
  /** Unit of the single y-axis, for example "kW". One unit per chart. */
  unit: string;
  /** What the chart shows, read by screen readers. */
  label: string;
  /** The community's time zone (IANA name), from the backend. The axis and the tooltip use it. */
  timeZone?: string;
  height?: number;
  min?: number;
  max?: number;
}

/**
 * A line chart over time, styled by the design system's chart rules: fixed series colors, one y-axis,
 * a legend, direct labels when there is room, dashed estimates and gaps for missing data.
 */
export function TimeSeriesChart<P extends Point>({ points, series, unit, label, timeZone = BROWSER_TIME_ZONE, height = 320, min, max }: TimeSeriesChartProps<P>) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Follow the container's width, so the chart resizes with the page.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || width === 0) return;
    const chart = init(el, undefined, { renderer: 'canvas' });
    chart.setOption(buildOption(points, series, unit, width));
    return () => chart.dispose();
  }, [points, series, unit, width, min, max, timeZone]);

  return <div ref={ref} data-chart role="img" aria-label={label} style={{ width: '100%', height }} />;

  function buildOption(pts: P[], specs: SeriesSpec<P>[], yUnit: string, w: number): Option {
    const hasEstimates = pts.some((p) => p.estimated);
    // ECharts lays out its time axis in the browser's time zone and has no setting for another one.
    // So each instant moves by the community's offset, and the chart reads the result as UTC:
    // the axis then shows the community's clock. The tooltip formats the real instant instead.
    // On the night summer time ends, one hour repeats, and the line steps back for that hour.
    const at = pts.map((p) => p.time + zoneOffset(p.time, timeZone));
    // Name the lines at their end when there is room and the ends are far enough apart;
    // the legend always names them too.
    const directLabels = w >= 640 && specs.length <= 4 && endsApart(pts, specs);
    const text = { color: colors.ink, fontFamily: fontFamily.text, fontSize: 12 };
    const muted = { color: colors['ink-muted'], fontFamily: fontFamily.text, fontSize: 12 };

    const lines: LineSeriesOption[] = specs.flatMap((spec) => {
      const base: LineSeriesOption = {
        type: 'line',
        name: spec.name,
        color: spec.color,
        showSymbol: false,
        connectNulls: false,
        sampling: 'lttb',
        emphasis: { disabled: true },
        lineStyle: { width: 2, color: spec.color },
      };
      const endLabel = { show: true, formatter: spec.name, ...text, distance: 8 };
      const measured: LineSeriesOption = {
        ...base,
        data: pts.map((p, i) => [at[i], p.estimated ? null : spec.value(p)]),
        endLabel: directLabels && !hasEstimates ? endLabel : undefined,
        labelLayout: { moveOverlap: 'shiftY' },
      };
      if (!hasEstimates) return [measured];
      // The estimated part is a second, dashed line with the same name, so the legend shows one entry.
      // It starts at the last measured point, so the two parts join.
      const estimated: LineSeriesOption = {
        ...base,
        lineStyle: { width: 2, color: spec.color, type: 'dashed' },
        data: pts.map((p, i) => [at[i], p.estimated || pts[i + 1]?.estimated ? spec.value(p) : null]),
        endLabel: directLabels ? endLabel : undefined,
        labelLayout: { moveOverlap: 'shiftY' },
      };
      return [measured, estimated];
    });

    return {
      animation: false,
      useUTC: true,
      aria: { enabled: true },
      textStyle: text,
      // On narrow screens the legend takes two rows.
      grid: { left: 8, right: directLabels ? 120 : 16, top: w >= 640 ? 48 : 72, bottom: 8 },
      legend: {
        top: 0,
        left: 0,
        icon: 'rect',
        itemWidth: 16,
        itemHeight: 3,
        textStyle: text,
        data: specs.map((s) => s.name),
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: colors['line-strong'] } },
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: 0,
        textStyle: text,
        extraCssText: 'box-shadow: none;',
        formatter: (params) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0];
          const point = first ? pts[first.dataIndex] : undefined;
          if (!point) return '';
          // A series can appear twice (measured and estimated parts): keep its one known value.
          const values = new Map<string, { color: string; value: number | null }>();
          for (const p of list) {
            const value = (p.value as [number, number | null])[1];
            const known = values.get(p.seriesName ?? '');
            values.set(p.seriesName ?? '', { color: String(p.color), value: value ?? known?.value ?? null });
          }
          const rows = [...values]
            .map(([name, { color, value }]) => {
              const swatch = `<span style="display:inline-block;width:10px;height:10px;margin-right:6px;background:${color}"></span>`;
              return `<div>${swatch}${name}: <b>${value == null ? 'no data' : `${formatNumber(value)} ${yUnit}`}</b></div>`;
            })
            .join('');
          return `<div style="margin-bottom:4px">${formatTime(point.time, timeZone)}${point.estimated ? ' · estimated' : ''}</div>${rows}`;
        },
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: colors['line-strong'] } },
        axisTick: { show: false },
        axisLabel: {
          ...muted,
          hideOverlap: true,
          // 24-hour times, and the date at midnight.
          formatter: { year: '{yyyy}', month: '{MMM}', day: '{d} {MMM}', hour: '{HH}:{mm}', minute: '{HH}:{mm}', second: '{HH}:{mm}:{ss}' },
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: yUnit,
        nameTextStyle: { ...muted, align: 'right' },
        min,
        max,
        axisLabel: { ...muted, formatter: (v: number) => formatNumber(v) },
        splitLine: { lineStyle: { color: colors.line } },
      },
      series: lines,
    };
  }
}

/** True when the last values of the series are far enough apart for their labels not to overlap. */
function endsApart<P extends Point>(pts: P[], specs: SeriesSpec<P>[]) {
  const all = pts.flatMap((p) => specs.map((s) => s.value(p))).filter((v): v is number => v != null);
  if (all.length === 0) return false;
  const range = Math.max(...all) - Math.min(...all) || 1;
  const ends = specs
    .map((s) => [...pts].reverse().map(s.value).find((v) => v != null))
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  return ends.every((v, i) => i === 0 || (v - ends[i - 1]) / range > 0.07);
}
