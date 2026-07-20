import { Link, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./pages/PublicLayout";
import { BrowsePage } from "./pages/BrowsePage";
import { MechDetailPage } from "./pages/MechDetailPage";
import { BuildsPage } from "./pages/BuildsPage";
import { BuildDetailPage } from "./pages/BuildDetailPage";
import { WeaponsPage } from "./pages/WeaponsPage";
import { AccessoriesPage } from "./pages/AccessoriesPage";
import { PilotsPage } from "./pages/PilotsPage";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminLoginPage } from "./admin/AdminLoginPage";
import { DashboardPage } from "./admin/DashboardPage";
import { UsersPage } from "./admin/UsersPage";
import { SettingsPage } from "./admin/SettingsPage";
import { AdminMechsPage } from "./admin/mechs/AdminMechsPage";
import { MechFormPage } from "./admin/mechs/MechFormPage";
import { AdminWeaponsPage } from "./admin/weapons/AdminWeaponsPage";
import { WeaponFormPage } from "./admin/weapons/WeaponFormPage";
import { AdminAccessoriesPage } from "./admin/accessories/AdminAccessoriesPage";
import { AccessoryFormPage } from "./admin/accessories/AccessoryFormPage";
import { AdminPilotsPage } from "./admin/pilots/AdminPilotsPage";
import { PilotFormPage } from "./admin/pilots/PilotFormPage";
import { AdminTypesPage } from "./admin/types/AdminTypesPage";
import { TypeFormPage } from "./admin/types/TypeFormPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { BuildEditorPage } from "./pages/profile/BuildEditorPage";

export default function App() {
  return (
    <Routes>
      {/* Public site: PublicLayout renders the header + section tabs. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/mechs/:id" element={<MechDetailPage />} />
        <Route path="/builds" element={<BuildsPage />} />
        <Route path="/builds/:buildId" element={<BuildDetailPage />} />
        <Route path="/weapons" element={<WeaponsPage />} />
        <Route path="/accessories" element={<AccessoriesPage />} />
        <Route path="/pilots" element={<PilotsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/builds/new" element={<BuildEditorPage />} />
        <Route path="/profile/builds/:buildId/edit" element={<BuildEditorPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin area: AdminLayout renders the sidebar, children fill the Outlet. */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
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
  );
}
