import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, SyncStatusIndicator } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useProgress } from '@/features/progress';
import {
  getAllLessons,
  getLessonsForRoadmap,
  isLessonUnlocked,
  getIncompletePrerequisites,
} from '@/lib/lessons';
import type { Difficulty } from '@/domain/types';
import styles from './RoadmapPage.module.css';

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

const sectionInfo: Record<Difficulty, { title: string; description: string }> = {
  beginner: {
    title: '初級 - React の基礎',
    description: 'React の基本概念を学び、簡単なコンポーネントを作成できるようになります。',
  },
  intermediate: {
    title: '中級 - 実践的なパターン',
    description: 'より複雑なアプリケーションを構築するためのパターンとテクニックを習得します。',
  },
  advanced: {
    title: '上級 - 高度なテクニック',
    description: 'パフォーマンス最適化や設計パターンなど、より深い知識を身につけます。',
  },
};

export function RoadmapPage() {
  const { user } = useAuth();
  const { isLessonCompleted, getCompletedLessonIds } = useProgress();
  const lessons = getAllLessons();
  const groupedLessons = getLessonsForRoadmap(lessons);

  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

  // Get completed lesson IDs as a Set for unlock checking
  const completedIds = useMemo(() => {
    return new Set(getCompletedLessonIds());
  }, [getCompletedLessonIds]);

  // Calculate progress stats
  const stats = {
    total: lessons.length,
    completed: lessons.filter((l) => isLessonCompleted(l.id)).length,
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>学習パス</h1>
        <p className={styles.subtitle}>
          React を体系的に学ぶためのロードマップです。上から順に進めていくことをおすすめします。
        </p>
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {stats.completed} / {stats.total} 完了
          </span>
          {user && <SyncStatusIndicator />}
        </div>
      </header>

      <div className={styles.roadmap}>
        {difficulties.map((difficulty) => {
          const sectionLessons = groupedLessons[difficulty];
          if (sectionLessons.length === 0) return null;

          const sectionCompleted = sectionLessons.filter((l) => isLessonCompleted(l.id)).length;

          return (
            <section key={difficulty} className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleRow}>
                  <Badge variant={difficultyVariants[difficulty]} size="small">
                    {difficultyLabels[difficulty]}
                  </Badge>
                  <h2 className={styles.sectionTitle}>{sectionInfo[difficulty].title}</h2>
                </div>
                <p className={styles.sectionDescription}>{sectionInfo[difficulty].description}</p>
                <span className={styles.sectionProgress}>
                  {sectionCompleted} / {sectionLessons.length} 完了
                </span>
              </div>

              <div className={styles.lessonList}>
                {sectionLessons.map((lesson, index) => {
                  const completed = isLessonCompleted(lesson.id);
                  const unlocked = isLessonUnlocked(lesson.id, completedIds);
                  const incompletePrereqs = getIncompletePrerequisites(lesson.id, completedIds);

                  return (
                    <Link
                      key={lesson.id}
                      to={`/lessons/${lesson.id}`}
                      className={`${styles.lessonCard} ${completed ? styles.completed : ''} ${!unlocked && !completed ? styles.locked : ''}`}
                      data-testid={`roadmap-lesson-${lesson.id}`}
                    >
                      <div
                        className={`${styles.lessonNumber} ${!unlocked && !completed ? styles.lockedNumber : ''}`}
                      >
                        {completed ? '✓' : unlocked ? index + 1 : '🔒'}
                      </div>
                      <div className={styles.lessonContent}>
                        <div className={styles.lessonTitleRow}>
                          <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                          {completed ? (
                            <Badge variant="success" size="small">
                              完了
                            </Badge>
                          ) : unlocked ? (
                            <Badge variant="default" size="small">
                              学習可能
                            </Badge>
                          ) : null}
                        </div>
                        <p className={styles.lessonDescription}>{lesson.description}</p>
                        <div className={styles.lessonMeta}>
                          <span className={styles.lessonDuration}>
                            約 {lesson.estimatedMinutes} 分
                          </span>
                          {!unlocked && !completed && incompletePrereqs.length > 0 && (
                            <span className={styles.lockedPrereqs}>
                              未完了: {incompletePrereqs.map((p) => p.title).join(', ')}
                            </span>
                          )}
                          {unlocked && lesson.prerequisites.length > 0 && (
                            <span className={styles.lessonPrereqs}>
                              前提: {lesson.prerequisites.length}件クリア
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
