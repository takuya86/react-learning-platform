# React Learning Platform - Claude Code Rules

## ドキュメント

- [環境構築](./docs/getting-started.md)
- [アーキテクチャ](./docs/design/architecture.md)
- [開発ガイド](./docs/guides/development.md)
- [全ドキュメント](./docs/README.md)

## クイックリファレンス

### ブランチ命名

```
feature/xxx  # 機能追加
fix/xxx      # バグ修正
refactor/xxx # リファクタリング
```

### コミットメッセージ

```
feat:     新機能
fix:      バグ修正
refactor: リファクタリング
test:     テスト追加
docs:     ドキュメント
chore:    その他
```

### よく使うコマンド

```bash
npm run dev              # 開発サーバー
npm run test:run         # テスト
npm run e2e              # E2Eテスト
npm run lint             # Lint
npm run typecheck        # 型チェック
npm run validate:lessons # レッスン検証
```

### CI相当チェック

```bash
npm run lint && npm run typecheck && npm run validate:lessons && npm run test:run && npm run build
```

## プロジェクト構成

```
src/
├── app/           # アプリケーション設定、ルーティング
├── components/ui/ # 共通UIコンポーネント
├── content/       # MDXレッスンコンテンツ
├── data/          # 静的データ
├── domain/types/  # 型定義
├── features/      # 機能別モジュール
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ
├── pages/         # ページコンポーネント
└── tests/         # テストファイル
```
