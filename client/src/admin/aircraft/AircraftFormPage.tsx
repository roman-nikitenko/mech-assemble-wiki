import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAircraft, useCreateAircraft, useUpdateAircraft } from "../../api/client";
import type { AircraftInput, MechRank } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";
import { QualityIcon } from "../../components/QualityIcon";
import { AIRCRAFT_RANK_TIERS } from "../../components/RankUpPreview";
import { STierIcon } from "../../components/STierIcon";

const TIERS: MechRank[] = ["Standard", "S"];

const EMPTY: AircraftInput = {
  name: "",
  description: null,
  imageUrl: null,
  tier: "Standard",
  hp: null,
  atk: null,
  def: null,
  specialBonus: null,
  rankUpPreview: [],
};

// The three free-text stat fields, side by side on one row.
const STAT_FIELDS = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "ATK" },
  { key: "def", label: "DEF" },
] as const;

const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

/** One form for /admin/aircraft/new AND /admin/aircraft/:id/edit; edit prefills
    from the cached list. */
export function AircraftFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const aircraft = useAircraft();
  const createAircraft = useCreateAircraft();
  const updateAircraft = useUpdateAircraft(id ?? "");
  const [form, setForm] = useState<AircraftInput>(EMPTY);
  // The 5 rank slots live as a fixed-length array and are submitted raw: the
  // index IS the colour rank, so a blank slot has to keep its position.
  const [rankUp, setRankUp] = useState<string[]>(["", "", "", "", ""]);

  // Which aircraft the form has already been filled from. The list query can
  // refetch while the admin is typing (window focus, an invalidation), and
  // without this guard each refetch would reset the form and throw away
  // unsaved edits. Navigating to a different id still re-hydrates.
  const hydratedId = useRef<string | null>(null);

  useEffect(() => {
    if (isEdit && aircraft.data && hydratedId.current !== id) {
      const found = aircraft.data.find((a) => a.id === id);
      if (found) {
        hydratedId.current = found.id;
        setForm({
          name: found.name,
          description: found.description,
          imageUrl: found.imageUrl,
          tier: found.tier,
          hp: found.hp,
          atk: found.atk,
          def: found.def,
          specialBonus: found.specialBonus,
          rankUpPreview: found.rankUpPreview,
        });
        setRankUp([...found.rankUpPreview, "", "", "", "", ""].slice(0, 5));
      }
    }
  }, [isEdit, id, aircraft.data]);

  const mutation = isEdit ? updateAircraft : createAircraft;

  function set<K extends keyof AircraftInput>(key: K, value: AircraftInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      { ...form, rankUpPreview: rankUp },
      { onSuccess: () => navigate("/admin/aircraft") }
    );
  }

  if (isEdit && aircraft.isPending) return <p className="text-ink-dim">Loading…</p>;

  return (
    <div className="max-w-md">
      <Link to="/admin/aircraft" className="text-sm text-ink-dim hover:text-accent">
        ← All aircraft
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New aircraft"}
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {/* 1. Name */}
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">
            Name *
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={fieldCls}
            placeholder="e.g. Sky Raider"
          />
        </div>

        {/* 2. Tier */}
        <div>
          <label className="mb-1 block text-sm font-semibold">Tier</label>
          <div className="flex gap-2" role="group" aria-label="Tier">
            {TIERS.map((t) => {
              const active = form.tier === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-label={`Tier ${t}`}
                  aria-pressed={active}
                  onClick={() => set("tier", t)}
                  className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    active
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-edge text-ink-dim hover:border-accent/50"
                  }`}
                >
                  {t === "S" && <STierIcon size={45} />}
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Stats — three free-text fields on one row */}
        <div className="grid grid-cols-3 gap-3">
          {STAT_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={key} className="mb-1 block text-sm font-semibold">
                {label}
              </label>
              <input
                id={key}
                value={form[key] ?? ""}
                onChange={(e) => set(key, e.target.value || null)}
                className={fieldCls}
                placeholder="e.g. 54.00k"
              />
            </div>
          ))}
        </div>

        {/* 4. Special bonus — free text, like the mech field */}
        <div>
          <label htmlFor="specialBonus" className="mb-1 block text-sm font-semibold">
            Special bonus
          </label>
          <input
            id="specialBonus"
            value={form.specialBonus ?? ""}
            onChange={(e) => set("specialBonus", e.target.value || null)}
            className={fieldCls}
            placeholder="e.g. ATK +10%"
          />
        </div>

        {/* 5. Description */}
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold">
            Description
          </label>
          <textarea
            id="description"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
            rows={5}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
          />
        </div>

        {/* 6. Image */}
        <ImageUploadField
          label="Image"
          value={form.imageUrl ?? null}
          onChange={(url) => set("imageUrl", url)}
        />

        {/* 7. Rank-up preview — 5 positional slots, Orange → Mythic */}
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Rank Up Preview</legend>
          <p className="mb-2 text-xs text-ink-dim">
            Each slot is a colour rank — leave one empty if that rank grants
            nothing; it keeps its place.
          </p>
          <div className="space-y-2">
            {rankUp.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <QualityIcon tier={AIRCRAFT_RANK_TIERS[i]} />
                <input
                  aria-label={`Rank ${i + 1} preview`}
                  value={line}
                  onChange={(e) =>
                    setRankUp((list) => list.map((l, j) => (j === i ? e.target.value : l)))
                  }
                  className={fieldCls}
                  placeholder={AIRCRAFT_RANK_TIERS[i]}
                />
              </div>
            ))}
          </div>
        </fieldset>

        {mutation.isError && (
          <p className="text-sm text-fire">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={form.name.trim() === "" || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create aircraft"}
        </button>
      </form>
    </div>
  );
}
