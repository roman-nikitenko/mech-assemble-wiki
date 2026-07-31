import { useState, type FormEvent } from "react";
import { Seo } from "../components/Seo";
import { useSubmitFeedback } from "../api/client";

/** Public contact form: name + message. A hidden `website` honeypot catches
    naive bots; the server also validates and rate-limits by IP. */
export function FeedbackPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const submit = useSubmitFeedback();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit.mutate({ name, message, website });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Seo
        title={`Mech Assemble Wiki — "Feedback"`}
        description="Send the Mech Assemble Wiki team a message — bug reports, corrections, and suggestions welcome."
        path="/feedback"
      />
      <h1 className="text-2xl font-black tracking-tight">Feedback</h1>
      <p className="mt-2 text-ink-dim">
        Found a mistake, or have a suggestion? Send us a message.
      </p>

      {submit.isSuccess ? (
        <p className="mt-8 rounded-xl border border-accent bg-surface px-4 py-6 text-center">
          Thanks! We got your message.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              className="rounded-lg border border-edge bg-surface px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={2000}
              rows={6}
              className="rounded-lg border border-edge bg-surface px-3 py-2"
            />
          </label>

          {/* Honeypot: off-screen and hidden from assistive tech + tab order.
              Real users never fill it; bots that do are silently dropped. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px]">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          {submit.isError && (
            <p className="text-fire">{(submit.error as Error).message}</p>
          )}

          <button
            type="submit"
            disabled={submit.isPending}
            className="self-start rounded-lg border border-accent px-4 py-2 font-semibold text-accent hover:brightness-110 disabled:opacity-60"
          >
            {submit.isPending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </main>
  );
}
