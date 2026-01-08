import type { SaveStatus } from '../hooks/useNotes';
import styles from './NoteStatus.module.css';

interface NoteStatusProps {
  status: SaveStatus;
}

const statusLabels: Record<SaveStatus, string> = {
  idle: '',
  saving: '保存中...',
  saved: '保存しました',
  error: '保存に失敗しました',
};

export function NoteStatus({ status }: NoteStatusProps) {
  if (status === 'idle') {
    return null;
  }

  const statusClass = styles[status] ?? '';

  return (
    <span className={`${styles.status} ${statusClass}`}>
      {statusLabels[status]}
    </span>
  );
}
