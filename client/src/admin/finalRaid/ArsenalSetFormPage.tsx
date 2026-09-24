import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useArsenalSets, useCreateArsenalSet, useUpdateArsenalSet } from "../../api/client";
import type { ArsenalSetInput } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { ImageUploadField } from "../ImageUploadField";

const EMPTY: ArsenalSetInput = { name: "", iconUrl: null, twoPieceBonus: null, fourPieceBonus: null };
const BACK = "/admin/final-raid?tab=sets";

/** One form for /admin/final-raid/sets/new AND .../sets/:id/edit. Edit
    prefills from the cached list (sets are few, so there's no single-set
    endpoint). Saving returns to the Set arsenal tab. */
export function ArsenalSetFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const sets = useArsenalSets();
  const createSet = useCreateArsenalSet();
  const updateSet = useUpdateArsenalSet(id ?? "");
  const [form, setForm] = useState<ArsenalSetInput>(EMPTY);
  // Which set id the form was last filled from. TanStack Query refetches the
  // list in the background (e.g. when the window regains focus), which hands
  // this effect a new `sets.data` — without this guard, that refetch would
  // overwrite whatever the admin had typed since the page opened.
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    // Wait out any in-flight fetch: when the page opens on a cached list, the
    // cache may be stale (e.g. the piece was changed in another tab), and a
    // form filled from it would save those stale values back.
    if (isEdit && sets.data && !sets.isFetching && seededFor.current !== id) {
      const set = sets.data.find((s) => s.id === id);
      if (set) {
        seededFor.current = id;
        setForm({
          name: set.name,
          iconUrl: set.iconUrl,
          twoPieceBonus: set.twoPieceBonus,
          fourPieceBonus: set.fourPieceBonus,
        });
      }
    }
  }, [isEdit, id, sets.data, sets.isFetching]);

  const mutation = isEdit ? updateSet : createSet;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form, { onSuccess: () => navigate(BACK) });
  }

  // Also "loading" while the fresh copy is on its way and the form hasn't been
  // filled yet — otherwise the empty form would flash first.
  if (isEdit && (sets.isPending || (sets.isFetching && seededFor.current !== id))) {
    return <p className="text-ink-dim">Loading…</p>;
  }
  // Without this, a failed load would show an empty form for an existing set.
  if (isEdit && sets.isError) return <ErrorPanel onRetry={() => sets.refetch()} />;
  if (isEdit && sets.data && !sets.data.some((s) => s.id === id)) {
    return (
      <div>
        <p className="text-ink-dim">That set no longer exists.</p>
        <Link to={BACK} className="text-accent underline">
          Back to sets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <Link to={BACK} className="text-sm text-ink-dim hover:text-accent">
        ← All sets
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">{isEdit ? `Edit ${form.name}` : "New set"}</h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">
            Name *
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
            placeholder="e.g. Swift Set"
          />
        </div>

        <ImageUploadField
          label="Icon"
          value={form.iconUrl}
          onChange={(url) => setForm((f) => ({ ...f, iconUrl: url }))}
        />

        <div>
          <label htmlFor="two-piece" className="mb-1 block text-sm font-semibold">
            2-piece bonus
          </label>
          <textarea
            id="two-piece"
            rows={2}
            // "" in the textarea ↔ null in the payload; the server also
            // normalises blanks to null, this just keeps the input controlled.
            value={form.twoPieceBonus ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, twoPieceBonus: e.target.value }))}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
            placeholder="e.g. Fire Rate +100%"
          />
        </div>

        <div>
          <label htmlFor="four-piece" className="mb-1 block text-sm font-semibold">
            4-piece bonus
          </label>
          <textarea
            id="four-piece"
            rows={3}
            value={form.fourPieceBonus ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, fourPieceBonus: e.target.value }))}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
            placeholder="e.g. Each shot increases DMG by 15%, max 20 stacks, resets after reloading."
          />
        </div>

        {mutation.isError && <p className="text-sm text-fire">{(mutation.error as Error).message}</p>}

        <button
          type="submit"
          disabled={form.name.trim() === "" || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create set"}
        </button>
      </form>
    </div>
  );
}
