import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

const queryClient = new QueryClient();

// Load Google Analytics off the critical path. gtag.js is ~163 KiB and, if
// loaded during boot, competes for bandwidth with the LCP image right when the
// page is rendering. Deferring it to after `load` costs us nothing measurable:
// the page_view beacon still fires (a second or two later), so the admin
// Dashboard sees every visit — we only skip tracking users who leave in the
// first moment before the deferred script runs.
if (document.readyState === "complete") {
  initAnalytics();
} else {
  window.addEventListener("load", () => initAnalytics(), { once: true });
}

// Auth now rides on an httpOnly session cookie set by our own /api/auth flow,
// so there's no Auth0Provider or token bridge — the app just renders.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
