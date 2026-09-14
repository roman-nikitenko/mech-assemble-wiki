import type { CSSProperties } from "react";
import type { SkillNodeRow } from "../api/types";
import { skillDisplayName, skillFamilies } from "./buildRules";
import { PickedSlot } from "./SkillsBlock";

const DESKTOP_OFFSET = ["", "sm:mt-6", "sm:mt-12", "sm:mt-18"];
const MOBILE_INDENT = ["", "max-sm:ml-4", "max-sm:ml-8", "max-sm:ml-12"];
const DESKTOP_ELBOW =
  "sm:before:left-(--rail-left) sm:before:-top-4 sm:before:h-4 sm:before:w-(--rail-width) sm:before:rounded-tr-lg sm:before:border-t-2 sm:before:border-r-2 sm:before:border-indigo-300/40";
const MOBILE_RAIL =
  "max-sm:before:-left-3 max-sm:before:-top-2 max-sm:before:w-0.5 max-sm:before:bg-indigo-300/40 max-sm:after:absolute max-sm:after:-left-3 max-sm:after:top-1/2 max-sm:after:h-0.5 max-sm:after:w-3 max-sm:after:bg-indigo-300/40 max-sm:after:content-['']";
  
export function SkillFamilyRow({
  label,
  skills,
  initial = false,
  cardImageUrl,
  linkedIcons,
}: {
  label: string;
  skills: SkillNodeRow[];
  initial?: boolean;
  cardImageUrl?: string | null;
  linkedIcons?: Record<string, string | null>;
}) {
  const entries = skillFamilies(skills);

  return (
    <ul aria-label={label} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
      {entries.map(({ skill, index, depth, parent, lastChild, siblingSpan }) => {
        const step = Math.min(depth, 3);
        const rail: CSSProperties | undefined =
          depth === 0
            ? undefined
            : siblingSpan === 0
              ? ({ "--rail-left": "-0.5rem", "--rail-width": "1.5rem" } as CSSProperties)
              : ({
                  "--rail-left": `calc(0.5rem - ${siblingSpan} * (100% + 0.5rem))`,
                  "--rail-width": `calc(${siblingSpan} * (100% + 0.5rem) + 0.5rem)`,
                } as CSSProperties);
        const connectors =
          depth > 0
            ? `before:absolute before:content-[''] ${DESKTOP_ELBOW} ${MOBILE_RAIL} ${
                lastChild ? "max-sm:before:bottom-1/2" : "max-sm:before:bottom-0"
              }`
            : "";
        return (
          <li
            key={index}
            data-depth={depth}
            style={rail}
            className={`relative sm:flex sm:w-[calc((100%-1.5rem)/4)] lg:w-[calc((100%-3.5rem)/8)] ${DESKTOP_OFFSET[step]} ${MOBILE_INDENT[step]} ${connectors}`}
          >
            {parent && <span className="sr-only">Upgrade of {skillDisplayName(parent)}</span>}
            <PickedSlot
              skill={skill}
              cardImageUrl={cardImageUrl}
              linkedIcons={linkedIcons}
              initial={initial}
              responsive
            />
          </li>
        );
      })}
    </ul>
  );
}
