# 改善ループ運用手順

作成日: 2026-01-11

## 概要

Lesson Improvement Hint で検出された改善対象を、Issue化 → 改善 → 効果測定 → クローズ まで回すための運用手順。

---

## 週次運用フロー

### 1. Worst レッスンの確認（毎週月曜）

1. `/admin/metrics` にアクセス
2. **Lesson Effectiveness Ranking** の **Worst** テーブルを確認
3. 改善候補（Top 5）を特定

### 2. Issue 作成

1. Worst テーブルの **Issue** 列にある「Issue作成」ボタンをクリック
2. GitHub Issue が自動作成される
   - タイトル: `[Lesson Improvement] {lessonTitle} ({lessonSlug}) - {hintType}`
   - ラベル: `lesson-improvement`, `metrics`, `hint:{hintType}`, `lesson:{slug}`
   - 本文にメタデータ（baseline snapshot）が埋め込まれる

### 3. 改善 PR 作成

Issue の「推奨アクション」に従って改善を実施:

| Hint Type        | 改善アクション                           |
| ---------------- | ---------------------------------------- |
| NEXT_LESSON_WEAK | 次レッスン導線を追加、prerequisites 確認 |
| CTA_MISSING      | 復習・クイズ・ノート CTA を配置          |
| LOW_ENGAGEMENT   | Example 追加、Exercises 改善             |

### 4. 効果測定（改善 PR マージ後 7 日）

1. `/admin/metrics` の **Improvement Tracker** セクションを確認
2. 各レッスンの **Delta**（Before/After の差分）を確認
3. 判定基準:
   - `deltaRate >= +10%` → 改善成功
   - `deltaRate < +10%` → 追加改善を検討

### 5. Issue クローズ

- 効果が確認できたら Issue をクローズ
- クローズ時のコメント例:
  ```
  改善完了。followUpRate: 15% → 28% (+13%)
  ```

---

## Improvement Tracker の見方

| カラム        | 説明                                          |
| ------------- | --------------------------------------------- |
| Lesson        | レッスン名（slug）                            |
| Hint Type     | 改善ヒント種別                                |
| Baseline Rate | Issue 作成時点の followUpRate（%）            |
| Current Rate  | 現在の followUpRate（%）                      |
| Delta         | 差分（+X.X%）、緑=改善、赤=悪化               |
| Status        | low sample（originCount < 5）の場合は判断保留 |
| Issue         | GitHub Issue へのリンク                       |

---

## spec-lock（仕様固定）

以下の仕様はテストで固定されており、変更時は spec-lock テストの更新が必要:

1. **Issue 発火条件**
   - originCount >= 5
   - hintType !== null
   - hintType !== 'LOW_SAMPLE'
   - 同一 lesson + hintType の Open Issue なし

2. **Delta 計算**
   - windowDays: 30（日次ぶれ吸収）
   - 境界: UTC 基準
   - deltaRate = afterRate - beforeRate

3. **Low Sample 判定**
   - originCount < 5 → isLowSample = true

---

## 自動化（GitHub Actions）

### 将来実装予定

- 週次で open issues をチェック
- deltaRate >= +10% の Issue に自動コメント
- 手動 close を推奨（最初は自動 close しない）

---

## 参考リンク

- [P3-2.2 改善ヒントチェックリスト](./lesson-improvement-hint-checklist.md)
- [Admin Metrics ページ](/admin/metrics)
