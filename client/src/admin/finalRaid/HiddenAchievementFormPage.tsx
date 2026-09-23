import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useCreateHiddenAchievement,
  useHiddenAchievements,
  useUpdateHiddenAchievement,
} from "../../api/client";
import type { HiddenAchievementInput } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { ACHIEVEMENT_TIERS, achievementQualityImage } from "../../lib/achievementQuality";
import { ImageUploadField } from "../ImageUploadField";

const BACK = "/admin/final-raid?tab=achievements";

/** The form keeps the two rewards as separate fields (that's how the game
    words them, and how the admin types them); they become an array on save,
    with blanks dropped by the server. */
interface FormState {
  name: string;
  description: string;
  iconUrl: string | null;
  tier: number;
  reward1: string;
  reward2: string;
}

const EMPTY: FormState = { name: "", description: "", iconUrl: null, tier: 1, reward1: "", reward2: "" };

function toInput(form: FormState): HiddenAchievementInput {
  return {
    name: form.name,
    description: form.description,
    iconUrl: form.iconUrl,
    tier: form.tier,
    // A blank Reward 1 with a filled Reward 2 collapses to one reward —
    // position carries no meaning here, unlike the mech rank-up preview.
    rewards: [form.reward1, form.reward2].filter((r) => r.trim() !== ""),
  };
}

const fieldClass = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

/** One form for /admin/final-raid/achievements/new AND .../:id/edit. */
export function HiddenAchievementFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const achievements = useHiddenAchievements();
  const createAchievement = useCreateHiddenAchievement();
  const updateAchievement = useUpdateHiddenAchievement(id ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  // Fill once per achievement, and only from data that isn't being refetched —
  // see ArsenalSetFormPage for why both halves matter.
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (isEdit && achievements.data && !achievements.isFetching && seededFor.current !== id) {
      const found = achievements.data.find((a) => a.id === id);
      if (found) {
        seededFor.current = id;
        setForm({
          name: found.name,
          description: found.description,
          iconUrl: found.iconUrl,
          tier: found.tier,
          reward1: found.rewards[0] ?? "",
          reward2: found.rewards[1] ?? "",
        });
      }
    }
  }, [isEdit, id, achievements.data, achievements.isFetching]);

  const mutation = isEdit ? updateAchievement : createAchievement;
  const canSave = form.name.trim() !== "" && form.description.trim() !== "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    mutation.mutate(toInput(form), { onSuccess: () => navigate(BACK) });
  }

  if (isEdit && (achievements.isPending || (achievements.isFetching && seededFor.current !== id))) {
    return <p className="text-ink-dim">Loading…</p>;
  }
  if (isEdit && achievements.isError) return <ErrorPanel onRetry={() => achievements.refetch()} />;
  if (isEdit && achievements.data && !achievements.data.some((a) => a.id === id)) {
    return (
      <div>
        <p className="text-ink-dim">That achievement no longer exists.</p>
        <Link to={BACK} className="text-accent underline">
          Back to achievements
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <Link to={BACK} className="text-sm text-ink-dim hover:text-accent">
        ← All achievements
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New achievement"}
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
            className={fieldClass}
            placeholder="e.g. Lone Wolf"
          />
        </div>

        <ImageUploadField
          label="Icon"
          value={form.iconUrl}
          onChange={(url) => setForm((f) => ({ ...f, iconUrl: url }))}
        />

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold">
            Description *
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
            placeholder="e.g. Clear Frenzy Raid 20 times with the same teammate in a single season."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reward-1" className="mb-1 block text-sm font-semibold">
              Reward 1
            </label>
            <input
              id="reward-1"
              value={form.reward1}
              onChange={(e) => setForm((f) => ({ ...f, reward1: e.target.value }))}
              className={fieldClass}
              placeholder="e.g. Diamond x1,000"
            />
          </div>
          <div>
            <label htmlFor="reward-2" className="mb-1 block text-sm font-semibold">
              Reward 2
            </label>
            <input
              id="reward-2"
              value={form.reward2}
              onChange={(e) => setForm((f) => ({ ...f, reward2: e.target.value }))}
              className={fieldClass}
              placeholder="e.g. Supply Coin x100"
            />
          </div>
        </div>

        {/* Quality is picked by its art, since the game gives the four tiers
            no names — a radio group, so it stays keyboard-usable. */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Quality *</legend>
          <div className="flex flex-wrap gap-3">
            {ACHIEVEMENT_TIERS.map((tier) => {
              const art = achievementQualityImage(tier);
              const selected = form.tier === tier;
              return (
                <label
                  key={tier}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-2 ${
                    selected ? "border-accent bg-surface" : "border-edge hover:border-accent/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tier}
                    checked={selected}
                    onChange={() => setForm((f) => ({ ...f, tier }))}
                    className="sr-only"
                  />
                  {art ? (
                    <img src={art} alt="" aria-hidden className="h-14 w-14 object-contain" />
                  ) : (
                    <div className="h-14 w-14 rounded bg-surface-2" aria-hidden />
                  )}
                  <span className="text-xs">Quality {tier}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {mutation.isError && <p className="text-sm text-fire">{(mutation.error as Error).message}</p>}

        <button
          type="submit"
          disabled={!canSave || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create achievement"}
        </button>
      </form>
    </div>
  );
}
