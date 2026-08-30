import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportAwakeningDialog } from "./ImportAwakeningDialog";
import { importCodexMech, type ImportedLevel } from "./awakeningImport";

/* The dialog is generic over what it produces; these tests exercise it with
   the mech-tree mapper, which is the pairing AwakeningPage uses. */
const mechProps = {
  hint: "Paste this mech's JSON block.",
  parse: (json: unknown) => {
    const r = importCodexMech(json);
    return r.ok ? ({ ok: true, value: r.levels } as const) : r;
  },
};

const CODEX_MECH = JSON.stringify({
  id: 150001, name: "Fire Judgement",
  lv: [{ n: 1, live: true, big: { attr: ["HP +5%"], skill: "Fire Field", cd: [0, 0], power: 1000 },
         nodes: [{ icon: "UI_Attr_hp", mech: "HP +15%", cond: { entry: "X", text: "cond", raw: "1_2_3" }, enh: null }] }],
});

describe("ImportAwakeningDialog", () => {
  it("hands mapped levels to onImport for valid JSON", async () => {
    const onImport = vi.fn();
    render(<ImportAwakeningDialog<ImportedLevel[]> open onClose={() => {}} onImport={onImport} {...mechProps} />);
    // Typing 900 chars of JSON via userEvent.type is too slow — click to focus,
    // then paste the whole blob in one go (Ruling C: only the paste matters here).
    await userEvent.click(screen.getByLabelText("Codex JSON"));
    await userEvent.paste(CODEX_MECH);
    await userEvent.click(screen.getByRole("button", { name: "Fill the form" }));
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport.mock.calls[0][0][0]).toMatchObject({ level: 1, coreSkill: "Fire Field" });
  });

  it("shows an error and does not import when the JSON does not parse", async () => {
    const onImport = vi.fn();
    render(<ImportAwakeningDialog<ImportedLevel[]> open onClose={() => {}} onImport={onImport} {...mechProps} />);
    await userEvent.click(screen.getByLabelText("Codex JSON"));
    await userEvent.paste("{ not json");
    await userEvent.click(screen.getByRole("button", { name: "Fill the form" }));
    expect(onImport).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/could not be read as JSON/i);
  });

  it("shows an error when the JSON is valid but not a codex mech", async () => {
    const onImport = vi.fn();
    render(<ImportAwakeningDialog<ImportedLevel[]> open onClose={() => {}} onImport={onImport} {...mechProps} />);
    await userEvent.click(screen.getByLabelText("Codex JSON"));
    await userEvent.paste('{"hello":"world"}');
    await userEvent.click(screen.getByRole("button", { name: "Fill the form" }));
    expect(onImport).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<ImportAwakeningDialog open={false} onClose={() => {}} onImport={() => {}} {...mechProps} />);
    expect(screen.queryByLabelText("Codex JSON")).not.toBeInTheDocument();
  });

  it("clears the stale error and textarea after Cancel, then reopening", async () => {
    // Mirrors AwakeningPage: the dialog stays mounted and toggles via `open`
    // rather than being remounted, so this harness keeps its own `open` state
    // the way AwakeningPage keeps `importing`.
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          {!open && (
            <button type="button" onClick={() => setOpen(true)}>
              Reopen
            </button>
          )}
          <ImportAwakeningDialog open={open} onClose={() => setOpen(false)} onImport={() => {}} {...mechProps} />
        </>
      );
    }

    render(<Harness />);
    await userEvent.click(screen.getByLabelText("Codex JSON"));
    await userEvent.paste("{ not json");
    await userEvent.click(screen.getByRole("button", { name: "Fill the form" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/could not be read as JSON/i);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Codex JSON")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reopen" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Codex JSON")).toHaveValue("");
  });
});
