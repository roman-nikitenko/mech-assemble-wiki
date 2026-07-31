import { useEffect } from "react";
import { useAdminFeedback, useDeleteFeedback, useMarkFeedbackRead } from "../api/client";
import { formatDate } from "../lib/date";

/** Admin Messages — feedback submissions, newest first. Opening the page marks
    everything read (clears the header bell). Message/name render as plain text
    (React-escaped), so a <script> in a message is shown, never executed. */
export function AdminMessagesPage() {
  const messages = useAdminFeedback();
  const markRead = useMarkFeedbackRead();
  const remove = useDeleteFeedback();

  // Mark all read once, when the page opens. markRead.mutate is stable; the
  // empty dep array runs this a single time on mount.
  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDelete(id: string, name: string) {
    if (!window.confirm(`Delete the message from ${name}?`)) return;
    remove.mutate(id);
  }

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">Messages</h1>

      {messages.isPending ? (
        <p className="mt-6 text-ink-dim">Loading…</p>
      ) : messages.isError ? (
        <p className="mt-6 text-fire">{(messages.error as Error).message}</p>
      ) : messages.data.length === 0 ? (
        <p className="mt-6 text-ink-dim">No messages yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {messages.data.map((m) => (
            <li key={m.id} className="rounded-xl border border-edge p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-ink-dim">{formatDate(m.createdAt)}</p>
                </div>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => onDelete(m.id, m.name)}
                  className="rounded border border-fire/40 px-2 py-1 text-xs text-fire hover:bg-fire/10 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
