// Client-side copy of the server's slugify (server/src/lib/slug.ts), used ONLY
// to preview the URL in the admin form as you type. The server remains the
// source of truth — it re-slugifies and de-duplicates on save — so this is a
// cosmetic hint, not validation. Kept in sync by hand; the two are tiny.
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
