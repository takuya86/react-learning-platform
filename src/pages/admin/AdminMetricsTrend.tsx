import { BarChart2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import styles from '../AdminMetricsPage.module.css';

interface TrendDataPoint {
  x: string;
  y: number;
}

interface AdminMetricsTrendProps {
  data: TrendDataPoint[];
}

export function AdminMetricsTrend({ data }: AdminMetricsTrendProps) {
  const hasData = data.some((d) => d.y > 0);
  const maxValue = Math.max(...data.map((d) => d.y), 1);

  if (!hasData) {
    return (
      <Card className={styles.chartCard} data-testid="admin-metrics-trend">
        <CardContent className={styles.chartCardContent}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <BarChart2 size={24} />
            </span>
            <span className={styles.emptyText}>まだ学習データがありません</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartWidth = 560;
  const chartHeight = 145;
  const padding = { top: 10, right: 10, bottom: 25, left: 30 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const barWidth = innerWidth / data.length;
  const barPadding = 1;

  const yTicks = [0, maxValue * 0.5, maxValue];

  return (
    <Card className={styles.chartCard} data-testid="admin-metrics-trend">
      <CardContent className={styles.chartCardContent}>
        <div>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 0.75rem',
              letterSpacing: '-0.01em',
            }}
          >
            日次イベント数（30日）
          </h3>
          <svg
            width="100%"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Y-axis grid lines */}
              {yTicks.map((tick, i) => {
                const y = innerHeight - (tick / maxValue) * innerHeight;
                return (
                  <g key={i}>
                    <line
                      x1={0}
                      y1={y}
                      x2={innerWidth}
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth={1}
                    />
                    <text
                      x={-5}
                      y={y + 3}
                      textAnchor="end"
                      fontSize={10}
                      fill="#71717a"
                      fontWeight={600}
                    >
                      {Math.round(tick)}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {data.map((point, i) => {
                const barHeight = (point.y / maxValue) * innerHeight;
                const x = i * barWidth + barPadding;
                const y = innerHeight - barHeight;
                const width = barWidth - barPadding * 2;

                return (
                  <rect
                    key={point.x}
                    x={x}
                    y={y}
                    width={Math.max(width, 1)}
                    height={Math.max(barHeight, 0)}
                    fill="url(#barGradient)"
                    rx={2}
                    style={{ transition: 'height 0.3s ease, y 0.3s ease' }}
                  />
                );
              })}

              {/* X-axis labels (every 5 days) */}
              {data.map((point, i) => {
                if (i % 5 !== 0) return null;
                const x = i * barWidth + barWidth / 2;
                return (
                  <text
                    key={`label-${point.x}`}
                    x={x}
                    y={innerHeight + 15}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#71717a"
                    fontWeight={500}
                  >
                    {point.x.slice(5)}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
