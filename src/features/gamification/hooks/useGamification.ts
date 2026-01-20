/**
 * ゲーミフィケーション統合フック
 * バッジ、レベル、XPの状態管理と操作を提供
 */

import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useProgress } from '@/features/progress';
import { getAllLessons } from '@/lib/lessons';
import { GAMIFICATION_STORAGE_KEY } from '../constants';
import {
  checkNewBadges,
  getEarnedBadgesWithDefinitions,
  getNextAchievableBadges,
  getAllBadgesWithStatus,
} from '../services/badgeService';
import {
  calculateLevel,
  getLevelDefinition,
  calculateLevelProgress,
  getXPToNextLevel,
  checkLevelUp,
} from '../services/levelService';
import {
  calculateXPGain,
  getStreakBonusMultiplier,
  getStreakBonusDescription,
} from '../services/bonusService';
import type {
  GamificationState,
  EarnedBadge,
  XPGain,
  XPReason,
  NewBadge,
  BadgeCheckInput,
} from '../types';

// 初期状態
const initialGamificationState: GamificationState = {
  totalXP: 0,
  currentLevel: 1,
  earnedBadges: [],
  lastXPGain: undefined,
};

export interface UseGamificationReturn {
  // 状態
  totalXP: number;
  currentLevel: number;
  levelTitle: string;
  levelProgress: number;
  xpToNextLevel: number | null;
  earnedBadges: EarnedBadge[];
  lastXPGain?: XPGain;
  streakBonusMultiplier: number;
  streakBonusDescription: string | null;

  // バッジ関連
  earnedBadgesWithDefinitions: ReturnType<typeof getEarnedBadgesWithDefinitions>;
  allBadgesWithStatus: ReturnType<typeof getAllBadgesWithStatus>;
  nextAchievableBadges: ReturnType<typeof getNextAchievableBadges>;

  // アクション
  addXP: (
    reason: XPReason,
    referenceId?: string
  ) => {
    xpGain: XPGain;
    leveledUp: boolean;
    newLevel?: number;
    newBadges: NewBadge[];
  };
  checkAndAwardBadges: () => NewBadge[];

  // 通知用
  pendingNotifications: NewBadge[];
  clearNotification: (badgeId: string) => void;
  clearAllNotifications: () => void;
}

export function useGamification(): UseGamificationReturn {
  const { progress } = useProgress();

  const [gamificationState, setGamificationState] = useLocalStorage<GamificationState>(
    GAMIFICATION_STORAGE_KEY,
    initialGamificationState
  );

  // 通知キュー（新規獲得バッジ）
  const [pendingNotifications, setPendingNotifications] = useState<NewBadge[]>([]);

  // レッスン総数
  const totalLessons = useMemo(() => getAllLessons().length, []);

  // バッジチェック用の入力データ
  const badgeCheckInput = useMemo((): BadgeCheckInput => {
    // 完了したレッスンIDを取得
    const completedLessons = Object.entries(progress.lessons)
      .filter(([, lessonProgress]) => lessonProgress.completedAt)
      .map(([lessonId]) => lessonId);

    // 満点クイズを取得
    const perfectQuizzes = progress.quizAttempts
      .filter((attempt) => attempt.score === attempt.totalQuestions)
      .map((attempt) => attempt.quizId);

    return {
      completedLessons,
      completedQuizzes: progress.completedQuizzes,
      completedExercises: progress.completedExercises,
      perfectQuizzes: [...new Set(perfectQuizzes)], // 重複排除
      streak: progress.streak,
      totalLessons,
    };
  }, [progress, totalLessons]);

  // ストリークボーナス
  const streakBonusMultiplier = useMemo(
    () => getStreakBonusMultiplier(progress.streak),
    [progress.streak]
  );

  const streakBonusDescription = useMemo(
    () => getStreakBonusDescription(progress.streak),
    [progress.streak]
  );

  // レベル関連の計算値
  const currentLevel = useMemo(
    () => calculateLevel(gamificationState.totalXP),
    [gamificationState.totalXP]
  );

  const levelDefinition = useMemo(() => getLevelDefinition(currentLevel), [currentLevel]);

  const levelProgress = useMemo(
    () => calculateLevelProgress(gamificationState.totalXP),
    [gamificationState.totalXP]
  );

  const xpToNextLevel = useMemo(
    () => getXPToNextLevel(gamificationState.totalXP),
    [gamificationState.totalXP]
  );

  // バッジ関連の計算値
  const earnedBadgeIds = useMemo(
    () => gamificationState.earnedBadges.map((b) => b.badgeId),
    [gamificationState.earnedBadges]
  );

  const earnedBadgesWithDefinitions = useMemo(
    () => getEarnedBadgesWithDefinitions(gamificationState.earnedBadges),
    [gamificationState.earnedBadges]
  );

  const allBadgesWithStatus = useMemo(
    () => getAllBadgesWithStatus(earnedBadgeIds),
    [earnedBadgeIds]
  );

  const nextAchievableBadges = useMemo(
    () => getNextAchievableBadges(badgeCheckInput, earnedBadgeIds, 3),
    [badgeCheckInput, earnedBadgeIds]
  );

  // XPを追加
  const addXP = useCallback(
    (reason: XPReason, referenceId?: string) => {
      const xpGain = calculateXPGain({
        reason,
        streak: progress.streak,
        referenceId,
      });

      const previousXP = gamificationState.totalXP;
      const newTotalXP = previousXP + xpGain.amount;

      // レベルアップチェック
      const levelUpResult = checkLevelUp(previousXP, newTotalXP);

      // バッジチェック
      const newBadges = checkNewBadges(badgeCheckInput, earnedBadgeIds);

      // 状態更新
      setGamificationState((prev) => ({
        ...prev,
        totalXP: newTotalXP,
        currentLevel: levelUpResult.newLevel,
        lastXPGain: xpGain,
        earnedBadges: [
          ...prev.earnedBadges,
          ...newBadges.map((nb) => ({
            badgeId: nb.badge.id,
            earnedAt: nb.earnedAt,
          })),
        ],
      }));

      // 通知キューに追加
      if (newBadges.length > 0) {
        setPendingNotifications((prev) => [...prev, ...newBadges]);
      }

      return {
        xpGain,
        leveledUp: levelUpResult.leveledUp,
        newLevel: levelUpResult.leveledUp ? levelUpResult.newLevel : undefined,
        newBadges,
      };
    },
    [
      progress.streak,
      gamificationState.totalXP,
      badgeCheckInput,
      earnedBadgeIds,
      setGamificationState,
    ]
  );

  // バッジをチェックして付与
  const checkAndAwardBadges = useCallback(() => {
    const newBadges = checkNewBadges(badgeCheckInput, earnedBadgeIds);

    if (newBadges.length > 0) {
      setGamificationState((prev) => ({
        ...prev,
        earnedBadges: [
          ...prev.earnedBadges,
          ...newBadges.map((nb) => ({
            badgeId: nb.badge.id,
            earnedAt: nb.earnedAt,
          })),
        ],
      }));

      setPendingNotifications((prev) => [...prev, ...newBadges]);
    }

    return newBadges;
  }, [badgeCheckInput, earnedBadgeIds, setGamificationState]);

  // 通知をクリア
  const clearNotification = useCallback((badgeId: string) => {
    setPendingNotifications((prev) => prev.filter((n) => n.badge.id !== badgeId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setPendingNotifications([]);
  }, []);

  return {
    // 状態
    totalXP: gamificationState.totalXP,
    currentLevel,
    levelTitle: levelDefinition.title,
    levelProgress,
    xpToNextLevel,
    earnedBadges: gamificationState.earnedBadges,
    lastXPGain: gamificationState.lastXPGain,
    streakBonusMultiplier,
    streakBonusDescription,

    // バッジ関連
    earnedBadgesWithDefinitions,
    allBadgesWithStatus,
    nextAchievableBadges,

    // アクション
    addXP,
    checkAndAwardBadges,

    // 通知用
    pendingNotifications,
    clearNotification,
    clearAllNotifications,
  };
}
