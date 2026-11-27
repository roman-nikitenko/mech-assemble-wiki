import { imageSrc } from "../../api/client";

/** The uploaded 3D viewer of a mech's SS skin. It is a self-contained mini-site,
    so it stays in an iframe: its three.js and CSS never mix with ours.
    `?embed=1` shows only the stage. */
export function SsViewTab({ mechName, url }: { mechName: string; url: string }) {
  return (
    <div className="mx-auto max-w-[680px]">
      {/* 668:634 is the viewer's stage, so the frame has no empty space around it. */}
      <iframe
        src={`${imageSrc(url)}?embed=1`}
        title={`${mechName} SS, interactive 3D model`}
        loading="lazy"
        allow="fullscreen"
        className="block aspect-[668/634] w-full rounded-xl border-0 bg-[#0b0e16]"
      />
      <a href={imageSrc(url)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-accent underline">
        Open full page
      </a>
    </div>
  );
}
