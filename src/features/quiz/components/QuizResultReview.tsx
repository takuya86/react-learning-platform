import type { QuizQuestion, QuestionResult } from '@/domain/types';
import { Badge } from '@/components/ui';
import styles from './QuizResultReview.module.css';

interface QuizResultReviewProps {
  questions: QuizQuestion[];
  results: QuestionResult[];
}

export function QuizResultReview({ questions, results }: QuizResultReviewProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>問題ごとの振り返り</h3>
      <div className={styles.list}>
        {questions.map((question, index) => {
          const result = results.find((r) => r.questionId === question.id);
          if (!result) return null;

          const selectedOption =
            result.selectedChoiceIndex !== null
              ? question.options[result.selectedChoiceIndex]
              : null;
          const correctOption = question.options[question.correctIndex];

          return (
            <div key={question.id} className={styles.item}>
              <div className={styles.header}>
                <span className={styles.number}>問題 {index + 1}</span>
                <div className={styles.badges}>
                  {result.isCorrect && <Badge variant="success">正解</Badge>}
                  {!result.isCorrect && !result.isSkipped && (
                    <Badge variant="danger">不正解</Badge>
                  )}
                  {result.isSkipped && <Badge variant="warning">スキップ</Badge>}
                  {result.hintUsed && <Badge variant="default">ヒント使用</Badge>}
                </div>
              </div>

              <p className={styles.question}>{question.question}</p>

              <div className={styles.answers}>
                {selectedOption !== null && (
                  <div
                    className={`${styles.answer} ${result.isCorrect ? styles.correct : styles.wrong}`}
                  >
                    <span className={styles.label}>あなたの回答:</span>
                    <span>{selectedOption}</span>
                  </div>
                )}
                {!result.isCorrect && (
                  <div className={`${styles.answer} ${styles.correct}`}>
                    <span className={styles.label}>正解:</span>
                    <span>{correctOption}</span>
                  </div>
                )}
              </div>

              <div className={styles.explanation}>
                <span className={styles.explanationLabel}>解説:</span>
                <p>{question.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
