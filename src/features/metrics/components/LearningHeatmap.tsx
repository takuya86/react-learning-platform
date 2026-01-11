/**
 * Learning Heatmap Component
 *
 * GitHub Contributions風の学習ヒートマップ
 *
 * ## 仕様
 * - 表示期間: 直近12週間（84日）
 * - 色段階（4段階）: level 0-3
 * - hover で「YYYY-MM-DD / X events」表示
 */

import { useState, useMemo, useCallback } from 'react';
import { type HeatmapDay, groupByWeek } from '../services/heatmapService';
import styles from './LearningHeatmap.module.css';

interface LearningHeatmapProps {
  data: HeatmapDay[];
  title?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}

export function LearningHeatmap({ data, title = 'Learning Activity' }: LearningHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });

  const weeks = useMemo(() => groupByWeek(data), [data]);

  const handleMouseEnter = useCallback(
    (day: HeatmapDay, event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const eventText = day.count === 1 ? 'event' : 'events';
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        content: `${day.date} / ${day.count} ${eventText}`,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const getLevelClass = (level: HeatmapDay['level']) => {
    switch (level) {
      case 0:
        return styles.level0;
      case 1:
        return styles.level1;
      case 2:
        return styles.level2;
      case 3:
        return styles.level3;
    }
  };

  return (
    <div className={styles.container} data-testid="heatmap">
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className={styles.week}>
            {week.map((day) => (
              <div
                key={day.date}
                className={`${styles.day} ${getLevelClass(day.level)}`}
                data-testid="heatmap-day"
                data-date={day.date}
                data-level={day.level}
                onMouseEnter={(e) => handleMouseEnter(day, e)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span>Less</span>
        <div className={styles.legend}>
          <div className={`${styles.legendDay} ${styles.level0}`} />
          <div className={`${styles.legendDay} ${styles.level1}`} />
          <div className={`${styles.legendDay} ${styles.level2}`} />
          <div className={`${styles.legendDay} ${styles.level3}`} />
        </div>
        <span>More</span>
      </div>

      {tooltip.visible && (
        <div
          className={styles.tooltip}
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
