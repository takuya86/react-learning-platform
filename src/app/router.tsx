import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import {
  DashboardPage,
  LessonsPage,
  LessonDetailPage,
  ExercisePage,
  QuizListPage,
  QuizPage,
  ProgressPage,
  NotFoundPage,
} from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
        path: 'lessons/:id',
        element: <LessonDetailPage />,
      },
      {
        path: 'lessons/:id/exercise',
        element: <ExercisePage />,
      },
      {
        path: 'quiz',
        element: <QuizListPage />,
      },
      {
        path: 'quiz/:id',
        element: <QuizPage />,
      },
      {
        path: 'progress',
        element: <ProgressPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
