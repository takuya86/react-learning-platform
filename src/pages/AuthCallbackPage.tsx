import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import styles from './AuthCallbackPage.module.css';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get the code from URL (PKCE flow)
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      if (code) {
        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }
      }

      // Check if we have a session (handles hash-based auth too)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Success - redirect to dashboard
        navigate('/', { replace: true });
      } else {
        // No session and no code - check hash fragment
        // Supabase may have already processed the hash
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              navigate('/', { replace: true });
            } else {
              setError('認証に失敗しました。もう一度お試しください。');
            }
          });
        }, 1000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>認証エラー</h1>
          <p className={styles.error}>{error}</p>
          <button className={styles.button} onClick={() => navigate('/login', { replace: true })}>
            ログインページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>認証中...</h1>
        <p className={styles.message}>メール認証を処理しています。しばらくお待ちください。</p>
        <div className={styles.spinner} />
      </div>
    </div>
  );
}
