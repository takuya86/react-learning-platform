import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>ページが見つかりません</h2>
        <p className={styles.description}>
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link to="/" className={styles.link}>
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
