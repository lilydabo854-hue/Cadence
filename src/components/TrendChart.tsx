import React, { useState } from 'react';
import type { AnalyticsPoint } from '../types/workspace';
import { formatCompactNumber } from '../utils/scheduler';

interface TrendChartProps {
  data: AnalyticsPoint[];
  metric: 'reach' | 'followers' | 'engagements';
  height?: number;
  accentColor: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  metric,
  height = 240,
  accentColor,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-500 dark:text-slate-400">
        No analytics time-series data available for this range.
      </div>
    );
  }

  const width = 760;
  const padLeft = 48;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const values = data.map((d) => d[metric]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const domainMin = metric === 'followers' ? Math.floor(minVal * 0.98) : 0;
  const domainMax = Math.max(domainMin + 10, Math.ceil(maxVal * 1.1));

  const xFor = (i: number) =>
    data.length === 1 ? padLeft + plotW / 2 : padLeft + (i / (data.length - 1)) * plotW;
  const yFor = (v: number) =>
    padTop + plotH - ((v - domainMin) / (domainMax - domainMin)) * plotH;

  const pointsStr = data.map((d, i) => `${xFor(i).toFixed(1)},${yFor(d[metric]).toFixed(1)}`).join(' ');
  const areaPath = `M ${xFor(0).toFixed(1)},${(padTop + plotH).toFixed(1)} L ${data
    .map((d, i) => `${xFor(i).toFixed(1)},${yFor(d[metric]).toFixed(1)}`)
    .join(' L ')} L ${xFor(data.length - 1).toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const val = Math.round(domainMin + (domainMax - domainMin) * t);
    return { val, y: yFor(val) };
  });

  const activeIdx = hoverIdx !== null ? hoverIdx : data.length - 1;
  const activePoint = data[activeIdx];

  return (
    <div className="relative w-full select-none">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
        <span className="font-mono tabular-nums">
          {activePoint.date} ·{' '}
          <strong className="text-slate-900 dark:text-slate-100 font-semibold">
            {activePoint[metric].toLocaleString()}
          </strong>{' '}
          {metric === 'followers' ? 'total followers' : metric}
        </span>
        <span className="font-mono tabular-nums">
          Range peak: {maxVal.toLocaleString()}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`${metric} trend chart over ${data.length} days`}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {yTicks.map((tick, idx) => (
          <g key={idx}>
            <line
              x1={padLeft}
              y1={tick.y}
              x2={width - padRight}
              y2={tick.y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="1"
            />
            <text
              x={padLeft - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
            >
              {formatCompactNumber(tick.val)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#grad-${metric})`} />

        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={pointsStr}
        />

        {activePoint && (
          <g>
            <line
              x1={xFor(activeIdx)}
              y1={padTop}
              x2={xFor(activeIdx)}
              y2={padTop + plotH}
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <circle
              cx={xFor(activeIdx)}
              cy={yFor(activePoint[metric])}
              r="4.5"
              fill={accentColor}
              className="stroke-white dark:stroke-slate-900"
              strokeWidth="2"
            />
          </g>
        )}

        {/* X axis start / mid / end labels */}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((idx) => (
          <text
            key={idx}
            x={xFor(idx)}
            y={height - 6}
            textAnchor={idx === 0 ? 'start' : idx === data.length - 1 ? 'end' : 'middle'}
            className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
          >
            {data[idx].date.slice(5)}
          </text>
        ))}

        {/* Invisible hover columns for smooth scrubbing */}
        {data.map((_, i) => {
          const colW = plotW / data.length;
          return (
            <rect
              key={i}
              x={xFor(i) - colW / 2}
              y={padTop}
              width={Math.max(colW, 6)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          );
        })}
      </svg>
    </div>
  );
};
