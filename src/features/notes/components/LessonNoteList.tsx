import type { Lesson } from '@/domain/types';
import styles from './LessonNoteList.module.css';

interface LessonNoteListProps {
  lessons: Lesson[];
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
  hasNote: (lessonId: string) => boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function LessonNoteList({
  lessons,
  selectedLessonId,
  onSelectLesson,
  hasNote,
  searchQuery,
  onSearchChange,
}: LessonNoteListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.search}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="レッスンを検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {lessons.length === 0 ? (
          <div className={styles.empty}>
            該当するレッスンがありません
          </div>
        ) : (
          lessons.map((lesson) => {
            const isSelected = lesson.id === selectedLessonId;
            const hasNoteForLesson = hasNote(lesson.id);

            return (
              <button
                key={lesson.id}
                className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                onClick={() => onSelectLesson(lesson.id)}
              >
                <div className={styles.itemContent}>
                  <span className={styles.title}>{lesson.title}</span>
                  <div className={styles.meta}>
                    <span className={styles.difficulty}>
                      {lesson.difficulty === 'beginner' && '初級'}
                      {lesson.difficulty === 'intermediate' && '中級'}
                      {lesson.difficulty === 'advanced' && '上級'}
                    </span>
                    {hasNoteForLesson && (
                      <span className={styles.noteIndicator}>ノートあり</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
