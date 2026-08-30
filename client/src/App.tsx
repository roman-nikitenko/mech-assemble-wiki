import { lazy, Suspense, type ComponentType } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { PublicLayout } from "./pages/PublicLayout";
import { BrowsePage } from "./pages/BrowsePage";
import { MechDetailPage } from "./pages/MechDetailPage";
import { BuildsPage } from "./pages/BuildsPage";
import { BuildDetailPage } from "./pages/BuildDetailPage";
import { CalculatorPage } from "./pages/CalculatorPage";
import { WeaponsPage } from "./pages/WeaponsPage";
import { WeaponDetailPage } from "./pages/WeaponDetailPage";
import { AccessoriesPage } from "./pages/AccessoriesPage";
import { PilotsPage } from "./pages/PilotsPage";
import { DronesPage } from "./pages/DronesPage";
import { ModulesPage } from "./pages/ModulesPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { LoginPage } from "./pages/LoginPage";

// Code-splitting: the public pages above load up front (they're small and part
// of normal browsing). The admin area and the build editor below are split into
// separate chunks that only download when their route is actually visited — so a
// first-time visitor to the Browse page never pays for the admin CRUD forms or
// the drag-and-drop skill-tree editor (which pulls in the heavy @dnd-kit lib).
//
// React.lazy expects a *default* export, but our components use named exports.
// This tiny helper adapts `import(...)` + a named export into the { default }
// shape lazy() wants, so we don't have to rewrite every page to `export default`.
function lazyNamed<M extends Record<string, unknown>, K extends keyof M>(
  loader: () => Promise<M>,
  name: K,
) {
  return lazy(async () => ({ default: (await loader())[name] as ComponentType }));
}

const BuildEditorPage = lazyNamed(() => import("./pages/profile/BuildEditorPage"), "BuildEditorPage");
const AdminLayout = lazyNamed(() => import("./admin/AdminLayout"), "AdminLayout");
const AdminLoginPage = lazyNamed(() => import("./admin/AdminLoginPage"), "AdminLoginPage");
const DashboardPage = lazyNamed(() => import("./admin/DashboardPage"), "DashboardPage");
const UsersPage = lazyNamed(() => import("./admin/UsersPage"), "UsersPage");
const AdminMessagesPage = lazyNamed(() => import("./admin/AdminMessagesPage"), "AdminMessagesPage");
const SettingsPage = lazyNamed(() => import("./admin/SettingsPage"), "SettingsPage");
const AdminMechsPage = lazyNamed(() => import("./admin/mechs/AdminMechsPage"), "AdminMechsPage");
const MechFormPage = lazyNamed(() => import("./admin/mechs/MechFormPage"), "MechFormPage");
const AdminWeaponsPage = lazyNamed(() => import("./admin/weapons/AdminWeaponsPage"), "AdminWeaponsPage");
const WeaponFormPage = lazyNamed(() => import("./admin/weapons/WeaponFormPage"), "WeaponFormPage");
const AdminAccessoriesPage = lazyNamed(() => import("./admin/accessories/AdminAccessoriesPage"), "AdminAccessoriesPage");
const AccessoryFormPage = lazyNamed(() => import("./admin/accessories/AccessoryFormPage"), "AccessoryFormPage");
const AdminPilotsPage = lazyNamed(() => import("./admin/pilots/AdminPilotsPage"), "AdminPilotsPage");
const PilotFormPage = lazyNamed(() => import("./admin/pilots/PilotFormPage"), "PilotFormPage");
const AdminTypesPage = lazyNamed(() => import("./admin/types/AdminTypesPage"), "AdminTypesPage");
const TypeFormPage = lazyNamed(() => import("./admin/types/TypeFormPage"), "TypeFormPage");
const DroneTypeFormPage = lazyNamed(() => import("./admin/types/DroneTypeFormPage"), "DroneTypeFormPage");
const AdminDronesPage = lazyNamed(() => import("./admin/drones/AdminDronesPage"), "AdminDronesPage");
const DroneFormPage = lazyNamed(() => import("./admin/drones/DroneFormPage"), "DroneFormPage");
const AdminModulesPage = lazyNamed(() => import("./admin/modules/AdminModulesPage"), "AdminModulesPage");
const ModuleFormPage = lazyNamed(() => import("./admin/modules/ModuleFormPage"), "ModuleFormPage");
const AdminModuleQualitiesPage = lazyNamed(() => import("./admin/moduleQualities/AdminModuleQualitiesPage"), "AdminModuleQualitiesPage");
const ModuleQualityFormPage = lazyNamed(() => import("./admin/moduleQualities/ModuleQualityFormPage"), "ModuleQualityFormPage");

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-ink-dim">Loading…</div>
      }
    >
    <Routes>
      {/* Public site: PublicLayout renders the header + section tabs. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/mechs/:id" element={<MechDetailPage />} />
        <Route path="/builds" element={<BuildsPage />} />
        <Route path="/builds/:buildId" element={<BuildDetailPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/weapons" element={<WeaponsPage />} />
        <Route path="/weapons/:id" element={<WeaponDetailPage />} />
        <Route path="/accessories" element={<AccessoriesPage />} />
        <Route path="/pilots" element={<PilotsPage />} />
        <Route path="/drones" element={<DronesPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/builds/new" element={<BuildEditorPage />} />
        <Route path="/profile/builds/:buildId/edit" element={<BuildEditorPage />} />
      </Route>

      {/* Standalone (no tabbed shell), like the admin login page. */}
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin area: AdminLayout renders the sidebar, children fill the Outlet. */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="mechs" element={<AdminMechsPage />} />
        <Route path="mechs/new" element={<MechFormPage />} />
        <Route path="mechs/:id/edit" element={<MechFormPage />} />
        <Route path="weapons" element={<AdminWeaponsPage />} />
        <Route path="weapons/new" element={<WeaponFormPage />} />
        <Route path="weapons/:id/edit" element={<WeaponFormPage />} />
        <Route path="accessories" element={<AdminAccessoriesPage />} />
        <Route path="accessories/new" element={<AccessoryFormPage />} />
        <Route path="accessories/:id/edit" element={<AccessoryFormPage />} />
        <Route path="pilots" element={<AdminPilotsPage />} />
        <Route path="pilots/new" element={<PilotFormPage />} />
        <Route path="pilots/:id/edit" element={<PilotFormPage />} />
        <Route path="types" element={<AdminTypesPage />} />
        <Route path="types/new" element={<TypeFormPage />} />
        <Route path="types/:id/edit" element={<TypeFormPage />} />
        <Route path="drone-types/new" element={<DroneTypeFormPage />} />
        <Route path="drone-types/:id/edit" element={<DroneTypeFormPage />} />
        <Route path="drones" element={<AdminDronesPage />} />
        <Route path="drones/new" element={<DroneFormPage />} />
        <Route path="drones/:id/edit" element={<DroneFormPage />} />
        <Route path="modules" element={<AdminModulesPage />} />
        <Route path="modules/new" element={<ModuleFormPage />} />
        <Route path="modules/:id/edit" element={<ModuleFormPage />} />
        <Route path="module-qualities" element={<AdminModuleQualitiesPage />} />
        <Route path="module-qualities/new" element={<ModuleQualityFormPage />} />
        <Route path="module-qualities/:id/edit" element={<ModuleQualityFormPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="*"
        element={
          <main className="mx-auto max-w-6xl px-4 py-16 text-center">
            <p className="text-ink-dim">Page not found.</p>
            <Link to="/" className="text-accent underline">
              Back to browse
            </Link>
          </main>
        }
      />
    </Routes>
    </Suspense>
    </>
  );
}
