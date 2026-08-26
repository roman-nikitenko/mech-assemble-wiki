import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreateDroneType, useDroneTypes, useUpdateDroneType } from "../../api/client";
import type { DroneTypeInput } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";

const EMPTY: DroneTypeInput = { name: "" };

/** One form for /admin/drone-types/new AND /admin/drone-types/:id/edit; edit
    prefills from the cached list. Returns to the Types page's Drone tab. */
export function DroneTypeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const droneTypes = useDroneTypes();
  const createDroneType = useCreateDroneType();
  const updateDroneType = useUpdateDroneType(id ?? "");
  const [form, setForm] = useState<DroneTypeInput>(EMPTY);

  useEffect(() => {
    if (isEdit && droneTypes.data) {
      const dt = droneTypes.data.find((d) => d.id === id);
      if (dt) setForm({ name: dt.name, iconUrl: dt.iconUrl });
    }
  }, [isEdit, id, droneTypes.data]);

  const mutation = isEdit ? updateDroneType : createDroneType;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form, { onSuccess: () => navigate("/admin/types?tab=drone") });
  }

  if (isEdit && droneTypes.isPending) return <p className="text-ink-dim">Loading…</p>;

  return (
    <div className="max-w-md">
      <Link to="/admin/types?tab=drone" className="text-sm text-ink-dim hover:text-accent">
        ← All drone types
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New drone type"}
      </h1>

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
            placeholder="e.g. Laser"
          />
        </div>

        <ImageUploadField
          label="Icon"
          value={form.iconUrl ?? null}
          onChange={(url) => setForm((f) => ({ ...f, iconUrl: url }))}
        />

        {mutation.isError && (
          <p className="text-sm text-fire">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={form.name.trim() === "" || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create drone type"}
        </button>
      </form>
    </div>
  );
}
