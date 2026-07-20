import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useMe } from "../auth/useMe";

const TABS = [
  { to: "/", label: "Mechs" },
  { to: "/builds", label: "Builds" },
  { to: "/weapons", label: "Weapons" },
  { to: "/accessories", label: "Accessories" },
  { to: "/pilots", label: "Pilots" },
];

/** Public shell: site title + section tabs; pages render into the Outlet.
    Styled like the detail page's Tabs component so the site feels uniform. */
export function PublicLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const me = useMe();
  // Mech detail pages (/mechs/:id) still belong to the Mechs tab.
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" || pathname.startsWith("/mechs") : pathname.startsWith(to);

  return (
    <>
      <header className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <h1 className="text-2xl font-black tracking-tight">
              Mech <span className="text-accent">Assemble</span> Wiki
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-sm font-semibold text-ink hover:text-accent">
                  {me.data?.nickname ?? "My Profile"}
                </Link>
                <button
                  type="button"
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="text-sm text-ink-dim hover:text-accent"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => loginWithRedirect()}
                disabled={isLoading}
                className="text-sm font-semibold text-accent cursor-pointer hover:brightness-110"
              >
                Log in
              </button>
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
      <Outlet />
    </>
  );
}
