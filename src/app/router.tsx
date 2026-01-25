import { lazy, Suspense } from 'react';
import { createBrowserRouter, useParams } from 'react-router-dom';
import { Layout } from './Layout';
import { RequireAuth, RequireRole } from '@/features/auth';

// Eagerly loaded pages (critical path)
import { LoginPage, AuthCallbackPage, NotFoundPage } from '@/pages';

// Lazy loaded pages (code splitting)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const LessonsPage = lazy(() =>
  import('@/pages/LessonsPage').then((m) => ({ default: m.LessonsPage }))
);
const LessonDetailPage = lazy(() =>
  import('@/pages/LessonDetailPage').then((m) => ({ default: m.LessonDetailPage }))
);
const ExercisePage = lazy(() =>
  import('@/pages/ExercisePage').then((m) => ({ default: m.ExercisePage }))
);
const QuizListPage = lazy(() =>
  import('@/pages/QuizListPage').then((m) => ({ default: m.QuizListPage }))
);
const QuizPage = lazy(() => import('@/pages/QuizPage').then((m) => ({ default: m.QuizPage })));
const ProgressPage = lazy(() =>
  import('@/pages/ProgressPage').then((m) => ({ default: m.ProgressPage }))
);
const BadgesPage = lazy(() =>
  import('@/pages/BadgesPage').then((m) => ({ default: m.BadgesPage }))
);
const LeaderboardPage = lazy(() =>
  import('@/pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const NotesPage = lazy(() => import('@/pages/NotesPage').then((m) => ({ default: m.NotesPage })));
const RoadmapPage = lazy(() =>
  import('@/pages/RoadmapPage').then((m) => ({ default: m.RoadmapPage }))
);
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AdminBacklogPage = lazy(() =>
  import('@/pages/AdminBacklogPage').then((m) => ({ default: m.AdminBacklogPage }))
);
const AdminMetricsPage = lazy(() =>
  import('@/pages/AdminMetricsPage').then((m) => ({ default: m.AdminMetricsPage }))
);
const ErrorBoundaryTestPage = lazy(() =>
  import('@/pages/ErrorBoundaryTestPage').then((m) => ({ default: m.ErrorBoundaryTestPage }))
);
const DesignSamplePage = lazy(() =>
  import('@/pages/DesignSamplePage').then((m) => ({ default: m.DesignSamplePage }))
);

function LessonDetailRoute() {
  const { id } = useParams<{ id: string }>();
  return <LessonDetailPage key={id} />;
}

function ExerciseRoute() {
  const { id } = useParams<{ id: string }>();
  return <ExercisePage key={id} />;
}

function QuizRoute() {
  const { id } = useParams<{ id: string }>();
  return <QuizPage key={id} />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  // デモ用公開ルート（調査後に削除）
  {
    path: '/demo/design',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <DesignSamplePage />
      </Suspense>
    ),
  },
  {
    path: '/demo/dashboard',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardPage />
      </Suspense>
    ),
  },
  {
    path: '/demo/lessons',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <LessonsPage />
      </Suspense>
    ),
  },
  {
    path: '/demo/badges',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <BadgesPage />
      </Suspense>
    ),
  },
  {
    path: '/demo/leaderboard',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <LeaderboardPage />
      </Suspense>
    ),
  },
  {
    path: '/demo/progress',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <ProgressPage />
      </Suspense>
    ),
  },
  {
    path: '/demo/notes',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotesPage />
      </Suspense>
    ),
  },
  {
    path: '/demo/roadmap',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <RoadmapPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'lessons',
        element: <LessonsPage />,
      },
      {
        path: 'roadmap',
        element: <RoadmapPage />,
      },
      {
        path: 'lessons/:id',
        element: <LessonDetailRoute />,
      },
      {
        path: 'lessons/:id/exercise',
        element: <ExerciseRoute />,
      },
      {
        path: 'quiz',
        element: <QuizListPage />,
      },
      {
        path: 'quiz/:id',
        element: <QuizRoute />,
      },
      {
        path: 'progress',
        element: <ProgressPage />,
      },
      {
        path: 'badges',
        element: <BadgesPage />,
      },
      {
        path: 'leaderboard',
        element: <LeaderboardPage />,
      },
      {
        path: 'notes',
        element: <NotesPage />,
      },
      {
        path: 'admin',
        element: (
          <RequireRole role="admin">
            <AdminPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/backlog',
        element: (
          <RequireRole role="admin">
            <AdminBacklogPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/metrics',
        element: (
          <RequireRole role="admin">
            <AdminMetricsPage />
          </RequireRole>
        ),
      },
      {
        path: 'error-test',
        element: <ErrorBoundaryTestPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
