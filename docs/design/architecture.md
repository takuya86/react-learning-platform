# アーキテクチャ設計

## 概要

React Learning Platformは、Feature-Sliced Design（FSD）を参考にした機能ベースのディレクトリ構成を採用。

## ディレクトリ構成

```
src/
├── app/                    # アプリケーション設定
│   ├── App.tsx            # ルートコンポーネント
│   ├── router.tsx         # ルーティング定義
│   ├── Layout.tsx         # 共通レイアウト
│   └── providers.tsx      # Context Providers
│
├── pages/                  # ページコンポーネント
│   ├── DashboardPage.tsx
│   ├── LessonsPage.tsx
│   ├── LessonDetailPage.tsx
│   ├── QuizListPage.tsx
│   ├── QuizPage.tsx
│   ├── NotesPage.tsx
│   ├── ProgressPage.tsx
│   └── NotFoundPage.tsx
│
├── features/               # 機能モジュール
│   ├── lessons/           # レッスン機能
│   ├── quiz/              # クイズ機能
│   ├── notes/             # ノート機能
│   └── progress/          # 進捗機能
│
├── components/             # 共通UIコンポーネント
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── ...
│
├── hooks/                  # 共通カスタムフック
│   ├── useDebounce.ts
│   └── ...
│
├── domain/                 # ドメイン層
│   └── types/             # 型定義
│       └── index.ts
│
├── data/                   # 静的データ
│   ├── lessons.ts
│   ├── quizzes.ts
│   └── exercises.ts
│
└── tests/                  # テストファイル
```

## レイヤー構成

```
┌─────────────────────────────────────────┐
│                  Pages                   │  ← ルーティングと組み立て
├─────────────────────────────────────────┤
│                Features                  │  ← 機能ロジック
├─────────────────────────────────────────┤
│     Components     │      Hooks         │  ← 再利用可能な部品
├─────────────────────────────────────────┤
│                 Domain                   │  ← 型・ビジネスロジック
├─────────────────────────────────────────┤
│                  Data                    │  ← 静的データ
└─────────────────────────────────────────┘
```

## 依存関係ルール

- Pages → Features, Components, Hooks
- Features → Components, Hooks, Domain, Data
- Components → Domain（型のみ）
- Hooks → Domain（型のみ）

**禁止**: Pages同士の直接import、Features同士の直接import

## 状態管理

```
┌─────────────────────────────────────────┐
│           ProgressProvider              │  ← グローバル状態
│  ┌─────────────────────────────────┐   │
│  │           RouterProvider         │   │
│  │  ┌─────────────────────────┐    │   │
│  │  │         Layout          │    │   │
│  │  │  ┌─────────────────┐   │    │   │
│  │  │  │   Page (Outlet)  │   │    │   │
│  │  │  │   └─ Features    │   │    │   │
│  │  │  └─────────────────┘   │    │   │
│  │  └─────────────────────────┘    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 技術スタック

| 層 | 技術 |
|---|---|
| ビルド | Vite |
| UI | React 19 |
| 型 | TypeScript |
| ルーティング | React Router v7 |
| フォーム | React Hook Form + Zod |
| スタイル | CSS Modules |
| テスト | Vitest + Testing Library + Playwright |

## 関連

- [ルーティング設計](./routing.md)
- [データモデル](./data-model.md)
