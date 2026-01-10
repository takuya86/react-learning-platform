# 開発ガイド

## ブランチ戦略

```bash
# 機能追加
git checkout -b feature/説明

# バグ修正
git checkout -b fix/説明

# リファクタリング
git checkout -b refactor/説明
```

## 開発の流れ

### 1. ブランチ作成

```bash
git checkout main
git pull origin main
git checkout -b feature/xxx
```

### 2. 実装 & コミット

```bash
git add .
git commit -m "feat: 機能追加の説明"
```

**コミットメッセージ形式:**

| Prefix      | 用途             |
| ----------- | ---------------- |
| `feat:`     | 新機能           |
| `fix:`      | バグ修正         |
| `refactor:` | リファクタリング |
| `test:`     | テスト追加       |
| `docs:`     | ドキュメント     |
| `chore:`    | その他           |

### 3. プッシュ & PR作成

```bash
git push -u origin HEAD
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

### 5. マージ

```bash
gh pr merge --squash --delete-branch
```

## Pre-commit Hook

コミット時に自動実行:

- ESLint（自動修正）
- Prettier（自動フォーマット）

手動でスキップする場合:

```bash
git commit --no-verify -m "WIP: 作業中"
```

## コマンド一覧

### 開発

| コマンド            | 説明         |
| ------------------- | ------------ |
| `npm run dev`       | 開発サーバー |
| `npm run build`     | ビルド       |
| `npm run lint`      | ESLint       |
| `npm run typecheck` | 型チェック   |

### テスト

| コマンド                | 説明            |
| ----------------------- | --------------- |
| `npm run test:run`      | テスト実行      |
| `npm run test:coverage` | カバレッジ付き  |
| `npm run e2e`           | E2Eテスト       |
| `npm run e2e:ui`        | E2E（UIモード） |

### レッスン管理

| コマンド                   | 説明             |
| -------------------------- | ---------------- |
| `npm run validate:lessons` | レッスン検証     |
| `npm run lessons:stats`    | レッスン統計     |
| `npm run generate:lessons` | レッスン雛形生成 |

## ローカルでのCI相当チェック

```bash
npm run lint && npm run typecheck && npm run validate:lessons && npm run test:run && npm run build
```

## 作業完了チェックリスト

- [ ] ブランチ名が規則に従っている
- [ ] コミットメッセージが形式に従っている
- [ ] `npm run lint` が通る
- [ ] `npm run typecheck` が通る
- [ ] `npm run test:run` が通る
- [ ] `npm run build` が通る
- [ ] PRテンプレートを埋めた
- [ ] CIが全て通った
