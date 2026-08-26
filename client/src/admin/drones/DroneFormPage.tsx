import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { imageSrc, useCreateDrone, useDroneTypes, useDrones, useUpdateDrone } from "../../api/client";
import type { DroneInput, MechRank } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";
import { VideoUploadField } from "../VideoUploadField";
import { Dropdown } from "../../components/Dropdown";
import { STierIcon } from "../../components/STierIcon";

const TIERS: MechRank[] = ["Standard", "S"];

const EMPTY: DroneInput = {
  name: "",
  iconUrl: null,
  tier: "Standard",
  droneTypeId: null,
  inheritAttack: null,
  atk: null,
  hp: null,
  def: null,
  previewVideoUrl: null,
  levelUpBonuses: [],
};

// The four free-text stat fields, in the 2×2 layout the design asks for.
const STAT_FIELDS = [
  { key: "inheritAttack", label: "Inherited Attack" },
  { key: "atk", label: "ATK" },
  { key: "hp", label: "HP" },
  { key: "def", label: "DEF" },
] as const;

/** One form for /admin/drones/new AND /admin/drones/:id/edit; edit prefills
    from the cached list. */
export function DroneFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const drones = useDrones();
  const droneTypes = useDroneTypes();
  const createDrone = useCreateDrone();
  const updateDrone = useUpdateDrone(id ?? "");
  const [form, setForm] = useState<DroneInput>(EMPTY);
  // Level-up bonuses live as a fixed 4-row array; blanks are dropped on submit.
  const [bonuses, setBonuses] = useState<string[]>(["", "", "", ""]);

  useEffect(() => {
    if (isEdit && drones.data) {
      const drone = drones.data.find((d) => d.id === id);
      if (drone) {
        setForm({
          name: drone.name,
          iconUrl: drone.iconUrl,
          tier: drone.tier,
          droneTypeId: drone.droneTypeId,
          inheritAttack: drone.inheritAttack,
          atk: drone.atk,
          hp: drone.hp,
          def: drone.def,
          previewVideoUrl: drone.previewVideoUrl,
          levelUpBonuses: drone.levelUpBonuses,
        });
        setBonuses([...drone.levelUpBonuses, "", "", "", ""].slice(0, 4));
      }
    }
  }, [isEdit, id, drones.data]);

  const mutation = isEdit ? updateDrone : createDrone;

  function set<K extends keyof DroneInput>(key: K, value: DroneInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      { ...form, levelUpBonuses: bonuses },
      { onSuccess: () => navigate("/admin/drones") }
    );
  }

  if (isEdit && drones.isPending) return <p className="text-ink-dim">Loading…</p>;

  return (
    <div className="max-w-md">
      <Link to="/admin/drones" className="text-sm text-ink-dim hover:text-accent">
        ← All drones
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New drone"}
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
            className="min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
            placeholder="e.g. Scout Drone"
          />
        </div>

        {/* 2. Drone type (icons from the drone-types catalog) */}
        <div>
          <label className="mb-1 block text-sm font-semibold">Drone type</label>
          <Dropdown
            ariaLabel="Drone type"
            value={form.droneTypeId ?? ""}
            onChange={(v) => set("droneTypeId", v || null)}
            options={[
              { value: "", label: "No type" },
              ...(droneTypes.data ?? []).map((dt) => ({
                value: dt.id,
                label: dt.name,
                icon: dt.iconUrl ? (
                  <img src={imageSrc(dt.iconUrl)} alt="" className="h-5 w-5 rounded object-cover" />
                ) : undefined,
              })),
            ]}
          />
        </div>

        {/* 3. Tier */}
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
                  {t === "S" && <STierIcon size={18} />}
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Stats — 2 columns × 2 rows */}
        <div className="grid grid-cols-2 gap-3">
          {STAT_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={key} className="mb-1 block text-sm font-semibold">
                {label}
              </label>
              <input
                id={key}
                value={form[key] ?? ""}
                onChange={(e) => set(key, e.target.value || null)}
                className="min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
                placeholder="e.g. 54.00k"
              />
            </div>
          ))}
        </div>

        {/* 5. Icon */}
        <ImageUploadField
          label="Icon"
          value={form.iconUrl ?? null}
          onChange={(url) => set("iconUrl", url)}
        />

        {/* 6. Preview video — S-tier drones only */}
        {form.tier === "S" && (
          <VideoUploadField
            label="Preview video"
            value={form.previewVideoUrl ?? null}
            onChange={(url) => set("previewVideoUrl", url)}
          />
        )}

        {/* 7. Level-up bonuses — up to 4 rows */}
        <div>
          <label className="mb-1 block text-sm font-semibold">Level-up bonuses</label>
          <div className="space-y-2">
            {bonuses.map((bonus, i) => (
              <input
                key={i}
                aria-label={`Level ${i + 1} bonus`}
                value={bonus}
                onChange={(e) =>
                  setBonuses((list) => list.map((b, j) => (j === i ? e.target.value : b)))
                }
                className="min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
                placeholder={`Level ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {mutation.isError && (
          <p className="text-sm text-fire">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={form.name.trim() === "" || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create drone"}
        </button>
      </form>
    </div>
  );
}
