const WELCOME_URL = "/assets/markdown/welcome_markdown.md";

let cached: string | null = null;
let inflight: Promise<string> | null = null;

/** Single shared fetch for the welcome note template (used on note routes). */
export function loadWelcomeMarkdown(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch(WELCOME_URL)
      .then((r) => r.text())
      .then((text) => {
        cached = text;
        return text;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
