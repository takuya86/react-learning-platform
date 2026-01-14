import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson, Note } from '@/domain/types';
import { Button, SyncStatusIndicator } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { NoteEditor } from './NoteEditor';
import { NotePreview } from './NotePreview';
import { NoteStatus } from './NoteStatus';
import type { SaveStatus } from '../hooks/useNotes';
import styles from './NotesLayout.module.css';

type ViewMode = 'edit' | 'preview' | 'split';

interface NotesLayoutProps {
  selectedLesson: Lesson | null;
  currentNote: Note | null;
  saveStatus: SaveStatus;
  onUpdateContent: (markdown: string) => void;
  onDeleteNote: () => void;
}

export function NotesLayout({
  selectedLesson,
  currentNote,
  saveStatus,
  onUpdateContent,
  onDeleteNote,
}: NotesLayoutProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [localContent, setLocalContent] = useState('');

  // Sync local content with current note
  useEffect(() => {
    setLocalContent(currentNote?.markdown ?? '');
  }, [currentNote?.lessonId, currentNote?.markdown]);

  const handleContentChange = useCallback(
    (markdown: string) => {
      setLocalContent(markdown);
      onUpdateContent(markdown);
    },
    [onUpdateContent]
  );

  if (!selectedLesson) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>レッスンを選択してください</h2>
          <p>左のリストからレッスンを選択して、ノートを作成・編集できます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{selectedLesson.title}</h1>
          <div className={styles.headerActions}>
            <Link to={`/lessons/${selectedLesson.id}`} className={styles.lessonLink}>
              レッスンを見る
            </Link>
            <NoteStatus status={saveStatus} />
            {user && <SyncStatusIndicator showTime={false} />}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleButton} ${viewMode === 'edit' ? styles.active : ''}`}
              onClick={() => setViewMode('edit')}
            >
              編集
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'split' ? styles.active : ''}`}
              onClick={() => setViewMode('split')}
            >
              分割
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'preview' ? styles.active : ''}`}
              onClick={() => setViewMode('preview')}
            >
              プレビュー
            </button>
          </div>
          {currentNote && localContent.trim() && (
            <Button variant="outline" onClick={onDeleteNote}>
              削除
            </Button>
          )}
        </div>
      </header>

      <div className={`${styles.content} ${styles[viewMode]}`}>
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={styles.editorPane}>
            <NoteEditor value={localContent} onChange={handleContentChange} />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={styles.previewPane}>
            <NotePreview markdown={localContent} />
          </div>
        )}
      </div>
    </div>
  );
}
