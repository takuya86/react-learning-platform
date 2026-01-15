/**
 * Heatmap Drilldown Modal
 *
 * ヒートマップの日をクリックした時の詳細表示
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, NotebookText, Pin, MailX } from 'lucide-react';
import { useDailyEvents } from '../hooks/useDailyEvents';
import {
  formatDateForDisplay,
  getDayOfWeekJapanese,
  type EventIconName,
} from '../services/dailyEventsService';
import styles from './HeatmapDrilldownModal.module.css';

const eventIconMap: Record<EventIconName, React.ReactNode> = {
  'book-open': <BookOpen size={16} />,
  'file-text': <FileText size={16} />,
  notebook: <NotebookText size={16} />,
  pin: <Pin size={16} />,
};

interface HeatmapDrilldownModalProps {
  date: string;
  onClose: () => void;
}

export function HeatmapDrilldownModal({ date, onClose }: HeatmapDrilldownModalProps) {
  const { result, isLoading, error, fetchEvents } = useDailyEvents();

  useEffect(() => {
    fetchEvents(date);
  }, [date, fetchEvents]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const displayDate = formatDateForDisplay(date);
  const dayOfWeek = getDayOfWeekJapanese(date);

  return (
    <div className={styles.overlay} onClick={onClose} data-testid="heatmap-drilldown-overlay">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        data-testid="heatmap-drilldown-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drilldown-title"
      >
        <div className={styles.header}>
          <h2 id="drilldown-title" className={styles.title}>
            {displayDate}（{dayOfWeek}）
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {isLoading && <div className={styles.loadingState}>読み込み中...</div>}

          {error && <div className={styles.errorState}>エラー: {error}</div>}

          {!isLoading && !error && result?.isEmpty && (
            <div className={styles.emptyState} data-testid="drilldown-empty">
              <span className={styles.emptyIcon}>
                <MailX size={24} />
              </span>
              <p className={styles.emptyText}>この日は未学習です</p>
              <p className={styles.emptySubtext}>学習を始めて記録を残しましょう</p>
            </div>
          )}

          {!isLoading && !error && result && !result.isEmpty && (
            <>
              <div className={styles.summary}>
                <span className={styles.summaryCount}>{result.totalCount}</span>
                <span className={styles.summaryLabel}>件の学習活動</span>
              </div>

              <ul className={styles.eventList} data-testid="drilldown-event-list">
                {result.events.map((event) => (
                  <li key={event.id} className={styles.eventItem}>
                    <span className={styles.eventIcon}>{eventIconMap[event.displayIconName]}</span>
                    <div className={styles.eventContent}>
                      <span className={styles.eventTitle}>{event.displayTitle}</span>
                      {event.referenceId && (
                        <span className={styles.eventReference}>{event.referenceId}</span>
                      )}
                    </div>
                    {event.linkPath && (
                      <Link to={event.linkPath} className={styles.eventLink} onClick={onClose}>
                        開く
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
