import { imageSrc } from "../api/client";

export function LinkedBadge({ iconUrl }: { iconUrl?: string | null }) {
  return (
    <span
      className="absolute right-1 top-10 z-10 h-10 w-10 overflow-hidden rounded-md border border-accent bg-bg shadow"
      title="Linked skill"
      aria-label="Linked skill"
    >
      {iconUrl ? (
        <img src={imageSrc(iconUrl)} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-accent text-bg">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
            <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4v1.9H7a1.2 1.2 0 0 0 0 2.4h4V15H7A3.1 3.1 0 0 1 3.9 12zm5.1-.9h6v1.8H9v-1.8zM14 8.9h4a3.1 3.1 0 0 1 0 6.2h-4v-1.9h4a1.2 1.2 0 0 0 0-2.4h-4V8.9z" />
          </svg>
        </span>
      )}
    </span>
  );
}

export function linkedPartnerIcon(
  skill: { linkedWeaponId: string | null; linkedMechId: string | null },
  icons: Record<string, string | null> | undefined
): string | null {
  const partnerId = skill.linkedWeaponId ?? skill.linkedMechId;
  if (!partnerId || !icons) return null;
  return icons[partnerId] ?? null;
}
