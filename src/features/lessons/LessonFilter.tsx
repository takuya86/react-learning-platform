import { Input, Select } from '@/components/ui';
import type { Difficulty } from '@/domain/types';
import styles from './LessonFilter.module.css';

interface LessonFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedTag: string;
  onTagChange: (value: string) => void;
  selectedDifficulty: Difficulty | '';
  onDifficultyChange: (value: Difficulty | '') => void;
  availableTags: string[];
}

const difficultyOptions = [
  { value: '', label: 'すべての難易度' },
  { value: 'beginner', label: '初級' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' },
];

export function LessonFilter({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagChange,
  selectedDifficulty,
  onDifficultyChange,
  availableTags,
}: LessonFilterProps) {
  const tagOptions = [
    { value: '', label: 'すべてのタグ' },
    ...availableTags.map((tag) => ({ value: tag, label: tag })),
  ];

  return (
    <div className={styles.container} role="search">
      <div className={styles.searchWrapper}>
        <label htmlFor="lesson-search" className="sr-only">
          レッスン検索
        </label>
        <Input
          id="lesson-search"
          placeholder="タイトルやタグで検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="レッスンをタイトルやタグで検索"
        />
      </div>
      <div className={styles.filters} role="group" aria-label="フィルター条件">
        <label htmlFor="tag-filter" className="sr-only">
          タグフィルター
        </label>
        <Select
          id="tag-filter"
          options={tagOptions}
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
          aria-label="タグでフィルター"
        />
        <label htmlFor="difficulty-filter" className="sr-only">
          難易度フィルター
        </label>
        <Select
          id="difficulty-filter"
          options={difficultyOptions}
          value={selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value as Difficulty | '')}
          aria-label="難易度でフィルター"
        />
      </div>
    </div>
  );
}
