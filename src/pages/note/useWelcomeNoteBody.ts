import { useEffect, useState } from "react";
import { loadWelcomeMarkdown } from "../../lib/welcomeMarkdown";

/** Welcome template markdown (cached module-wide in `loadWelcomeMarkdown`). */
export function useWelcomeNoteBody(): string {
  const [text, setText] = useState("");
  useEffect(() => {
    void loadWelcomeMarkdown().then(setText);
  }, []);
  return text;
}
