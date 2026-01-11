# 改善効果の自動評価 - 運用手順

作成日: 2026-01-11

## 概要

P4-1 で実装した「改善効果の自動評価」機能の運用手順。

改善 Issue 作成後、一定期間経過後に Before/After の followUpRate を比較し、改善効果を自動判定してコメントを投稿します。

---

## GitHub Actions での実行方法

### 1. Actions タブを開く

GitHub リポジトリの **Actions** タブにアクセス

### 2. ワークフローを選択

左サイドバーから **「Evaluate Improvement Issue」** ワークフローを選択

### 3. ワークフローを実行

1. 「**Run workflow**」ボタンをクリック
2. 入力フォームに以下を入力:
   - **Issue 番号**: 評価対象の GitHub Issue 番号（例: `123`）
   - **評価期間（日数）**: デフォルト `14`（改善実施後の観察期間）
3. 「**Run workflow**」をクリックして実行

### 4. 結果の確認

- ワークフローが完了すると、指定した Issue に評価結果がコメントされる
- コメントには以下が含まれる:
  - Before/After の followUpRate
  - 差分（deltaRate）
  - 評価ステータス（IMPROVED/NO_CHANGE/REGRESSED/LOW_SAMPLE）

---

## CLI での実行方法（ローカル）

### 1. 環境変数の設定

```bash
export GITHUB_TOKEN=ghp_xxx
export VITE_GITHUB_OWNER=takuya86
export VITE_GITHUB_REPO=react-learning-platform
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_SERVICE_KEY=xxx
```

### 2. 実行コマンド

#### 通常実行（評価結果をコメント）

```bash
node tools/evaluate-issue.mjs --issue=123 --window=14
```

#### ドライラン（コメントせずに結果確認）

```bash
node tools/evaluate-issue.mjs --issue=123 --dry-run
```

- ドライランでは評価結果を標準出力に表示するのみ
- Issue へのコメント投稿は行わない
- 事前確認や動作テストに使用

---

## 評価ステータスの意味

| ステータス     | 条件                  | 意味                   |
| -------------- | --------------------- | ---------------------- |
| **IMPROVED**   | deltaRate >= +5%      | 改善効果あり（成功）   |
| **NO_CHANGE**  | -5% < deltaRate < +5% | 有意な変化なし         |
| **REGRESSED**  | deltaRate <= -5%      | 悪化（追加対応が必要） |
| **LOW_SAMPLE** | originCount < 5       | サンプル不足、判断保留 |

### 補足

- **deltaRate**: After の followUpRate - Before の followUpRate
- **originCount**: 評価期間内のサンプル数（レッスン完了数）
- originCount が 5 未満の場合は、統計的に信頼できないため LOW_SAMPLE と判定

---

## 冪等性（重複防止）

### 仕組み

- 同一 Issue + 同一評価期間の評価は **1回のみ** コメントされる
- HTML コメントマーカーで重複を検出:
  ```html
  <!-- eval:issue-123:window-14 -->
  ```

### 動作

- 既に同じマーカーのコメントが存在する場合、新規コメントは投稿されない
- 評価期間を変更した場合は、別の評価として扱われる

---

## 推奨運用フロー

### 1. 改善 PR をマージ

- Lesson Improvement Issue に対応する改善を実施
- PR をマージして本番環境に反映

### 2. 待機期間（14日）

- 改善効果が現れるまで一定期間待つ
- デフォルトは **14日間**

### 3. 評価ワークフローを実行

- GitHub Actions の「Evaluate Improvement Issue」を実行
- Issue 番号と評価期間（14）を指定

### 4. ステータスを確認

評価コメントのステータスに応じて対応:

#### IMPROVED の場合

- 改善成功
- Issue に「改善完了」コメントを追加してクローズ

#### NO_CHANGE の場合

- 効果が不明瞭
- 追加改善を検討するか、観察期間を延長（28日など）して再評価

#### REGRESSED の場合

- 悪化している
- 改善内容を見直し、追加対応を検討

#### LOW_SAMPLE の場合

- サンプル不足
- さらに期間を延長（28日など）して再評価

---

## spec-lock（仕様固定）

以下の仕様はテストで固定されており、変更時は spec-lock テストの更新が必要:

### 1. 評価パラメータ

| 定数                      | 値   | 説明                       |
| ------------------------- | ---- | -------------------------- |
| EVALUATION_WINDOW_DAYS    | 14   | デフォルト評価期間（日数） |
| MIN_ORIGIN_FOR_EVAL       | 5    | 評価に必要な最小サンプル数 |
| EVAL_RATE_DELTA_THRESHOLD | 0.05 | 有意差の閾値（5pp）        |

### 2. 評価ロジック

```
deltaRate = afterRate - beforeRate

if originCount < 5:
  status = LOW_SAMPLE
elif deltaRate >= +0.05:
  status = IMPROVED
elif deltaRate <= -0.05:
  status = REGRESSED
else:
  status = NO_CHANGE
```

### 3. 期間計算

- **Before 期間**: Issue 作成日の前 `windowDays` 日間
- **After 期間**: Issue 作成日の後 `windowDays` 日間
- UTC 基準で日付境界を計算

---

## トラブルシューティング

### 評価が実行されない

- 環境変数が正しく設定されているか確認
- GITHUB_TOKEN に Issue への書き込み権限があるか確認

### LOW_SAMPLE が続く

- レッスンのトラフィックが少ない可能性
- 評価期間を延長（28日など）して再実行
- または、もう少し待ってから再評価

### 評価結果が期待と異なる

- Baseline メタデータ（Issue 本文）が正しく設定されているか確認
- Supabase の `lesson_progress_events` データを確認
- ドライランで deltaRate を事前確認

---

## 参考リンク

- [改善ループ運用手順](./improvement-loop.md)
- [改善ヒントチェックリスト](./lesson-improvement-hint-checklist.md)
- [Admin Metrics ページ](/admin/metrics)

---

P4-1 改善効果の自動評価
運用ドキュメント v1.0
