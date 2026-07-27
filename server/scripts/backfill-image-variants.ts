/**
 * One-time (idempotent) backfill: generate the responsive WebP variants for
 * images that were uploaded BEFORE the resize-on-upload change.
 *
 * It only ADDS `<stem>-<width>.webp` files next to each existing original — it
 * never renames, rewrites, or deletes the originals, so stored image URLs (and
 * the immutable browser cache) stay valid. Safe to re-run: images that already
 * have all their variants are skipped.
 *
 * Run with:  npm run image:variants
 */
import fs from "node:fs";
import path from "node:path";
import { uploadsDir, VARIANT_WIDTHS, variantName, writeResponsiveVariants } from "../src/routes/uploads";

// Extensions we treat as source images. Anything else in the folder is ignored.
const SOURCE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
// A file is a generated variant (not a base) if it ends with one of our widths.
const isVariant = (name: string) =>
  VARIANT_WIDTHS.some((w) => name.endsWith(`-${w}.webp`));

async function main() {
  const files = fs.readdirSync(uploadsDir);
  const bases = files.filter(
    (name) => SOURCE_EXT.has(path.extname(name).toLowerCase()) && !isVariant(name)
  );

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const base of bases) {
    const missing = VARIANT_WIDTHS.some(
      (w) => !fs.existsSync(path.join(uploadsDir, variantName(base, w)))
    );
    if (!missing) {
      skipped++;
      continue;
    }
    try {
      const buffer = fs.readFileSync(path.join(uploadsDir, base));
      await writeResponsiveVariants(buffer, base);
      processed++;
      console.log(`✓ ${base}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${base}: ${(err as Error).message}`);
    }
  }

  console.log(
    `\nDone. ${processed} generated, ${skipped} already had variants, ${failed} failed ` +
      `(${bases.length} base images total).`
  );
}

main();
