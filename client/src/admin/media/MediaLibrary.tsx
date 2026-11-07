import { useEffect, useState } from "react";
import { fetchMediaNames, imageSrc, srcSet, useDeleteMediaBulk, useMedia } from "../../api/client";
import type { MediaItem } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { BulkDeleteDialog } from "./BulkDeleteDialog";
import { MediaDetails } from "./MediaDetails";

const PAGE_SIZE = 48;

interface MediaLibraryProps {
  /** manage: click opens a details panel (delete, "used by").
      select: click highlights a file for the picker; images only. */
  mode: "manage" | "select";
  /** select mode: URL of the highlighted file. */
  selected?: string | null;
  onSelect?: (item: MediaItem) => void;
}

/** The browsable grid of everything in the uploads folder, with search, sort
    and paging. One component, two jobs (the Media page and the picker popup) —
    only what a click DOES differs, so the grid is never written twice. */
export function MediaLibrary({ mode, selected = null, onSelect }: MediaLibraryProps) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [type, setType] = useState<"all" | "image" | "video">("all");
  const [page, setPage] = useState(1);
  const [usage, setUsage] = useState<"all" | "used" | "unused">("all");
  const [activeName, setActiveName] = useState<string | null>(null);
  // Bulk delete (manage mode only). `selection` maps file name -> how many
  // records use it, so the confirm dialog can say what will be cleared without
  // needing the file objects (they may be on pages that aren't loaded).
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<Map<string, number>>(new Map());
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const bulkDelete = useDeleteMediaBulk();

  // Wait for a pause in typing before querying — every keystroke would
  // otherwise scan the folder and the database.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  // A selection only makes sense for the files it was made from, so changing
  // what the grid shows starts a fresh one — otherwise files you can no longer
  // see could still be in the pile when you press Delete.
  useEffect(() => {
    setSelection(new Map());
  }, [search, type, usage]);

  const filters = {
    search,
    // The picker only attaches images, so it never shows videos, and it has no
    // "unused" filter (that is a clean-up tool).
    type: mode === "select" ? ("image" as const) : type,
    usage: mode === "select" ? ("all" as const) : usage,
  };
  const { data, isPending, isError, refetch, isPlaceholderData } = useMedia({
    ...filters,
    sort,
    page,
    limit: PAGE_SIZE,
  });

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  // After deleting the last files on the final page, step back instead of
  // showing an empty page.
  useEffect(() => {
    if (data && page > pages) setPage(pages);
  }, [data, page, pages]);
  // Looked up by name each render: if the file was deleted (or paged away),
  // the panel simply closes instead of showing stale data.
  const active = mode === "manage" ? data?.items.find((i) => i.name === activeName) ?? null : null;

  function toggleSelected(item: MediaItem) {
    setSelection((prev) => {
      const next = new Map(prev);
      if (next.has(item.name)) next.delete(item.name);
      else next.set(item.name, item.usage.length);
      return next;
    });
  }

  function handleClick(item: MediaItem) {
    if (mode === "select") onSelect?.(item);
    else if (selecting) toggleSelected(item);
    else setActiveName(item.name);
  }

  function startSelecting() {
    setActiveName(null); // the details panel and bulk mode would compete for the click
    setSelecting(true);
  }

  function stopSelecting() {
    setSelecting(false);
    setSelection(new Map());
  }

  function selectPage() {
    setSelection((prev) => {
      const next = new Map(prev);
      for (const item of data?.items ?? []) next.set(item.name, item.usage.length);
      return next;
    });
  }

  // Every file matching the current filters, across all pages — the way to
  // clear out e.g. all unused files without paging through them.
  async function selectAllMatching() {
    setLoadingAll(true);
    try {
      const { files } = await fetchMediaNames(filters);
      setSelection(new Map(files.map((f) => [f.name, f.usageCount])));
    } finally {
      setLoadingAll(false);
    }
  }

  const selectedNames = [...selection.keys()];
  const inUseFiles = [...selection.values()].filter((n) => n > 0).length;
  const usagePlaces = [...selection.values()].reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by file name or by what uses it…"
          aria-label="Search media"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-edge bg-surface px-3 text-sm"
        />
        {mode === "manage" && (
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as typeof type);
              setPage(1);
            }}
            aria-label="File type"
            className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm"
          >
            <option value="all">All files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        )}
        {mode === "manage" && (
          <select
            value={usage}
            onChange={(e) => {
              setUsage(e.target.value as typeof usage);
              setPage(1);
            }}
            aria-label="Usage"
            className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm"
          >
            <option value="all">Used and unused</option>
            <option value="unused">Not used</option>
            <option value="used">In use</option>
          </select>
        )}
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as typeof sort);
            setPage(1);
          }}
          aria-label="Sort"
          className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {mode === "manage" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {selecting ? (
            <>
              <span className="font-semibold">{selection.size} selected</span>
              <button type="button" onClick={selectPage} className="min-h-11 rounded-lg border border-edge px-3 hover:border-accent">
                Select this page
              </button>
              {data && data.total > data.items.length && (
                <button
                  type="button"
                  onClick={selectAllMatching}
                  disabled={loadingAll}
                  className="min-h-11 rounded-lg border border-edge px-3 hover:border-accent disabled:opacity-60"
                >
                  {loadingAll ? "Selecting…" : `Select all ${data.total}`}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelection(new Map())}
                disabled={selection.size === 0}
                className="min-h-11 rounded-lg border border-edge px-3 hover:border-accent disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmingBulk(true)}
                disabled={selection.size === 0}
                className="min-h-11 rounded-lg bg-fire px-3 font-semibold text-bg hover:brightness-110 disabled:opacity-40"
              >
                Delete selected
              </button>
              <button type="button" onClick={stopSelecting} className="min-h-11 rounded-lg px-3 text-ink-dim hover:text-ink">
                Done
              </button>
            </>
          ) : (
            <button type="button" onClick={startSelecting} className="min-h-11 rounded-lg border border-edge px-3 hover:border-accent">
              Select multiple
            </button>
          )}
        </div>
      )}

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1">
            {data.items.length === 0 ? (
              <p className="py-8 text-center text-ink-dim">No files found.</p>
            ) : (
              <ul
                className={`grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 ${
                  active ? "xl:grid-cols-5" : "lg:grid-cols-6"
                } ${isPlaceholderData ? "opacity-60" : ""}`}
              >
                {data.items.map((item) => {
                  const highlighted =
                    mode === "select" ? item.url === selected : selecting ? selection.has(item.name) : item.name === activeName;
                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => handleClick(item)}
                        aria-pressed={highlighted}
                        title={item.name}
                        className={`group relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-surface-2 ${
                          highlighted ? "border-accent" : "border-edge hover:border-accent/60"
                        }`}
                      >
                        {item.kind === "image" ? (
                          <img
                            src={imageSrc(item.url)}
                            srcSet={srcSet(item.url)}
                            sizes="160px"
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-3xl text-ink-dim">▶</span>
                        )}
                        {mode === "manage" && selecting && (
                          // Visual checkbox; the tile button itself carries aria-pressed.
                          <span
                            aria-hidden
                            className={`absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded border text-xs font-black ${
                              highlighted ? "border-accent bg-accent text-bg" : "border-edge bg-bg/80"
                            }`}
                          >
                            {highlighted ? "✓" : ""}
                          </span>
                        )}
                        {item.usage.length > 0 && (
                          <span className="absolute top-1 left-1 rounded bg-bg/80 px-1.5 py-0.5 text-[10px] font-semibold text-ink-dim">
                            in use
                          </span>
                        )}
                        {/* File name on hover/focus, bottom-left — like the link
                            preview a browser shows before you click. */}
                        <span className="pointer-events-none absolute bottom-0 left-0 max-w-full truncate bg-bg/90 px-1.5 py-0.5 font-mono text-[10px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                          {item.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-dim">
              <span>
                {data.total} {data.total === 1 ? "file" : "files"}
              </span>
              {pages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="min-h-11 rounded-lg border border-edge px-3 disabled:opacity-40"
                  >
                    ‹ Prev
                  </button>
                  <span>
                    Page {page} of {pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="min-h-11 rounded-lg border border-edge px-3 disabled:opacity-40"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {active && (
            // Sticky on wide screens: the panel stays pinned at the top of the
            // viewport while you scroll the grid, so clicking an image far down
            // the list never means scrolling back up. self-start stops the flex
            // row from stretching it to the grid's full height (a stretched
            // element has nothing to stick within); max-h + overflow lets a long
            // "Used by" list scroll inside the panel instead of running off-screen.
            <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-80 lg:shrink-0 lg:self-start lg:overflow-y-auto">
              <MediaDetails item={active} onClose={() => setActiveName(null)} />
            </div>
          )}
        </div>
      )}

      {confirmingBulk && (
        <BulkDeleteDialog
          count={selectedNames.length}
          inUseFiles={inUseFiles}
          records={usagePlaces}
          pending={bulkDelete.isPending}
          error={bulkDelete.isError ? (bulkDelete.error as Error).message : null}
          onCancel={() => {
            setConfirmingBulk(false);
            bulkDelete.reset(); // don't show a stale error next time it opens
          }}
          onConfirm={() =>
            bulkDelete.mutate(selectedNames, {
              onSuccess: () => {
                setConfirmingBulk(false);
                stopSelecting();
              },
            })
          }
        />
      )}
    </div>
  );
}
