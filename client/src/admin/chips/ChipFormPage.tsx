import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useChips, useCreateChip, useUpdateChip } from "../../api/client";
import type { ChipCategory, ChipInput, ChipQuality } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { chipIcon } from "../../lib/chipArt";
import { CHIP_CATEGORIES, CHIP_QUALITIES, chipQualityTextStyle } from "../../lib/chipQualities";
import { ChipQualityEditor, emptyQuality } from "./ChipQualityEditor";

const BACK = "/admin/chips";
const fieldClass = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

/** Qualities are kept in a map by id so clicking a gem edits that quality
    without disturbing the others; the map becomes the server's array on save. */
interface FormState {
  name: string;
  category: ChipCategory;
  qualities: Record<number, ChipQuality>;
}

const EMPTY: FormState = { name: "", category: "Head", qualities: {} };

function toInput(form: FormState): ChipInput {
  return { name: form.name, category: form.category, qualities: Object.values(form.qualities) };
}

/** One form for /admin/chips/new AND /admin/chips/:id/edit. Choose the
    category first, then click each quality gem to fill in its own values. */
export function ChipFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const chips = useChips();
  const createChip = useCreateChip();
  const updateChip = useUpdateChip(id ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [selected, setSelected] = useState<number>(CHIP_QUALITIES[0].quality);
  // Name auto-suggests "[Head] Chip" until the admin types their own.
  const [nameTouched, setNameTouched] = useState(false);
  // Fill once per chip, from settled data (see HiddenAchievementFormPage).
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (isEdit && chips.data && !chips.isFetching && seededFor.current !== id) {
      const found = chips.data.find((c) => c.id === id);
      if (found) {
        seededFor.current = id;
        setNameTouched(true);
        setForm({
          name: found.name,
          category: found.category,
          qualities: Object.fromEntries(
            found.qualities.map((q) => [q.quality, { ...q, baseStats: q.baseStats.length ? q.baseStats : [""] }]),
          ),
        });
      }
    }
  }, [isEdit, id, chips.data, chips.isFetching]);

  function setCategory(category: ChipCategory) {
    setForm((f) => ({ ...f, category, name: nameTouched ? f.name : `[${category}] Chip` }));
  }

  const current = form.qualities[selected] ?? emptyQuality(selected);
  const mutation = isEdit ? updateChip : createChip;
  const canSave = form.name.trim() !== "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    mutation.mutate(toInput(form), { onSuccess: () => navigate(BACK) });
  }

  if (isEdit && (chips.isPending || (chips.isFetching && seededFor.current !== id))) {
    return <p className="text-ink-dim">Loading…</p>;
  }
  if (isEdit && chips.isError) return <ErrorPanel onRetry={() => chips.refetch()} />;
  if (isEdit && chips.data && !chips.data.some((c) => c.id === id)) {
    return (
      <div>
        <p className="text-ink-dim">That chip no longer exists.</p>
        <Link to={BACK} className="text-accent underline">
          Back to chips
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link to={BACK} className="text-sm text-ink-dim hover:text-accent">
        ← All chips
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">{isEdit ? `Edit ${form.name}` : "New chip"}</h1>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Category *</legend>
          <div className="flex flex-wrap gap-2">
            {CHIP_CATEGORIES.map((c) => (
              <button
                key={c.category}
                type="button"
                aria-pressed={form.category === c.category}
                onClick={() => setCategory(c.category)}
                className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold ${
                  form.category === c.category ? "border-accent bg-accent/15 text-accent" : "border-edge bg-surface text-ink-dim hover:text-ink"
                }`}
              >
                {c.category}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">
            Name *
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => {
              setNameTouched(true);
              setForm((f) => ({ ...f, name: e.target.value }));
            }}
            className={fieldClass}
            placeholder="e.g. [Head] Chip"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Qualities — click one to edit its values</p>
          <div role="tablist" aria-label="Quality" className="grid grid-cols-5 gap-1.5 sm:grid-cols-9">
            {CHIP_QUALITIES.map((q) => {
              const icon = chipIcon(form.category, q.quality);
              const filled = q.quality in form.qualities;
              const active = q.quality === selected;
              return (
                <button
                  key={q.quality}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelected(q.quality)}
                  className={`grid cursor-pointer justify-items-center gap-0.5 rounded-xl border px-0.5 pb-1 pt-1.5 font-mono text-[11px] ${
                    active ? "border-accent bg-accent/10" : "border-edge hover:border-accent/50"
                  }`}
                >
                  {icon && <img src={icon} alt="" className={`aspect-square w-full max-w-14 object-contain ${filled ? "" : "opacity-40"}`} />}
                  <span style={chipQualityTextStyle(q.quality)}>{q.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <section aria-label={`Edit quality ${selected}`} className="rounded-xl border border-edge bg-surface p-4">
          <ChipQualityEditor
            // key resets the editor's internal state when switching quality
            key={selected}
            value={current}
            onChange={(next) => setForm((f) => ({ ...f, qualities: { ...f.qualities, [selected]: next } }))}
          />
        </section>

        {mutation.isError && (
          <p role="alert" className="text-sm text-fire">
            {(mutation.error as Error).message}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canSave || mutation.isPending}
            className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : "Save chip"}
          </button>
          <Link to={BACK} className="inline-flex min-h-11 items-center rounded-lg border border-edge px-4 text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
