import skinStar from "../assets/skin-start.svg";

export function StarNumber({ n }: { n: number }) {
  return (
    <span
      className="relative self-start inline-block h-8 w-8 shrink-0 align-middle"
      aria-label={`Star ${n}`}
    >
      <img src={skinStar} alt="" className="h-8 w-8" />
      <span className="absolute inset-0 flex mt-0.5 items-center justify-center pt-px text-[14px] font-black text-black">
        {n}
      </span>
    </span>
  );
}
