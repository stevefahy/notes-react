import type { Note } from "../types";

const FALLBACK_DATE = "December 17, 1995 03:24:00";

/** Sort by updatedAt descending without mutating the source array or note objects. */
export function sortNotesByUpdated(notes: Note[]): Note[] {
  return [...notes]
    .map((n) =>
      n.updatedAt === "No date" || n.updatedAt === undefined
        ? { ...n, updatedAt: FALLBACK_DATE }
        : n,
    )
    .sort((a, b) => {
      if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
        return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1;
      }
      return a.updatedAt !== undefined ? 1 : -1;
    })
    .reverse();
}
