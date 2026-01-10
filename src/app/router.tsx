import { createBrowserRouter, useParams } from 'react-router-dom';
import { Layout } from './Layout';
import { RequireAuth, RequireRole } from '@/features/auth';
import {
  DashboardPage,
  LessonsPage,
  LessonDetailPage,
  ExercisePage,
  QuizListPage,
  QuizPage,
  ProgressPage,
  NotesPage,
  RoadmapPage,
  NotFoundPage,
  LoginPage,
  AdminPage,
  AdminBacklogPage,
} from '@/pages';

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
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
