/**
 * Learning Trend Chart Component
 *
 * 学習量推移を表示する自前SVG棒グラフ
 *
 * ## 仕様
 * - 30日（日単位）/ 12週（週単位）の切り替え
 * - ホバーでtooltip表示
 * - 空状態のUI
 * - 0〜maxの自動スケール
 */

import { useState, useCallback, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { type TrendMode, formatDateLabel } from '../services/trendService';
import styles from './LearningTrendChart.module.css';

interface LearningTrendChartProps {
  data: { x: string; y: number }[];
  mode: TrendMode;
  onModeChange: (mode: TrendMode) => void;
  isLoading: boolean;
  error: string | null;
  title?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
}

const CHART_PADDING = { top: 10, right: 10, bottom: 25, left: 30 };

export function LearningTrendChart({
  data,
  mode,
  onModeChange,
  isLoading,
  error,
  title = '学習量推移',
}: LearningTrendChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: '',
    value: 0,
  });

  const hasData = useMemo(() => data.some((d) => d.y > 0), [data]);
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.y), 1), [data]);

  const handleBarHover = useCallback(
    (point: { x: string; y: number }, event: React.MouseEvent<SVGRectElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const container = event.currentTarget.closest('[data-chart-container]');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top,
        label: formatDateLabel(point.x, mode),
        value: point.y,
      });
    },
    [mode]
  );

  const handleBarLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container} data-testid="trend-chart">
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <ModeToggle mode={mode} onModeChange={onModeChange} disabled />
        </div>
        <div className={styles.loadingState}>読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container} data-testid="trend-chart">
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <ModeToggle mode={mode} onModeChange={onModeChange} />
        </div>
        <div className={styles.errorState}>エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="trend-chart">
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <ModeToggle mode={mode} onModeChange={onModeChange} />
      </div>

      {!hasData ? (
        <div className={styles.emptyState} data-testid="trend-empty">
          <span className={styles.emptyIcon}>
            <BarChart2 size={24} />
          </span>
          <span className={styles.emptyText}>まだ学習データがありません</span>
        </div>
      ) : (
        <div className={styles.chartContainer} data-chart-container>
          <svg className={styles.chart} viewBox="0 0 600 180" preserveAspectRatio="xMidYMid meet">
            <BarChart
              data={data}
              maxValue={maxValue}
              mode={mode}
              onBarHover={handleBarHover}
              onBarLeave={handleBarLeave}
            />
          </svg>

          {tooltip.visible && (
            <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
              {tooltip.label}: {tooltip.value}件
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ModeToggleProps {
  mode: TrendMode;
  onModeChange: (mode: TrendMode) => void;
  disabled?: boolean;
}

function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <div className={styles.modeToggle}>
      <button
        type="button"
        className={`${styles.modeButton} ${mode === 'daily' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('daily')}
        disabled={disabled}
        data-testid="trend-mode-daily"
      >
        30日
      </button>
      <button
        type="button"
        className={`${styles.modeButton} ${mode === 'weekly' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('weekly')}
        disabled={disabled}
        data-testid="trend-mode-weekly"
      >
        12週
      </button>
    </div>
  );
}

interface BarChartProps {
  data: { x: string; y: number }[];
  maxValue: number;
  mode: TrendMode;
  onBarHover: (point: { x: string; y: number }, event: React.MouseEvent<SVGRectElement>) => void;
  onBarLeave: () => void;
}

function BarChart({ data, maxValue, mode, onBarHover, onBarLeave }: BarChartProps) {
  const chartWidth = 600 - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = 180 - CHART_PADDING.top - CHART_PADDING.bottom;

  const barWidth = chartWidth / data.length;
  const barPadding = mode === 'daily' ? 1 : 2;

  // Y-axis grid lines (4 lines including 0)
  const yTicks = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  // X-axis labels (show every nth label to avoid crowding)
  const labelInterval = mode === 'daily' ? 5 : 2;

  return (
    <g transform={`translate(${CHART_PADDING.left}, ${CHART_PADDING.top})`}>
      {/* Grid lines */}
      {yTicks.map((tick, i) => {
        const y = chartHeight - (tick / maxValue) * chartHeight;
        return (
          <g key={i}>
            <line className={styles.gridLine} x1={0} y1={y} x2={chartWidth} y2={y} />
            <text className={styles.axisLabel} x={-5} y={y + 3} textAnchor="end">
              {Math.round(tick)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((point, i) => {
        const barHeight = (point.y / maxValue) * chartHeight;
        const x = i * barWidth + barPadding;
        const y = chartHeight - barHeight;
        const width = barWidth - barPadding * 2;

        return (
          <rect
            key={point.x}
            className={styles.bar}
            x={x}
            y={y}
            width={Math.max(width, 1)}
            height={Math.max(barHeight, 0)}
            data-testid="trend-bar"
            onMouseEnter={(e) => onBarHover(point, e)}
            onMouseLeave={onBarLeave}
          />
        );
      })}

      {/* X-axis labels */}
      {data.map((point, i) => {
        if (i % labelInterval !== 0) return null;
        const x = i * barWidth + barWidth / 2;
        return (
          <text
            key={`label-${point.x}`}
            className={styles.axisLabel}
            x={x}
            y={chartHeight + 15}
            textAnchor="middle"
          >
            {formatDateLabel(point.x, mode)}
          </text>
        );
      })}
    </g>
  );
}
