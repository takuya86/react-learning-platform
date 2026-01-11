/**
 * Clickable Heatmap
 *
 * LearningHeatmapにクリック機能を追加したラッパー
 * クリック時にドリルダウンモーダルを表示
 */

import { useState, useCallback } from 'react';
import { LearningHeatmap, type HeatmapDay } from '@/features/metrics';
import { HeatmapDrilldownModal } from './HeatmapDrilldownModal';
import styles from './ClickableHeatmap.module.css';

interface ClickableHeatmapProps {
  data: HeatmapDay[];
  title?: string;
}

export function ClickableHeatmap({ data, title = 'Learning Activity' }: ClickableHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const dayElement = target.closest('[data-date]') as HTMLElement | null;

    if (dayElement && dayElement.dataset.date) {
      setSelectedDate(dayElement.dataset.date);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedDate(null);
  }, []);

  return (
    <div data-testid="clickable-heatmap">
      <div
        className={styles.clickableWrapper}
        onClick={handleDayClick}
        role="button"
        tabIndex={0}
        aria-label="学習履歴のヒートマップ。日をクリックして詳細を表示"
        onKeyDown={(e) => {
          // Allow keyboard navigation
          if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target as HTMLElement;
            const dayElement = target.closest('[data-date]') as HTMLElement | null;
            if (dayElement?.dataset.date) {
              setSelectedDate(dayElement.dataset.date);
            }
          }
        }}
      >
        <LearningHeatmap data={data} title={title} />
      </div>

      {selectedDate && <HeatmapDrilldownModal date={selectedDate} onClose={handleCloseModal} />}
    </div>
  );
}
