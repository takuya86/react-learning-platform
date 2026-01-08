import { Outlet, NavLink } from 'react-router-dom';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <NavLink to="/" className={styles.logo}>
            React Learning
          </NavLink>
          <div className={styles.links}>
            <NavLink
              to="/lessons"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              レッスン
            </NavLink>
            <NavLink
              to="/quiz"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              クイズ
            </NavLink>
            <NavLink
              to="/notes"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              ノート
            </NavLink>
            <NavLink
              to="/progress"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              進捗
            </NavLink>
          </div>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>React Learning Platform - React学習のための実践プロジェクト</p>
      </footer>
    </div>
  );
}
