import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import patreonSymbol from "../assets/patreon-symbol-white.svg";
import { PATREON_URL } from "../lib/site";

/** Public "Support the wiki" page. The header and footer buttons land here;
    the only outbound link is the Patreon button, so the page can explain
    where the money goes before sending anyone to a third-party site. */
export function SupportPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Seo
        title="Support Mech Assemble Wiki"
        description="Help keep Mech Assemble Wiki online and up to date after every game patch."
        path="/support"
      />
      <h1 className="text-2xl font-black tracking-tight">Support Mech Assemble Wiki</h1>

      <div className="mt-4 space-y-4 text-ink-dim">
        <p>Hi! I build and maintain this wiki on my own in my free time.</p>
        <p>
          Mech Assemble Wiki started as a simple idea: one place where players can quickly look up any
          mech&rsquo;s skills, weapons, pilots, skins and awakening progression, without digging through
          scattered posts and screenshots. Every page here is checked, updated after game patches, and
          kept free for everyone.
        </p>
      </div>

      <h2 className="mt-8 text-lg font-bold">Where your support goes</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-dim">
        <li>Hosting and the domain, so the site stays fast and online</li>
        <li>Time spent adding new mechs and updating data after each patch</li>
        <li>New features and tools for the community</li>
      </ul>

      <h2 className="mt-8 text-lg font-bold">How you can help</h2>
      <p className="mt-2 text-ink-dim">
        If this wiki has saved you time or helped you build a better team, you can support the project on
        Patreon. Any amount helps, and it goes straight into keeping the wiki alive and up to date.
      </p>
      {/* A plain <a>: it leaves the site, so it opens a new tab. noopener stops
          the new page from reaching back into this one via window.opener. */}
      <a
        href={PATREON_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#FF424D] px-8 text-lg font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {/* Patreon's official white symbol on their coral (#FF424D) brand colour. */}
        <img src={patreonSymbol} alt="" className="h-6 w-6" />
        Support on Patreon
      </a>

      <h2 className="mt-8 text-lg font-bold">
        Supporters <span aria-hidden="true">❤️</span>
      </h2>
      <p className="mt-2 text-ink-dim">Be the first to support the wiki!</p>

      <h2 className="mt-8 text-lg font-bold">Can&rsquo;t support financially? That&rsquo;s totally fine.</h2>
      <p className="mt-2 text-ink-dim">You can still help a lot:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-dim">
        <li>Share the wiki with your guild or friends</li>
        <li>
          Report mistakes or missing info on the{" "}
          <Link to="/feedback" className="text-accent underline">
            feedback page
          </Link>
        </li>
        <li>Suggest features you&rsquo;d like to see</li>
      </ul>

      <p className="mt-8 text-ink-dim">
        Thank you for using the wiki, and good luck out there against the swarm! <span aria-hidden="true">🧟‍♂️⚙️</span>
      </p>
    </main>
  );
}
