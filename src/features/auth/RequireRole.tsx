import type { ReactNode } from 'react';
import { RequireAuth } from './RequireAuth';
import { useAuth } from './AuthContext';

interface RequireRoleProps {
  role: 'admin' | 'user';
  children: ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { role: userRole } = useAuth();

  // First ensure user is authenticated
  return (
    <RequireAuth>
      {userRole === role ? (
        <>{children}</>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>403 - アクセス拒否</h1>
          <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '0.5rem' }}>
            このページにアクセスする権限がありません。
          </p>
          <p style={{ fontSize: '1rem', color: '#888' }}>
            {role === 'admin'
              ? '管理者権限が必要です。管理者アカウントでログインしてください。'
              : 'ユーザー権限が必要です。'}
          </p>
        </div>
      )}
    </RequireAuth>
  );
}
