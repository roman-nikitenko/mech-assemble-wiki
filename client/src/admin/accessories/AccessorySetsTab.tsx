import { useEffect, useState } from "react";
import {
  useAccessories,
  useAccessorySets,
  useCreateAccessorySet,
  useDeleteAccessorySet,
  useUpdateAccessorySet,
} from "../../api/client";
import type { AccessorySet, AccessorySetPiece } from "../../api/types";
import { Dropdown } from "../../components/Dropdown";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

/** A set being edited. `id` is null for a block the admin just added and has
    not saved — those exist only in this component until Save is pressed, so an
    abandoned draft leaves nothing behind. */
interface Draft {
  id: string | null;
  key: string;
  name: string;
  bonus: string;
  pieces: AccessorySetPiece[];
  /** JSON of {name, bonus, accessoryIds} as last known to match the server —
      set when a draft is (re)seeded from a server row, and again right after
      a successful save. Comparing a draft's current fields against this is
      the single source of truth for "is this draft dirty" — used both to
      decide whether the reseed effect may safely overwrite a draft with
      fresh server data, and (via `isSaved` below) to know when the "Saved."
      indicator should show. `null` means this draft has never been saved
      (a fresh "+ Add set" block), so it's always considered dirty. */
  savedSnapshot: string | null;
}

/** The shape actually sent to / echoed back by the API — used to compare a
    draft's current fields against its last known server-synced state. */
interface SetPayload {
  name: string;
  bonus: string | null;
  accessoryIds: string[];
}

function payloadOfDraft(d: Pick<Draft, "name" | "bonus" | "pieces">): SetPayload {
  return {
    name: d.name.trim(),
    bonus: d.bonus.trim() === "" ? null : d.bonus.trim(),
    accessoryIds: d.pieces.map((p) => p.id),
  };
}

function payloadOfServer(s: AccessorySet): SetPayload {
  return { name: s.name, bonus: s.bonus, accessoryIds: s.accessories.map((p) => p.id) };
}

/** True once the draft's editable fields have diverged from the last state
    known to match the server (its initial seed, or its last successful
    save) — i.e. there is something here that hasn't been sent yet. */
function isDirty(draft: Draft): boolean {
  return draft.savedSnapshot !== JSON.stringify(payloadOfDraft(draft));
}

const draftFrom = (s: AccessorySet): Draft => ({
  id: s.id,
  key: s.id,
  name: s.name,
  bonus: s.bonus ?? "",
  pieces: s.accessories,
  savedSnapshot: JSON.stringify(payloadOfServer(s)),
});

function SetBlock({
  draft,
  options,
  onChange,
  onSaved,
  onRemove,
}: {
  draft: Draft;
  options: AccessorySetPiece[];
  onChange: (next: Draft) => void;
  /** Applied functionally against the LATEST draft, so a save cannot clobber
      edits typed while it was in flight. */
  onSaved: (saved: AccessorySet) => void;
  onRemove: () => void;
}) {
  const create = useCreateAccessorySet();
  const update = useUpdateAccessorySet(draft.id ?? "");
  const remove = useDeleteAccessorySet();
  const [error, setError] = useState<string | null>(null);
  // Whether THIS session actually performed a successful save since the last
  // edit. Combined with `!isDirty` (below) rather than react-query's own
  // isSuccess flag, because a create's isSuccess lives on a different
  // mutation object (`create`) than the `update` this block switches to the
  // moment its draft gets a real id — reading isSuccess off the "current"
  // mutation would make "Saved." flash and vanish right after a create.
  const [justSaved, setJustSaved] = useState(false);

  const mutation = draft.id === null ? create : update;
  const dirty = isDirty(draft);
  const isSaved = justSaved && !error && !dirty;

  function save() {
    if (draft.name.trim() === "") {
      setError("A set needs a name.");
      return;
    }
    setError(null);
    mutation.mutate(payloadOfDraft(draft), {
      // Adopt the server's own copy of the set (id included) as the new
      // baseline. Carrying the created id back into the draft here — rather
      // than waiting for the list to reseed — is what stops the reseed
      // effect from treating the newly created row as a second, unrelated
      // set with no matching draft.
      onSuccess: (saved) => {
        // Adopt ONLY the id and the new saved-baseline, never the server's copy
        // of the content: a save is not instant, and anything typed while it
        // was in flight would be silently reverted to the echoed body. Applied
        // against the latest draft, not the one captured when save() ran.
        onSaved(saved);
        setJustSaved(true);
      },
      onError: (e) => setError(e.message),
    });
  }

  function addPiece(id: string) {
    const picked = options.find((o) => o.id === id);
    // Already in this set — adding twice would send a duplicate id the server
    // would silently collapse, so ignore it here where we can say nothing.
    if (!picked || draft.pieces.some((p) => p.id === id)) return;
    onChange({ ...draft, pieces: [...draft.pieces, picked] });
  }

  return (
    <section className="mt-3 rounded-xl border border-edge bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label className="mb-1 block text-xs text-ink-dim">Name *</label>
          <input
            aria-label="Set name"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            className="min-h-11 w-full rounded-lg border border-edge bg-bg px-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            // An unsaved draft only exists locally — drop it immediately.
            // A saved set must wait for the server delete to succeed, so a
            // failed request leaves the set (and the error) in place to retry.
            if (draft.id === null) {
              onRemove();
              return;
            }
            remove.mutate(draft.id, {
              onSuccess: onRemove,
              onError: (e) => setError(e.message),
            });
          }}
          disabled={remove.isPending}
          className="min-h-11 rounded-lg border border-edge px-3 text-sm text-ink-dim hover:border-fire hover:text-fire disabled:opacity-50"
        >
          {remove.isPending ? "Deleting…" : "Delete set"}
        </button>
      </div>

      <label className="mt-3 mb-1 block text-xs text-ink-dim">
        Bonus when every piece is collected
      </label>
      <textarea
        aria-label="Set bonus"
        value={draft.bonus}
        onChange={(e) => onChange({ ...draft, bonus: e.target.value })}
        rows={2}
        className="w-full rounded-lg border border-edge bg-bg px-3 py-2 text-sm"
      />

      <h3 className="mt-3 text-xs text-ink-dim">Pieces ({draft.pieces.length})</h3>
      {draft.pieces.length > 0 && (
        <ul className="mt-1 space-y-1">
          {draft.pieces.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{p.name}</span>
              <button
                type="button"
                aria-label={`Remove ${p.name} from ${draft.name || "this set"}`}
                onClick={() =>
                  onChange({ ...draft, pieces: draft.pieces.filter((x) => x.id !== p.id) })
                }
                className="text-xs text-ink-dim hover:text-fire"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 max-w-sm">
        <Dropdown
          ariaLabel={`Add an accessory to ${draft.name || "this set"}`}
          searchable
          value={null}
          placeholder="+ Add accessory"
          onChange={addPiece}
          options={options
            .filter((o) => !draft.pieces.some((p) => p.id === o.id))
            .map((o) => ({ value: o.id, label: o.name }))}
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={mutation.isPending}
          className="min-h-11 rounded-lg border border-accent px-4 text-sm disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save set"}
        </button>
        {error && (
          <span role="alert" className="text-sm text-fire">
            {error}
          </span>
        )}
        {isSaved && <span className="text-sm text-accent">Saved.</span>}
      </div>
    </section>
  );
}

/** Admin, stateful editor — the "Sets" tab on /admin/accessories. Distinct
    from the public, read-only AccessorySetsTab at
    pages/sections/AccessorySetsTab.tsx; this one owns drafts, dirty-tracking
    and the create/update/delete mutations. */
export function AccessorySetsTab() {
  const sets = useAccessorySets();
  const accessories = useAccessories();
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Merge server truth into the existing drafts rather than replacing them
  // wholesale — several sets get entered/compared side by side here (that's
  // the whole reason this editor is inline instead of a form page), and
  // every create/update/delete invalidates this same query. Blindly
  // swapping in `sets.data` on each refetch would wipe out unsaved edits in
  // every OTHER open block the instant one of them got saved.
  useEffect(() => {
    if (!sets.data) return;
    setDrafts((prev) => {
      const remaining = new Map(sets.data.map((s) => [s.id, s]));
      const merged: Draft[] = [];
      for (const d of prev) {
        if (d.id === null) {
          // A fresh "+ Add set" block never has a server row to reconcile
          // against — always keep it, typed content and all.
          merged.push(d);
          continue;
        }
        const serverRow = remaining.get(d.id);
        remaining.delete(d.id);
        if (!serverRow) continue; // deleted server-side — drop it here too
        // Only overwrite with the server's copy if nothing local is pending;
        // a dirty draft's in-progress edits must survive an unrelated save.
        // Keep `key: d.key` (rather than the server row's own id) so a
        // just-created draft's React key does not change here — changing it
        // would remount SetBlock and destroy `justSaved` (the "Saved."
        // indicator) at the exact moment it should appear.
        merged.push(isDirty(d) ? d : { ...draftFrom(serverRow), key: d.key });
      }
      // Any server rows nobody local matched (first load, or another admin's
      // new set) get appended as drafts of their own.
      for (const s of remaining.values()) merged.push(draftFrom(s));
      return merged;
    });
  }, [sets.data]);

  if (sets.isPending) return <LoadingSkeleton variant="detail" />;
  // Without this, a failed GET falls through to `drafts.length === 0` below
  // and tells the admin "no accessory sets yet" during an API outage — the
  // public sets tab and the accessory table on this same admin page both
  // already show ErrorPanel here, so this brings the third one in line.
  if (sets.isError) return <ErrorPanel onRetry={() => sets.refetch()} />;

  const options: AccessorySetPiece[] = (accessories.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    tier: a.tier,
    iconUrl: a.iconUrl,
    imageUrl: a.imageUrl,
    // Carried so the shape matches what the sets API returns; the admin
    // editor itself never renders attributes.
    attributes: a.attributes,
  }));

  return (
    <div className="max-w-3xl">
      {accessories.isError && (
        // Without this, a failed accessories fetch leaves the "+ Add
        // accessory" dropdown in every block silently empty, with nothing
        // telling the admin that is a load failure and not "no accessories
        // exist yet".
        <p role="alert" className="mt-3 text-sm text-fire">
          Could not load the accessory list — the "+ Add accessory" pickers
          below will be empty until this succeeds.{" "}
          <button
            type="button"
            onClick={() => accessories.refetch()}
            className="underline hover:no-underline"
          >
            Retry
          </button>
        </p>
      )}

      {drafts.length === 0 && (
        <p className="mt-3 text-sm text-ink-dim">
          No accessory sets yet. Add one to group accessories that share a bonus.
        </p>
      )}

      {drafts.map((d) => (
        <SetBlock
          key={d.key}
          draft={d}
          options={options}
          onChange={(next) => setDrafts((prev) => prev.map((x) => (x.key === d.key ? next : x)))}
          onSaved={(saved) =>
            setDrafts((prev) =>
              prev.map((x) =>
                x.key === d.key
                  ? {
                      // Keep the live content; take only the server-assigned id
                      // and the new baseline the dirty check compares against.
                      ...x,
                      id: saved.id,
                      savedSnapshot: JSON.stringify(payloadOfServer(saved)),
                    }
                  : x
              )
            )
          }
          onRemove={() => setDrafts((prev) => prev.filter((x) => x.key !== d.key))}
        />
      ))}

      <button
        type="button"
        onClick={() =>
          setDrafts((prev) => [
            ...prev,
            { id: null, key: `draft-${Date.now()}`, name: "", bonus: "", pieces: [], savedSnapshot: null },
          ])
        }
        className="mt-4 min-h-11 rounded-lg border border-dashed border-edge px-4 text-sm hover:border-accent/60"
      >
        + Add set
      </button>
    </div>
  );
}
