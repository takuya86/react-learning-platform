import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button, Input } from '@/components/ui';
import { isMockMode } from '@/lib/supabase';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { user, loading, signIn, signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mockRole, setMockRole] = useState<'user' | 'admin'>(() => {
    if (isMockMode && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.E2E_MOCK_ROLE);
      return stored === 'admin' ? 'admin' : 'user';
    }
    return 'user';
  });

  // Get the redirect path from location state, or default to home
  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  // If already logged in, redirect to the intended destination
  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const handleRoleChange = (newRole: 'user' | 'admin') => {
    setMockRole(newRole);
    localStorage.setItem(STORAGE_KEYS.E2E_MOCK_ROLE, newRole);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        setError(error.message);
      }
      // OAuth redirects to provider, so no navigation needed here
    } catch {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);

      if (error) {
        setError(error.message);
      } else if (!isSignUp) {
        // Only navigate on successful sign in
        // Sign up may require email confirmation
        navigate(from, { replace: true });
      } else {
        // Show success message for sign up
        setError('確認メールを送信しました。メールを確認してください。');
      }
    } catch {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {isMockMode && (
          <div className={styles.mockWarning}>
            <strong>開発モード:</strong> Supabase環境変数が未設定のため、認証機能は動作しません。
            <br />
            <code>.env.local</code> にSupabaseの認証情報を設定してください。
          </div>
        )}
        {isMockMode && (
          <div className={styles.roleSelector}>
            <label className={styles.roleSelectorLabel}>テスト用ロール:</label>
            <div className={styles.roleButtons}>
              <button
                type="button"
                className={`${styles.roleButton} ${mockRole === 'user' ? styles.roleButtonActive : ''}`}
                onClick={() => handleRoleChange('user')}
              >
                ユーザー
              </button>
              <button
                type="button"
                className={`${styles.roleButton} ${mockRole === 'admin' ? styles.roleButtonActive : ''}`}
                onClick={() => handleRoleChange('admin')}
              >
                管理者
              </button>
            </div>
          </div>
        )}
        <h1 className={styles.title}>{isSignUp ? 'アカウント作成' : 'ログイン'}</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              メールアドレス
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              パスワード
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
            />
          </div>

          {error && (
            <div
              className={styles.error}
              role="alert"
              style={{
                color: error.includes('確認メール') ? '#15803d' : undefined,
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={isSubmitting} className={styles.button}>
            {isSubmitting ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </Button>
        </form>

        {!isMockMode && (
          <div className={styles.oauthSection}>
            <div className={styles.divider}>
              <span>または</span>
            </div>
            <div className={styles.oauthButtons}>
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isSubmitting}
                className={`${styles.oauthButton} ${styles.googleButton}`}
              >
                <svg className={styles.oauthIcon} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleでログイン
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignIn('github')}
                disabled={isSubmitting}
                className={`${styles.oauthButton} ${styles.githubButton}`}
              >
                <svg className={styles.oauthIcon} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                  />
                </svg>
                GitHubでログイン
              </button>
            </div>
          </div>
        )}

        <div className={styles.switch}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className={styles.switchButton}
          >
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントを作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}
