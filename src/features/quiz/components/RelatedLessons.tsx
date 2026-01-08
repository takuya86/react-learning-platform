import { Link } from 'react-router-dom';
import type { Lesson } from '@/domain/types';
import { Badge } from '@/components/ui';
import styles from './RelatedLessons.module.css';

interface RelatedLessonsProps {
  lessons: Lesson[];
  title?: string;
}

export function RelatedLessons({
  lessons,
  title = '関連レッスン',
}: RelatedLessonsProps) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>復習におすすめのレッスンです</p>
      <ul className={styles.list}>
        {lessons.map((lesson) => (
          <li key={lesson.id} className={styles.item}>
            <Link to={`/lessons/${lesson.id}`} className={styles.link}>
              <div className={styles.lessonInfo}>
                <span className={styles.lessonTitle}>{lesson.title}</span>
                <div className={styles.tags}>
                  {lesson.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <span className={styles.arrow}>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
