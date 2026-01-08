import type { Lesson } from '@/domain/types';
import { LessonCard } from './LessonCard';
import styles from './LessonList.module.css';

interface LessonListProps {
  lessons: Lesson[];
}

export function LessonList({ lessons }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <div className={styles.empty}>
        <p>該当するレッスンが見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}
