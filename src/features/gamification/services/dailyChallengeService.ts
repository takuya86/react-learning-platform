/**
 * デイリーチャレンジサービス
 * チャレンジの定義、判定、進捗管理を提供
 */

import type { Progress } from '@/domain/types';
import type {
  ChallengeDefinition,
  ChallengeType,
  ChallengeStatus,
  DailyChallengeProgress,
} from '../types';

// チャレンジ定義
export const CHALLENGE_DEFINITIONS: Record<ChallengeType, ChallengeDefinition> = {
  lesson_complete: {
    id: 'lesson_complete',
    title: 'レッスンを完了',
    description: '今日1つレッスンを完了する',
    icon: '📚',
    xpReward: 10,
  },
  quiz_attempt: {
    id: 'quiz_attempt',
    title: 'クイズに挑戦',
    description: '今日1つクイズに挑戦する',
    icon: '🎯',
    xpReward: 10,
  },
  streak_maintain: {
    id: 'streak_maintain',
    title: '連続学習を維持',
    description: '連続学習日数を維持する',
    icon: '🔥',
    xpReward: 15,
  },
  visit_badges: {
    id: 'visit_badges',
    title: 'バッジを確認',
    description: 'バッジページを確認する',
    icon: '🏆',
    xpReward: 5,
  },
};

// ボーナスXP（全チャレンジ達成時）
export const DAILY_COMPLETION_BONUS_XP = 50;

/**
 * 今日の日付を取得 (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 日替わりでチャレンジを3つ選択
 * 日付から決定論的に選択（同じ日は同じチャレンジ）
 */
export function getTodayChallenges(date: string = getTodayDateString()): ChallengeType[] {
  const allTypes: ChallengeType[] = [
    'lesson_complete',
    'quiz_attempt',
    'streak_maintain',
    'visit_badges',
  ];

  // 日付から疑似乱数を生成（同じ日付は同じシード）
  const seed = date.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
  const seededRandom = (index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  // Fisher-Yatesシャッフル（シード付き）
  const shuffled = [...allTypes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 3つ選択
  return shuffled.slice(0, 3);
}

/**
 * チャレンジの達成状況を判定
 */
export function checkChallengeCompletion(
  challengeType: ChallengeType,
  progress: Progress,
  visitedBadgesToday: boolean
): boolean {
  const today = getTodayDateString();

  switch (challengeType) {
    case 'lesson_complete': {
      // 今日完了したレッスンがあるか
      return Object.values(progress.lessons).some((lesson) => {
        if (!lesson.completedAt) return false;
        const completedDate = lesson.completedAt.split('T')[0];
        return completedDate === today;
      });
    }

    case 'quiz_attempt': {
      // 今日挑戦したクイズがあるか
      return progress.quizAttempts.some((attempt) => {
        const attemptDate = attempt.attemptedAt.split('T')[0];
        return attemptDate === today;
      });
    }

    case 'streak_maintain': {
      // 連続学習が1日以上維持されているか
      return progress.streak >= 1;
    }

    case 'visit_badges': {
      // バッジページを訪問したか（フック側で管理）
      return visitedBadgesToday;
    }

    default:
      return false;
  }
}

/**
 * 今日のチャレンジ進捗を取得
 */
export function getTodayChallengeProgress(
  progress: Progress,
  visitedBadgesToday: boolean,
  storedProgress?: DailyChallengeProgress
): DailyChallengeProgress {
  const today = getTodayDateString();
  const todayChallenges = getTodayChallenges(today);

  // 保存済みの進捗が今日のものなら使用
  if (storedProgress && storedProgress.date === today) {
    // ただし達成状況は最新の状態で再計算
    const challenges: ChallengeStatus[] = todayChallenges.map((id) => ({
      id,
      completed: checkChallengeCompletion(id, progress, visitedBadgesToday),
    }));

    const allCompleted = challenges.every((c) => c.completed);

    return {
      ...storedProgress,
      challenges,
      allCompleted,
    };
  }

  // 新しい日の進捗を作成
  const challenges: ChallengeStatus[] = todayChallenges.map((id) => ({
    id,
    completed: checkChallengeCompletion(id, progress, visitedBadgesToday),
  }));

  const allCompleted = challenges.every((c) => c.completed);

  return {
    date: today,
    challenges,
    allCompleted,
    bonusXPAwarded: false,
  };
}

/**
 * 全チャレンジ達成でボーナスXPを付与すべきか判定
 */
export function shouldAwardBonusXP(dailyProgress: DailyChallengeProgress): boolean {
  return dailyProgress.allCompleted && !dailyProgress.bonusXPAwarded;
}

/**
 * ボーナスXP付与済みにマーク
 */
export function markBonusXPAwarded(dailyProgress: DailyChallengeProgress): DailyChallengeProgress {
  return {
    ...dailyProgress,
    bonusXPAwarded: true,
  };
}
