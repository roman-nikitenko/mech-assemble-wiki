import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "../lib/site";

/** Per-page SEO tags. React 19 hoists <title>/<meta>/<link> rendered anywhere
    in the tree up into <head> automatically, so a page just renders <Seo ... />
    and gets its own title, description, canonical URL, and social-share cards —
    no react-helmet needed.

    Keep the GLOBAL, page-independent tags (og:site_name, og:type, twitter:card,
    default og:image, theme-color, JSON-LD) in index.html. This component only
    emits the PER-PAGE tags, so nothing is duplicated between the two.

    `path` is the route this page lives at (e.g. "/mechs/abc"); it builds the
    canonical + og:url from SITE_URL. Pass a fully-formed <title> string — we
    don't append the site name here so callers stay in control. */
export function Seo({
  title,
  description = SITE_DESCRIPTION,
  path,
  image,
}: {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
}) {
  const url = siteUrl(path);
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph — how the page looks when shared on Discord, Facebook, etc. */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter/X card — falls back to the OG image set in index.html. */}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      <meta name="twitter:site" content={SITE_NAME} />
    </>
  );
}
