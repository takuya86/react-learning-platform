# P3-2.2 Lesson Improvement Hint

## 運用チェックリスト（毎週ルーチン）

本チェックリストは、Admin Metrics の
**Lesson Effectiveness Ranking + Improvement Hint** を
「判断 → 改善 → 検証」につなげるための運用手順です。

---

## 0. 前提

- 対象画面: `/admin/metrics`
- 期間: **直近30日**（デフォルト）
- LOW_SAMPLE（originCount < 5）は判断対象外

---

## 1. 改善対象の抽出（5分）

### 1.1 表示条件

- Worst Lessons テーブル
- Hint が **null でない**行のみを見る
- `LOW_SAMPLE` は除外

### 1.2 優先順位（上から見る）

1. `NEXT_LESSON_WEAK`
2. `CTA_MISSING`
3. `LOW_ENGAGEMENT`

---

## 2. ヒント別の判断ルール（即決用）

### NEXT_LESSON_WEAK

> 次のレッスン導線が弱い可能性

確認すること：

- 「次に読むべきレッスン」が表示されているか
- prerequisites / 関連レッスンが正しく設定されているか

改善アクション例：

- Next Lessons の関連を追加
- レッスン末尾に「次は○○を読む」文言を追加

---

### CTA_MISSING

> 復習・クイズ・ノート導線が不足

確認すること：

- review / quiz / note の導線が本文中にあるか
- Exercises の最後に行動を促しているか

改善アクション例：

- 「この内容をノートにまとめよう」CTA追加
- クイズ・復習ボタンを本文下に配置

---

### LOW_ENGAGEMENT

> 内容理解後の行動につながっていない可能性

確認すること：

- Example が「コピペで動く」か
- Pitfalls が実務的か
- Exercises が段階的か（易→中→難）

改善アクション例：

- Example を1つ追加
- Pitfalls を実例ベースに書き直す
- Exercises を3段階構成に修正

---

## 3. 改善タスク化（10分）

改善対象ごとに以下を記録：

- 対象 lesson slug
- Hint 種別
- 実施する改善内容（1つだけ）
- 担当者
- 次回確認日（+7日 or +14日）

---

## 4. 改善後の検証（翌週）

確認項目：

- originCount が増えているか
- followUpRate が改善しているか
- Hint が消えている or 別種別に変化しているか

※ 数値が動かなくても **「LOW_SAMPLE → 判定可能」になれば成功**

---

## 5. 運用上の注意（重要）

- LOW_SAMPLE は「失敗」ではなく **データ不足**
- 1レッスンにつき **1回の改善で止める**
- 数値よりも「行動が発生したか」を優先して見る

---

## 完了条件

- 毎週 1〜3 レッスンに改善が入っている
- Hint 種別の偏りが月単位で減少している
- 改善内容が"迷わず決まる"状態になっている

---

P3-2.2 Lesson Improvement Hint
運用チェックリスト v1.0
