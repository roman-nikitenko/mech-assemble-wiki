import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const TABS = [
  { to: "/", label: "Mechs" },
  { to: "/builds", label: "Builds" },
  { to: "/weapons", label: "Weapons" },
  { to: "/accessories", label: "Accessories" },
  { to: "/pilots", label: "Pilots" },
];

const buttonStyles = 'border rounded-lg border-accent px-2 py-1';

// Small inline icons (no icon library in the project). They inherit color via
// `currentColor` and size via the className passed in. The header shows the
// account link and log out as these icons on every screen size (the readable
// name/label is carried by each control's aria-label).
function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0v.25H4.5v-.25Z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
    </svg>
  );
}

/** Public shell: site title + section tabs; pages render into the Outlet.
    Styled like the detail page's Tabs component so the site feels uniform. */
export function PublicLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading, me, logout } = useAuth();
  // Mech detail pages (/mechs/:id) still belong to the Mechs tab.
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" || pathname.startsWith("/mechs") : pathname.startsWith(to);

  return (
    // Flex column so the footer is pushed to the bottom on short pages
    // (the content wrapper grows to fill the remaining height).
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <h1 className="text-2xl font-black tracking-tight">
              Mech <span className="text-accent">Assemble</span> Wiki
            </h1>
          </Link>
          <div className="flex items-center gap-4  ">
            {isAuthenticated ? (
              <>
                {/* Icon-only on every screen size — the account link and log
                    out are shown as icons (name/label live in aria-label). */}
                <Link
                  to="/profile"
                  aria-label={me?.nickname ?? "My Profile"}
                  className="flex items-center text-ink hover:text-accent"
                >
                  <UserIcon className="h-6 w-6" />
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  aria-label="Log out"
                  className={`${buttonStyles} flex items-center text-ink-dim hover:text-accent cursor-pointer`}
                >
                  <LogoutIcon className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                aria-disabled={isLoading}
                className={`${buttonStyles} text-sm  font-semibold text-accent hover:brightness-110`}
              >
                Log in
              </Link>
            )}
            {/* No Admin link on purpose — the admin area is reached by
                typing /admin directly (it has its own login). */}
          </div>
        </div>
        <nav aria-label="Site sections" className="mt-4 flex gap-1 overflow-x-auto border-b border-edge">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={isActive(tab.to) ? "page" : undefined}
              className={`flex min-h-11 items-center whitespace-nowrap px-4 text-sm font-semibold transition-colors ${
                isActive(tab.to)
                  ? "border-b-2 border-accent text-accent"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="mt-16 border-t border-edge">
        <div className="mx-auto max-w-6xl px-4 py-8 text-ink-dim">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="text-lg font-black tracking-tight text-ink">
              Mech <span className="text-accent">Assemble</span> Wiki
            </Link>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {TABS.map((tab) => (
                <Link key={tab.to} to={tab.to} className="hover:text-accent">
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
          {/* Unofficial fan-site disclaimer — the important part for a
              community wiki. No developer name is asserted (we don't invent
              one); "respective owners" covers the game's trademarks and art. */}
          <p className="mt-6 text-xs leading-relaxed">
            Fan-made, unofficial community wiki. &ldquo;Mech Assemble: Zombie Swarm&rdquo;
            and all related names, artwork, and assets are trademarks and copyrights of
            their respective owners. This site is not affiliated with or endorsed by them.
          </p>
          <p className="mt-2 text-xs">
            &copy; {new Date().getFullYear()} Mech Assemble Wiki.
          </p>
        </div>
      </footer>
    </div>
  );
}
