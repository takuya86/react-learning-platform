# React Learning Platform

React/TypeScript学習のための実践プロジェクトです。

## 必要環境

- **Node.js 20.x** (`.nvmrc` で指定)
- npm
- Docker (オプション)

## セットアップ

### Node バージョンの設定

```bash
# nvm を使用している場合
nvm use

# nodenv を使用している場合
nodenv local 20
```

### 依存関係のインストール

```bash
npm ci
```

## 開発

### ローカル開発（npm）

```bash
# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:5173 を開く
```

### Docker を使用した開発

```bash
# コンテナをビルドして起動
docker compose up --build

# ブラウザで http://localhost:5173 を開く

# 停止
docker compose down

# バックグラウンドで起動する場合
docker compose up -d --build

# ログを確認
docker compose logs -f web
```

Docker環境ではホットリロードが有効です。ソースコードの変更は自動的に反映されます。

## 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run test` | テスト実行（watch モード） |
| `npm run test:run` | テスト実行（1回のみ） |
| `npm run lint` | ESLint 実行 |
| `npm run format` | Prettier でフォーマット |
| `npm run preview` | ビルド結果をプレビュー |

## プロジェクト構成

```
src/
├── app/           # アプリケーション設定、ルーティング
├── components/ui/ # 共通UIコンポーネント
├── data/          # 静的データ
├── domain/types/  # 型定義
├── features/      # 機能別モジュール
│   ├── lessons/
│   ├── notes/
│   ├── progress/
│   └── quiz/
├── hooks/         # カスタムフック
├── pages/         # ページコンポーネント
└── tests/         # テストファイル
```

## CI/CD

GitHub Actions で以下を自動実行:
- テスト (`npm run test:run`)
- ビルド (`npm run build`)

## 技術スタック

- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Vite
- **テスト**: Vitest + Testing Library
- **フォーム**: React Hook Form + Zod
- **ルーティング**: React Router
- **スタイリング**: CSS Modules
