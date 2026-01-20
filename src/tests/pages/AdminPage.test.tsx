import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '@/pages/AdminPage';
import type { User } from '@supabase/supabase-js';

// Use vi.hoisted to properly hoist mock definitions before vi.mock
const { mockUseAuth } = vi.hoisted(() => {
  const mockUseAuth = {
    user: null as User | null,
    role: 'user' as 'user' | 'admin',
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  };

  return { mockUseAuth };
});

// Mock auth hooks
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth,
}));

const MOCK_USER: User = {
  id: 'user-123',
  email: 'admin@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: { role: 'admin' },
  user_metadata: {},
} as User;

const renderAdminPage = () => {
  return render(
    <BrowserRouter>
      <AdminPage />
    </BrowserRouter>
  );
};

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.user = MOCK_USER;
    mockUseAuth.role = 'admin';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - basic structure', () => {
    it('should render admin page title and subtitle', () => {
      renderAdminPage();

      expect(screen.getByRole('heading', { name: '管理者ページ' })).toBeInTheDocument();
      expect(screen.getByText('管理者専用の機能にアクセスできます')).toBeInTheDocument();
    });

    it('should render user information section', () => {
      renderAdminPage();

      expect(screen.getByRole('heading', { name: 'ユーザー情報' })).toBeInTheDocument();
    });

    it('should render admin features section', () => {
      renderAdminPage();

      expect(screen.getByRole('heading', { name: '管理者機能' })).toBeInTheDocument();
    });
  });

  describe('user information display', () => {
    it('should display user email', () => {
      renderAdminPage();

      expect(screen.getByText('メールアドレス:')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    it('should display user ID', () => {
      renderAdminPage();

      expect(screen.getByText('ユーザーID:')).toBeInTheDocument();
      expect(screen.getByText('user-123')).toBeInTheDocument();
    });

    it('should display admin role badge', () => {
      mockUseAuth.role = 'admin';
      renderAdminPage();

      expect(screen.getByText('権限:')).toBeInTheDocument();
      expect(screen.getByText('管理者')).toBeInTheDocument();
    });

    it('should display user role badge when role is user', () => {
      mockUseAuth.role = 'user';
      renderAdminPage();

      expect(screen.getByText('権限:')).toBeInTheDocument();
      expect(screen.getByText('ユーザー')).toBeInTheDocument();
    });

    it('should handle null user gracefully', () => {
      mockUseAuth.user = null;
      renderAdminPage();

      expect(screen.getByText('メールアドレス:')).toBeInTheDocument();
      // Should not crash, email and id will be undefined/empty
    });
  });

  describe('admin feature cards', () => {
    it('should render user management card', () => {
      renderAdminPage();

      expect(screen.getByRole('heading', { name: 'ユーザー管理' })).toBeInTheDocument();
      expect(
        screen.getByText('ユーザーアカウントの作成、編集、削除を行います')
      ).toBeInTheDocument();
    });

    it('should render backlog management card', () => {
      renderAdminPage();

      expect(screen.getByRole('heading', { name: 'Backlog 管理' })).toBeInTheDocument();
      expect(
        screen.getByText('レッスン生成パイプラインのバックログを管理します')
      ).toBeInTheDocument();
    });

    it('should render metrics management card', () => {
      renderAdminPage();

      expect(screen.getByRole('heading', { name: 'Metrics 管理' })).toBeInTheDocument();
      expect(screen.getByText('プラットフォーム全体の利用状況を確認します')).toBeInTheDocument();
    });

    it('should render system settings card', () => {
      renderAdminPage();

      expect(screen.getByRole('heading', { name: 'システム設定' })).toBeInTheDocument();
      expect(screen.getByText('プラットフォームの設定を変更します')).toBeInTheDocument();
    });
  });

  describe('feature navigation', () => {
    it('should have link to backlog management page', () => {
      renderAdminPage();

      const links = screen.getAllByRole('link', { name: '管理画面へ' });
      const backlogLink = links.find((link) => link.getAttribute('href') === '/admin/backlog');
      expect(backlogLink).toBeInTheDocument();
      expect(backlogLink).toHaveAttribute('href', '/admin/backlog');
    });

    it('should have link to metrics management page', () => {
      renderAdminPage();

      const links = screen.getAllByRole('link', { name: '管理画面へ' });
      const metricsLink = links.find((link) => link.getAttribute('href') === '/admin/metrics');
      expect(metricsLink).toBeInTheDocument();
      expect(metricsLink).toHaveAttribute('href', '/admin/metrics');
    });

    it('should have disabled button for user management (coming soon)', () => {
      renderAdminPage();

      const buttons = screen.getAllByRole('button', { name: '準備中' });
      expect(buttons[0]).toBeDisabled();
    });

    it('should have disabled button for system settings (coming soon)', () => {
      renderAdminPage();

      const buttons = screen.getAllByRole('button', { name: '準備中' });
      expect(buttons[1]).toBeDisabled();
    });
  });

  describe('access control indicators', () => {
    it('should render all admin features regardless of role', () => {
      mockUseAuth.role = 'user';
      renderAdminPage();

      // Admin features are still rendered, access control should be handled by routing
      expect(screen.getByRole('heading', { name: 'ユーザー管理' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Backlog 管理' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Metrics 管理' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'システム設定' })).toBeInTheDocument();
    });
  });

  describe('user email variations', () => {
    it('should display different email addresses correctly', () => {
      mockUseAuth.user = {
        ...MOCK_USER,
        email: 'test.user@company.com',
      };
      renderAdminPage();

      expect(screen.getByText('test.user@company.com')).toBeInTheDocument();
    });

    it('should display different user IDs correctly', () => {
      mockUseAuth.user = {
        ...MOCK_USER,
        id: 'admin-456',
      };
      renderAdminPage();

      expect(screen.getByText('admin-456')).toBeInTheDocument();
    });
  });

  describe('feature card layout', () => {
    it('should render exactly 4 feature cards', () => {
      renderAdminPage();

      // Check by unique titles
      expect(screen.getByRole('heading', { name: 'ユーザー管理' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Backlog 管理' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Metrics 管理' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'システム設定' })).toBeInTheDocument();
    });

    it('should have 2 active links and 2 disabled buttons', () => {
      renderAdminPage();

      const links = screen.getAllByRole('link', { name: '管理画面へ' });
      expect(links).toHaveLength(2);

      const disabledButtons = screen.getAllByRole('button', { name: '準備中' });
      expect(disabledButtons).toHaveLength(2);
      disabledButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderAdminPage();

      const h1 = screen.getByRole('heading', { level: 1, name: '管理者ページ' });
      expect(h1).toBeInTheDocument();

      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThanOrEqual(2); // At least "ユーザー情報" and "管理者機能"

      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      expect(h3Headings).toHaveLength(4); // 4 feature cards
    });

    it('should have accessible links with descriptive text', () => {
      renderAdminPage();

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('should have accessible buttons with descriptive text', () => {
      renderAdminPage();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });
});
