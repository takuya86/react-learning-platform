import { describe, it, expect, vi, beforeEach } from 'vitest';
import { router } from '@/app/router';
import type { RouteObject } from 'react-router-dom';

// Mock RequireAuth and RequireRole
vi.mock('@/features/auth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="require-auth">{children}</div>
  ),
  RequireRole: ({ children, role }: { children: React.ReactNode; role: string }) => (
    <div data-testid="require-role" data-role={role}>
      {children}
    </div>
  ),
}));

// Mock all page components
vi.mock('@/pages', () => ({
  DashboardPage: () => <div data-testid="page-dashboard">Dashboard</div>,
  LessonsPage: () => <div data-testid="page-lessons">Lessons</div>,
  LessonDetailPage: () => <div data-testid="page-lesson-detail">Lesson Detail</div>,
  ExercisePage: () => <div data-testid="page-exercise">Exercise</div>,
  QuizListPage: () => <div data-testid="page-quiz-list">Quiz List</div>,
  QuizPage: () => <div data-testid="page-quiz">Quiz</div>,
  ProgressPage: () => <div data-testid="page-progress">Progress</div>,
  NotesPage: () => <div data-testid="page-notes">Notes</div>,
  RoadmapPage: () => <div data-testid="page-roadmap">Roadmap</div>,
  NotFoundPage: () => <div data-testid="page-not-found">Not Found</div>,
  LoginPage: () => <div data-testid="page-login">Login</div>,
  AuthCallbackPage: () => <div data-testid="page-auth-callback">Auth Callback</div>,
  AdminPage: () => <div data-testid="page-admin">Admin</div>,
  AdminBacklogPage: () => <div data-testid="page-admin-backlog">Admin Backlog</div>,
  AdminMetricsPage: () => <div data-testid="page-admin-metrics">Admin Metrics</div>,
}));

// Mock Layout
vi.mock('@/app/Layout', () => ({
  Layout: () => <div data-testid="layout">Layout</div>,
}));

describe('router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('route structure', () => {
    it('should be a valid router configuration', () => {
      expect(router).toBeDefined();
      expect(router.routes).toBeDefined();
      expect(Array.isArray(router.routes)).toBe(true);
    });

    it('should have public routes at root level', () => {
      const routes = router.routes as RouteObject[];

      const loginRoute = routes.find((r) => r.path === '/login');
      expect(loginRoute).toBeDefined();

      const callbackRoute = routes.find((r) => r.path === '/auth/callback');
      expect(callbackRoute).toBeDefined();
    });

    it('should have protected routes under root path', () => {
      const routes = router.routes as RouteObject[];
      const rootRoute = routes.find((r) => r.path === '/');

      expect(rootRoute).toBeDefined();
      expect(rootRoute?.children).toBeDefined();
      expect(Array.isArray(rootRoute?.children)).toBe(true);
    });
  });

  describe('public routes', () => {
    it('should define login route', () => {
      const routes = router.routes as RouteObject[];
      const loginRoute = routes.find((r) => r.path === '/login');

      expect(loginRoute).toBeDefined();
      expect(loginRoute?.element).toBeDefined();
    });

    it('should define auth callback route', () => {
      const routes = router.routes as RouteObject[];
      const callbackRoute = routes.find((r) => r.path === '/auth/callback');

      expect(callbackRoute).toBeDefined();
      expect(callbackRoute?.element).toBeDefined();
    });
  });

  describe('protected routes', () => {
    let protectedRoutes: RouteObject[] | undefined;

    beforeEach(() => {
      const routes = router.routes as RouteObject[];
      const rootRoute = routes.find((r) => r.path === '/');
      protectedRoutes = rootRoute?.children;
    });

    it('should have dashboard as index route', () => {
      const indexRoute = protectedRoutes?.find((r) => r.index === true);
      expect(indexRoute).toBeDefined();
    });

    it('should define lessons routes', () => {
      const lessonsRoute = protectedRoutes?.find((r) => r.path === 'lessons');
      expect(lessonsRoute).toBeDefined();

      const lessonDetailRoute = protectedRoutes?.find((r) => r.path === 'lessons/:id');
      expect(lessonDetailRoute).toBeDefined();

      const exerciseRoute = protectedRoutes?.find((r) => r.path === 'lessons/:id/exercise');
      expect(exerciseRoute).toBeDefined();
    });

    it('should define roadmap route', () => {
      const roadmapRoute = protectedRoutes?.find((r) => r.path === 'roadmap');
      expect(roadmapRoute).toBeDefined();
    });

    it('should define quiz routes', () => {
      const quizListRoute = protectedRoutes?.find((r) => r.path === 'quiz');
      expect(quizListRoute).toBeDefined();

      const quizRoute = protectedRoutes?.find((r) => r.path === 'quiz/:id');
      expect(quizRoute).toBeDefined();
    });

    it('should define progress route', () => {
      const progressRoute = protectedRoutes?.find((r) => r.path === 'progress');
      expect(progressRoute).toBeDefined();
    });

    it('should define notes route', () => {
      const notesRoute = protectedRoutes?.find((r) => r.path === 'notes');
      expect(notesRoute).toBeDefined();
    });

    it('should define catch-all 404 route', () => {
      const notFoundRoute = protectedRoutes?.find((r) => r.path === '*');
      expect(notFoundRoute).toBeDefined();
    });
  });

  describe('admin routes', () => {
    let protectedRoutes: RouteObject[] | undefined;

    beforeEach(() => {
      const routes = router.routes as RouteObject[];
      const rootRoute = routes.find((r) => r.path === '/');
      protectedRoutes = rootRoute?.children;
    });

    it('should define admin dashboard route', () => {
      const adminRoute = protectedRoutes?.find((r) => r.path === 'admin');
      expect(adminRoute).toBeDefined();
    });

    it('should define admin backlog route', () => {
      const adminBacklogRoute = protectedRoutes?.find((r) => r.path === 'admin/backlog');
      expect(adminBacklogRoute).toBeDefined();
    });

    it('should define admin metrics route', () => {
      const adminMetricsRoute = protectedRoutes?.find((r) => r.path === 'admin/metrics');
      expect(adminMetricsRoute).toBeDefined();
    });
  });

  describe('route parameters', () => {
    let protectedRoutes: RouteObject[] | undefined;

    beforeEach(() => {
      const routes = router.routes as RouteObject[];
      const rootRoute = routes.find((r) => r.path === '/');
      protectedRoutes = rootRoute?.children;
    });

    it('should have id parameter in lesson detail route', () => {
      const lessonDetailRoute = protectedRoutes?.find((r) => r.path === 'lessons/:id');
      expect(lessonDetailRoute).toBeDefined();
      expect(lessonDetailRoute?.path).toContain(':id');
    });

    it('should have id parameter in exercise route', () => {
      const exerciseRoute = protectedRoutes?.find((r) => r.path === 'lessons/:id/exercise');
      expect(exerciseRoute).toBeDefined();
      expect(exerciseRoute?.path).toContain(':id');
    });

    it('should have id parameter in quiz route', () => {
      const quizRoute = protectedRoutes?.find((r) => r.path === 'quiz/:id');
      expect(quizRoute).toBeDefined();
      expect(quizRoute?.path).toContain(':id');
    });
  });

  describe('route count validation', () => {
    it('should have expected number of protected routes', () => {
      const routes = router.routes as RouteObject[];
      const rootRoute = routes.find((r) => r.path === '/');
      const protectedRoutes = rootRoute?.children;

      // Index + lessons (3) + roadmap + quiz (2) + progress + notes + admin (3) + not-found
      expect(protectedRoutes?.length).toBeGreaterThanOrEqual(13);
    });

    it('should have expected number of public routes', () => {
      const routes = router.routes as RouteObject[];
      const publicRoutes = routes.filter((r) => r.path !== '/');

      // login + auth/callback
      expect(publicRoutes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('route elements', () => {
    it('should have element defined for each route', () => {
      const routes = router.routes as RouteObject[];

      routes.forEach((route) => {
        if (route.path !== '/') {
          expect(route.element).toBeDefined();
        }
      });
    });

    it('should have element defined for protected child routes', () => {
      const routes = router.routes as RouteObject[];
      const rootRoute = routes.find((r) => r.path === '/');
      const protectedRoutes = rootRoute?.children || [];

      protectedRoutes.forEach((route) => {
        expect(route.element).toBeDefined();
      });
    });
  });

  describe('route paths uniqueness', () => {
    it('should have unique paths at root level', () => {
      const routes = router.routes as RouteObject[];
      const paths = routes.map((r) => r.path).filter(Boolean);
      const uniquePaths = new Set(paths);

      expect(paths.length).toBe(uniquePaths.size);
    });

    it('should have unique paths in protected routes', () => {
      const routes = router.routes as RouteObject[];
      const rootRoute = routes.find((r) => r.path === '/');
      const protectedRoutes = rootRoute?.children || [];

      const paths = protectedRoutes
        .filter((r) => !r.index)
        .map((r) => r.path)
        .filter(Boolean);
      const uniquePaths = new Set(paths);

      expect(paths.length).toBe(uniquePaths.size);
    });
  });
});
