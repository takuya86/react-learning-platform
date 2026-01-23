/**
 * ゲーミフィケーション機能の型定義
 */

// バッジカテゴリ
export type BadgeCategory = 'lesson' | 'streak' | 'quiz' | 'exercise';

// バッジ定義
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  condition: BadgeCondition;
}

// バッジ獲得条件
export type BadgeCondition =
  | { type: 'lessons_completed'; count: number }
  | { type: 'all_lessons_completed' }
  | { type: 'streak_days'; days: number }
  | { type: 'quizzes_completed'; count: number }
  | { type: 'quiz_perfect_score' }
  | { type: 'exercises_completed'; count: number };

// 獲得済みバッジ
export interface EarnedBadge {
  badgeId: string;
  earnedAt: string; // ISO 8601
}

// レベル定義
export interface LevelDefinition {
  level: number;
  requiredXP: number;
  title: string;
}

// XP獲得理由
export type XPReason =
  | 'lesson_completed'
  | 'quiz_completed'
  | 'quiz_perfect'
  | 'exercise_completed'
  | 'streak_bonus';

// XP獲得記録
export interface XPGain {
  amount: number;
  baseAmount: number;
  bonusMultiplier: number;
  reason: XPReason;
  referenceId?: string;
  timestamp: string;
}

// ユーザーのゲーミフィケーション状態
export interface GamificationState {
  totalXP: number;
  currentLevel: number;
  earnedBadges: EarnedBadge[];
  lastXPGain?: XPGain;
}

// XP計算の入力
export interface XPCalculationInput {
  reason: XPReason;
  streak: number;
  referenceId?: string;
}

// バッジ判定の入力
export interface BadgeCheckInput {
  completedLessons: string[];
  completedQuizzes: string[];
  completedExercises: string[];
  perfectQuizzes: string[];
  streak: number;
  totalLessons: number;
}

// 新規獲得バッジ
export interface NewBadge {
  badge: BadgeDefinition;
  earnedAt: string;
}

// デイリーチャレンジ関連の型定義

// チャレンジタイプ
export type ChallengeType = 'lesson_complete' | 'quiz_attempt' | 'streak_maintain' | 'visit_badges';

// チャレンジ定義
export interface ChallengeDefinition {
  id: ChallengeType;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

// チャレンジ達成状況
export interface ChallengeStatus {
  id: ChallengeType;
  completed: boolean;
}

// 日別チャレンジ進捗
export interface DailyChallengeProgress {
  date: string; // YYYY-MM-DD
  challenges: ChallengeStatus[];
  allCompleted: boolean;
  bonusXPAwarded: boolean;
}
