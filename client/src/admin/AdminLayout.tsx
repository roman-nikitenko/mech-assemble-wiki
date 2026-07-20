import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { clearAdminToken, getAdminToken } from "../auth/adminSession";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true }, // end: exact match, or it'd stay lit for every /admin/* page
  { to: "/admin/users", label: "Users", end: false },
  { to: "/admin/mechs", label: "Mechs", end: false },
  { to: "/admin/weapons", label: "Weapons", end: false },
  { to: "/admin/accessories", label: "Accessories", end: false },
  { to: "/admin/pilots", label: "Pilots", end: false },
  { to: "/admin/types", label: "Types", end: false },
  { to: "/admin/settings", label: "Settings", end: false },
];

/** Admin shell: left sidebar on lg+ screens, horizontal scrollable nav bar
    on phones. Child pages render into the <Outlet/>.
    The sidebar is STICKY: h-screen (not min-h) caps it at the viewport so
    top-0 pins it while the main column scrolls past — and mt-auto on the
    "Back to site" link then means "bottom of the screen", not "bottom of
    however tall the page content is". */
export function AdminLayout() {
  const navigate = useNavigate();
  if (!getAdminToken()) return <Navigate to="/admin/login" replace />;
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="sticky top-0 z-40 flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-edge bg-surface p-3 lg:h-screen lg:w-56 lg:flex-col lg:items-stretch lg:overflow-y-auto lg:border-r lg:border-b-0">
        <p className="hidden px-3 py-2 text-xs font-bold uppercase tracking-widest text-ink-dim lg:block">
          Admin
        </p>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
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
          <button
            type="button"
            onClick={() => { clearAdminToken(); navigate("/admin/login"); }}
            className="block min-h-11 px-3 py-2 text-left text-sm text-ink-dim hover:text-fire"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex-1 p-4 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
}
