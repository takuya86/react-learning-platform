# ルーティング設計

## ルート一覧

| パス | コンポーネント | 説明 |
|------|---------------|------|
| `/` | DashboardPage | ダッシュボード |
| `/lessons` | LessonsPage | レッスン一覧 |
| `/lessons/:id` | LessonDetailPage | レッスン詳細 |
| `/lessons/:id/exercise` | ExercisePage | 演習 |
| `/quiz` | QuizListPage | クイズ一覧 |
| `/quiz/:id` | QuizPage | クイズ実施 |
| `/notes` | NotesPage | ノート |
| `/progress` | ProgressPage | 進捗 |
| `*` | NotFoundPage | 404 |

## ルート定義

```typescript
// src/app/router.tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'lessons', element: <LessonsPage /> },
      { path: 'lessons/:id', element: <LessonDetailPage /> },
      { path: 'lessons/:id/exercise', element: <ExercisePage /> },
      { path: 'quiz', element: <QuizListPage /> },
      { path: 'quiz/:id', element: <QuizPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

## ナビゲーション

### グローバルナビゲーション（Layout）

```
[React Learning] [レッスン] [クイズ] [ノート] [進捗]
```

### ページ内遷移

#### レッスン詳細から

```
/lessons/:id
    ├─→ /lessons/:id/exercise  （演習に進む）
    ├─→ /quiz/:quizId          （クイズを開く）※関連クイズがある場合
    ├─→ /notes?lessonId=:id    （ノートを開く）
    └─→ /lessons               （レッスン一覧に戻る）
```

#### クイズから

```
/quiz/:id
    └─→ /quiz                   （クイズ一覧に戻る）
```

## クエリパラメータ

| パス | パラメータ | 用途 |
|------|-----------|------|
| `/notes` | `lessonId` | 指定レッスンを選択状態で開く |

## SPAルーティング（Vercel）

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 関連

- [ADR-0001: React Router v7](../adr/0001-react-router-v7.md)
