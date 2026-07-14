import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreateType, useTypes, useUpdateType } from "../../api/client";
import type { TypeInput } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";

const EMPTY: TypeInput = { name: "" };

/** One form for /admin/types/new AND /admin/types/:id/edit; edit prefills
    from the cached list (same pattern as pilots). */
export function TypeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const types = useTypes();
  const createType = useCreateType();
  const updateType = useUpdateType(id ?? "");
  const [form, setForm] = useState<TypeInput>(EMPTY);

  useEffect(() => {
    if (isEdit && types.data) {
      const type = types.data.find((t) => t.id === id);
      if (type) setForm({ name: type.name, iconUrl: type.iconUrl });
    }
  }, [isEdit, id, types.data]);

  const mutation = isEdit ? updateType : createType;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form, { onSuccess: () => navigate("/admin/types") });
  }

  if (isEdit && types.isPending) return <p className="text-ink-dim">Loading…</p>;

  return (
    <div className="max-w-md">
      <Link to="/admin/types" className="text-sm text-ink-dim hover:text-accent">
        ← All types
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New type"}
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
            placeholder="e.g. Thunder"
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
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create type"}
        </button>
      </form>
    </div>
  );
}
