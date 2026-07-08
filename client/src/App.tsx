import { Link, Route, Routes } from "react-router-dom";
import { BrowsePage } from "./pages/BrowsePage";
import { MechDetailPage } from "./pages/MechDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BrowsePage />} />
      <Route path="/mechs/:id" element={<MechDetailPage />} />
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
