export interface Note {
  lessonId: string;
  markdown: string;
  createdAt: string;
  updatedAt: string;
}

export const NOTES_STORAGE_VERSION = 1;

export interface NotesStorageData {
  version: number;
  notesByLessonId: Record<string, Note>;
}

export const initialNotesData: NotesStorageData = {
  version: NOTES_STORAGE_VERSION,
  notesByLessonId: {},
};
