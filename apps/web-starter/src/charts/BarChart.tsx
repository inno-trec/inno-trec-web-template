import { colors, fontFamily } from '@inno-trec/tokens';
import { BarChart as EBarChart, type BarSeriesOption } from 'echarts/charts';
import { AriaComponent, GridComponent, MarkLineComponent, TooltipComponent, type GridComponentOption, type TooltipComponentOption } from 'echarts/components';
import { init, use, type ComposeOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef, useState } from 'react';
import { formatNumber } from './format';

use([EBarChart, GridComponent, TooltipComponent, MarkLineComponent, AriaComponent, CanvasRenderer]);

type Option = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>;

export interface BarChartProps {
  /** One bar per category, for example one per PV system. */
  categories: string[];
  /** Null draws no bar and the tooltip says "no data". */
  values: Array<number | null>;
  /** What the bars measure, for the tooltip ("Specific yield"). */
  name: string;
  /** The series token of what is measured, for example colors['series-pv'] for PV yield. Never a status color. */
  color: string;
  unit: string;
  /** What the chart shows, read by screen readers. */
  label: string;
  /** A reference value, drawn as a dotted ink-muted line with its name and value. */
  reference?: { name: string; value: number | null };
  height?: number;
}

/**
 * Horizontal bars that compare categories, styled by the design system's chart rules: bars from zero,
 * square, one color for the measure, values beside the bars, and an optional dotted reference line.
 * Horizontal bars keep long names readable on phones.
 */
export function BarChart({ categories, values, name, color, unit, label, reference, height }: BarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const chartHeight = height ?? 56 + categories.length * 44;

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
    const text = { color: colors.ink, fontFamily: fontFamily.text, fontSize: 12 };
    const muted = { color: colors['ink-muted'], fontFamily: fontFamily.text, fontSize: 12 };
    const option: Option = {
      animation: false,
      aria: { enabled: true },
      textStyle: text,
      grid: { left: 8, right: 56, top: reference ? 28 : 8, bottom: 8 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: colors['surface-muted'] } },
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: 0,
        textStyle: text,
        extraCssText: 'box-shadow: none;',
        formatter: (params) => {
          const p = (Array.isArray(params) ? params : [params])[0];
          if (!p) return '';
          const v = p.value as number | null;
          const ref = reference?.value != null ? `<div>${reference.name}: ${formatNumber(reference.value)} ${unit}</div>` : '';
          return `<div style="margin-bottom:4px">${p.name}</div><div>${name}: <b>${v == null ? 'no data' : `${formatNumber(v)} ${unit}`}</b></div>${ref}`;
        },
      },
      yAxis: {
        type: 'category',
        data: categories,
        inverse: true,
        axisLine: { lineStyle: { color: colors['line-strong'] } },
        axisTick: { show: false },
        axisLabel: { ...text, width: width < 480 ? 96 : 180, overflow: 'truncate' },
      },
      xAxis: {
        type: 'value',
        name: unit,
        nameLocation: 'end',
        nameTextStyle: muted,
        min: 0,
        axisLabel: { ...muted, formatter: (v: number) => formatNumber(v) },
        splitLine: { lineStyle: { color: colors.line } },
      },
      series: [
        {
          type: 'bar',
          name,
          data: values,
          barMaxWidth: 28,
          itemStyle: { color, borderRadius: 0 },
          emphasis: { disabled: true },
          label: { show: true, position: 'right', ...text, formatter: (p) => (p.value == null ? '' : formatNumber(p.value as number)) },
          markLine:
            reference?.value != null
              ? {
                  silent: true,
                  symbol: 'none',
                  lineStyle: { color: colors['ink-muted'], width: 2, type: 'dotted' },
                  // With the categories listed top to bottom, 'start' puts the label above the bars.
                  label: { show: true, position: 'start', formatter: `${reference.name} ${formatNumber(reference.value)}`, ...muted },
                  data: [{ xAxis: reference.value }],
                }
              : undefined,
        },
      ],
    };
    chart.setOption(option);
    return () => chart.dispose();
  }, [categories, values, name, color, unit, reference, width]);

  return <div ref={ref} data-chart role="img" aria-label={label} style={{ width: '100%', height: chartHeight }} />;
}
