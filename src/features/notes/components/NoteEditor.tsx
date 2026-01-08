import { useCallback, type ChangeEvent } from 'react';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function NoteEditor({
  value,
  onChange,
  placeholder = 'マークダウンでノートを書きましょう...',
  disabled = false,
}: NoteEditorProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className={styles.container}>
      <textarea
        className={styles.editor}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
      />
    </div>
  );
}
