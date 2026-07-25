import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "../api/client";
import { useMe } from "./useMe";

/** Auth state derived from GET /api/me: a 200 means logged in, a 401 means
    guest (useMe returns null data for guests, no retry). Also exposes logout. */
export function useAuth() {
  const me = useMe();
  const qc = useQueryClient();
  const logout = useMutation({
    mutationFn: async () => {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries(),
  });
  return {
    isAuthenticated: !!me.data,
    isLoading: me.isLoading,
    me: me.data ?? null,
    logout: () => logout.mutate(),
    // Full-page redirect that starts the provider flow.
    login: (provider: "google" | "discord") => {
      window.location.href = `${API_URL}/api/auth/${provider}/login`;
    },
  };
}
