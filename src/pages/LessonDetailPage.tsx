import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Button, Badge } from '@/components/ui';
import { useProgress } from '@/features/progress';
import { getLessonById, getQuizByLessonId } from '@/data';
import type { Difficulty } from '@/domain/types';
import styles from './LessonDetailPage.module.css';

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

export function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { markLessonOpened, completeLesson, isLessonCompleted } = useProgress();

  const lesson = id ? getLessonById(id) : undefined;
  const relatedQuiz = id ? getQuizByLessonId(id) : undefined;
  const completed = id ? isLessonCompleted(id) : false;

  useEffect(() => {
    if (id && lesson) {
      markLessonOpened(id);
    }
  }, [id, lesson, markLessonOpened]);

  if (!lesson) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>レッスンが見つかりません</h1>
          <p>指定されたレッスンは存在しないか、削除された可能性があります。</p>
          <Link to="/lessons">レッスン一覧に戻る</Link>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    if (id) {
      completeLesson(id);
    }
  };

  const handleGoToExercise = () => {
    if (lesson.exerciseId) {
      navigate(`/lessons/${id}/exercise`);
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Link to="/lessons">レッスン一覧</Link>
        <span className={styles.separator}>/</span>
        <span>{lesson.title}</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.meta}>
          <Badge variant={difficultyVariants[lesson.difficulty]}>
            {difficultyLabels[lesson.difficulty]}
          </Badge>
          <span className={styles.duration}>約 {lesson.estimatedMinutes} 分</span>
          {completed && <Badge variant="success">完了済み</Badge>}
        </div>
        <h1 className={styles.title}>{lesson.title}</h1>
        <p className={styles.description}>{lesson.description}</p>
        <div className={styles.tags}>
          {lesson.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      </header>

      <article className={styles.content}>
        <ReactMarkdown>{lesson.content}</ReactMarkdown>
      </article>

      <footer className={styles.footer}>
        <div className={styles.actions}>
          {!completed && (
            <Button onClick={handleComplete} variant="primary">
              このレッスンを完了にする
            </Button>
          )}
          {lesson.exerciseId && (
            <Button onClick={handleGoToExercise} variant="outline">
              演習に進む
            </Button>
          )}
          {relatedQuiz && (
            <Link to={`/quiz/${relatedQuiz.id}`} className={styles.quizLink} data-testid="open-quiz-link">
              クイズを開く
            </Link>
          )}
          <Link to={`/notes?lessonId=${id}`} className={styles.noteLink} data-testid="open-notes-link">
            ノートを開く
          </Link>
          <Link to="/lessons" className={styles.backLink}>
            レッスン一覧に戻る
          </Link>
        </div>
      </footer>
    </div>
  );
}
