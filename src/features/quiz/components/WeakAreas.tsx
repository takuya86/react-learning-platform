import type { WeakArea } from '../utils/analysis';
import styles from './WeakAreas.module.css';

interface WeakAreasProps {
  weakAreas: WeakArea[];
}

export function WeakAreas({ weakAreas }: WeakAreasProps) {
  if (weakAreas.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>苦手分野</h3>
        <p className={styles.empty}>苦手分野はありません。素晴らしいです！</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>苦手分野</h3>
      <p className={styles.description}>
        以下の分野の復習をおすすめします
      </p>
      <ul className={styles.list}>
        {weakAreas.map((area) => (
          <li key={area.tag} className={styles.item}>
            <span className={styles.tag}>{area.tag}</span>
            <div className={styles.stats}>
              <span className={styles.wrongCount}>
                {area.wrongCount} / {area.totalCount} 問不正解
              </span>
              <span className={styles.rate}>
                (不正解率: {Math.round(area.wrongRate * 100)}%)
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
