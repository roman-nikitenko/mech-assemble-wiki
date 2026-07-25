import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

const queryClient = new QueryClient();
initAnalytics();

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
