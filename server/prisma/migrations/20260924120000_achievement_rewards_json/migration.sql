-- hidden_achievements.rewards: text[] -> jsonb [{ type, amount }].
-- Converted in place rather than dropped: every existing string becomes an
-- amount with no type, so nothing entered by hand is lost. The admin re-picks
-- the type (which chooses the icon) when next editing that achievement.
ALTER TABLE "hidden_achievements" ADD COLUMN "rewards_json" JSONB NOT NULL DEFAULT '[]';

UPDATE "hidden_achievements" h
SET "rewards_json" = COALESCE(
  (SELECT jsonb_agg(jsonb_build_object('type', NULL, 'amount', r))
     FROM unnest(h."rewards") AS r),
  '[]'::jsonb
);

ALTER TABLE "hidden_achievements" DROP COLUMN "rewards";
ALTER TABLE "hidden_achievements" RENAME COLUMN "rewards_json" TO "rewards";
