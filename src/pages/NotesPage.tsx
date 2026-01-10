import { useNotes, LessonNoteList, NotesLayout } from '@/features/notes';
import styles from './NotesPage.module.css';

export function NotesPage() {
  const {
    filteredLessons,
    selectedLesson,
    currentNote,
    searchQuery,
    saveStatus,
    selectLesson,
    setSearchQuery,
    updateNoteContent,
    deleteCurrentNote,
    hasNote,
  } = useNotes();

  return (
    <div className={styles.container} data-testid="notes-page">
      <aside className={styles.sidebar}>
        <LessonNoteList
          lessons={filteredLessons}
          selectedLessonId={selectedLesson?.id ?? null}
          onSelectLesson={selectLesson}
          hasNote={hasNote}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </aside>
      <main className={styles.main}>
        <NotesLayout
          selectedLesson={selectedLesson}
          currentNote={currentNote}
          saveStatus={saveStatus}
          onUpdateContent={updateNoteContent}
          onDeleteNote={deleteCurrentNote}
        />
      </main>
    </div>
  );
}
