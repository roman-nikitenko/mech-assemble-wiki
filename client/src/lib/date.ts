/** "24 feb 2026" — the site's date format. Fixed English short month
    (lowercased) so it renders the same for every visitor. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-GB", { month: "short" }).toLowerCase();
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}
