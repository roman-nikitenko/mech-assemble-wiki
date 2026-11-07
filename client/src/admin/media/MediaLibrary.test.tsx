import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MediaLibrary } from "./MediaLibrary";
import type { MediaItem, MediaPage } from "../../api/types";

const unused: MediaItem = {
  name: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp", url: "/uploads/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp",
  kind: "image", size: 2048, width: 100, height: 50, modifiedAt: "2026-01-01T00:00:00.000Z", usage: [],
};
const used: MediaItem = {
  name: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp", url: "/uploads/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp",
  kind: "image", size: 4096, width: 200, height: 100, modifiedAt: "2026-02-01T00:00:00.000Z",
  usage: [{ kind: "Mech", id: "m1", name: "Bob", field: "imageUrl", editPath: "/admin/mechs/m1/edit" }],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Routes fetch by URL/method and records every call so tests can assert on it.
function mockApi(items: MediaItem[] = [used, unused], total = items.length) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    if (init?.method === "DELETE") {
      // bulk delete is DELETE /api/media (no file name); single is /api/media/<name>
      return Promise.resolve(url.endsWith("/api/media") ? json({ deleted: 3, missing: 0 }) : new Response(null, { status: 204 }));
    }
    if (url.includes("names=1")) {
      // "select all N": every match across pages, not just the loaded page
      return Promise.resolve(
        json({
          files: [
            { name: used.name, usageCount: 1 },
            { name: unused.name, usageCount: 0 },
            { name: "cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp", usageCount: 0 },
          ],
          total: 3,
        }),
      );
    }
    const page: MediaPage = { items, total, page: 1, limit: 48 };
    return Promise.resolve(json(page));
  });
}

const bulkDeleteCall = (spy: ReturnType<typeof mockApi>) =>
  spy.mock.calls.find(([u, init]) => init?.method === "DELETE" && String(u).endsWith("/api/media"));

function renderLibrary(props: React.ComponentProps<typeof MediaLibrary>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <MediaLibrary {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("MediaLibrary (manage mode)", () => {
  it("lists files and marks the ones in use", async () => {
    mockApi();
    renderLibrary({ mode: "manage" });
    expect(await screen.findByTitle(used.name)).toBeInTheDocument();
    expect(screen.getByTitle(unused.name)).toBeInTheDocument();
    expect(screen.getAllByText("in use")).toHaveLength(1);
  });

  it("opens details showing who uses the file, with a link to edit it", async () => {
    mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByTitle(used.name));
    expect(screen.getByText("File details")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bob" })).toHaveAttribute("href", "/admin/mechs/m1/edit");
    expect(screen.getByText("200 × 100")).toBeInTheDocument();
  });

  it("warns before deleting a file that is in use, says the records are kept, then deletes it by name", async () => {
    const spy = mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByTitle(used.name));
    await userEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(screen.getByText(/still used by 1 place/)).toBeInTheDocument();
    expect(screen.getByText(/records themselves are kept/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete and clear from records" }));
    await waitFor(() => {
      const del = spy.mock.calls.find(([, init]) => init?.method === "DELETE");
      expect(String(del?.[0])).toMatch(new RegExp(`/api/media/${used.name}$`));
    });
  });

  it("does not warn when the file is unused", async () => {
    mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByTitle(unused.name));
    expect(screen.getByText("Not used anywhere.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(screen.queryByText(/still used by/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("sends the search text (after a short pause) and the sort to the server", async () => {
    const spy = mockApi();
    renderLibrary({ mode: "manage" });
    await screen.findByTitle(used.name);
    await userEvent.type(screen.getByLabelText("Search media"), "bob");
    await waitFor(() => expect(spy.mock.calls.some(([u]) => String(u).includes("search=bob"))).toBe(true));
    await userEvent.selectOptions(screen.getByLabelText("Sort"), "oldest");
    await waitFor(() => expect(spy.mock.calls.some(([u]) => String(u).includes("sort=oldest"))).toBe(true));
  });
});

describe("MediaLibrary (usage filter)", () => {
  it("asks the server for only unused files when 'Not used' is chosen", async () => {
    const spy = mockApi();
    renderLibrary({ mode: "manage" });
    await screen.findByTitle(used.name);
    await userEvent.selectOptions(screen.getByLabelText("Usage"), "unused");
    await waitFor(() => expect(spy.mock.calls.some(([u]) => String(u).includes("usage=unused"))).toBe(true));
  });

  it("does not offer the clean-up filter in the picker", async () => {
    mockApi();
    renderLibrary({ mode: "select", selected: null, onSelect: vi.fn() });
    await screen.findByTitle(used.name);
    expect(screen.queryByLabelText("Usage")).not.toBeInTheDocument();
  });
});

describe("MediaLibrary (bulk delete)", () => {
  it("is not offered in the picker", async () => {
    mockApi();
    renderLibrary({ mode: "select", selected: null, onSelect: vi.fn() });
    await screen.findByTitle(used.name);
    expect(screen.queryByRole("button", { name: "Select multiple" })).not.toBeInTheDocument();
  });

  it("selects tiles instead of opening details, and counts them", async () => {
    mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByRole("button", { name: "Select multiple" }));
    await userEvent.click(screen.getByTitle(used.name));
    await userEvent.click(screen.getByTitle(unused.name));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(screen.queryByText("File details")).not.toBeInTheDocument();
    expect(screen.getByTitle(used.name)).toHaveAttribute("aria-pressed", "true");
    // clicking again deselects
    await userEvent.click(screen.getByTitle(used.name));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("deletes the selection in one request, after warning about files in use", async () => {
    const spy = mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByRole("button", { name: "Select multiple" }));
    await userEvent.click(screen.getByTitle(used.name));
    await userEvent.click(screen.getByTitle(unused.name));
    await userEvent.click(screen.getByRole("button", { name: "Delete selected" }));

    expect(screen.getByText("Delete 2 files?")).toBeInTheDocument();
    expect(screen.getByText(/1 of them is still used by 1 place/)).toBeInTheDocument();
    expect(screen.getByText(/records themselves are\s+kept/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete 2 files and clear from records" }));

    await waitFor(() => expect(bulkDeleteCall(spy)).toBeDefined());
    const init = bulkDeleteCall(spy)![1]!;
    expect(JSON.parse(String(init.body))).toEqual({ names: [used.name, unused.name] });
    // back to normal browsing afterwards
    expect(await screen.findByRole("button", { name: "Select multiple" })).toBeInTheDocument();
  });

  it("does not mention records when none of the selected files are used", async () => {
    mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByRole("button", { name: "Select multiple" }));
    await userEvent.click(screen.getByTitle(unused.name));
    await userEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    expect(screen.getByText(/None of them are used anywhere/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete 1 file" })).toBeInTheDocument();
  });

  it("cancelling the dialog deletes nothing and keeps the selection", async () => {
    const spy = mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByRole("button", { name: "Select multiple" }));
    await userEvent.click(screen.getByTitle(unused.name));
    await userEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(bulkDeleteCall(spy)).toBeUndefined();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("'Select this page' picks everything loaded; 'Select all N' picks every match across pages", async () => {
    // 2 files on this page, 3 in total -> the all-matching button appears
    mockApi([used, unused], 3);
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByRole("button", { name: "Select multiple" }));
    await userEvent.click(screen.getByRole("button", { name: "Select this page" }));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Select all 3" }));
    expect(await screen.findByText("3 selected")).toBeInTheDocument();
  });

  it("hides 'Select all' when everything already fits on the page", async () => {
    mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByRole("button", { name: "Select multiple" }));
    expect(screen.queryByRole("button", { name: /Select all/ })).not.toBeInTheDocument();
  });

  it("drops the selection when the filter changes, so hidden files can't be deleted by accident", async () => {
    mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByRole("button", { name: "Select multiple" }));
    await userEvent.click(screen.getByTitle(used.name));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Usage"), "unused");
    expect(await screen.findByText("0 selected")).toBeInTheDocument();
  });

  it("'Done' leaves selection mode", async () => {
    mockApi();
    renderLibrary({ mode: "manage" });
    await userEvent.click(await screen.findByRole("button", { name: "Select multiple" }));
    await userEvent.click(screen.getByTitle(used.name));
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("button", { name: "Select multiple" })).toBeInTheDocument();
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
  });
});

describe("MediaLibrary (select mode)", () => {
  it("asks for images only and reports the clicked file instead of opening details", async () => {
    const spy = mockApi();
    const onSelect = vi.fn();
    renderLibrary({ mode: "select", selected: null, onSelect });
    await userEvent.click(await screen.findByTitle(unused.name));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ url: unused.url }));
    expect(screen.queryByText("File details")).not.toBeInTheDocument();
    expect(String(spy.mock.calls[0][0])).toContain("type=image");
    expect(screen.queryByLabelText("File type")).not.toBeInTheDocument();
  });

  it("highlights the selected file", async () => {
    mockApi();
    renderLibrary({ mode: "select", selected: used.url, onSelect: vi.fn() });
    expect(await screen.findByTitle(used.name)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTitle(unused.name)).toHaveAttribute("aria-pressed", "false");
  });
});
