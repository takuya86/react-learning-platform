/**
 * バッジ判定サービス
 * 純粋関数でバッジの獲得判定を行う
 */

import { BADGES, BADGE_MAP } from '../constants';
import type { BadgeDefinition, BadgeCheckInput, EarnedBadge, NewBadge } from '../types';

/**
 * バッジ獲得条件をチェック
 * [spec-lock] バッジ条件は constants.ts で定義
 */
export function checkBadgeCondition(badge: BadgeDefinition, input: BadgeCheckInput): boolean {
  const { condition } = badge;

  switch (condition.type) {
    case 'lessons_completed':
      return input.completedLessons.length >= condition.count;

    case 'all_lessons_completed':
      return input.totalLessons > 0 && input.completedLessons.length >= input.totalLessons;

    case 'streak_days':
      return input.streak >= condition.days;

    case 'quizzes_completed':
      return input.completedQuizzes.length >= condition.count;

    case 'quiz_perfect_score':
      return input.perfectQuizzes.length > 0;

    case 'exercises_completed':
      return input.completedExercises.length >= condition.count;

    default:
      return false;
  }
}

/**
 * 新規獲得バッジを判定
 * 既に獲得済みのバッジは除外
 */
export function checkNewBadges(input: BadgeCheckInput, earnedBadgeIds: string[]): NewBadge[] {
  const earnedSet = new Set(earnedBadgeIds);
  const newBadges: NewBadge[] = [];
  const now = new Date().toISOString();

  for (const badge of BADGES) {
    // 既に獲得済みならスキップ
    if (earnedSet.has(badge.id)) {
      continue;
    }

    // 条件チェック
    if (checkBadgeCondition(badge, input)) {
      newBadges.push({
        badge,
        earnedAt: now,
      });
    }
  }

  return newBadges;
}

/**
 * バッジIDからバッジ定義を取得
 */
export function getBadgeById(badgeId: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(badgeId);
}

/**
 * 獲得済みバッジの一覧を取得（定義付き）
 */
export function getEarnedBadgesWithDefinitions(
  earnedBadges: EarnedBadge[]
): Array<{ badge: BadgeDefinition; earnedAt: string }> {
  return earnedBadges
    .map((earned) => {
      const badge = getBadgeById(earned.badgeId);
      if (!badge) return null;
      return { badge, earnedAt: earned.earnedAt };
    })
    .filter((item): item is { badge: BadgeDefinition; earnedAt: string } => item !== null);
}

/**
 * 全バッジと獲得状態を取得
 */
export function getAllBadgesWithStatus(earnedBadgeIds: string[]): Array<{
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt?: string;
}> {
  const earnedMap = new Map<string, string>();
  // Note: earnedAtは別途渡す必要があるが、簡略化のためここではearnedフラグのみ
  earnedBadgeIds.forEach((id) => earnedMap.set(id, ''));

  return BADGES.map((badge) => ({
    badge,
    earned: earnedMap.has(badge.id),
  }));
}

/**
 * カテゴリ別にバッジを取得
 */
export function getBadgesByCategory(category: BadgeDefinition['category']): BadgeDefinition[] {
  return BADGES.filter((badge) => badge.category === category);
}

/**
 * 次に獲得できそうなバッジを取得（進捗が近いもの）
 */
export function getNextAchievableBadges(
  input: BadgeCheckInput,
  earnedBadgeIds: string[],
  limit: number = 3
): Array<{ badge: BadgeDefinition; progress: number; target: number }> {
  const earnedSet = new Set(earnedBadgeIds);
  const candidates: Array<{
    badge: BadgeDefinition;
    progress: number;
    target: number;
    ratio: number;
  }> = [];

  for (const badge of BADGES) {
    if (earnedSet.has(badge.id)) continue;

    const { condition } = badge;
    let progress = 0;
    let target = 0;

    switch (condition.type) {
      case 'lessons_completed':
        progress = input.completedLessons.length;
        target = condition.count;
        break;
      case 'all_lessons_completed':
        progress = input.completedLessons.length;
        target = input.totalLessons;
        break;
      case 'streak_days':
        progress = input.streak;
        target = condition.days;
        break;
      case 'quizzes_completed':
        progress = input.completedQuizzes.length;
        target = condition.count;
        break;
      case 'quiz_perfect_score':
        progress = input.perfectQuizzes.length > 0 ? 1 : 0;
        target = 1;
        break;
      case 'exercises_completed':
        progress = input.completedExercises.length;
        target = condition.count;
        break;
    }

    if (target > 0 && progress < target) {
      candidates.push({
        badge,
        progress,
        target,
        ratio: progress / target,
      });
    }
  }

  // 進捗率が高い順にソート
  return candidates
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, limit)
    .map(({ badge, progress, target }) => ({ badge, progress, target }));
}
