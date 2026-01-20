/**
 * ゲーミフィケーション機能の定数定義
 */

import type { BadgeDefinition, LevelDefinition } from './types';

// ========================================
// バッジ定義
// ========================================

export const BADGES: BadgeDefinition[] = [
  // レッスン系バッジ
  {
    id: 'first-lesson',
    name: 'はじめの一歩',
    description: '最初のレッスンを完了しました',
    icon: '🌱',
    category: 'lesson',
    condition: { type: 'lessons_completed', count: 1 },
  },
  {
    id: 'lesson-5',
    name: '学習者',
    description: '5つのレッスンを完了しました',
    icon: '📚',
    category: 'lesson',
    condition: { type: 'lessons_completed', count: 5 },
  },
  {
    id: 'lesson-10',
    name: '探求者',
    description: '10のレッスンを完了しました',
    icon: '🔍',
    category: 'lesson',
    condition: { type: 'lessons_completed', count: 10 },
  },
  {
    id: 'lesson-20',
    name: '熟練者',
    description: '20のレッスンを完了しました',
    icon: '🎓',
    category: 'lesson',
    condition: { type: 'lessons_completed', count: 20 },
  },
  {
    id: 'all-lessons',
    name: 'マスター',
    description: '全てのレッスンを完了しました',
    icon: '👑',
    category: 'lesson',
    condition: { type: 'all_lessons_completed' },
  },

  // ストリーク系バッジ
  {
    id: 'streak-3',
    name: '継続の芽',
    description: '3日連続で学習しました',
    icon: '🌿',
    category: 'streak',
    condition: { type: 'streak_days', days: 3 },
  },
  {
    id: 'streak-7',
    name: '習慣形成',
    description: '7日連続で学習しました',
    icon: '🔥',
    category: 'streak',
    condition: { type: 'streak_days', days: 7 },
  },
  {
    id: 'streak-30',
    name: '鉄人',
    description: '30日連続で学習しました',
    icon: '💎',
    category: 'streak',
    condition: { type: 'streak_days', days: 30 },
  },

  // クイズ系バッジ
  {
    id: 'quiz-perfect',
    name: '完璧主義者',
    description: 'クイズで満点を達成しました',
    icon: '⭐',
    category: 'quiz',
    condition: { type: 'quiz_perfect_score' },
  },
  {
    id: 'quiz-10',
    name: 'クイズマスター',
    description: '10個のクイズを完了しました',
    icon: '🧠',
    category: 'quiz',
    condition: { type: 'quizzes_completed', count: 10 },
  },

  // 演習系バッジ
  {
    id: 'exercise-5',
    name: '実践者',
    description: '5つの演習を完了しました',
    icon: '💪',
    category: 'exercise',
    condition: { type: 'exercises_completed', count: 5 },
  },
];

// バッジをIDで検索するためのマップ
export const BADGE_MAP = new Map<string, BadgeDefinition>(BADGES.map((badge) => [badge.id, badge]));

// ========================================
// レベル定義
// ========================================

export const LEVELS: LevelDefinition[] = [
  { level: 1, requiredXP: 0, title: '入門者' },
  { level: 2, requiredXP: 200, title: '見習い' },
  { level: 3, requiredXP: 500, title: '学習者' },
  { level: 4, requiredXP: 1000, title: '探求者' },
  { level: 5, requiredXP: 2000, title: '実践者' },
  { level: 6, requiredXP: 3500, title: '熟練者' },
  { level: 7, requiredXP: 5500, title: 'エキスパート' },
  { level: 8, requiredXP: 8000, title: 'マスター' },
  { level: 9, requiredXP: 11000, title: '達人' },
  { level: 10, requiredXP: 15000, title: '伝説' },
];

export const MAX_LEVEL = LEVELS.length;

// ========================================
// XP設定
// ========================================

export const XP_VALUES = {
  lesson_completed: 100,
  quiz_completed: 50,
  quiz_perfect: 30, // ボーナス
  exercise_completed: 75,
  streak_bonus_per_day: 20,
} as const;

// ストリークボーナス倍率
export const STREAK_BONUS_MULTIPLIERS = [
  { minDays: 30, multiplier: 1.5 }, // +50%
  { minDays: 14, multiplier: 1.3 }, // +30%
  { minDays: 7, multiplier: 1.2 }, // +20%
  { minDays: 3, multiplier: 1.1 }, // +10%
] as const;

// デフォルト倍率（ストリーク3日未満）
export const DEFAULT_MULTIPLIER = 1.0;

// ========================================
// LocalStorageキー
// ========================================

export const GAMIFICATION_STORAGE_KEY = 'react-learning-gamification';
