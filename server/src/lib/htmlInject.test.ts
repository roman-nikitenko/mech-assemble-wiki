import { describe, expect, it } from "vitest";
import { injectMeta } from "./htmlInject";
import type { PageMeta } from "./ogMeta";

// Mirrors the real index.html head: a multi-line description meta plus the
// site-level og:image / twitter defaults that must be overridden, not doubled.
const FIXTURE = `<!doctype html><html><head>
  <title>Mech Assemble Wiki — default</title>
  <meta
    name="description"
    content="default site description"
  />
  <meta property="og:site_name" content="Mech Assemble Wiki" />
  <meta property="og:image" content="https://mech-assemble-wiki.online/favicon.svg" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:image" content="https://mech-assemble-wiki.online/favicon.svg" />
</head><body></body></html>`;

const meta: PageMeta = {
  title: 'Mech Assemble Wiki — "Iron Colossus"',
  description: "A cool mech.",
  url: "https://mech-assemble-wiki.online/mechs/iron-colossus",
  image: "https://mech-assemble-wiki.online/uploads/colossus.png",
  largeImage: true,
};

describe("injectMeta", () => {
  it("replaces the title and injects og:title/description/url", () => {
    const out = injectMeta(FIXTURE, meta);
    expect(out).toContain('<title>Mech Assemble Wiki — &quot;Iron Colossus&quot;</title>');
    expect(out).toContain('<meta property="og:title" content="Mech Assemble Wiki — &quot;Iron Colossus&quot;" />');
    expect(out).toContain('<meta property="og:description" content="A cool mech." />');
    expect(out).toContain('<meta property="og:url" content="https://mech-assemble-wiki.online/mechs/iron-colossus" />');
  });

  it("overrides the default image + card without leaving duplicates", () => {
    const out = injectMeta(FIXTURE, meta);
    expect(out).toContain('<meta property="og:image" content="https://mech-assemble-wiki.online/uploads/colossus.png" />');
    expect(out).not.toContain("favicon.svg"); // both default image tags removed
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(out).not.toContain('content="summary"'); // old card removed
    // exactly one og:image tag survives
    expect(out.match(/property="og:image"/g)).toHaveLength(1);
  });

  it("keeps the favicon defaults when the page has no image", () => {
    const out = injectMeta(FIXTURE, { ...meta, image: null, largeImage: false });
    expect(out).toContain("favicon.svg"); // defaults untouched
    expect(out).toContain('content="summary"');
    expect(out).not.toContain('property="og:image" content="https://mech-assemble-wiki.online/uploads');
  });

  it("escapes HTML-special characters so values can't break out of attributes", () => {
    const out = injectMeta(FIXTURE, { ...meta, description: ' Before <b> & "quoted"' });
    expect(out).toContain('content="Before &lt;b&gt; &amp; &quot;quoted&quot;"');
  });

  it("replaces the default description meta (no leftover default)", () => {
    const out = injectMeta(FIXTURE, meta);
    expect(out).not.toContain("default site description");
    expect(out.match(/name="description"/g)).toHaveLength(1);
  });
});
