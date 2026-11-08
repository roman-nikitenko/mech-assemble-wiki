import type { Chip, ChipInput } from "../api/types";
import { EXPORT_FORMAT } from "./chipsImport";

/** The export document: only the editable fields (no ids or dates), so the
    file imports cleanly into any database — including a fresh one. */
export function buildChipsExport(chips: Chip[], now = new Date()) {
  const clean: ChipInput[] = chips.map((c) => ({ name: c.name, category: c.category, qualities: c.qualities }));
  return { format: EXPORT_FORMAT, version: 1, exportedAt: now.toISOString(), chips: clean };
}

/** Saves a JSON file in the browser: wrap the text in a Blob, point a hidden
    link at it and click it. */
export function downloadChipsJson(chips: Chip[], now = new Date()) {
  const blob = new Blob([JSON.stringify(buildChipsExport(chips, now), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chips-${now.toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
