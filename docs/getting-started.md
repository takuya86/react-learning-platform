# Getting Started

## 前提条件

- Node.js v20（[.nvmrc](./../.nvmrc) 参照）
- npm

## 環境構築

### 1. リポジトリのクローン

```bash
git clone git@github.com:{owner}/react-learning-platform.git
cd react-learning-platform
```

### 2. Node.jsバージョン確認

```bash
nvm use  # .nvmrcに従って自動切り替え
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

```bash
cp .env.example .env.local
```

| 変数名                   | 説明             |
| ------------------------ | ---------------- |
| `VITE_SUPABASE_URL`      | Supabase URL     |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名キー |

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:5173 でアクセス可能

## 動作確認

1. トップページが表示される
2. レッスン一覧が表示される
3. レッスン詳細に遷移できる

## よく使うコマンド

| コマンド           | 説明             |
| ------------------ | ---------------- |
| `npm run dev`      | 開発サーバー起動 |
| `npm run build`    | ビルド           |
| `npm run test:run` | テスト実行       |
| `npm run e2e`      | E2Eテスト        |

## 次のステップ

- [アーキテクチャ](./design/architecture.md)を把握
- [開発フロー](./guides/development.md)を確認
- [機能仕様](./specs/)を確認
