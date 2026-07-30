import type { PageMeta } from "./ogMeta";

/** Escapes the HTML-significant chars (&, <, >, ") so admin/user text can't
    break out of an attribute or inject markup. Enough for text inside double-quoted
    attributes and for <title> content. Trims leading/trailing whitespace so
    accidental padding in admin-entered strings doesn't end up in tag values. */
function esc(value: string): string {
  // Ampersand must go first — otherwise the & in later replacements
  // (e.g. &lt;) would itself get double-escaped.
  return value
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Removes a single <meta …attr="value"…> tag (any attribute order / newlines).
    `attr`/`value` are our own literals, so no regex-escaping is needed. The
    `[^>]*` spans never cross a `>`, so a multi-line meta is matched whole. */
function removeMeta(html: string, attr: string, value: string): string {
  const re = new RegExp(`<meta\\s[^>]*${attr}=["']${value}["'][^>]*>`, "i");
  return html.replace(re, "");
}

/** Returns `html` with per-page tags injected. Overrides the static defaults it
    replaces (title, description, and — only when the page has its own image —
    og:image / twitter:image / twitter:card) so a scraper never sees two. */
export function injectMeta(html: string, meta: PageMeta): string {
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`);
  out = removeMeta(out, "name", "description");

  const lines = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
  ];

  if (meta.image) {
    // Drop the site-level favicon defaults so the real art is the only image.
    out = removeMeta(out, "property", "og:image");
    out = removeMeta(out, "name", "twitter:image");
    out = removeMeta(out, "name", "twitter:card");
    lines.push(
      `<meta property="og:image" content="${esc(meta.image)}" />`,
      `<meta name="twitter:image" content="${esc(meta.image)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    );
  }

  return out.replace("</head>", `${lines.join("\n    ")}\n  </head>`);
}
