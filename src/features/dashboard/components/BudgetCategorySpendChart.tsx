import { useCallback, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '@domain/format';
import type { MonthlySpendPoint } from '@features/dashboard/budgetInsightDetailData';
import { EmptyState } from '@shared/ui/EmptyState';
import { Spinner } from '@shared/ui/Spinner';

interface BudgetCategorySpendChartProps {
  points: MonthlySpendPoint[];
  averageSpend: number;
  isLoading: boolean;
  isError: boolean;
}

const axisValueFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

export function BudgetCategorySpendChart({ points, averageSpend, isLoading, isError }: BudgetCategorySpendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 920;
  const height = 320;
  const margins = { top: 16, right: 24, bottom: 52, left: 74 };
  const plotWidth = width - margins.left - margins.right;
  const plotHeight = height - margins.top - margins.bottom;
  const plotBottom = margins.top + plotHeight;

  const yMax = useMemo(() => {
    const maxPoint = points.reduce((acc, point) => Math.max(acc, point.amount), 0);
    const maxValue = Math.max(maxPoint, averageSpend);
    return maxValue > 0 ? maxValue * 1.15 : 1;
  }, [points, averageSpend]);

  const yTicks = useMemo(
    () => Array.from({ length: 5 }, (_, index) => ({ id: `budget-spend-tick-${index}`, value: ((4 - index) / 4) * yMax })),
    [yMax],
  );

  const yForValue = (value: number) => margins.top + plotHeight - (value / yMax) * plotHeight;
  const xForIndex = (index: number) => {
    if (points.length <= 1) {
      return margins.left + plotWidth / 2;
    }
    return margins.left + (plotWidth * index) / (points.length - 1);
  };

  const spendPoints = points.map((point, index) => ({
    x: xForIndex(index),
    y: yForValue(point.amount),
  }));

  const averageY = yForValue(averageSpend);

  const getDataIndexFromMouse = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (points.length === 0 || !svgRef.current) {
        return null;
      }

      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * width;

      let closestIndex = 0;
      let closestDistance = Infinity;

      for (let index = 0; index < points.length; index += 1) {
        const distance = Math.abs(xForIndex(index) - svgX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }

      if (svgX < margins.left - 10 || svgX > margins.left + plotWidth + 10) {
        return null;
      }

      return closestIndex;
    },
    [points.length, margins.left, plotWidth, width, xForIndex],
  );

  const hoveredPoint = hoveredIndex === null ? null : points[hoveredIndex];

  if (isLoading) {
    return (
      <div className="chart-state">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <EmptyState title="Could not load monthly spend trend" description="Try refreshing after your next sync." />;
  }

  if (points.length === 0) {
    return <EmptyState title="No spend trend yet" description="Transactions in this category will appear here by month." />;
  }

  return (
    <div className="chart-content">
      <p className="subtle">Monthly spending trend with your historical average benchmark</p>
      <svg
        ref={svgRef}
        className="trend-chart budget-category-trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Monthly category spending line chart"
        onMouseMove={(event) => setHoveredIndex(getDataIndexFromMouse(event))}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {yTicks.map((tick) => {
          const y = yForValue(tick.value);
          return (
            <g key={tick.id}>
              <line className="trend-grid-line" x1={margins.left} y1={y} x2={margins.left + plotWidth} y2={y} />
              <text className="trend-axis-label" x={margins.left - 10} y={y + 4} textAnchor="end">
                {axisValueFormatter.format(tick.value)}
              </text>
            </g>
          );
        })}

        <line className="trend-axis-line" x1={margins.left} y1={plotBottom} x2={margins.left + plotWidth} y2={plotBottom} />

        <line
          className="budget-category-average-line"
          x1={margins.left}
          y1={averageY}
          x2={margins.left + plotWidth}
          y2={averageY}
        />
        <text
          className="trend-axis-label budget-category-average-label"
          x={margins.left + plotWidth - 2}
          y={averageY - 6}
          textAnchor="end"
        >
          Avg {axisValueFormatter.format(averageSpend)}
        </text>

        <path className="budget-category-spend-line" d={buildLinePath(spendPoints)} />

        {points.map((point, index) => (
          <g key={point.month}>
            <circle className="budget-category-spend-point" cx={xForIndex(index)} cy={yForValue(point.amount)} r={4} />
            <text className="trend-axis-label" x={xForIndex(index)} y={plotBottom + 17} textAnchor="middle">
              {point.label}
            </text>
          </g>
        ))}

        {hoveredPoint && hoveredIndex !== null && (() => {
          const crossX = xForIndex(hoveredIndex);
          const pointY = yForValue(hoveredPoint.amount);
          const tooltipWidth = 172;
          const tooltipHeight = 66;
          const tooltipPadding = 12;
          const tooltipX = crossX + tooltipPadding + tooltipWidth > width - margins.right
            ? crossX - tooltipPadding - tooltipWidth
            : crossX + tooltipPadding;
          const tooltipY = Math.max(margins.top, Math.min(pointY, averageY) - tooltipHeight / 2);

          return (
            <g className="trend-hover-group" pointerEvents="none">
              <line className="trend-crosshair" x1={crossX} y1={margins.top} x2={crossX} y2={plotBottom} />
              <circle className="budget-category-spend-hover-point" cx={crossX} cy={pointY} r={6} />
              <rect className="trend-tooltip-bg" x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx={8} />
              <text className="trend-tooltip-label" x={tooltipX + 12} y={tooltipY + 18}>
                {hoveredPoint.label}
              </text>
              <text className="trend-tooltip-value" x={tooltipX + 12} y={tooltipY + 37}>
                Spend: {formatCurrency(hoveredPoint.amount)}
              </text>
              <text className="trend-tooltip-value" x={tooltipX + 12} y={tooltipY + 54}>
                Average: {formatCurrency(averageSpend)}
              </text>
            </g>
          );
        })()}
      </svg>
      <ul className="trend-legend budget-category-trend-legend" aria-label="Category chart legend">
        <li className="trend-legend-item">
          <span className="trend-legend-swatch budget-category-spend-swatch" aria-hidden="true" />
          Monthly Spend
        </li>
        <li className="trend-legend-item">
          <span className="budget-category-average-swatch" aria-hidden="true" />
          Average Spend
        </li>
      </ul>
    </div>
  );
}
