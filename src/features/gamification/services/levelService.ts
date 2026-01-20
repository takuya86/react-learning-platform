/**
 * レベル・XP計算サービス
 * 純粋関数でレベルとXPの計算を行う
 */

import { LEVELS, MAX_LEVEL } from '../constants';
import type { LevelDefinition } from '../types';

/**
 * XPからレベルを計算
 * [spec-lock] レベル閾値は constants.ts の LEVELS で定義
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;

  for (const levelDef of LEVELS) {
    if (totalXP >= levelDef.requiredXP) {
      level = levelDef.level;
    } else {
      break;
    }
  }

  return level;
}

/**
 * 現在のレベル定義を取得
 */
export function getLevelDefinition(level: number): LevelDefinition {
  const def = LEVELS.find((l) => l.level === level);
  return def || LEVELS[0];
}

/**
 * 次のレベル定義を取得
 * 最大レベルの場合はnullを返す
 */
export function getNextLevelDefinition(currentLevel: number): LevelDefinition | null {
  if (currentLevel >= MAX_LEVEL) {
    return null;
  }
  return LEVELS.find((l) => l.level === currentLevel + 1) || null;
}

/**
 * 現在レベルの進捗を計算
 * @returns 0-100 のパーセンテージ
 */
export function calculateLevelProgress(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const currentDef = getLevelDefinition(currentLevel);
  const nextDef = getNextLevelDefinition(currentLevel);

  // 最大レベルの場合は100%
  if (!nextDef) {
    return 100;
  }

  const currentLevelXP = totalXP - currentDef.requiredXP;
  const xpForNextLevel = nextDef.requiredXP - currentDef.requiredXP;

  if (xpForNextLevel <= 0) {
    return 100;
  }

  return Math.min(100, Math.floor((currentLevelXP / xpForNextLevel) * 100));
}

/**
 * 次のレベルまでに必要なXP
 */
export function getXPToNextLevel(totalXP: number): number | null {
  const currentLevel = calculateLevel(totalXP);
  const nextDef = getNextLevelDefinition(currentLevel);

  if (!nextDef) {
    return null; // 最大レベル
  }

  return nextDef.requiredXP - totalXP;
}

/**
 * レベルアップしたかチェック
 */
export function checkLevelUp(
  previousXP: number,
  newXP: number
): { leveledUp: boolean; newLevel: number; previousLevel: number } {
  const previousLevel = calculateLevel(previousXP);
  const newLevel = calculateLevel(newXP);

  return {
    leveledUp: newLevel > previousLevel,
    newLevel,
    previousLevel,
  };
}

/**
 * レベルの称号を取得
 */
export function getLevelTitle(level: number): string {
  const def = getLevelDefinition(level);
  return def.title;
}

/**
 * 全レベル情報を取得（進捗表示用）
 */
export function getAllLevelsWithProgress(totalXP: number): Array<{
  level: LevelDefinition;
  achieved: boolean;
  current: boolean;
}> {
  const currentLevel = calculateLevel(totalXP);

  return LEVELS.map((level) => ({
    level,
    achieved: totalXP >= level.requiredXP,
    current: level.level === currentLevel,
  }));
}
