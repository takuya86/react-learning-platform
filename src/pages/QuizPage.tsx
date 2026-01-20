import { useReducer, useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { useProgress } from '@/features/progress';
import { useGamification } from '@/features/gamification';
import { getQuizById } from '@/data';
import { getAllLessons } from '@/lib/lessons';
import { quizReducer, createInitialState, stateToSession } from '@/features/quiz/state/quizReducer';
import {
  saveQuizSession,
  loadQuizSession,
  deleteQuizSession,
  hasQuizSession,
} from '@/features/quiz/utils/storage';
import { buildQuestionResults, buildQuizAttempt } from '@/features/quiz/utils/scoring';
import { getWeakAreas, findRelatedLessons, calculateScore } from '@/features/quiz/utils/analysis';
import {
  QuizTimer,
  QuizProgress,
  QuizResultReview,
  WeakAreas,
  RelatedLessons,
} from '@/features/quiz/components';
import styles from './QuizPage.module.css';

// Helper to get current timestamp
const now = () => new Date().toISOString();

export function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completeQuiz, recordQuizAttempt } = useProgress();
  const { addXP, checkAndAwardBadges } = useGamification();
  const lessons = useMemo(() => getAllLessons(), []);

  const quiz = id ? getQuizById(id) : undefined;

  const [state, dispatch] = useReducer(
    quizReducer,
    { quizId: id || '', timeLimitSec: quiz?.timeLimitSec ?? null },
    ({ quizId, timeLimitSec }) => createInitialState(quizId, timeLimitSec, now())
  );

  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // Track if we've already saved the result to prevent double saves
  const resultSavedRef = useRef(false);

  // Check for existing session on mount
  useEffect(() => {
    if (!id) return;
    const hasSession = hasQuizSession(id);
    setHasExistingSession(hasSession);
    if (hasSession) {
      setShowResumeDialog(true);
    }
  }, [id]);

  // Auto-save session on state changes (but not when finished or showing resume dialog)
  useEffect(() => {
    if (!id || state.isFinished || showResumeDialog) return;

    const session = stateToSession(state);
    saveQuizSession(session);
  }, [id, state, showResumeDialog]);

  // Unified result saving: when isFinished becomes true, save result once
  useEffect(() => {
    if (!state.isFinished || !quiz || !id || resultSavedRef.current) return;

    // Mark as saved to prevent double execution
    resultSavedRef.current = true;

    // Delete session
    deleteQuizSession(id);

    // Record completion
    completeQuiz(id);

    // Build and record attempt
    const attempt = buildQuizAttempt(state, quiz.questions);
    recordQuizAttempt(attempt);

    // Award XP for quiz completion
    addXP('quiz_completed', id);

    // Check for perfect score and award bonus
    const isPerfect = attempt.score === attempt.totalQuestions;
    if (isPerfect) {
      addXP('quiz_perfect', id);
    }

    // Check for new badges
    checkAndAwardBadges();
  }, [
    state.isFinished,
    quiz,
    id,
    completeQuiz,
    recordQuizAttempt,
    state,
    addXP,
    checkAndAwardBadges,
  ]);

  const handleResume = useCallback(() => {
    if (!id) return;
    const session = loadQuizSession(id);
    if (session) {
      dispatch({ type: 'RESUME_FROM_SESSION', session, timestamp: now() });
    }
    setShowResumeDialog(false);
  }, [id]);

  const handleStartNew = useCallback(() => {
    if (!id) return;
    deleteQuizSession(id);
    dispatch({
      type: 'RESET',
      quizId: id,
      timeLimitSec: quiz?.timeLimitSec ?? null,
      timestamp: now(),
    });
    setShowResumeDialog(false);
    setHasExistingSession(false);
    resultSavedRef.current = false;
  }, [id, quiz?.timeLimitSec]);

  const handleTick = useCallback(() => {
    dispatch({ type: 'TICK', timestamp: now() });
  }, []);

  if (!quiz) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>クイズが見つかりません</h1>
          <p>指定されたクイズは存在しないか、削除された可能性があります。</p>
          <Link to="/quiz">クイズ一覧に戻る</Link>
        </div>
      </div>
    );
  }

  if (showResumeDialog && hasExistingSession) {
    return (
      <div className={styles.container}>
        <Card className={styles.resumeCard}>
          <CardContent>
            <h2 className={styles.resumeTitle}>前回の続きから再開しますか？</h2>
            <p className={styles.resumeDescription}>
              このクイズには保存された進捗があります。
              続きから再開するか、最初からやり直すか選択してください。
            </p>
            <div className={styles.resumeActions}>
              <Button onClick={handleResume} variant="primary">
                続きから再開
              </Button>
              <Button onClick={handleStartNew} variant="outline">
                最初からやり直す
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[state.currentIndex];
  const isLastQuestion = state.currentIndex === quiz.questions.length - 1;
  const hasAnswered = currentQuestion && state.answers[currentQuestion.id] !== undefined;
  const isSkipped = currentQuestion && state.skippedQuestionIds.includes(currentQuestion.id);
  const answeredCount = Object.keys(state.answers).filter(
    (qId) => state.answers[qId] !== null
  ).length;
  const skippedCount = state.skippedQuestionIds.length;

  const handleSelectAnswer = (answerIndex: number) => {
    if (hasAnswered || isSkipped) return;
    dispatch({
      type: 'SELECT_ANSWER',
      questionId: currentQuestion.id,
      answerIndex,
      timestamp: now(),
    });
  };

  const handleSkip = () => {
    if (hasAnswered) return;
    dispatch({
      type: 'SKIP_QUESTION',
      questionId: currentQuestion.id,
      totalQuestions: quiz.questions.length,
      timestamp: now(),
    });
  };

  const handleUseHint = () => {
    if (!currentQuestion.hint || state.hintUsedByQuestionId[currentQuestion.id]) return;
    dispatch({ type: 'USE_HINT', questionId: currentQuestion.id, timestamp: now() });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      dispatch({ type: 'FINISH', timestamp: now() });
    } else {
      dispatch({ type: 'NEXT_QUESTION', totalQuestions: quiz.questions.length, timestamp: now() });
    }
  };

  const handleRetry = () => {
    if (id) {
      deleteQuizSession(id);
    }
    resultSavedRef.current = false;
    dispatch({
      type: 'RESET',
      quizId: id || '',
      timeLimitSec: quiz.timeLimitSec ?? null,
      timestamp: now(),
    });
  };

  if (state.isFinished) {
    const questionResults = buildQuestionResults(state, quiz.questions);
    const { correct, total, percentage } = calculateScore(state.answers, quiz.questions);
    const weakAreas = getWeakAreas(questionResults, quiz.questions, 3);
    const weakTags = weakAreas.map((w) => w.tag);
    const relatedLessonsList = findRelatedLessons(weakTags, lessons, 3);

    return (
      <div className={styles.container}>
        <Card className={styles.resultCard}>
          <CardContent>
            <h2 className={styles.resultTitle}>クイズ完了！</h2>
            <div className={styles.score} data-testid="quiz-score">
              <span className={styles.scoreValue}>{correct}</span>
              <span className={styles.scoreTotal}>/ {total}</span>
            </div>
            <p className={styles.percentage} data-testid="quiz-percentage">
              {percentage}% 正解
            </p>
            <div className={styles.resultMessage}>
              {percentage === 100 && <p>素晴らしい！完璧です！</p>}
              {percentage >= 70 && percentage < 100 && <p>よくできました！</p>}
              {percentage < 70 && <p>もう一度復習してみましょう！</p>}
            </div>

            {weakAreas.length > 0 && <WeakAreas weakAreas={weakAreas} />}

            {relatedLessonsList.length > 0 && (
              <RelatedLessons lessons={relatedLessonsList} title="復習におすすめ" />
            )}

            <QuizResultReview questions={quiz.questions} results={questionResults} />

            <div className={styles.resultActions}>
              <Button onClick={handleRetry} variant="outline">
                もう一度挑戦
              </Button>
              <Button onClick={() => navigate('/quiz')} variant="primary">
                クイズ一覧に戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showHint = currentQuestion.hint && state.hintUsedByQuestionId[currentQuestion.id];

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Link to="/quiz">クイズ一覧</Link>
        <span className={styles.separator}>/</span>
        <span data-testid="quiz-title">{quiz.title}</span>
      </nav>

      <div className={styles.header}>
        <QuizProgress
          current={state.currentIndex}
          total={quiz.questions.length}
          answeredCount={answeredCount}
          skippedCount={skippedCount}
        />
        <QuizTimer
          timeRemainingSec={state.timeRemainingSec}
          onTick={handleTick}
          isRunning={!state.isFinished && !state.showExplanation}
        />
      </div>

      <Card className={styles.questionCard} data-testid="question-card">
        <CardContent>
          <div className={styles.questionHeader}>
            <h2 className={styles.question}>{currentQuestion.question}</h2>
            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
              <div className={styles.questionTags}>
                {currentQuestion.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {currentQuestion.hint && !hasAnswered && !isSkipped && (
            <div className={styles.hintSection}>
              {showHint ? (
                <div className={styles.hintContent}>
                  <span className={styles.hintLabel}>ヒント:</span> {currentQuestion.hint}
                </div>
              ) : (
                <Button onClick={handleUseHint} variant="outline" className={styles.hintButton}>
                  ヒントを見る
                </Button>
              )}
            </div>
          )}

          <div className={styles.options}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = state.answers[currentQuestion.id] === index;
              const isCorrect = index === currentQuestion.correctIndex;
              const showCorrectness = state.showExplanation || isSkipped;

              let optionClass = styles.option;
              if (showCorrectness) {
                if (isCorrect) {
                  optionClass = `${styles.option} ${styles.correct}`;
                } else if (isSelected) {
                  optionClass = `${styles.option} ${styles.incorrect}`;
                }
              } else if (isSelected) {
                optionClass = `${styles.option} ${styles.selected}`;
              }

              return (
                <button
                  key={index}
                  className={optionClass}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={hasAnswered || isSkipped}
                  data-testid="quiz-option"
                >
                  <span className={styles.optionIndex}>{String.fromCharCode(65 + index)}</span>
                  <span className={styles.optionText}>{option}</span>
                  {showCorrectness && isCorrect && <Badge variant="success">正解</Badge>}
                </button>
              );
            })}
          </div>

          {(state.showExplanation || isSkipped) && (
            <div className={styles.explanation}>
              <h3>解説</h3>
              <p>{currentQuestion.explanation}</p>
            </div>
          )}

          <div className={styles.actions}>
            {!hasAnswered && !isSkipped && (
              <Button onClick={handleSkip} variant="outline">
                スキップ
              </Button>
            )}
            {(hasAnswered || isSkipped) && (
              <Button onClick={handleNext} variant="primary">
                {isLastQuestion ? '結果を見る' : '次の問題へ'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
