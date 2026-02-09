import { useCallback, useMemo, useRef, useState } from 'react';
import type { TrendDto } from '@shared/api/endpoints/analytics';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Spinner } from '@shared/ui/Spinner';

type ChartMode = 'bar' | 'line';

interface IncomeVsSpendingChartProps {
  trends: TrendDto['trends'];
  isLoading: boolean;
  isError: boolean;
}

interface ChartPoint {
  month: string;
  label: string;
  income: number;
  expenses: number;
  cumulativeIncome: number;
  cumulativeExpenses: number;
}

const axisValueFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const tooltipValueFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: '2-digit',
});

function formatMonthLabel(month: string): string {
  const [yearPart, monthPart] = month.split('-');
  const year = Number(yearPart);
  const monthNumber = Number(monthPart);

  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) {
    return month;
  }

  return monthLabelFormatter.format(new Date(year, monthNumber - 1, 1));
}

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

export function IncomeVsSpendingChart({ trends, isLoading, isError }: IncomeVsSpendingChartProps) {
  const [mode, setMode] = useState<ChartMode>('bar');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const chartData = useMemo(() => {
    let runningIncome = 0;
    let runningExpenses = 0;

    return trends.map<ChartPoint>((item) => {
      runningIncome += item.income;
      runningExpenses += item.expenses;

      return {
        month: item.month,
        label: formatMonthLabel(item.month),
        income: item.income,
        expenses: item.expenses,
        cumulativeIncome: runningIncome,
        cumulativeExpenses: runningExpenses,
      };
    });
  }, [trends]);

  const width = 920;
  const height = 320;
  const margins = { top: 16, right: 24, bottom: 52, left: 74 };
  const plotWidth = width - margins.left - margins.right;
  const plotHeight = height - margins.top - margins.bottom;
  const plotBottom = margins.top + plotHeight;

  const yMax = useMemo(() => {
    const maxValue = chartData.reduce((currentMax, point) => {
      const candidate =
        mode === 'bar'
          ? Math.max(point.income, point.expenses)
          : Math.max(point.cumulativeIncome, point.cumulativeExpenses);
      return Math.max(currentMax, candidate);
    }, 0);

    return maxValue > 0 ? maxValue * 1.1 : 1;
  }, [chartData, mode]);

  const yTicks = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => ({
        value: ((4 - index) / 4) * yMax,
        id: `tick-${index}`,
      })),
    [yMax],
  );

  const groupWidth = plotWidth / Math.max(chartData.length, 1);
  const barGap = Math.min(8, groupWidth * 0.14);
  const barWidth = Math.max(6, Math.min(28, (groupWidth - barGap * 3) / 2));

  const yForValue = (value: number) => margins.top + plotHeight - (value / yMax) * plotHeight;
  const xForLineIndex = (index: number) => {
    if (chartData.length <= 1) {
      return margins.left + plotWidth / 2;
    }
    return margins.left + (plotWidth * index) / (chartData.length - 1);
  };

  const cumulativeIncomePoints = chartData.map((point, index) => ({
    x: xForLineIndex(index),
    y: yForValue(point.cumulativeIncome),
  }));

  const cumulativeExpensesPoints = chartData.map((point, index) => ({
    x: xForLineIndex(index),
    y: yForValue(point.cumulativeExpenses),
  }));

  const getDataIndexFromMouse = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || chartData.length === 0) return null;

      const rect = svg.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * width;

      if (mode === 'bar') {
        const index = Math.floor((svgX - margins.left) / groupWidth);
        if (index >= 0 && index < chartData.length) return index;
      } else {
        // For line chart, snap to nearest data point
        let closest = 0;
        let closestDist = Infinity;
        for (let i = 0; i < chartData.length; i++) {
          const dist = Math.abs(xForLineIndex(i) - svgX);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
        // Only show if reasonably close to the plot area
        if (svgX >= margins.left - 10 && svgX <= margins.left + plotWidth + 10) {
          return closest;
        }
      }
      return null;
    },
    [chartData, mode, groupWidth, margins.left, plotWidth, width, xForLineIndex],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      setHoveredIndex(getDataIndexFromMouse(event));
    },
    [getDataIndexFromMouse],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const hoveredPoint = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="chart-state">
          <Spinner />
        </div>
      );
    }

    if (isError) {
      return <EmptyState title="Could not load trend data" description="Try refreshing after your next sync." />;
    }

    if (chartData.length === 0) {
      return <EmptyState title="No trend data yet" description="Sync transactions to see income vs spending over time." />;
    }

    return (
      <div className="chart-content">
        <p className="subtle">{mode === 'bar' ? 'Monthly income and spending totals' : 'Cumulative income and spending totals'}</p>
        <svg
          ref={svgRef}
          className="trend-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={mode === 'bar' ? 'Monthly income and spending bar chart' : 'Cumulative income and spending line chart'}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
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

          {mode === 'bar'
            ? chartData.map((point, index) => {
                const clusterWidth = barWidth * 2 + barGap;
                const clusterStart = margins.left + index * groupWidth + (groupWidth - clusterWidth) / 2;
                const incomeHeight = (point.income / yMax) * plotHeight;
                const expenseHeight = (point.expenses / yMax) * plotHeight;
                const xLabel = margins.left + groupWidth * (index + 0.5);

                return (
                  <g key={point.month}>
                    <rect
                      className="trend-bar trend-bar-income"
                      x={clusterStart}
                      y={plotBottom - incomeHeight}
                      width={barWidth}
                      height={incomeHeight}
                      rx={3}
                    />
                    <rect
                      className="trend-bar trend-bar-expense"
                      x={clusterStart + barWidth + barGap}
                      y={plotBottom - expenseHeight}
                      width={barWidth}
                      height={expenseHeight}
                      rx={3}
                    />
                    <text className="trend-axis-label" x={xLabel} y={plotBottom + 17} textAnchor="middle">
                      {point.label}
                    </text>
                  </g>
                );
              })
            : (
                <>
                  <path className="trend-line trend-line-income" d={buildLinePath(cumulativeIncomePoints)} />
                  <path className="trend-line trend-line-expense" d={buildLinePath(cumulativeExpensesPoints)} />

                  {chartData.map((point, index) => {
                    const x = xForLineIndex(index);
                    return (
                      <g key={point.month}>
                        <circle className="trend-point trend-point-income" cx={x} cy={yForValue(point.cumulativeIncome)} r={4} />
                        <circle className="trend-point trend-point-expense" cx={x} cy={yForValue(point.cumulativeExpenses)} r={4} />
                        <text className="trend-axis-label" x={x} y={plotBottom + 17} textAnchor="middle">
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

          {/* Hover crosshair + tooltip */}
          {hoveredIndex !== null && hoveredPoint && (() => {
            const crossX = mode === 'bar'
              ? margins.left + groupWidth * (hoveredIndex + 0.5)
              : xForLineIndex(hoveredIndex);

            const incomeVal = mode === 'bar' ? hoveredPoint.income : hoveredPoint.cumulativeIncome;
            const expenseVal = mode === 'bar' ? hoveredPoint.expenses : hoveredPoint.cumulativeExpenses;
            const incomeY = yForValue(incomeVal);
            const expenseY = yForValue(expenseVal);

            const tooltipW = 175;
            const tooltipH = 68;
            const tooltipPad = 12;
            // Position tooltip to the right of crosshair; flip to left if too close to right edge
            const tooltipX = crossX + tooltipPad + tooltipW > width - margins.right
              ? crossX - tooltipPad - tooltipW
              : crossX + tooltipPad;
            const tooltipY = Math.max(margins.top, Math.min(incomeY, expenseY) - tooltipH / 2);

            return (
              <g className="trend-hover-group" pointerEvents="none">
                <line
                  className="trend-crosshair"
                  x1={crossX}
                  y1={margins.top}
                  x2={crossX}
                  y2={plotBottom}
                />

                {/* Highlight dots on data points */}
                <circle className="trend-hover-dot trend-hover-dot-income" cx={crossX} cy={incomeY} r={6} />
                <circle className="trend-hover-dot trend-hover-dot-expense" cx={crossX} cy={expenseY} r={6} />

                {/* Tooltip card */}
                <rect
                  className="trend-tooltip-bg"
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipW}
                  height={tooltipH}
                  rx={8}
                />
                <text className="trend-tooltip-label" x={tooltipX + 12} y={tooltipY + 18}>
                  {hoveredPoint.label}
                </text>
                <circle cx={tooltipX + 12} cy={tooltipY + 33} r={4} fill="#1676dd" />
                <text className="trend-tooltip-value" x={tooltipX + 22} y={tooltipY + 37}>
                  Income: {tooltipValueFormatter.format(incomeVal)}
                </text>
                <circle cx={tooltipX + 12} cy={tooltipY + 52} r={4} fill="#dc623d" />
                <text className="trend-tooltip-value" x={tooltipX + 22} y={tooltipY + 56}>
                  Spending: {tooltipValueFormatter.format(expenseVal)}
                </text>
              </g>
            );
          })()}

        </svg>
        <ul className="trend-legend" aria-label="Chart legend">
          <li className="trend-legend-item">
            <span className="trend-legend-swatch trend-income" aria-hidden="true" />
            Income
          </li>
          <li className="trend-legend-item">
            <span className="trend-legend-swatch trend-expense" aria-hidden="true" />
            Spending
          </li>
        </ul>
      </div>
    );
  };

  return (
    <Card
      title="Income vs Spending"
      actions={
        <div className="chart-toggle" role="group" aria-label="Chart type">
          <button
            type="button"
            className={`btn ${mode === 'bar' ? 'btn-primary' : 'btn-secondary'} chart-toggle-btn`}
            onClick={() => setMode('bar')}
            aria-pressed={mode === 'bar'}
          >
            Bar Chart
          </button>
          <button
            type="button"
            className={`btn ${mode === 'line' ? 'btn-primary' : 'btn-secondary'} chart-toggle-btn`}
            onClick={() => setMode('line')}
            aria-pressed={mode === 'line'}
          >
            Cumulative Line
          </button>
        </div>
      }
    >
      {renderContent()}
    </Card>
  );
}
