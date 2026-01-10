import { useState, useMemo } from 'react';
import { LessonFilter, LessonList } from '@/features/lessons';
import { useDebounce } from '@/hooks';
import { getAllLessons, getAllTags } from '@/lib/lessons';
import type { Difficulty } from '@/domain/types';
import styles from './LessonsPage.module.css';

export function LessonsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | ''>('');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const lessons = useMemo(() => getAllLessons(), []);
  const availableTags = useMemo(() => getAllTags(), []);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch =
        debouncedSearchQuery === '' ||
        lesson.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        lesson.tags.some((tag) => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));

      const matchesTag = selectedTag === '' || lesson.tags.includes(selectedTag);

      const matchesDifficulty =
        selectedDifficulty === '' || lesson.difficulty === selectedDifficulty;

      return matchesSearch && matchesTag && matchesDifficulty;
    });
  }, [lessons, debouncedSearchQuery, selectedTag, selectedDifficulty]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>レッスン一覧</h1>
        <p className={styles.subtitle}>
          Reactの基礎から実践までを学びましょう。全{lessons.length}レッスン
        </p>
      </header>

      <LessonFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        availableTags={availableTags}
      />

      <LessonList lessons={filteredLessons} />
    </div>
  );
}
