import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Modal } from "./Modal";

/** A trigger that opens the modal, so focus restoration has somewhere to go. */
function Harness({ closeOnBackdrop = false }: { closeOnBackdrop?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (
        <Modal label="Test dialog" onClose={() => setOpen(false)} closeOnBackdrop={closeOnBackdrop}>
          <button>First</button>
          <button>Second</button>
        </Modal>
      )}
    </>
  );
}

describe("Modal", () => {
  it("focuses its first control on open", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("keeps Tab inside the panel", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    await userEvent.tab();
    expect(second).toHaveFocus();
    // Past the last control it wraps, rather than reaching the page behind.
    await userEvent.tab();
    expect(first).toHaveFocus();
    // And backwards off the first control wraps to the last.
    await userEvent.tab({ shift: true });
    expect(second).toHaveFocus();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on a backdrop click only when asked", async () => {
    const { unmount } = render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    // The default picker-style modal ignores backdrop clicks so a stray click
    // can't lose the user's place.
    await userEvent.click(screen.getByRole("dialog").parentElement!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    unmount();

    render(<Harness closeOnBackdrop />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("dialog").parentElement!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focuses the panel itself when it holds no controls", async () => {
    function Empty() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          {open && (
            <Modal label="Empty dialog" onClose={() => setOpen(false)}>
              <p>Nothing to focus</p>
            </Modal>
          )}
        </>
      );
    }
    render(<Empty />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("locks body scroll while open and releases it after", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("does not call onClose for other keys", async () => {
    const onClose = vi.fn();
    render(
      <Modal label="Test dialog" onClose={onClose}>
        <button>First</button>
      </Modal>
    );
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("a");
    expect(onClose).not.toHaveBeenCalled();
  });

  // A hidden input matches input:not([disabled]) but cannot hold focus, and a
  // negative tabindex isn't tabbable — either one sitting first would make
  // initial focus a no-op and put the trap's first/last on the wrong element.
  it("skips hidden inputs and negative tabindex when trapping focus", async () => {
    function WithUnfocusable() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          {open && (
            <Modal label="Test dialog" onClose={() => setOpen(false)}>
              <input type="hidden" value="x" />
              <div tabIndex={-2}>skipped</div>
              <button>First</button>
              <button>Second</button>
            </Modal>
          )}
        </>
      );
    }
    render(<WithUnfocusable />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));

    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });
    expect(first).toHaveFocus();

    // Shift+Tab off the first real control wraps to the last, never onto the
    // hidden input or out to the page behind.
    await userEvent.tab({ shift: true });
    expect(second).toHaveFocus();
    await userEvent.tab();
    expect(first).toHaveFocus();
  });
});
