import { Suspense } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import styles from './Layout.module.css';

export function Layout() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={`${styles.layout} ${isAdminPage ? styles.adminTheme : ''}`}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <NavLink to="/" className={styles.logo}>
            React Learning
          </NavLink>
          <div className={styles.links}>
            <NavLink
              to="/lessons"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              レッスン
            </NavLink>
            <NavLink
              to="/roadmap"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              学習パス
            </NavLink>
            <NavLink
              to="/quiz"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              クイズ
            </NavLink>
            <NavLink
              to="/notes"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              ノート
            </NavLink>
            <NavLink
              to="/progress"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              進捗
            </NavLink>
            <NavLink
              to="/badges"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              バッジ
            </NavLink>
            <NavLink
              to="/leaderboard"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              ランキング
            </NavLink>
            {role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              >
                管理
              </NavLink>
            )}
          </div>
          <div className={styles.auth}>
            {user ? (
              <>
                <span className={styles.email}>{user.email}</span>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  ログアウト
                </button>
              </>
            ) : (
              <NavLink to="/login" className={styles.loginLink}>
                ログイン
              </NavLink>
            )}
          </div>
        </nav>
      </header>
      <main className={styles.main}>
        <Suspense
          fallback={
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
              <p>読み込み中...</p>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <footer className={styles.footer}>
        <p>React Learning Platform - React学習のための実践プロジェクト</p>
      </footer>
    </div>
  );
}
