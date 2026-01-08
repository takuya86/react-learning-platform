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
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <Input
          placeholder="タイトルやタグで検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className={styles.filters}>
        <Select
          options={tagOptions}
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
        />
        <Select
          options={difficultyOptions}
          value={selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value as Difficulty | '')}
        />
      </div>
    </div>
  );
}
