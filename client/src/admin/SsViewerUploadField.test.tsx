import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SsViewerUploadField } from "./SsViewerUploadField";

const URL_ = "/uploads/viewers/11111111-1111-4111-8111-111111111111/index.html";
const reply = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const zipFile = () => new File(["zip"], "mech-viewer.zip", { type: "application/zip" });

afterEach(() => vi.restoreAllMocks());

describe("SsViewerUploadField", () => {
  it("uploads the chosen zip as 'viewer' and hands the url to the form", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(reply({ url: URL_ }, 201));
    const onChange = vi.fn();
    render(<SsViewerUploadField value={null} onChange={onChange} />);
    await userEvent.upload(screen.getByLabelText("3D SS view"), zipFile());
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(URL_));
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/uploads/viewer");
    expect((init!.body as FormData).get("viewer")).toBeInstanceOf(File);
  });

  it("shows the server's reason and keeps the current value on a bad zip", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(reply({ error: "The zip has no index.html." }, 400));
    const onChange = vi.fn();
    render(<SsViewerUploadField value={null} onChange={onChange} />);
    await userEvent.upload(screen.getByLabelText("3D SS view"), zipFile());
    expect(await screen.findByRole("alert")).toHaveTextContent("The zip has no index.html.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("links to a preview and can remove the view", async () => {
    const onChange = vi.fn();
    render(<SsViewerUploadField value={URL_} onChange={onChange} />);
    expect(screen.getByRole("link", { name: "Open preview" })).toHaveAttribute("href", expect.stringContaining(URL_));
    await userEvent.click(screen.getByRole("button", { name: "Remove 3D view" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
