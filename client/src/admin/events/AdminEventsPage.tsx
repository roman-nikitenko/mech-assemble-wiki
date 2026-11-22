import { useState } from "react";
import { Link } from "react-router-dom";
import { useDeleteEvent, useEvents } from "../../api/client";
import type { CalendarEvent, EventCategory } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { EVENT_CATEGORIES, categoryInfo } from "../../lib/eventCategories";
import { downloadTextFile } from "../../lib/downloadFile";
import { eventsToExportJson } from "../../lib/eventsImport";
import { ImportEventsDialog } from "./ImportEventsDialog";

export function AdminEventsPage() {
  const { data, isPending, isError, refetch } = useEvents();
  const deleteEvent = useDeleteEvent();
  const [confirming, setConfirming] = useState<CalendarEvent | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");

  const query = search.trim().toLowerCase();
  // Newest first: the admin mostly edits what is running or coming up.
  const visible = (data ?? [])
    .filter((e) => (!query || e.name.toLowerCase().includes(query)) && (category === "" || e.category === category))
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || a.name.localeCompare(b.name));

  const btn = "min-h-11 cursor-pointer rounded-lg border border-edge px-4 py-2 text-sm font-semibold hover:border-accent/60 disabled:opacity-50";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Events</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setImporting(true)} className={btn}>Import JSON</button>
          <button
            type="button"
            disabled={!data || data.length === 0}
            onClick={() => data && downloadTextFile("events.json", eventsToExportJson(data))}
            className={btn}
          >
            Export JSON
          </button>
          <Link to="/admin/events/new" className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110">
            + New event
          </Link>
        </div>
      </div>

      <p className="mt-2 max-w-2xl text-xs text-ink-dim">
        <b>Import JSON</b> takes the game's <code>events.json</code> (open the dialog for an example of the format) and can
        upload the event images in the same step. <b>Export JSON</b> downloads every event as a backup you can import back.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search" aria-label="Search by name" placeholder="Search by name…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 w-44 rounded-lg border border-edge bg-surface px-3 text-sm"
        />
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <button
                key={c.value} type="button" aria-pressed={active}
                onClick={() => setCategory(active ? "" : c.value)}
                className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold ${
                  active ? "border-accent bg-accent/15 text-accent" : "border-edge bg-surface text-ink-dim hover:text-ink"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr key={e.id} className="border-t border-edge">
                  <td className="px-4 py-2 font-semibold">
                    <Link to={`/admin/events/${e.id}/edit`} className="hover:text-accent">{e.name}</Link>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: categoryInfo(e.category).color }} />{" "}
                    {categoryInfo(e.category).label}
                  </td>
                  <td className="px-4 py-2 text-ink-dim">{e.startDate} → {e.endDate}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link to={`/admin/events/${e.id}/edit`} className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60">Edit</Link>
                      <button onClick={() => setConfirming(e)} className="rounded border border-fire/40 px-2 py-1 text-xs text-fire hover:bg-fire/10">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink-dim">
                    {data.length === 0 ? "No events yet — add one or use Import JSON." : "No events match."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {importing && <ImportEventsDialog existing={data ?? []} onClose={() => setImporting(false)} />}

      {confirming && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-bg/80 p-4" role="dialog" aria-modal="true">
          <div className="max-w-md rounded-xl border border-edge bg-surface p-6">
            <h2 className="font-bold">Delete {confirming.name}?</h2>
            <p className="mt-2 text-sm text-ink-dim">This can't be undone.</p>
            {deleteEvent.isError && <p className="mt-2 text-sm text-fire">{(deleteEvent.error as Error).message}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirming(null)} className="min-h-11 rounded-lg border border-edge px-4 text-sm">Cancel</button>
              <button
                onClick={() => deleteEvent.mutate(confirming.id, { onSuccess: () => setConfirming(null) })}
                disabled={deleteEvent.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteEvent.isPending ? "Deleting..." : "Delete event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
