import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { useProgress } from '@/features/progress';
import { getLessonById } from '@/lib/lessons';
import { getExerciseById } from '@/data';
import styles from './ExercisePage.module.css';

export function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  const { completeExercise, progress } = useProgress();

  const lesson = id ? getLessonById(id) : undefined;
  const exercise = lesson?.exerciseId ? getExerciseById(lesson.exerciseId) : undefined;
  const isCompleted = exercise ? progress.completedExercises.includes(exercise.id) : false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  if (!lesson || !exercise) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>演習が見つかりません</h1>
          <p>指定された演習は存在しないか、このレッスンには演習がありません。</p>
          <Link to="/lessons">レッスン一覧に戻る</Link>
        </div>
      </div>
    );
  }

  const onSubmit = () => {
    completeExercise(exercise.id);
    alert('演習を完了しました！');
  };

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Link to="/lessons">レッスン一覧</Link>
        <span className={styles.separator}>/</span>
        <Link to={`/lessons/${id}`}>{lesson.title}</Link>
        <span className={styles.separator}>/</span>
        <span>演習</span>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{exercise.title}</h1>
        <p className={styles.description}>{exercise.description}</p>
        {isCompleted && <div className={styles.completedBadge}>完了済み</div>}
      </header>

      <Card className={styles.instructionsCard}>
        <CardHeader>
          <CardTitle>演習の説明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.instructions}>
            <ReactMarkdown>{exercise.instructions}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <Card className={styles.formCard}>
        <CardHeader>
          <CardTitle>回答を入力</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {exercise.fields.map((field) => (
              <div key={field.name} className={styles.field}>
                {field.type === 'text' && (
                  <Input
                    label={field.label}
                    placeholder={field.placeholder}
                    error={errors[field.name]?.message as string}
                    {...register(field.name, {
                      required: field.required ? `${field.label}は必須です` : false,
                    })}
                  />
                )}
                {field.type === 'textarea' && (
                  <div className={styles.textareaWrapper}>
                    <label className={styles.label}>{field.label}</label>
                    <textarea
                      className={styles.textarea}
                      placeholder={field.placeholder}
                      {...register(field.name, {
                        required: field.required ? `${field.label}は必須です` : false,
                      })}
                    />
                    {errors[field.name] && (
                      <span className={styles.error}>{errors[field.name]?.message as string}</span>
                    )}
                  </div>
                )}
                {field.type === 'checkbox' && (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      {...register(field.name, {
                        required: field.required ? `${field.label}に同意してください` : false,
                      })}
                    />
                    <span>{field.label}</span>
                    {errors[field.name] && (
                      <span className={styles.error}>{errors[field.name]?.message as string}</span>
                    )}
                  </label>
                )}
              </div>
            ))}
            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                {isCompleted ? '再提出する' : '提出する'}
              </Button>
              <Link to={`/lessons/${id}`} className={styles.backLink}>
                レッスンに戻る
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
