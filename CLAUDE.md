# React Learning Platform - Claude Code Rules

## 開発ワークフロー

### 1. ブランチ作成

```bash
# 機能追加
git checkout -b feature/説明

# バグ修正
git checkout -b fix/説明

# リファクタリング
git checkout -b refactor/説明
```

### 2. 実装 & コミット

```bash
# 変更をステージング
git add .

# コミット（pre-commitでlint/formatが自動実行）
git commit -m "feat: 機能追加の説明"
```

**コミットメッセージ形式:**

- `feat:` 新機能
- `fix:` バグ修正
- `refactor:` リファクタリング
- `test:` テスト追加
- `docs:` ドキュメント
- `chore:` その他

### 3. プッシュ & PR作成

```bash
# プッシュ
git push -u origin HEAD

# PR作成（テンプレートが自動適用）
gh pr create --assignee @me
```

### 4. CIレビュー確認

PRを作成するとCIが自動実行:

1. Lint
2. Type check
3. Validate lessons (--strict)
4. Test with coverage
5. Build
6. E2E tests

**全て通るまでマージしない**

### 5. 指摘対応 & 再レビュー

```bash
# 修正後
git add .
git commit -m "fix: レビュー指摘対応"
git push
```

### 6. マージ

```bash
# CIが通ったらマージ
gh pr merge --squash --delete-branch
```

---

## Pre-commit Hook

コミット時に自動実行:

- ESLint (自動修正)
- Prettier (自動フォーマット)

手動でスキップする場合:

```bash
git commit --no-verify -m "WIP: 作業中"
```

---

## ローカルでのCI相当チェック

```bash
# 全チェック実行
npm run lint && npm run typecheck && npm run validate:lessons && npm run test:run && npm run build
```

---

## プロジェクト構成

```
src/
├── app/           # アプリケーション設定、ルーティング
├── components/ui/ # 共通UIコンポーネント
├── content/       # MDXレッスンコンテンツ
├── data/          # 静的データ
├── domain/types/  # 型定義
├── features/      # 機能別モジュール
│   ├── lessons/
│   ├── notes/
│   ├── progress/
│   └── quiz/
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ
├── pages/         # ページコンポーネント
└── tests/         # テストファイル
```

---

## コマンド一覧

| コマンド                   | 説明                 |
| -------------------------- | -------------------- |
| `npm run dev`              | 開発サーバー         |
| `npm run build`            | ビルド               |
| `npm run lint`             | ESLint               |
| `npm run typecheck`        | 型チェック           |
| `npm run test:run`         | テスト実行           |
| `npm run test:coverage`    | カバレッジ付きテスト |
| `npm run e2e`              | E2Eテスト            |
| `npm run validate:lessons` | レッスン検証         |
| `npm run lessons:stats`    | レッスン統計         |
| `npm run generate:lessons` | レッスン雛形生成     |

---

## 作業完了チェックリスト

- [ ] ブランチ名が規則に従っている
- [ ] コミットメッセージが形式に従っている
- [ ] `npm run lint` が通る
- [ ] `npm run typecheck` が通る
- [ ] `npm run test:run` が通る
- [ ] `npm run build` が通る
- [ ] PRテンプレートを埋めた
- [ ] CIが全て通った
