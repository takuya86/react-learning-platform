import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useProgress } from '@/features/progress';
import type { Lesson, Difficulty } from '@/domain/types';
import styles from './LessonCard.module.css';

interface LessonCardProps {
  lesson: Lesson;
}

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

export function LessonCard({ lesson }: LessonCardProps) {
  const { isLessonCompleted, isLessonOpened } = useProgress();
  const completed = isLessonCompleted(lesson.id);
  const opened = isLessonOpened(lesson.id);

  return (
    <Card className={`${styles.card} ${completed ? styles.completed : ''}`}>
      <CardHeader>
        <div className={styles.headerTop}>
          <Badge variant={difficultyVariants[lesson.difficulty]}>
            {difficultyLabels[lesson.difficulty]}
          </Badge>
          {completed && <Badge variant="success">完了</Badge>}
          {!completed && opened && <Badge variant="primary">学習中</Badge>}
        </div>
        <CardTitle>{lesson.title}</CardTitle>
        <CardDescription>{lesson.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={styles.tags}>
          {lesson.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>
        <p className={styles.duration}>約 {lesson.estimatedMinutes} 分</p>
      </CardContent>
      <CardFooter>
        <Link to={`/lessons/${lesson.id}`} className={styles.link}>
          {completed ? '復習する' : opened ? '続きを学ぶ' : 'レッスンを始める'}
        </Link>
      </CardFooter>
    </Card>
  );
}
