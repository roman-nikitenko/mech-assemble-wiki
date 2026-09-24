import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useCreateHiddenAchievement,
  useHiddenAchievements,
  useUpdateHiddenAchievement,
} from "../../api/client";
import type { AchievementReward, HiddenAchievementInput } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { ACHIEVEMENT_TIERS, achievementQualityImage } from "../../lib/achievementQuality";
import { Dropdown } from "../../components/Dropdown";
import { REWARD_TYPES } from "../../lib/rewardIcons";
import { ImageUploadField } from "../ImageUploadField";

const BACK = "/admin/final-raid?tab=achievements";

/** The form holds the rewards as an editable list of rows. A row the admin
    added but never filled in is dropped on save (the server does the same),
    so "+ Add reward" is free to leave an empty row behind. */
interface FormState {
  name: string;
  description: string;
  iconUrl: string | null;
  tier: number;
  rewards: AchievementReward[];
}

const EMPTY_REWARD: AchievementReward = { type: null, amount: "" };
// One empty row to start, so the first reward needs no extra click.
const EMPTY: FormState = { name: "", description: "", iconUrl: null, tier: 1, rewards: [EMPTY_REWARD] };

// Matches MAX_REWARDS in server/src/routes/hidden-achievements.ts.
const MAX_REWARDS = 6;

const REWARD_OPTIONS = REWARD_TYPES.map((t) => ({
  value: t.key,
  label: t.label,
  icon: <img src={t.icon} alt="" className="h-6 w-6 object-contain" />,
}));

function toInput(form: FormState): HiddenAchievementInput {
  return {
    name: form.name,
    description: form.description,
    iconUrl: form.iconUrl,
    tier: form.tier,
    rewards: form.rewards.filter((r) => r.amount.trim() !== ""),
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
          // Always leave one row to type in, even for an achievement that
          // grants nothing.
          rewards: found.rewards.length > 0 ? found.rewards : [EMPTY_REWARD],
        });
      }
    }
  }, [isEdit, id, achievements.data, achievements.isFetching]);

  function setReward(index: number, patch: Partial<AchievementReward>) {
    setForm((f) => ({
      ...f,
      rewards: f.rewards.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  }

  function removeReward(index: number) {
    setForm((f) => {
      const rest = f.rewards.filter((_, i) => i !== index);
      // Never leave the list empty: one blank row stays to type into.
      return { ...f, rewards: rest.length > 0 ? rest : [EMPTY_REWARD] };
    });
  }

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

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Rewards</legend>
          <div className="space-y-2">
            {form.rewards.map((reward, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  aria-label={`Reward ${i + 1} amount`}
                  value={reward.amount}
                  onChange={(e) => setReward(i, { amount: e.target.value })}
                  className={`${fieldClass} sm:w-40`}
                  placeholder="e.g. 3000"
                />
                <Dropdown
                  ariaLabel={`Reward ${i + 1} type`}
                  options={REWARD_OPTIONS}
                  value={reward.type}
                  onChange={(value) => setReward(i, { type: value })}
                  placeholder="Choose an item…"
                  searchable
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeReward(i)}
                  aria-label={`Remove reward ${i + 1}`}
                  className="min-h-11 shrink-0 cursor-pointer rounded-lg border border-fire/40 px-3 text-sm text-fire hover:bg-fire/10"
                >
                  −
                </button>
              </div>
            ))}
          </div>
          {form.rewards.length < MAX_REWARDS && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, rewards: [...f.rewards, EMPTY_REWARD] }))}
              className="mt-2 min-h-11 cursor-pointer rounded-lg border border-edge px-4 text-sm font-semibold hover:border-accent/60"
            >
              + Add reward
            </button>
          )}
          <p className="mt-1 text-xs text-ink-dim">
            An amount with no item still shows as plain text. Rows left empty are dropped on save.
          </p>
        </fieldset>

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
