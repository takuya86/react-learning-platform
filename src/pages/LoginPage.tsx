import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button, Input } from '@/components/ui';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the redirect path from location state, or default to home
  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  // If already logged in, redirect to the intended destination
  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

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
