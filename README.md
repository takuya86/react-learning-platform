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
- Lint (`npm run lint`)
- 型チェック (`npm run typecheck`)
- テスト + カバレッジ (`npm run test:coverage`)
- ビルド (`npm run build`)

## デプロイ（Vercel）

### 公開手順

1. [Vercel](https://vercel.com) にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリ `react-learning-platform` をImport
4. ビルド設定を確認（通常は自動検出される）
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 「Deploy」をクリック

### 自動デプロイ

- **本番デプロイ**: `main` ブランチへのpushで自動実行
- **Previewデプロイ**: PRごとに自動生成

### 公開後の確認項目

以下のURLに直接アクセスして、SPAルーティングが正常に動作することを確認:

- `/lessons` - レッスン一覧
- `/lessons/react-basics` - レッスン詳細
- `/quiz` - クイズ一覧
- `/quiz/react-basics-quiz` - クイズ詳細
- `/notes` - ノート
- `/progress` - 進捗

すべてのパスで404にならず、正しくページが表示されればOK。

## 技術スタック

- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Vite
- **テスト**: Vitest + Testing Library
- **フォーム**: React Hook Form + Zod
- **ルーティング**: React Router
- **スタイリング**: CSS Modules
