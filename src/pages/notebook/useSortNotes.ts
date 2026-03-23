import { useCallback } from "react";
import type { Note } from "../../types";
import { sortNotesByUpdated } from "../../lib/sortNotesByUpdated";

export function useSortNotes() {
  return useCallback((notes: Note[]) => sortNotesByUpdated(notes), []);
}
