import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/app/Layout';
import type { User } from '@supabase/supabase-js';

// Mock useAuth hook
const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Helper to render with router
const renderWithRouter = (initialRoute = '/') => {
  window.history.pushState({}, 'Test page', initialRoute);
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Layout />}>
          <Route path="*" element={<div>Content</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
  });

  describe('rendering - not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: 'user',
        signOut: mockSignOut,
      });
    });

    it('should render header with navigation', () => {
      renderWithRouter();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render logo link', () => {
      renderWithRouter();
      const logo = screen.getByText('React Learning');
      expect(logo).toBeInTheDocument();
      expect(logo.closest('a')).toHaveAttribute('href', '/');
    });

    it('should render all navigation links', () => {
      renderWithRouter();
      expect(screen.getByText('レッスン')).toBeInTheDocument();
      expect(screen.getByText('学習パス')).toBeInTheDocument();
      expect(screen.getByText('クイズ')).toBeInTheDocument();
      expect(screen.getByText('ノート')).toBeInTheDocument();
      expect(screen.getByText('進捗')).toBeInTheDocument();
    });

    it('should render login link when user is not authenticated', () => {
      renderWithRouter();
      expect(screen.getByText('ログイン')).toBeInTheDocument();
      const loginLink = screen.getByText('ログイン').closest('a');
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should not render logout button when user is not authenticated', () => {
      renderWithRouter();
      expect(screen.queryByText('ログアウト')).not.toBeInTheDocument();
    });

    it('should not render admin link for non-admin users', () => {
      renderWithRouter();
      expect(screen.queryByText('管理')).not.toBeInTheDocument();
    });
  });

  describe('rendering - authenticated user', () => {
    const mockUser: Partial<User> = {
      id: 'user-1',
      email: 'test@example.com',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'user',
        signOut: mockSignOut,
      });
    });

    it('should display user email', () => {
      renderWithRouter();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render logout button', () => {
      renderWithRouter();
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });

    it('should call signOut when logout button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const logoutButton = screen.getByText('ログアウト');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it('should not render login link when user is authenticated', () => {
      renderWithRouter();
      expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
    });
  });

  describe('rendering - admin user', () => {
    const mockAdminUser: Partial<User> = {
      id: 'admin-1',
      email: 'admin@example.com',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        role: 'admin',
        signOut: mockSignOut,
      });
    });

    it('should render admin link for admin users', () => {
      renderWithRouter();
      expect(screen.getByText('管理')).toBeInTheDocument();
    });

    it('should have correct href for admin link', () => {
      renderWithRouter();
      const adminLink = screen.getByText('管理').closest('a');
      expect(adminLink).toHaveAttribute('href', '/admin');
    });
  });

  describe('admin theme', () => {
    const mockAdminUser: Partial<User> = {
      id: 'admin-1',
      email: 'admin@example.com',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        role: 'admin',
        signOut: mockSignOut,
      });
    });

    it('should not apply admin theme on non-admin pages', () => {
      renderWithRouter('/lessons');
      const layout = screen.getByRole('banner').parentElement;
      expect(layout?.className).not.toMatch(/adminTheme/);
    });

    it('should apply admin theme on admin pages', () => {
      renderWithRouter('/admin');
      const layout = screen.getByRole('banner').parentElement;
      expect(layout?.className).toMatch(/adminTheme/);
    });

    it('should apply admin theme on admin subpages', () => {
      renderWithRouter('/admin/backlog');
      const layout = screen.getByRole('banner').parentElement;
      expect(layout?.className).toMatch(/adminTheme/);
    });
  });

  describe('navigation links', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: 'user',
        signOut: mockSignOut,
      });
    });

    it('should have correct hrefs for all navigation links', () => {
      renderWithRouter();

      const lessonsLink = screen.getByText('レッスン').closest('a');
      expect(lessonsLink).toHaveAttribute('href', '/lessons');

      const roadmapLink = screen.getByText('学習パス').closest('a');
      expect(roadmapLink).toHaveAttribute('href', '/roadmap');

      const quizLink = screen.getByText('クイズ').closest('a');
      expect(quizLink).toHaveAttribute('href', '/quiz');

      const notesLink = screen.getByText('ノート').closest('a');
      expect(notesLink).toHaveAttribute('href', '/notes');

      const progressLink = screen.getByText('進捗').closest('a');
      expect(progressLink).toHaveAttribute('href', '/progress');
    });

    it('should apply active class to current route', () => {
      renderWithRouter('/lessons');
      const lessonsLink = screen.getByText('レッスン').closest('a');
      expect(lessonsLink?.className).toMatch(/active/);
    });
  });

  describe('layout structure', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: 'user',
        signOut: mockSignOut,
      });
    });

    it('should render main content area', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render footer', () => {
      renderWithRouter();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should display footer text', () => {
      renderWithRouter();
      expect(
        screen.getByText('React Learning Platform - React学習のための実践プロジェクト')
      ).toBeInTheDocument();
    });

    it('should render outlet for child routes', () => {
      renderWithRouter();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { email: 'test@example.com' } as User,
        role: 'user',
        signOut: mockSignOut,
      });
    });

    it('should handle signOut errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      renderWithRouter();

      const logoutButton = screen.getByText('ログアウト');
      await user.click(logoutButton);

      // The component should not crash
      expect(screen.getByText('ログアウト')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });
});
