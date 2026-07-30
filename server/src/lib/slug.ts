// Turns a display name into a URL-safe slug used in public page paths
// (e.g. "Abyssal Knight" -> "abyssal-knight"). Pure and deterministic so it's
// easy to test; UNIQUENESS is handled separately at the DB layer, because that
// needs to look at other rows (see uniqueMechSlug in routes/mechs.ts).
export function slugify(input: string): string {
  return (
    input
      // Split accented letters into base + combining mark, then drop the marks
      // (U+0300-U+036F) so "Kaito" survives instead of losing the letter.
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      // Any run of non-alphanumerics (spaces, punctuation, ":") becomes one "-".
      .replace(/[^a-z0-9]+/g, "-")
      // No leading/trailing hyphens (e.g. from a name that ends in punctuation).
      .replace(/^-+|-+$/g, "")
  );
}
