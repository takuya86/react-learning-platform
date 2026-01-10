import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import type { LoadedLesson } from '@/lib/lessons';
import type { Difficulty } from '@/domain/types';
import styles from './NextLessonsCard.module.css';

const difficultyLabels: Record<Difficulty, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
};

const difficultyVariants: Record<Difficulty, 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

interface NextLessonsCardProps {
  recommendations: LoadedLesson[];
  className?: string;
}

export function NextLessonsCard({ recommendations, className = '' }: NextLessonsCardProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={`${styles.card} ${className}`} data-testid="next-lessons-card">
      <CardHeader>
        <CardTitle>次のおすすめ</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={styles.description}>前提条件をクリアした、今すぐ学習できるレッスンです</p>
        <div className={styles.lessonList}>
          {recommendations.map((lesson, index) => (
            <Link
              key={lesson.id}
              to={`/lessons/${lesson.id}`}
              className={styles.lessonItem}
              data-testid={`recommendation-${lesson.id}`}
            >
              <span className={styles.lessonNumber}>{index + 1}</span>
              <div className={styles.lessonContent}>
                <div className={styles.lessonHeader}>
                  <h4 className={styles.lessonTitle}>{lesson.title}</h4>
                  <Badge variant={difficultyVariants[lesson.difficulty]} size="small">
                    {difficultyLabels[lesson.difficulty]}
                  </Badge>
                </div>
                <p className={styles.lessonDescription}>{lesson.description}</p>
                <span className={styles.lessonDuration}>約 {lesson.estimatedMinutes} 分</span>
              </div>
            </Link>
          ))}
        </div>
        <div className={styles.footer}>
          <Link to="/roadmap" className={styles.viewAllLink}>
            学習パスを見る →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
