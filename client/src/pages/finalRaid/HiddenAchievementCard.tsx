import { imageSrc } from "../../api/client";
import type { HiddenAchievement } from "../../api/types";
import { achievementQualityImage, achievementRewardFrame } from "../../lib/achievementQuality";
import { rewardIcon, rewardLabel } from "../../lib/rewardIcons";

export function HiddenAchievementCard({ achievement }: { achievement: HiddenAchievement }) {
  const plate = achievementQualityImage(achievement.tier);
  // The frame behind each reward icon follows the achievement's own quality.
  const rewardFrame = achievementRewardFrame(achievement.tier);

  return (
    <article className="flex overflow-hidden border border-edge bg-surface h-[100px]">
      <div className="relative w-21 shrink-0 self-stretch">
        {plate && (
          <img src={plate} alt="" aria-hidden className="absolute top-0 left-0 bottom-0 h-full object-cover" />
        )}
        {achievement.iconUrl && (
          <img
            src={imageSrc(achievement.iconUrl)}
            alt=""
            aria-hidden
            className="absolute top-3 left-1.5 h-14 w-14  object-contain"
          />
        )}
      </div>

      <div className="min-w-0 flex flex-col justify-between flex-1 px-1 py-2">
        <p className="font-semibold text-xs">
          <span className="font-black text-accent">{achievement.name}</span>
          <span className="sr-only"> — quality {achievement.tier}</span>
          <span className="text-ink-dim">-</span>
          <span>{achievement.description}</span>
        </p>

        {achievement.rewards.length > 0 && (
          <ul className="mt-2 flex flex-wrap items-center gap-2">
            {achievement.rewards.map((reward, i) => {
              const icon = rewardIcon(reward.type);
              const label = rewardLabel(reward.type);
              return (
                <li className="flex" key={`${reward.type ?? ""}-${reward.amount}-${i}`}>
                  {icon ? (
                    <span
                      className="relative inline-flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center bg-cover bg-center"
                      style={rewardFrame ? { backgroundImage: `url(${rewardFrame})` } : undefined}
                      title={`${label} ${reward.amount}`}
                    >
                      <img src={icon} alt="" aria-hidden className=" object-contain" />
                      <span className="absolute right-1 bottom-0 sm:text-xs text-[10px] font-black text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
                        {reward.amount}
                      </span>
                      <span className="sr-only">
                        {label} {reward.amount}
                      </span>
                    </span>
                  ) : (
                    <span className="rounded-lg border border-edge bg-surface-2 px-2 py-1 text-xs text-ink-dim">
                      {[label, reward.amount].filter(Boolean).join(" ")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}
