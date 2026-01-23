/**
 * デイリーチャレンジ管理フック
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useProgress } from '@/features/progress';
import {
  getTodayChallenges,
  getTodayChallengeProgress,
  shouldAwardBonusXP,
  markBonusXPAwarded,
  CHALLENGE_DEFINITIONS,
  DAILY_COMPLETION_BONUS_XP,
  getTodayDateString,
} from '../services/dailyChallengeService';
import type { ChallengeDefinition, DailyChallengeProgress } from '../types';

const STORAGE_KEY = 'react-learning-daily-challenge';
const BADGE_VISIT_KEY = 'react-learning-badge-visit-date';

export interface ChallengeWithStatus extends ChallengeDefinition {
  completed: boolean;
}

export interface UseDailyChallengeReturn {
  challenges: ChallengeWithStatus[];
  progress: number;
  allCompleted: boolean;
  bonusXPAwarded: boolean;
  totalXP: number;
  markBadgeVisited: () => void;
  onBonusXPClaimed: () => void;
}

export function useDailyChallenge(onBonusXP?: (amount: number) => void): UseDailyChallengeReturn {
  const { progress } = useProgress();
  const [dailyProgress, setDailyProgress] = useLocalStorage<DailyChallengeProgress | null>(
    STORAGE_KEY,
    null
  );
  const [badgeVisitDate, setBadgeVisitDate] = useLocalStorage<string | null>(BADGE_VISIT_KEY, null);

  // 今日バッジページを訪問したか
  const visitedBadgesToday = useMemo(() => {
    const today = getTodayDateString();
    return badgeVisitDate === today;
  }, [badgeVisitDate]);

  // 今日のチャレンジ進捗を計算
  const currentProgress = useMemo(() => {
    return getTodayChallengeProgress(progress, visitedBadgesToday, dailyProgress ?? undefined);
  }, [progress, visitedBadgesToday, dailyProgress]);

  // LocalStorageに保存
  useEffect(() => {
    setDailyProgress(currentProgress);
  }, [currentProgress, setDailyProgress]);

  // ボーナスXP自動付与（全達成時）
  useEffect(() => {
    if (shouldAwardBonusXP(currentProgress)) {
      onBonusXP?.(DAILY_COMPLETION_BONUS_XP);
      setDailyProgress(markBonusXPAwarded(currentProgress));
    }
  }, [currentProgress, onBonusXP, setDailyProgress]);

  // チャレンジと達成状況を結合
  const challenges = useMemo((): ChallengeWithStatus[] => {
    const todayChallenges = getTodayChallenges();
    return todayChallenges.map((type) => {
      const definition = CHALLENGE_DEFINITIONS[type];
      const status = currentProgress.challenges.find((c) => c.id === type);
      return {
        ...definition,
        completed: status?.completed ?? false,
      };
    });
  }, [currentProgress]);

  // 進捗率（0-100）
  const progressPercentage = useMemo(() => {
    const completedCount = challenges.filter((c) => c.completed).length;
    return Math.round((completedCount / challenges.length) * 100);
  }, [challenges]);

  // 獲得可能な合計XP
  const totalXP = useMemo(() => {
    const challengeXP = challenges.reduce((sum, c) => sum + c.xpReward, 0);
    return challengeXP + DAILY_COMPLETION_BONUS_XP;
  }, [challenges]);

  // バッジページ訪問をマーク
  const markBadgeVisited = useCallback(() => {
    const today = getTodayDateString();
    setBadgeVisitDate(today);
  }, [setBadgeVisitDate]);

  // ボーナスXP請求完了（外部から呼ばれる）
  const onBonusXPClaimed = useCallback(() => {
    setDailyProgress((prev) => {
      if (!prev) return prev;
      return markBonusXPAwarded(prev);
    });
  }, [setDailyProgress]);

  return {
    challenges,
    progress: progressPercentage,
    allCompleted: currentProgress.allCompleted,
    bonusXPAwarded: currentProgress.bonusXPAwarded,
    totalXP,
    markBadgeVisited,
    onBonusXPClaimed,
  };
}
