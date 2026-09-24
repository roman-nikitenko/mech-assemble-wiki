import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useArsenalPieces,
  useArsenalSets,
  useCreateArsenalPiece,
  useUpdateArsenalPiece,
} from "../../api/client";
import type { ArsenalPieceInput, ArsenalSlot } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { ARSENAL_QUALITIES } from "../../lib/arsenalQualities";
import { ARSENAL_SLOTS } from "../../lib/arsenalSlots";
import { ImageUploadField } from "../ImageUploadField";

const BACK = "/admin/final-raid";

type Kind = "normal" | "set";

/** The form's own state. It differs from ArsenalPieceInput in two ways:
    `slot` can be "" (nothing chosen yet — we don't want to silently default
    every new piece to Breastplate), and `kind` is kept separately from
    `setId` so that picking "Set arsenal" shows the dropdown BEFORE a set has
    been chosen. The payload only ever carries setId. */
interface FormState {
  name: string;
  iconUrl: string | null;
  slot: ArsenalSlot | "";
  qualityMin: number;
  qualityMax: number;
  kind: Kind;
  setId: string;
}

const EMPTY: FormState = {
  name: "",
  iconUrl: null,
  slot: "",
  qualityMin: 1,
  qualityMax: ARSENAL_QUALITIES.length,
  kind: "normal",
  setId: "",
};

/** What's stopping a save, or null when the form is ready. Shown next to the
    button so a disabled Save never leaves the admin guessing why. */
function blocker(form: FormState): string | null {
  if (form.name.trim() === "") return "Enter a name.";
  if (form.slot === "") return "Choose a slot.";
  if (form.qualityMin > form.qualityMax) return "The lowest quality can't be above the highest.";
  if (form.kind === "set" && form.setId === "") return "Choose the set this piece belongs to.";
  return null;
}

function toInput(form: FormState): ArsenalPieceInput {
  return {
    name: form.name,
    iconUrl: form.iconUrl,
    slot: form.slot as ArsenalSlot, // blocker() guarantees it's chosen
    qualityMin: form.qualityMin,
    qualityMax: form.qualityMax,
    // Normal arsenal never sends a set, even if one was picked and then the
    // admin switched back to Normal.
    setId: form.kind === "set" ? form.setId : null,
  };
}

const fieldClass = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

/** One form for /admin/final-raid/arsenal/new AND .../arsenal/:id/edit. */
export function ArsenalPieceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const pieces = useArsenalPieces();
  const sets = useArsenalSets();
  const createPiece = useCreateArsenalPiece();
  const updatePiece = useUpdateArsenalPiece(id ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  // Fill the form once per piece — a background refetch must not overwrite
  // unsaved edits (see ArsenalSetFormPage for the full story).
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    // Wait out any in-flight fetch: when the page opens on a cached list, the
    // cache may be stale (e.g. the piece was changed in another tab), and a
    // form filled from it would save those stale values back.
    if (isEdit && pieces.data && !pieces.isFetching && seededFor.current !== id) {
      const piece = pieces.data.find((p) => p.id === id);
      if (piece) {
        seededFor.current = id;
        setForm({
          name: piece.name,
          iconUrl: piece.iconUrl,
          slot: piece.slot,
          qualityMin: piece.qualityMin,
          qualityMax: piece.qualityMax,
          kind: piece.setId ? "set" : "normal",
          setId: piece.setId ?? "",
        });
      }
    }
  }, [isEdit, id, pieces.data, pieces.isFetching]);

  const mutation = isEdit ? updatePiece : createPiece;
  const reason = blocker(form);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason) return;
    mutation.mutate(toInput(form), { onSuccess: () => navigate(BACK) });
  }

  // Also "loading" while the fresh copy is on its way and the form hasn't been
  // filled yet — otherwise the empty form would flash first.
  if (isEdit && (pieces.isPending || (pieces.isFetching && seededFor.current !== id))) {
    return <p className="text-ink-dim">Loading…</p>;
  }
  if (isEdit && pieces.isError) return <ErrorPanel onRetry={() => pieces.refetch()} />;
  if (isEdit && pieces.data && !pieces.data.some((p) => p.id === id)) {
    return (
      <div>
        <p className="text-ink-dim">That piece no longer exists.</p>
        <Link to={BACK} className="text-accent underline">
          Back to arsenal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <Link to={BACK} className="text-sm text-ink-dim hover:text-accent">
        ← All arsenal
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">{isEdit ? `Edit ${form.name}` : "New piece"}</h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">
            Name *
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={fieldClass}
            placeholder="e.g. Swift Belt"
          />
        </div>

        <ImageUploadField
          label="Icon"
          value={form.iconUrl}
          onChange={(url) => setForm((f) => ({ ...f, iconUrl: url }))}
        />

        <div>
          <label htmlFor="slot" className="mb-1 block text-sm font-semibold">
            Slot *
          </label>
          <select
            id="slot"
            value={form.slot}
            onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value as ArsenalSlot | "" }))}
            className={fieldClass}
          >
            <option value="">Choose a slot…</option>
            {ARSENAL_SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* The range of qualities this piece exists at in the game — a future
            build lets the player pick a quality inside it. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="quality-min" className="mb-1 block text-sm font-semibold">
              Lowest quality
            </label>
            <select
              id="quality-min"
              value={form.qualityMin}
              onChange={(e) => setForm((f) => ({ ...f, qualityMin: Number(e.target.value) }))}
              className={fieldClass}
            >
              {ARSENAL_QUALITIES.map((q) => (
                <option key={q.quality} value={q.quality}>
                  {q.quality}. {q.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quality-max" className="mb-1 block text-sm font-semibold">
              Highest quality
            </label>
            <select
              id="quality-max"
              value={form.qualityMax}
              onChange={(e) => setForm((f) => ({ ...f, qualityMax: Number(e.target.value) }))}
              className={fieldClass}
            >
              {ARSENAL_QUALITIES.map((q) => (
                <option key={q.quality} value={q.quality}>
                  {q.quality}. {q.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Type *</legend>
          <div className="flex flex-wrap gap-4">
            {(
              [
                ["normal", "Normal arsenal"],
                ["set", "Set arsenal"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  checked={form.kind === value}
                  onChange={() => setForm((f) => ({ ...f, kind: value }))}
                  className="accent-accent"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {form.kind === "set" && (
          <div>
            <label htmlFor="set" className="mb-1 block text-sm font-semibold">
              Set *
            </label>
            {sets.isPending ? (
              <p className="text-sm text-ink-dim">Loading sets…</p>
            ) : sets.isError ? (
              <ErrorPanel onRetry={() => sets.refetch()} />
            ) : sets.data.length === 0 ? (
              <p className="text-sm text-ink-dim">
                No sets yet —{" "}
                <Link to="/admin/final-raid/sets/new" className="text-accent underline">
                  create one
                </Link>{" "}
                first.
              </p>
            ) : (
              <select
                id="set"
                value={form.setId}
                onChange={(e) => setForm((f) => ({ ...f, setId: e.target.value }))}
                className={fieldClass}
              >
                <option value="">Choose a set…</option>
                {sets.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {mutation.isError && <p className="text-sm text-fire">{(mutation.error as Error).message}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={reason !== null || mutation.isPending}
            className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create piece"}
          </button>
          {reason && <p className="text-sm text-ink-dim">{reason}</p>}
        </div>
      </form>
    </div>
  );
}
