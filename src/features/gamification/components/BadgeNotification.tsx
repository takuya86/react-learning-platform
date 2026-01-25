/**
 * バッジ獲得通知コンポーネント
 */

import { memo, useEffect, useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { BadgeIcon } from './BadgeIcon';
import type { NewBadge } from '../types';
import styles from './BadgeNotification.module.css';

interface BadgeNotificationProps {
  newBadge: NewBadge;
  onClose: () => void;
  autoCloseMs?: number;
}

export const BadgeNotification = memo(function BadgeNotification({
  newBadge,
  onClose,
  autoCloseMs = 5000,
}: BadgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 300); // アニメーション完了後にクローズ
  }, [onClose]);

  useEffect(() => {
    // 表示アニメーション開始
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // 自動クローズ
    const closeTimer = setTimeout(() => {
      handleClose();
    }, autoCloseMs);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, [autoCloseMs, handleClose]);

  return (
    <div
      className={`${styles.container} ${isVisible ? styles.visible : ''} ${isClosing ? styles.closing : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>
            <BadgeIcon icon={newBadge.badge.icon} size={32} />
          </span>
          <span className={styles.sparkle}>
            <Sparkles size={16} />
          </span>
        </div>
        <div className={styles.info}>
          <span className={styles.label}>バッジ獲得!</span>
          <span className={styles.name}>{newBadge.badge.name}</span>
          <span className={styles.description}>{newBadge.badge.description}</span>
        </div>
        <button className={styles.closeButton} onClick={handleClose} aria-label="閉じる">
          ×
        </button>
      </div>
    </div>
  );
});

/**
 * 複数バッジ通知のコンテナ
 */
interface BadgeNotificationContainerProps {
  notifications: NewBadge[];
  onClear: (badgeId: string) => void;
}

export const BadgeNotificationContainer = memo(function BadgeNotificationContainer({
  notifications,
  onClear,
}: BadgeNotificationContainerProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <BadgeNotification
          key={notification.badge.id}
          newBadge={notification}
          onClose={() => onClear(notification.badge.id)}
        />
      ))}
    </div>
  );
});
