import Markdown from 'react-markdown';
import styles from './NotePreview.module.css';

interface NotePreviewProps {
  markdown: string;
}

export function NotePreview({ markdown }: NotePreviewProps) {
  if (!markdown.trim()) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          プレビューするコンテンツがありません
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Markdown>{markdown}</Markdown>
      </div>
    </div>
  );
}
