# React Learning Platform

React/TypeScript の基礎から実践までを学べるインタラクティブな学習アプリケーション。

## Demo

**公開URL**: https://react-learning-platform-rho.vercel.app

## Features

- **レッスン**: React の基礎概念をステップバイステップで学習
- **クイズ**: 理解度を確認するインタラクティブなクイズ機能
- **タイマー**: クイズに制限時間を設定し、実践的な緊張感を演出
- **ノート**: 学習メモを記録・管理
- **進捗管理**: 完了レッスン・クイズの進捗をトラッキング
- **レジューム**: 中断したクイズを途中から再開可能
- **苦手分野**: 不正解問題を自動記録し、弱点を可視化

## Tech Stack

| カテゴリ       | 技術                     |
| -------------- | ------------------------ |
| フレームワーク | React 19 + TypeScript    |
| ビルドツール   | Vite                     |
| ルーティング   | React Router             |
| 認証           | Supabase Auth            |
| フォーム       | React Hook Form + Zod    |
| テスト         | Vitest + Testing Library |
| スタイリング   | CSS Modules              |
| CI/CD          | GitHub Actions + Vercel  |
| コンテナ       | Docker                   |

## Getting Started

```bash
# リポジトリをクローン
git clone https://github.com/takuya86/react-learning-platform.git
cd react-learning-platform

# Node.js バージョン設定（nvm使用時）
nvm use

# 依存関係インストール
npm ci

# 開発サーバー起動
npm run dev
# → http://localhost:5173
```

## Authentication Setup

このアプリケーションは認証にSupabaseを使用しています。

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com) にアクセスしてアカウント作成
2. 新しいプロジェクトを作成
3. Project Settings → API から以下を取得:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhbG...`

### 2. 環境変数設定

```bash
# .env.example を .env.local にコピー
cp .env.example .env.local

# .env.local を編集してSupabase認証情報を設定
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 認証設定（Supabaseダッシュボード）

1. Authentication → Providers で Email を有効化
2. Authentication → URL Configuration で:
   - Site URL: `http://localhost:5173`（開発時）
   - Redirect URLs: 本番URLを追加

### 4. 本番環境（Vercel）での設定

#### Vercel環境変数

Vercel Dashboard → Settings → Environment Variables に以下を追加:

| 変数名                   | 値                        |
| ------------------------ | ------------------------- |
| `VITE_SUPABASE_URL`      | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...`               |

設定後、Deployments から Redeploy を実行。

#### Supabase URL設定（本番用）

Authentication → URL Configuration:

| 項目          | 値                                                  |
| ------------- | --------------------------------------------------- |
| Site URL      | `https://react-learning-platform-rho.vercel.app`    |
| Redirect URLs | `https://react-learning-platform-rho.vercel.app/**` |

### 5. モックモード（開発・テスト）

環境変数が未設定の場合、自動的にモックモードで動作します:

- **開発時**: ログイン機能は動作しない（UIのみ確認可能）
- **E2E テスト**: `localStorage.setItem('e2e_mock_authenticated', 'true')` で認証をバイパス
- **CI**: モックモードで実行され、Supabase依存なくテストが通過

## Database Setup (Cloud Sync)

ログインユーザーの進捗データとノートをSupabaseに同期するには、以下のテーブルをセットアップしてください。

### 1. テーブル作成

Supabase Dashboard → SQL Editor で以下のSQLを実行:

```sql
-- User Progress Table
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lessons JSONB NOT NULL DEFAULT '{}',
  completed_quizzes TEXT[] NOT NULL DEFAULT '{}',
  completed_exercises TEXT[] NOT NULL DEFAULT '{}',
  streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE,
  study_dates DATE[] NOT NULL DEFAULT '{}',
  quiz_attempts JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User Notes Table
CREATE TABLE user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  markdown TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can CRUD own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own notes" ON user_notes
  FOR ALL USING (auth.uid() = user_id);
```

### 2. 同期の動作

- **ログイン時**: Supabaseからデータを取得し、ローカルデータとマージ
- **データ更新時**: localStorage即時更新 → 500msデバウンス → Supabase同期
- **オフライン時**: localStorageのみ更新、オンライン復帰で同期

### 3. マージ戦略（Merge Strategy）

ローカルとリモートのデータが異なる場合、以下の戦略でマージします。

#### Progress データ

| フィールド           | 戦略             | 説明                                                                                         |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `lessons`            | Union + 完了優先 | 両方の全レッスンを統合。同じレッスンがある場合は完了済みを優先、両方完了済みなら早い方を採用 |
| `completedQuizzes`   | Union            | 配列を統合、重複を除去                                                                       |
| `completedExercises` | Union            | 配列を統合、重複を除去                                                                       |
| `streak`             | Max              | より大きい値を採用                                                                           |
| `lastStudyDate`      | 最新             | より新しい日付を採用                                                                         |
| `studyDates`         | Union            | 配列を統合、重複を除去、ソート                                                               |
| `quizAttempts`       | Union + 重複排除 | `quizId + attemptedAt` をキーに重複を排除                                                    |

#### Notes データ

| 戦略            | 説明                                              |
| --------------- | ------------------------------------------------- |
| Last-Write-Wins | 各 `lessonId` ごとに `updatedAt` が新しい方を採用 |

#### 境界ケース

| ケース                       | 動作             |
| ---------------------------- | ---------------- |
| ローカルのみ存在             | ローカルを採用   |
| リモートのみ存在             | リモートを採用   |
| 両方存在、タイムスタンプ同一 | ローカルを優先   |
| 片方がnull/undefined         | 存在する方を採用 |

### 4. 注意事項

- テーブル未作成の場合でも、localStorageでの動作は継続（エラーログは出力）
- モックモードでは同期は無効（localStorageのみで動作）

### 5. 手動Smokeテスト（Supabase実接続確認）

E2Eテストはモックモードで実行されるため、Supabase実接続の確認は以下の手順で手動実施してください。

#### 事前準備

```bash
# 1. .env.local にSupabase認証情報が設定されていることを確認
cat .env.local
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbG...

# 2. 開発サーバー起動
npm run dev

# 3. ブラウザで http://localhost:5173 にアクセス
```

#### 確認チェックリスト

| #   | 確認項目                  | 期待動作                                                     |
| --- | ------------------------- | ------------------------------------------------------------ |
| 1   | ログインページ            | 「開発モード」警告が表示されない                             |
| 2   | ログイン後 - 学習パス画面 | 同期ステータス「同期済み」が表示される                       |
| 3   | レッスン完了              | 同期ステータスが「同期中...」→「同期済み」に変化             |
| 4   | ノート作成/編集           | ノート画面で同期ステータスが「同期中...」→「同期済み」に変化 |
| 5   | 進捗画面                  | 同期ステータスと最終同期時刻が表示される                     |
| 6   | 別ブラウザ同期            | シークレットウィンドウでログイン → 同じデータが表示          |
| 7   | Supabase確認              | Dashboard > Table Editor でデータが入っている                |

#### オフラインテスト

```bash
# ブラウザのDevTools > Network > Offline をON
# 1. 同期ステータスが「オフライン」に変化することを確認
# 2. レッスン完了やノート編集ができることを確認（localStorageに保存）
# 3. Offline をOFF → 同期ステータスが「同期中...」→「同期済み」に変化
```

#### マージ動作確認

```bash
# 1. ブラウザAでログイン → レッスン1を完了
# 2. ブラウザBでログイン → レッスン2を完了
# 3. ブラウザAをリロード → レッスン1,2両方が完了状態
# 4. ブラウザBをリロード → レッスン1,2両方が完了状態
```

## Tests & Quality

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript 型チェック
npm run test:run      # テスト実行（単発）
npm run test          # テスト実行（watchモード）
npm run test:coverage # カバレッジ付きテスト
npm run build         # プロダクションビルド
```

## Docker Development

```bash
# コンテナ起動（ホットリロード有効）
docker compose up --build

# バックグラウンド起動
docker compose up -d --build

# 停止
docker compose down
```

## CI

GitHub Actions で以下を自動実行（push / PR時）:

1. **Lint** - コード品質チェック
2. **Type check** - 型安全性の検証
3. **Validate lessons** - レッスンコンテンツ検証
4. **Test + Coverage** - テスト実行とカバレッジ計測
5. **Build** - ビルド成功の確認
6. **E2E tests** - Playwright E2Eテスト（モックモード）

## Lesson Content Operations

レッスンコンテンツはMDX形式で管理し、週次で自動生成されます。

### 運用フロー

```
┌─────────────┐    generate:lessons    ┌──────────┐    Claude埋め    ┌─────────────┐
│   Backlog   │ ─────────────────────► │  PR作成  │ ───────────────► │  品質チェック  │
│ (18本待機)  │   毎週月曜 09:00 JST    │ (雛形MDX) │                  │   CI緑確認   │
└─────────────┘                        └──────────┘                  └──────┬──────┘
                                                                            │
                                           マージ                           │
┌─────────────┐                        ┌──────────┐                         │
│    公開     │ ◄───────────────────── │   main   │ ◄───────────────────────┘
│  (Vercel)   │                        │  ブランチ  │
└─────────────┘                        └──────────┘
```

### コマンド一覧

```bash
# 雛形生成（最大3本/回）
npm run generate:lessons

# レッスン検証（必須）
npm run validate:lessons -- --strict

# 統計確認（バランス確認）
npm run lessons:stats
```

### 品質ゲート（PRマージ前）

```bash
npm run validate:lessons -- --strict  # 必須フィールド・循環依存チェック
npm run typecheck                      # 型チェック
npm run test:run                       # テスト
npm run build                          # ビルド
```

### Backlog運用ルール

| チェック項目        | 説明                                          |
| ------------------- | --------------------------------------------- |
| prerequisites整合性 | 存在しないslugを参照していない                |
| 循環依存なし        | A→B→A のような依存がない（CIで検出）          |
| 難易度バランス      | beginner/intermediate/advanced が偏りすぎない |
| 初学者導線          | beginnerが毎月一定数増える                    |

### 週次KPI

```bash
npm run lessons:stats
# → pending が週3ずつ減っていればOK
```

## Deployment

### Vercel へのデプロイ手順

1. [Vercel](https://vercel.com) にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリ `react-learning-platform` をImport
4. ビルド設定（自動検出）:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 「Deploy」をクリック

### 自動デプロイ

- `main` ブランチへの push/merge → 本番デプロイ
- PR作成時 → プレビューデプロイ

### SPAルーティング

`vercel.json` でリライト設定済み。全パスが正常に動作します。

## Branch Strategy

運用方針：**main は常にデプロイ可能（Vercel本番と同期）**。作業は基本PR経由で main にマージします。

### Branch roles

| ブランチ    | 用途                           | 例                            |
| ----------- | ------------------------------ | ----------------------------- |
| `main`      | 常に安定・デプロイ可能         | -                             |
| `feature/*` | 機能追加・スプリント作業       | `feature/sprint3-notes`       |
| `fix/*`     | バグ修正                       | `fix/timeout-double-fire`     |
| `chore/*`   | 依存更新、リファクタ、設定調整 | `chore/ci-coverage-threshold` |
| `hotfix/*`  | 本番緊急対応（必要時のみ）     | `hotfix/prod-routing-404`     |

※ `dev` ブランチは小規模では省略推奨。複数人運用時に導入。

### PR rules

- **1PR = 1目的**（小さく保つ）
- **CI緑必須**（lint / typecheck / test:coverage / build）
- **説明テンプレ**:
  ```
  ## 目的
  ## 変更点
  ## 動作確認
  ## 影響範囲
  ## スクリーンショット（任意）
  ```

### Release flow

1. `feature/*` → PR → `main` にマージ
2. GitHub Actions が CI を実行（緑確認）
3. Vercel が `main` を自動デプロイ

## Roadmap

### 完了済み

| Sprint     | 内容                                               |
| ---------- | -------------------------------------------------- |
| Sprint 2   | クイズ機能（タイマー、レジューム、苦手分野記録）   |
| Sprint 3   | ノート機能（追加・編集・削除・LocalStorage永続化） |
| Sprint 4   | Docker化 + CI最小構成                              |
| Sprint 5-A | CI強化（lint / typecheck / coverage）              |
| Sprint 5-B | Vercelデプロイ対応                                 |
| Sprint 6   | Supabase Auth認証機能（ログイン必須化）            |

### 今後の候補

- バックエンド連携（進捗データの永続化）
- レッスンコンテンツ拡充
- ダークモード対応
- PWA対応（オフライン学習）
