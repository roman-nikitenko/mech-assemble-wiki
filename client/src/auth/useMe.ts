import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { API_URL } from "../api/client";
import { getAccessToken } from "./authToken";

export interface Me {
  id: string;
  // The Auth0 display name (Google/Discord); shown in the admin Users list.
  name: string | null;
  nickname: string | null;
  server: string | null;
  isNew: boolean;
}

async function authedJson<T>(
  path: string,
  method: "GET" | "PUT",
  body?: unknown,
  displayName?: string
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token ?? ""}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      // The access token only carries the sub, so we pass the Auth0 name
      // ourselves (URI-encoded for non-ASCII) for the server to store.
      ...(displayName ? { "x-display-name": encodeURIComponent(displayName) } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Our profile row (find-or-create happens server-side on first call). */
export function useMe() {
  const { isAuthenticated, user } = useAuth0();
  return useQuery({
    queryKey: ["me"],
    enabled: isAuthenticated,
    queryFn: () => authedJson<Me>("/api/me", "GET", undefined, user?.name),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  const { user } = useAuth0();
  return useMutation({
    mutationFn: (input: { nickname: string; server: string }) =>
      authedJson<Me>("/api/me", "PUT", input, user?.name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
