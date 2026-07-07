// Turns a flat list of rows carrying {id, parentId} into a nested forest.
// Used for skill_upgrades and weapon_upgrades, whose branching trees are
// stored self-referentially (parent_id -> same table) in the database.
//
// Generic over T so each node keeps ALL its original fields (name,
// isEvolution, unlockReq, ...) and gains a children array. Works for any
// depth — no cap.

export interface TreeInput {
  id: string;
  parentId: string | null;
}

export type TreeNode<T extends TreeInput> = T & { children: TreeNode<T>[] };

export function buildTree<T extends TreeInput>(rows: T[]): TreeNode<T>[] {
  // Pass 1: wrap every row in a node with an empty children array,
  // indexed by id so parents can be found in O(1).
  const nodes = new Map<string, TreeNode<T>>();
  for (const row of rows) {
    nodes.set(row.id, { ...row, children: [] });
  }

  // Pass 2: attach each node to its parent; nodes without a (known)
  // parent are roots. Map preserves insertion order, so sibling order
  // follows the input order — sort the input before calling if you
  // need a specific sibling order.
  const roots: TreeNode<T>[] = [];
  for (const node of nodes.values()) {
    if (node.parentId !== null && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
