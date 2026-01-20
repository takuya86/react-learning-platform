import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';

// Use vi.hoisted to properly hoist mock definitions before vi.mock
const { mockUseAuth, mockNavigate } = vi.hoisted(() => {
  const mockSignIn = vi.fn();
  const mockSignUp = vi.fn();
  const mockSignInWithOAuth = vi.fn();

  const mockUseAuth = {
    user: null as { id: string; email: string } | null,
    loading: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithOAuth: mockSignInWithOAuth,
  };

  const mockNavigate = vi.fn();

  return { mockUseAuth, mockNavigate };
});

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

// Mock auth hooks
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock supabase lib - using getter to allow dynamic value changes
let mockIsMockModeValue = false;
vi.mock('@/lib/supabase', () => ({
  get isMockMode() {
    return mockIsMockModeValue;
  },
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

const renderLoginPageWithLocation = (state?: { from?: { pathname: string } }) => {
  const initialEntries = state ? [{ pathname: '/login', state }] : ['/login'];
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LoginPage />
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUseAuth.user = null;
    mockUseAuth.loading = false;
    mockIsMockModeValue = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - basic structure', () => {
    it('should render login form with email and password inputs', () => {
      renderLoginPage();

      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });

    it('should render login title by default', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    });

    it('should render email input with correct attributes', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText('メールアドレス');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });

    it('should render password input with correct attributes', () => {
      renderLoginPage();

      const passwordInput = screen.getByLabelText('パスワード');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
      expect(passwordInput).toHaveAttribute('minlength', '6');
    });

    it('should render toggle button to switch to sign up', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: 'アカウントを作成する' })).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading message when auth is loading', () => {
      mockUseAuth.loading = true;
      renderLoginPage();

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
      expect(screen.queryByLabelText('メールアドレス')).not.toBeInTheDocument();
    });
  });

  describe('redirect when authenticated', () => {
    it('should redirect to home when user is already logged in', () => {
      mockUseAuth.user = { id: 'user-1', email: 'test@example.com' };
      mockUseAuth.loading = false;

      const { container } = renderLoginPageWithLocation();

      // Navigate component should render (redirect happens)
      expect(container.querySelector('form')).not.toBeInTheDocument();
    });

    it('should redirect to intended path when specified in location state', () => {
      mockUseAuth.user = { id: 'user-1', email: 'test@example.com' };
      mockUseAuth.loading = false;

      const { container } = renderLoginPageWithLocation({
        from: { pathname: '/notes' },
      });

      // Navigate component should render (redirect happens)
      expect(container.querySelector('form')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should have required attribute on email and password inputs', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });

    it('should require minimum 6 characters for password', () => {
      renderLoginPage();

      const passwordInput = screen.getByLabelText('パスワード');
      expect(passwordInput).toHaveAttribute('minlength', '6');
    });
  });

  describe('toggle between login and sign up', () => {
    it('should switch to sign up mode when toggle button is clicked', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const toggleButton = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleButton);

      expect(screen.getByRole('heading', { name: 'アカウント作成' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'アカウント作成' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'すでにアカウントをお持ちの方はこちら' })
      ).toBeInTheDocument();
    });

    it('should switch back to login mode when toggle button is clicked in sign up mode', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // Switch to sign up
      const toggleToSignUp = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleToSignUp);

      // Switch back to login
      const toggleToLogin = screen.getByRole('button', {
        name: 'すでにアカウントをお持ちの方はこちら',
      });
      await user.click(toggleToLogin);

      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });

    it('should clear error when toggling modes', async () => {
      const user = userEvent.setup();
      mockUseAuth.signIn.mockResolvedValueOnce({
        error: { message: 'Invalid credentials' },
      });

      renderLoginPage();

      // Submit form to trigger error
      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
      });

      // Toggle to sign up
      const toggleButton = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleButton);

      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should update password autocomplete attribute when switching modes', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const passwordInput = screen.getByLabelText('パスワード');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');

      // Switch to sign up
      const toggleButton = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    });
  });

  describe('form submission - login', () => {
    it('should call signIn with email and password on login submit', async () => {
      const user = userEvent.setup();
      mockUseAuth.signIn.mockResolvedValueOnce({ error: null });

      renderLoginPage();

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUseAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should navigate to home on successful login', async () => {
      const user = userEvent.setup();
      mockUseAuth.signIn.mockResolvedValueOnce({ error: null });

      renderLoginPage();

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();
      mockUseAuth.signIn.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid login credentials');
      });
    });

    it('should disable button and show loading text while submitting', async () => {
      const user = userEvent.setup();
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      mockUseAuth.signIn.mockReturnValueOnce(signInPromise);

      renderLoginPage();

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '処理中...' })).toBeDisabled();
      });

      // Resolve the promise
      resolveSignIn!({ error: null });

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '処理中...' })).not.toBeInTheDocument();
      });
    });

    it('should handle unexpected error during login', async () => {
      const user = userEvent.setup();
      mockUseAuth.signIn.mockRejectedValueOnce(new Error('Network error'));

      renderLoginPage();

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('予期しないエラーが発生しました');
      });
    });
  });

  describe('form submission - sign up', () => {
    it('should call signUp with email and password on sign up submit', async () => {
      const user = userEvent.setup();
      mockUseAuth.signUp.mockResolvedValueOnce({ error: null });

      renderLoginPage();

      // Switch to sign up mode
      const toggleButton = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleButton);

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'アカウント作成' });

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUseAuth.signUp).toHaveBeenCalledWith('newuser@example.com', 'password123');
      });
    });

    it('should show confirmation message on successful sign up', async () => {
      const user = userEvent.setup();
      mockUseAuth.signUp.mockResolvedValueOnce({ error: null });

      renderLoginPage();

      // Switch to sign up mode
      const toggleButton = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleButton);

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'アカウント作成' });

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          '確認メールを送信しました。メールを確認してください。'
        );
      });
    });

    it('should show error message on sign up failure', async () => {
      const user = userEvent.setup();
      mockUseAuth.signUp.mockResolvedValueOnce({
        error: { message: 'User already exists' },
      });

      renderLoginPage();

      // Switch to sign up mode
      const toggleButton = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleButton);

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'アカウント作成' });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('User already exists');
      });
    });

    it('should not navigate on successful sign up (requires email confirmation)', async () => {
      const user = userEvent.setup();
      mockUseAuth.signUp.mockResolvedValueOnce({ error: null });

      renderLoginPage();

      // Switch to sign up mode
      const toggleButton = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleButton);

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'アカウント作成' });

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUseAuth.signUp).toHaveBeenCalled();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('OAuth authentication', () => {
    beforeEach(() => {
      mockIsMockModeValue = false;
    });

    it('should render OAuth buttons when not in mock mode', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /Googleでログイン/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /GitHubでログイン/ })).toBeInTheDocument();
    });

    it('should not render OAuth buttons in mock mode', () => {
      mockIsMockModeValue = true;
      renderLoginPage();

      expect(screen.queryByRole('button', { name: /Googleでログイン/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /GitHubでログイン/ })).not.toBeInTheDocument();
    });

    it('should call signInWithOAuth with google provider', async () => {
      const user = userEvent.setup();
      mockUseAuth.signInWithOAuth.mockResolvedValueOnce({ error: null });

      renderLoginPage();

      const googleButton = screen.getByRole('button', { name: /Googleでログイン/ });
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockUseAuth.signInWithOAuth).toHaveBeenCalledWith('google');
      });
    });

    it('should call signInWithOAuth with github provider', async () => {
      const user = userEvent.setup();
      mockUseAuth.signInWithOAuth.mockResolvedValueOnce({ error: null });

      renderLoginPage();

      const githubButton = screen.getByRole('button', { name: /GitHubでログイン/ });
      await user.click(githubButton);

      await waitFor(() => {
        expect(mockUseAuth.signInWithOAuth).toHaveBeenCalledWith('github');
      });
    });

    it('should show error message on OAuth failure', async () => {
      const user = userEvent.setup();
      mockUseAuth.signInWithOAuth.mockResolvedValueOnce({
        error: { message: 'OAuth provider error' },
      });

      renderLoginPage();

      const googleButton = screen.getByRole('button', { name: /Googleでログイン/ });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('OAuth provider error');
      });
    });

    it('should disable OAuth buttons while submitting', async () => {
      const user = userEvent.setup();
      let resolveOAuth: (value: { error: null }) => void;
      const oauthPromise = new Promise<{ error: null }>((resolve) => {
        resolveOAuth = resolve;
      });
      mockUseAuth.signInWithOAuth.mockReturnValueOnce(oauthPromise);

      renderLoginPage();

      const googleButton = screen.getByRole('button', { name: /Googleでログイン/ });
      await user.click(googleButton);

      // Both OAuth buttons should be disabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Googleでログイン/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /GitHubでログイン/ })).toBeDisabled();
      });

      resolveOAuth!({ error: null });
    });

    it('should handle unexpected error during OAuth', async () => {
      const user = userEvent.setup();
      mockUseAuth.signInWithOAuth.mockRejectedValueOnce(new Error('Network error'));

      renderLoginPage();

      const googleButton = screen.getByRole('button', { name: /Googleでログイン/ });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('予期しないエラーが発生しました');
      });
    });
  });

  describe('mock mode specific features', () => {
    beforeEach(() => {
      mockIsMockModeValue = true;
    });

    it('should show mock mode warning', () => {
      renderLoginPage();

      expect(screen.getByText(/開発モード:/)).toBeInTheDocument();
      expect(screen.getByText(/Supabase環境変数が未設定/)).toBeInTheDocument();
    });

    it('should render role selector in mock mode', () => {
      renderLoginPage();

      expect(screen.getByText('テスト用ロール:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ユーザー' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '管理者' })).toBeInTheDocument();
    });

    it('should default to user role in mock mode', () => {
      renderLoginPage();

      const userButton = screen.getByRole('button', { name: 'ユーザー' });
      expect(userButton.className).toMatch(/roleButtonActive/);
    });

    it('should switch to admin role when admin button is clicked', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const adminButton = screen.getByRole('button', { name: '管理者' });
      await user.click(adminButton);

      expect(adminButton.className).toMatch(/roleButtonActive/);
      expect(localStorage.getItem('e2e_mock_role')).toBe('admin');
    });

    it('should switch to user role when user button is clicked after admin', async () => {
      const user = userEvent.setup();
      localStorage.setItem('e2e_mock_role', 'admin');
      renderLoginPage();

      const userButton = screen.getByRole('button', { name: 'ユーザー' });
      await user.click(userButton);

      expect(userButton.className).toMatch(/roleButtonActive/);
      expect(localStorage.getItem('e2e_mock_role')).toBe('user');
    });

    it('should load admin role from localStorage in mock mode', () => {
      localStorage.setItem('e2e_mock_role', 'admin');
      renderLoginPage();

      const adminButton = screen.getByRole('button', { name: '管理者' });
      expect(adminButton.className).toMatch(/roleButtonActive/);
    });
  });

  describe('error message styling', () => {
    it('should display error message with default styling for errors', async () => {
      const user = userEvent.setup();
      mockUseAuth.signIn.mockResolvedValueOnce({
        error: { message: 'Invalid credentials' },
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).not.toHaveStyle({ color: '#15803d' });
      });
    });

    it('should display success message with green color for confirmation email', async () => {
      const user = userEvent.setup();
      mockUseAuth.signUp.mockResolvedValueOnce({ error: null });

      renderLoginPage();

      // Switch to sign up mode
      const toggleButton = screen.getByRole('button', { name: 'アカウントを作成する' });
      await user.click(toggleButton);

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'アカウント作成' });

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveStyle({ color: '#15803d' });
      });
    });
  });
});
