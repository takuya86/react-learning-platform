import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from '@/components/ui';
import { useProgress } from '@/features/progress';
import { quizzes } from '@/data';
import styles from './QuizListPage.module.css';

export function QuizListPage() {
  const { progress } = useProgress();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>クイズ一覧</h1>
        <p className={styles.subtitle}>
          学んだ内容をクイズで確認しましょう
        </p>
      </header>

      <div className={styles.grid}>
        {quizzes.map((quiz) => {
          const isCompleted = progress.completedQuizzes.includes(quiz.id);

          return (
            <Card key={quiz.id} className={styles.card}>
              <CardHeader>
                <div className={styles.headerTop}>
                  <Badge variant="primary">
                    {quiz.questions.length} 問
                  </Badge>
                  {isCompleted && <Badge variant="success">完了</Badge>}
                </div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={styles.relatedLabel}>関連レッスン:</p>
                <div className={styles.relatedLessons}>
                  {quiz.relatedLessonIds.map((lessonId) => (
                    <Badge key={lessonId} variant="default">
                      {lessonId}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/quiz/${quiz.id}`} className={styles.link}>
                  {isCompleted ? 'もう一度挑戦' : 'クイズを始める'}
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
