import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImageUploadField } from "./ImageUploadField";

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

const item = {
  name: "pic.webp", url: "/uploads/pic.webp", kind: "image", size: 1, width: 1, height: 1,
  modifiedAt: "2026-01-01T00:00:00.000Z", usage: [],
};

// The field sits inside a <form>, like in every admin page.
function Harness({ onSubmit }: { onSubmit: () => void }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <ImageUploadField label="Icon" value={value} onChange={setValue} />
    </form>
  );
}

function renderField() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(json({ items: [item], total: 1, page: 1, limit: 48 })),
  );
  const onSubmit = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Harness onSubmit={onSubmit} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onSubmit };
}

afterEach(() => vi.restoreAllMocks());

describe("ImageUploadField", () => {
  it("opens the Media popup, and choosing a file fills the field and closes the popup", async () => {
    renderField();
    await userEvent.click(screen.getByRole("button", { name: "Choose image" }));
    await userEvent.click(await screen.findByTitle("pic.webp"));
    await userEvent.click(screen.getByRole("button", { name: "Use this image" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByAltText("Icon preview")).toHaveAttribute("src", expect.stringContaining("/uploads/pic.webp"));
    expect(screen.getByRole("button", { name: "Change image" })).toBeInTheDocument();
  });

  it("shows the chosen file's name next to the preview (revealed on hover)", async () => {
    renderField();
    await userEvent.click(screen.getByRole("button", { name: "Choose image" }));
    await userEvent.click(await screen.findByTitle("pic.webp"));
    await userEvent.click(screen.getByRole("button", { name: "Use this image" }));
    // just the file name, not the "/uploads/" path
    expect(screen.getByText("pic.webp")).toBeInTheDocument();
  });

  it("can remove the chosen image", async () => {
    renderField();
    await userEvent.click(screen.getByRole("button", { name: "Choose image" }));
    await userEvent.click(await screen.findByTitle("pic.webp"));
    await userEvent.click(screen.getByRole("button", { name: "Use this image" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove image" }));
    expect(screen.queryByAltText("Icon preview")).not.toBeInTheDocument();
  });

  it("never submits the surrounding form from inside the popup (Enter in search, tabs)", async () => {
    const { onSubmit } = renderField();
    await userEvent.click(screen.getByRole("button", { name: "Choose image" }));
    await userEvent.type(await screen.findByLabelText("Search media"), "abc{Enter}");
    await userEvent.click(screen.getByRole("tab", { name: "Upload" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
