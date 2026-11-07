import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MediaUploader } from "./MediaUploader";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function renderUploader(onUploaded = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MediaUploader onUploaded={onUploaded} />
    </QueryClientProvider>,
  );
  return { onUploaded, input: document.querySelector('input[type="file"]') as HTMLInputElement };
}

afterEach(() => vi.restoreAllMocks());

describe("MediaUploader", () => {
  it("uploads several files at once and reports every URL in order", async () => {
    let n = 0;
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(json({ url: `/uploads/f${++n}.webp` }, 201)));
    const { input, onUploaded } = renderUploader();
    await userEvent.upload(input, [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
      new File(["c"], "c.webp", { type: "image/webp" }),
    ]);
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    expect(onUploaded.mock.calls[0][0]).toHaveLength(3);
    expect(spy.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(3);
    expect(screen.getAllByText("Uploaded")).toHaveLength(3);
  });

  it("rejects a wrong file type without sending it, while still uploading the good ones", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(json({ url: "/uploads/ok.webp" }, 201)));
    const { input, onUploaded } = renderUploader();
    // applyAccept:false — the real <input accept> would stop a browser file picker, but a drop bypasses it.
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(input, [
      new File(["x"], "notes.txt", { type: "text/plain" }),
      new File(["y"], "ok.png", { type: "image/png" }),
    ]);
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(["/uploads/ok.webp"]));
    expect(screen.getByText("Only PNG, JPEG, or WebP images are allowed.")).toBeInTheDocument();
    expect(spy.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  });

  it("shows the server's message when one upload fails and keeps the rest", async () => {
    let calls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(++calls === 1 ? json({ error: "Could not process that image." }, 400) : json({ url: "/uploads/ok.webp" }, 201)),
    );
    const { input, onUploaded } = renderUploader();
    await userEvent.upload(input, [
      new File(["x"], "bad.png", { type: "image/png" }),
      new File(["y"], "good.png", { type: "image/png" }),
    ]);
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(["/uploads/ok.webp"]));
    expect(screen.getByText("Could not process that image.")).toBeInTheDocument();
  });

  it("rejects an image over 5 MB before uploading", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const { input } = renderUploader();
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    await userEvent.upload(input, big);
    expect(await screen.findByText("Image must be 5 MB or smaller.")).toBeInTheDocument();
    expect(spy.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  });

  describe("long batches", () => {
    const pngs = (n: number) =>
      Array.from({ length: n }, (_, i) => new File(["x"], `img${String(i + 1).padStart(2, "0")}.png`, { type: "image/png" }));

    it("shows only the 4 most recent files, with a summary and a button to see all", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(json({ url: "/uploads/ok.webp" }, 201)));
      const { input, onUploaded } = renderUploader();
      await userEvent.upload(input, pngs(10));
      await waitFor(() => expect(onUploaded).toHaveBeenCalled());

      expect(screen.getByText("10 uploaded")).toBeInTheDocument();
      // the last four, in upload order — the first six are collapsed away
      expect(screen.getAllByText("Uploaded")).toHaveLength(4);
      for (const n of ["img07.png", "img08.png", "img09.png", "img10.png"]) expect(screen.getByText(n)).toBeInTheDocument();
      expect(screen.queryByText("img01.png")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Show all 10" })).toHaveAttribute("aria-expanded", "false");
    });

    it("expands to every file and collapses again", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(json({ url: "/uploads/ok.webp" }, 201)));
      const { input, onUploaded } = renderUploader();
      await userEvent.upload(input, pngs(10));
      await waitFor(() => expect(onUploaded).toHaveBeenCalled());

      await userEvent.click(screen.getByRole("button", { name: "Show all 10" }));
      expect(screen.getAllByText("Uploaded")).toHaveLength(10);
      expect(screen.getByText("img01.png")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Show fewer" }));
      expect(screen.getAllByText("Uploaded")).toHaveLength(4);
      expect(screen.queryByText("img01.png")).not.toBeInTheDocument();
    });

    it("has no expand button for a small batch", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(json({ url: "/uploads/ok.webp" }, 201)));
      const { input, onUploaded } = renderUploader();
      await userEvent.upload(input, pngs(4));
      await waitFor(() => expect(onUploaded).toHaveBeenCalled());
      expect(screen.queryByRole("button", { name: /Show all/ })).not.toBeInTheDocument();
    });

    it("still counts failures that are hidden in the collapsed part of the list", async () => {
      let calls = 0;
      // the FIRST of 8 files fails — it will be collapsed away, but must not go unnoticed
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(++calls === 1 ? json({ error: "Could not process that image." }, 400) : json({ url: "/uploads/ok.webp" }, 201)),
      );
      const { input, onUploaded } = renderUploader();
      await userEvent.upload(input, pngs(8));
      await waitFor(() => expect(onUploaded).toHaveBeenCalled());
      expect(screen.getByText("7 uploaded, 1 failed")).toBeInTheDocument();
      expect(screen.queryByText("Could not process that image.")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Show all 8" }));
      expect(screen.getByText("Could not process that image.")).toBeInTheDocument();
    });
  });
});
