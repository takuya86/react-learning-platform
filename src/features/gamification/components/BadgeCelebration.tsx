/**
 * バッジ獲得時の派手なアニメーション演出コンポーネント
 * 画面中央にモーダル風のオーバーレイを表示
 */

import { memo, useEffect, useState, useCallback } from 'react';
import type { NewBadge } from '../types';
import styles from './BadgeCelebration.module.css';

interface BadgeCelebrationProps {
  newBadge: NewBadge;
  onClose: () => void;
  autoCloseMs?: number;
}

export const BadgeCelebration = memo(function BadgeCelebration({
  newBadge,
  onClose,
  autoCloseMs = 3000,
}: BadgeCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 500); // アニメーション完了後にクローズ
  }, [onClose]);

  const handleOverlayClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    // コンテンツクリックでは閉じない
    e.stopPropagation();
  }, []);

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
      className={`${styles.overlay} ${isVisible ? styles.visible : ''} ${isClosing ? styles.closing : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-celebration-title"
      aria-describedby="badge-celebration-description"
    >
      {/* パーティクルエフェクト */}
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{ '--index': i } as React.CSSProperties}
          />
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className={styles.content} onClick={handleContentClick}>
        {/* キラキラエフェクト */}
        <div className={styles.sparkles} aria-hidden="true">
          <span className={styles.sparkle} style={{ '--delay': '0s' } as React.CSSProperties}>
            ✨
          </span>
          <span className={styles.sparkle} style={{ '--delay': '0.2s' } as React.CSSProperties}>
            ✨
          </span>
          <span className={styles.sparkle} style={{ '--delay': '0.4s' } as React.CSSProperties}>
            ✨
          </span>
          <span className={styles.sparkle} style={{ '--delay': '0.6s' } as React.CSSProperties}>
            ⭐
          </span>
          <span className={styles.sparkle} style={{ '--delay': '0.8s' } as React.CSSProperties}>
            ✨
          </span>
        </div>

        {/* おめでとうテキスト */}
        <h2 className={styles.congratsText} id="badge-celebration-title">
          🎉 おめでとう！ 🎉
        </h2>

        {/* バッジアイコン */}
        <div className={styles.badgeIconWrapper}>
          <div className={styles.badgeGlow} aria-hidden="true" />
          <span className={styles.badgeIcon}>{newBadge.badge.icon}</span>
        </div>

        {/* バッジ情報 */}
        <div className={styles.badgeInfo} id="badge-celebration-description">
          <h3 className={styles.badgeName}>{newBadge.badge.name}</h3>
          <p className={styles.badgeDescription}>{newBadge.badge.description}</p>
        </div>

        {/* 閉じるヒント */}
        <p className={styles.closeHint}>クリックで閉じる</p>
      </div>
    </div>
  );
});

/**
 * 複数バッジ獲得時の順番表示コンテナ
 */
interface BadgeCelebrationContainerProps {
  notifications: NewBadge[];
  onClear: (badgeId: string) => void;
}

export const BadgeCelebrationContainer = memo(function BadgeCelebrationContainer({
  notifications,
  onClear,
}: BadgeCelebrationContainerProps) {
  // 現在表示中のバッジ（先頭のみ）
  const currentBadge = notifications[0];

  if (!currentBadge) {
    return null;
  }

  return (
    <BadgeCelebration newBadge={currentBadge} onClose={() => onClear(currentBadge.badge.id)} />
  );
});
