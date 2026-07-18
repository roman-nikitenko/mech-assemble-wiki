/** Tiny markup language for build notes (deliberately no library — the
    needs are small and fixed, and storage stays a plain string):
      ## Heading      → h2        (whole line)
      ### Heading     → h3        (whole line)
      **bold**        → bold
      *italic*        → italic
      #[Iron Colossus]→ mention   (brackets because names contain spaces)
    Headings take the rest of their line verbatim — no inline markup inside.
    Unmatched markers are left as literal text, never errors. */

export type NoteInline =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "mention"; name: string };

export type NoteBlock =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; parts: NoteInline[] };

// ** before * so bold wins; [^*] keeps matches from crossing markers.
const INLINE = /\*\*([^*]+)\*\*|\*([^*]+)\*|#\[([^\]]+)\]/g;

export function parseInline(text: string): NoteInline[] {
  const parts: NoteInline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ kind: "text", text: text.slice(last, at) });
    if (m[1] !== undefined) parts.push({ kind: "bold", text: m[1] });
    else if (m[2] !== undefined) parts.push({ kind: "italic", text: m[2] });
    else parts.push({ kind: "mention", name: m[3] });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

/** Plain-text excerpt of a note (markers stripped, mentions become bare
    names) — used by the public Builds list cards. */
export function noteExcerpt(text: string, maxLength = 120): string {
  const plain = parseNote(text)
    .map((block) =>
      block.kind === "p"
        ? block.parts.map((p) => (p.kind === "mention" ? p.name : p.text)).join("")
        : block.text
    )
    .join(" ")
    .trim();
  return plain.length <= maxLength ? plain : `${plain.slice(0, maxLength).trimEnd()}…`;
}

export function parseNote(text: string): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (line.trim() === "") continue; // blank lines just separate blocks
    if (line.startsWith("### ")) blocks.push({ kind: "h3", text: line.slice(4) });
    else if (line.startsWith("## ")) blocks.push({ kind: "h2", text: line.slice(3) });
    else blocks.push({ kind: "p", parts: parseInline(line) });
  }
  return blocks;
}
