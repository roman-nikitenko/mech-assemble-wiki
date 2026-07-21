import type { SkillNodeRow, SkillNodeType } from "../../api/types";

// One editor row. The drafts array is ALWAYS in depth-first display order —
// every helper below preserves that invariant, which is what makes "a row's
// subtree is the contiguous run of deeper rows after it" true.
export interface SkillDraft {
  key: string;
  parentKey: string | null;
  name: string;
  description: string;
  appearanceLevel: number;
  type: SkillNodeType;
  expanded: boolean;
  // Normal-only flag (mirrors SkillNode.repeatable). Forced false for
  // Premium/Core in serializeDrafts, matching the server.
  repeatable: boolean;
}

export function rowDepth(drafts: SkillDraft[], row: SkillDraft): number {
  let depth = 0;
  let parentKey = row.parentKey;
  while (parentKey) {
    const parent = drafts.find((d) => d.key === parentKey);
    if (!parent) break;
    depth += 1;
    parentKey = parent.parentKey;
  }
  return depth;
}

// A row's subtree = itself + the contiguous DEEPER rows right after it.
export function subtreeSize(drafts: SkillDraft[], index: number): number {
  const depth = rowDepth(drafts, drafts[index]);
  let size = 1;
  for (let i = index + 1; i < drafts.length; i++) {
    if (rowDepth(drafts, drafts[i]) > depth) size += 1;
    else break;
  }
  return size;
}

// Indent: become a child of the nearest PREVIOUS SIBLING (same depth).
// No-op for a first sibling — there's nothing to indent under.
export function indentRow(drafts: SkillDraft[], index: number): SkillDraft[] {
  const row = drafts[index];
  const depth = rowDepth(drafts, row);
  for (let i = index - 1; i >= 0; i--) {
    const d = rowDepth(drafts, drafts[i]);
    if (d === depth) {
      const newParent = drafts[i].key;
      return drafts.map((r) => (r.key === row.key ? { ...r, parentKey: newParent } : r));
    }
    if (d < depth) break;
  }
  return drafts;
}

// Outdent: become a sibling of the current parent. The whole subtree block
// moves to sit right after the parent's subtree, keeping DFS order valid.
export function outdentRow(drafts: SkillDraft[], index: number): SkillDraft[] {
  const row = drafts[index];
  if (row.parentKey === null) return drafts;
  const parent = drafts.find((d) => d.key === row.parentKey)!;
  const size = subtreeSize(drafts, index);
  const block = drafts
    .slice(index, index + size)
    .map((r, i) => (i === 0 ? { ...r, parentKey: parent.parentKey } : r));
  const without = [...drafts.slice(0, index), ...drafts.slice(index + size)];
  const parentIndex = without.findIndex((d) => d.key === parent.key);
  const insertAt = parentIndex + subtreeSize(without, parentIndex);
  return [...without.slice(0, insertAt), ...block, ...without.slice(insertAt)];
}

// Remove: delete ONE row; its children are PROMOTED to its parent
// (WordPress-menu behavior).
export function removeRow(drafts: SkillDraft[], index: number): SkillDraft[] {
  const row = drafts[index];
  return drafts
    .filter((d) => d.key !== row.key)
    .map((d) => (d.parentKey === row.key ? { ...d, parentKey: row.parentKey } : d));
}

// Move a row's whole subtree so its header lands at position `to` (an index
// into the list WITHOUT the moving block), at `desiredDepth` — clamped the
// WordPress way: at most one deeper than the row that ends up above it.
export function moveRow(
  drafts: SkillDraft[],
  from: number,
  to: number,
  desiredDepth: number
): SkillDraft[] {
  const size = subtreeSize(drafts, from);
  const block = drafts.slice(from, from + size);
  const without = [...drafts.slice(0, from), ...drafts.slice(from + size)];
  const insertAt = Math.max(0, Math.min(to, without.length));
  const above = insertAt > 0 ? without[insertAt - 1] : null;
  const maxDepth = above ? rowDepth(without, above) + 1 : 0;
  const depth = Math.max(0, Math.min(desiredDepth, maxDepth));

  // parent = the ancestor of the row above sitting at depth-1
  let parentKey: string | null = null;
  if (depth > 0 && above) {
    let candidate: SkillDraft | null = above;
    let candidateDepth = rowDepth(without, above);
    while (candidate && candidateDepth >= depth) {
      const nextKey: string | null = candidate.parentKey;
      candidate = nextKey ? (without.find((d) => d.key === nextKey) ?? null) : null;
      candidateDepth -= 1;
    }
    parentKey = candidate?.key ?? null;
  }

  const rebased = block.map((r, i) => (i === 0 ? { ...r, parentKey } : r));
  return [...without.slice(0, insertAt), ...rebased, ...without.slice(insertAt)];
}

// API form: flat entries with parentIndex — always earlier thanks to the
// DFS-order invariant.
export function serializeDrafts(drafts: SkillDraft[]) {
  return drafts.map((d) => ({
    name: d.type === "Core" ? null : d.name.trim(),
    description: d.description.trim() === "" ? null : d.description.trim(),
    appearanceLevel: d.appearanceLevel,
    type: d.type,
    parentIndex: d.parentKey === null ? null : drafts.findIndex((p) => p.key === d.parentKey),
    repeatable: d.type === "Normal" ? d.repeatable : false,
  }));
}

// Edit prefill: group the API's flat nodes by parent, sort siblings, walk
// depth-first. Node ids double as draft keys.
export function draftsFromNodes(nodes: SkillNodeRow[]): SkillDraft[] {
  const byParent = new Map<string | null, SkillNodeRow[]>();
  for (const node of nodes) {
    const list = byParent.get(node.parentId) ?? [];
    list.push(node);
    byParent.set(node.parentId, list);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);
  const out: SkillDraft[] = [];
  const walk = (parentId: string | null, parentKey: string | null) => {
    for (const node of byParent.get(parentId) ?? []) {
      out.push({
        key: node.id,
        parentKey,
        name: node.name ?? "",
        description: node.description ?? "",
        appearanceLevel: node.appearanceLevel,
        type: node.type,
        expanded: false,
        repeatable: node.repeatable,
      });
      walk(node.id, node.id);
    }
  };
  walk(null, null);
  return out;
}
