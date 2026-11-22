import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreateEvent, useEvents, useUpdateEvent } from "../../api/client";
import type { EventCategory, EventInput, RewardSection } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { EVENT_CATEGORIES } from "../../lib/eventCategories";
import { ImageUploadField } from "../ImageUploadField";

const BACK = "/admin/events";
const fieldClass = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

// The form keeps numbers as strings (so a half-typed field is fine) and turns them
// into numbers/nulls in toInput(). Reward items are editable rows; blank rows are
// dropped on save (the server does the same).
interface ItemForm { name: string; amount: string; quality: string; iconUrl: string | null }
interface SectionForm { section: string; note: string; items: ItemForm[] }
interface FormState {
  gameId: number | null; // kept as-is when editing an imported event
  name: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  minServerDay: string;
  featuring: string;
  iconUrl: string | null;
  backgroundUrl: string | null;
  otherBackgrounds: string[];
  rewards: SectionForm[];
}

const EMPTY_ITEM: ItemForm = { name: "", amount: "", quality: "0", iconUrl: null };
const EMPTY: FormState = {
  gameId: null, name: "", category: "draw", startDate: "", endDate: "", minServerDay: "",
  featuring: "", iconUrl: null, backgroundUrl: null, otherBackgrounds: [], rewards: [],
};

function toInput(f: FormState): EventInput {
  const rewards: RewardSection[] = f.rewards.map((s) => ({
    section: s.section.trim(),
    note: s.note.trim() || null,
    items: s.items
      .filter((i) => i.name.trim() !== "")
      .map((i) => ({
        name: i.name.trim(),
        amount: i.amount.trim() === "" ? null : Number(i.amount), // empty = a pool, not an amount
        quality: Number(i.quality) || 0,
        iconUrl: i.iconUrl,
      })),
  }));
  return {
    gameId: f.gameId, name: f.name.trim(), category: f.category, startDate: f.startDate, endDate: f.endDate,
    minServerDay: f.minServerDay.trim() === "" ? null : Number(f.minServerDay),
    featuring: f.featuring.trim() || null, iconUrl: f.iconUrl, backgroundUrl: f.backgroundUrl,
    otherBackgrounds: f.otherBackgrounds.filter((u) => u !== ""), rewards,
  };
}

/** One form for /admin/events/new AND /admin/events/:id/edit. */
export function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const events = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(id ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  // Fill once per event, and only from data that isn't being refetched — a refetch
  // landing mid-edit must not overwrite what the admin typed.
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (isEdit && events.data && !events.isFetching && seededFor.current !== id) {
      const e = events.data.find((x) => x.id === id);
      if (e) {
        seededFor.current = id;
        setForm({
          gameId: e.gameId, name: e.name, category: e.category, startDate: e.startDate, endDate: e.endDate,
          minServerDay: e.minServerDay === null ? "" : String(e.minServerDay),
          featuring: e.featuring ?? "", iconUrl: e.iconUrl, backgroundUrl: e.backgroundUrl,
          otherBackgrounds: e.otherBackgrounds,
          rewards: e.rewards.map((s) => ({
            section: s.section, note: s.note ?? "",
            items: s.items.map((i) => ({ name: i.name, amount: i.amount === null ? "" : String(i.amount), quality: String(i.quality), iconUrl: i.iconUrl })),
          })),
        });
      }
    }
  }, [isEdit, id, events.data, events.isFetching]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setSection = (i: number, patch: Partial<SectionForm>) =>
    setForm((f) => ({ ...f, rewards: f.rewards.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const setItem = (si: number, ii: number, patch: Partial<ItemForm>) =>
    setSection(si, { items: form.rewards[si].items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) });

  const mutation = isEdit ? updateEvent : createEvent;
  const datesOk = form.startDate !== "" && form.endDate !== "" && form.endDate >= form.startDate;
  const canSave = form.name.trim() !== "" && datesOk;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    mutation.mutate(toInput(form), { onSuccess: () => navigate(BACK) });
  }

  if (isEdit && (events.isPending || (events.isFetching && seededFor.current !== id))) {
    return <p className="text-ink-dim">Loading…</p>;
  }
  if (isEdit && events.isError) return <ErrorPanel onRetry={() => events.refetch()} />;
  if (isEdit && events.data && !events.data.some((x) => x.id === id)) {
    return (
      <div>
        <p className="text-ink-dim">That event no longer exists.</p>
        <Link to={BACK} className="text-accent underline">Back to events</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to={BACK} className="text-sm text-ink-dim hover:text-accent">← All events</Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">{isEdit ? `Edit ${form.name}` : "New event"}</h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">Name *</label>
          <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={fieldClass} placeholder="e.g. Wasteland Expedition" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-semibold">Category</label>
            <select id="category" value={form.category} onChange={(e) => set("category", e.target.value as EventCategory)} className={fieldClass}>
              {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="minServerDay" className="mb-1 block text-sm font-semibold">Minimum server day</label>
            <input id="minServerDay" type="number" min={0} value={form.minServerDay} onChange={(e) => set("minServerDay", e.target.value)} className={fieldClass} placeholder="e.g. 28" />
          </div>
          <div>
            <label htmlFor="startDate" className="mb-1 block text-sm font-semibold">Start date *</label>
            <input id="startDate" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1 block text-sm font-semibold">End date *</label>
            <input id="endDate" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={fieldClass} aria-describedby="endHint" />
            <p id="endHint" className="mt-1 text-xs text-ink-dim">The last day the event is still running.</p>
          </div>
        </div>
        {form.startDate !== "" && form.endDate !== "" && !datesOk && (
          <p role="alert" className="text-sm text-fire">The end date can't be before the start date.</p>
        )}

        <div>
          <label htmlFor="featuring" className="mb-1 block text-sm font-semibold">Featuring</label>
          <input id="featuring" value={form.featuring} onChange={(e) => set("featuring", e.target.value)} className={fieldClass} placeholder="e.g. Slash Fighter + Volt Kunai" />
        </div>

        <ImageUploadField label="Icon" value={form.iconUrl} onChange={(url) => set("iconUrl", url)} />
        <ImageUploadField label="Background" value={form.backgroundUrl} onChange={(url) => set("backgroundUrl", url)} />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Extra backgrounds (quest / pass / shop art)</legend>
          <div className="space-y-2">
            {form.otherBackgrounds.map((url, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <ImageUploadField label={`Extra background ${i + 1}`} value={url || null} onChange={(u) => set("otherBackgrounds", form.otherBackgrounds.map((x, j) => (j === i ? u ?? "" : x)))} />
                </div>
                <button type="button" aria-label={`Remove extra background ${i + 1}`} onClick={() => set("otherBackgrounds", form.otherBackgrounds.filter((_, j) => j !== i))} className="min-h-11 shrink-0 rounded-lg border border-fire/40 px-3 text-sm text-fire hover:bg-fire/10">−</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("otherBackgrounds", [...form.otherBackgrounds, ""])} className="mt-2 text-sm text-accent hover:underline">+ Add background</button>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Reward sections</legend>
          <div className="space-y-4">
            {form.rewards.map((s, si) => (
              <div key={si} className="rounded-lg border border-edge p-3">
                <div className="flex gap-2">
                  <input aria-label={`Section ${si + 1} title`} value={s.section} onChange={(e) => setSection(si, { section: e.target.value })} className={fieldClass} placeholder="Section title, e.g. Ranking: Rank 1" />
                  <input aria-label={`Section ${si + 1} note`} value={s.note} onChange={(e) => setSection(si, { note: e.target.value })} className={fieldClass} placeholder="Note (optional)" />
                  <button type="button" aria-label={`Remove section ${si + 1}`} onClick={() => set("rewards", form.rewards.filter((_, j) => j !== si))} className="min-h-11 shrink-0 rounded-lg border border-fire/40 px-3 text-sm text-fire hover:bg-fire/10">−</button>
                </div>
                <div className="mt-3 space-y-3">
                  {s.items.map((it, ii) => (
                    <div key={ii} className="rounded border border-edge/60 p-2">
                      <div className="flex flex-wrap gap-2">
                        <input aria-label={`Section ${si + 1} item ${ii + 1} name`} value={it.name} onChange={(e) => setItem(si, ii, { name: e.target.value })} className={`${fieldClass} sm:flex-1`} placeholder="Item name" />
                        <input aria-label={`Section ${si + 1} item ${ii + 1} amount`} type="number" min={0} value={it.amount} onChange={(e) => setItem(si, ii, { amount: e.target.value })} className={`${fieldClass} sm:w-32`} placeholder="Amount" />
                        <input aria-label={`Section ${si + 1} item ${ii + 1} quality`} type="number" min={0} value={it.quality} onChange={(e) => setItem(si, ii, { quality: e.target.value })} className={`${fieldClass} sm:w-24`} placeholder="Quality" />
                        <button type="button" aria-label={`Remove item ${ii + 1} of section ${si + 1}`} onClick={() => setSection(si, { items: s.items.filter((_, j) => j !== ii) })} className="min-h-11 shrink-0 rounded-lg border border-fire/40 px-3 text-sm text-fire hover:bg-fire/10">−</button>
                      </div>
                      <div className="mt-2">
                        <ImageUploadField label="Item icon" value={it.iconUrl} onChange={(u) => setItem(si, ii, { iconUrl: u })} />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setSection(si, { items: [...s.items, EMPTY_ITEM] })} className="mt-2 text-sm text-accent hover:underline">+ Add item</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("rewards", [...form.rewards, { section: "", note: "", items: [EMPTY_ITEM] }])} className="mt-2 text-sm text-accent hover:underline">+ Add reward section</button>
          <p className="mt-1 text-xs text-ink-dim">Leave Amount empty for a pool of possible items (shop, prize pool). Quality: 1 grey … 8 gold, 13 rainbow, 0 unknown.</p>
        </fieldset>

        {mutation.isError && <p role="alert" className="text-sm text-fire">{(mutation.error as Error).message}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={!canSave || mutation.isPending} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-bg hover:brightness-110 disabled:opacity-60">
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
          <Link to={BACK} className="flex min-h-11 items-center rounded-lg border border-edge px-5 text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
