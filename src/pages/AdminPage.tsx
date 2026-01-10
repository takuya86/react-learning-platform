import { useAuth } from '@/features/auth';
import styles from './AdminPage.module.css';

export function AdminPage() {
  const { user, role } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>管理者ページ</h1>
        <p className={styles.subtitle}>管理者専用の機能にアクセスできます</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ユーザー情報</h2>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>メールアドレス:</span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ユーザーID:</span>
              <span className={styles.infoValue}>{user?.id}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>権限:</span>
              <span className={`${styles.infoValue} ${styles.roleBadge} ${styles[role]}`}>
                {role === 'admin' ? '管理者' : 'ユーザー'}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>管理者機能</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>ユーザー管理</h3>
              <p className={styles.featureDescription}>
                ユーザーアカウントの作成、編集、削除を行います
              </p>
              <button className={styles.featureButton} disabled>
                準備中
              </button>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>コンテンツ管理</h3>
              <p className={styles.featureDescription}>
                レッスンやクイズの追加、編集、削除を行います
              </p>
              <button className={styles.featureButton} disabled>
                準備中
              </button>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>統計情報</h3>
              <p className={styles.featureDescription}>
                プラットフォーム全体の利用状況を確認します
              </p>
              <button className={styles.featureButton} disabled>
                準備中
              </button>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>システム設定</h3>
              <p className={styles.featureDescription}>プラットフォームの設定を変更します</p>
              <button className={styles.featureButton} disabled>
                準備中
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
