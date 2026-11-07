import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MediaPickerModal } from "./MediaPickerModal";
import type { MediaItem } from "../../api/types";

const file = (n: string): MediaItem => ({
  name: `${n}.webp`, url: `/uploads/${n}.webp`, kind: "image", size: 1, width: 1, height: 1,
  modifiedAt: "2026-01-01T00:00:00.000Z", usage: [],
});
let items = [file("one"), file("two")];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function mockApi() {
  return vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
    if (init?.method === "POST") return Promise.resolve(json({ url: "/uploads/fresh.webp" }, 201));
    return Promise.resolve(json({ items, total: items.length, page: 1, limit: 48 }));
  });
}

function renderPicker(props: Partial<React.ComponentProps<typeof MediaPickerModal>> = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <MediaPickerModal label="Icon" current={null} onSelect={onSelect} onClose={onClose} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onSelect, onClose };
}

afterEach(() => {
  vi.restoreAllMocks();
  items = [file("one"), file("two")];
});

describe("MediaPickerModal", () => {
  it("has Upload and Media tabs and opens on Media", async () => {
    mockApi();
    renderPicker();
    expect(screen.getByRole("tab", { name: "Upload" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Media" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByTitle("one.webp")).toBeInTheDocument();
  });

  it("cannot be confirmed until a file is chosen, then returns its URL", async () => {
    mockApi();
    const { onSelect } = renderPicker();
    const use = screen.getByRole("button", { name: "Use this image" });
    expect(use).toBeDisabled();
    await userEvent.click(await screen.findByTitle("two.webp"));
    expect(use).toBeEnabled();
    await userEvent.click(use);
    expect(onSelect).toHaveBeenCalledWith("/uploads/two.webp");
  });

  it("shows the highlighted file's full name in the footer", async () => {
    mockApi();
    renderPicker();
    await userEvent.click(await screen.findByTitle("two.webp"));
    // the grid tile also carries the name (hover label), the footer is the second match
    expect(screen.getAllByText("two.webp").length).toBeGreaterThanOrEqual(2);
  });

  it("starts with the field's current image selected", async () => {
    mockApi();
    renderPicker({ current: "/uploads/one.webp" });
    expect(await screen.findByTitle("one.webp")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Use this image" })).toBeEnabled();
  });

  it("switches to the Upload tab, and after an upload lands on Media with the new file selected", async () => {
    mockApi();
    const { onSelect } = renderPicker();
    await userEvent.click(screen.getByRole("tab", { name: "Upload" }));
    // the new file shows up in the library once the list is refreshed
    items = [file("fresh"), ...items];
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(["x"], "pic.png", { type: "image/png" }));

    await waitFor(() => expect(screen.getByRole("tab", { name: "Media" })).toHaveAttribute("aria-selected", "true"));
    await userEvent.click(screen.getByRole("button", { name: "Use this image" }));
    expect(onSelect).toHaveBeenCalledWith("/uploads/fresh.webp");
  });

  it("closes with Cancel", async () => {
    mockApi();
    const { onClose } = renderPicker();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
