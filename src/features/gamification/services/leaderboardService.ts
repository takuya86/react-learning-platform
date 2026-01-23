/**
 * リーダーボードサービス
 * モックデータでXPランキングを生成
 */

import { calculateLevel, getLevelDefinition } from './levelService';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  levelTitle: string;
  isCurrentUser: boolean;
}

// ダミーユーザー名
const DUMMY_USERS = [
  '田中太郎',
  '佐藤花子',
  '鈴木一郎',
  '高橋美咲',
  '伊藤健太',
  '渡辺さくら',
  '山本大輔',
  '中村あおい',
  '小林翔太',
  '加藤麻衣',
  '吉田隆',
  '山田優子',
];

// ダミーユーザーのXP（固定値で毎回同じランキング）
const DUMMY_XP = [12500, 9800, 8200, 6500, 5100, 4200, 3500, 2800, 2100, 1500, 900, 400];

/**
 * リーダーボードを生成
 * @param currentUserXP 現在のユーザーのXP
 * @param currentUserName 現在のユーザー名（デフォルト: あなた）
 */
export function generateLeaderboard(
  currentUserXP: number,
  currentUserName = 'あなた'
): LeaderboardEntry[] {
  // ダミーユーザーを生成
  const entries: Omit<LeaderboardEntry, 'rank'>[] = DUMMY_USERS.map((name, index) => {
    const xp = DUMMY_XP[index];
    const level = calculateLevel(xp);
    const levelDef = getLevelDefinition(level);
    return {
      name,
      xp,
      level,
      levelTitle: levelDef.title,
      isCurrentUser: false,
    };
  });

  // 現在のユーザーを追加
  const currentUserLevel = calculateLevel(currentUserXP);
  const currentUserLevelDef = getLevelDefinition(currentUserLevel);
  entries.push({
    name: currentUserName,
    xp: currentUserXP,
    level: currentUserLevel,
    levelTitle: currentUserLevelDef.title,
    isCurrentUser: true,
  });

  // XPでソートして順位を付ける
  return entries
    .sort((a, b) => b.xp - a.xp)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

/**
 * 上位N件を取得
 */
export function getTopRankers(currentUserXP: number, limit = 10): LeaderboardEntry[] {
  const leaderboard = generateLeaderboard(currentUserXP);
  return leaderboard.slice(0, limit);
}
