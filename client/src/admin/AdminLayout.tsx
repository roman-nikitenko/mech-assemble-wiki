import { Link, NavLink, Outlet } from "react-router-dom";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true }, // end: exact match, or it'd stay lit for every /admin/* page
  { to: "/admin/users", label: "Users", end: false },
  { to: "/admin/mechs", label: "Mechs", end: false },
  { to: "/admin/pilots", label: "Pilots", end: false },
  { to: "/admin/types", label: "Types", end: false },
  { to: "/admin/settings", label: "Settings", end: false },
];

/** Admin shell: left sidebar on lg+ screens, horizontal scrollable nav bar
    on phones. Child pages render into the <Outlet/>. */
export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-edge bg-surface p-3 lg:min-h-screen lg:w-56 lg:flex-col lg:items-stretch lg:border-r lg:border-b-0">
        <p className="hidden px-3 py-2 text-xs font-bold uppercase tracking-widest text-ink-dim lg:block">
          Admin
        </p>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `min-h-11 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
                isActive ? "bg-surface-2 text-accent" : "text-ink-dim hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <div className="lg:mt-auto">
          <Link to="/" className="block min-h-11 px-3 py-2 text-sm text-ink-dim hover:text-accent">
            ← Back to site
          </Link>
        </div>
      </aside>
      <div className="flex-1 p-4 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
}
