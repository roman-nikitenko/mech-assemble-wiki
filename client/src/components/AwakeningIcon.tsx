// One PNG per awakening node attribute, keyed by the game's own sprite name
// (e.g. "UI_Attr_hp"). Globbed eagerly like the drone borders and quality gems,
// so dropping a new sprite into the folder is enough — no edit here.
const iconAssets = import.meta.glob("../assets/awaking-icons/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// ".../UI_Attr_hp.png" -> "UI_Attr_hp"
const BY_KEY = new Map<string, string>(
  Object.entries(iconAssets).map(([path, url]) => [
    path.split("/").pop()?.replace(/\.png$/, "") ?? "",
    url,
  ])
);

/** The sprite for an awakening node. Renders nothing when the key is unknown or
    absent, so a node with a sprite we don't have still lays out correctly. */
export function AwakeningIcon({ icon, size = 32 }: { icon: string | null; size?: number }) {
  const url = icon === null ? undefined : BY_KEY.get(icon);
  if (url === undefined) return null;
  return <img src={url} alt="" width={size} height={size} className="object-contain" />;
}
