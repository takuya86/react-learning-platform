/**
 * XP獲得表示コンポーネント
 */

import { memo, useEffect, useState } from 'react';
import { Flame, PartyPopper } from 'lucide-react';
import type { XPGain } from '../types';
import { getXPReasonLabel } from '../services/bonusService';
import styles from './XPGainIndicator.module.css';

interface XPGainIndicatorProps {
  xpGain: XPGain;
  onAnimationComplete?: () => void;
}

export const XPGainIndicator = memo(function XPGainIndicator({
  xpGain,
  onAnimationComplete,
}: XPGainIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const hasBonus = xpGain.bonusMultiplier > 1;
  const bonusPercent = hasBonus ? Math.round((xpGain.bonusMultiplier - 1) * 100) : 0;

  return (
    <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.content}>
        <span className={styles.amount}>+{xpGain.amount} XP</span>
        <span className={styles.reason}>{getXPReasonLabel(xpGain.reason)}</span>
        {hasBonus && (
          <span className={styles.bonus}>
            <Flame size={14} style={{ verticalAlign: 'middle' }} /> +{bonusPercent}% ボーナス
          </span>
        )}
      </div>
    </div>
  );
});

/**
 * レベルアップ通知
 */
interface LevelUpIndicatorProps {
  newLevel: number;
  levelTitle: string;
  onClose: () => void;
}

export const LevelUpIndicator = memo(function LevelUpIndicator({
  newLevel,
  levelTitle,
  onClose,
}: LevelUpIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${styles.levelUpContainer} ${isVisible ? styles.levelUpVisible : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.levelUpContent}>
        <div className={styles.levelUpIcon}>
          <PartyPopper size={32} />
        </div>
        <div className={styles.levelUpText}>
          <span className={styles.levelUpLabel}>レベルアップ!</span>
          <span className={styles.levelUpLevel}>Lv.{newLevel}</span>
          <span className={styles.levelUpTitle}>{levelTitle}</span>
        </div>
      </div>
    </div>
  );
});
