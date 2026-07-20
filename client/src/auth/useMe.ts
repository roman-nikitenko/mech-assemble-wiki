import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { API_URL } from "../api/client";
import { getAccessToken } from "./authToken";

export interface Me {
  id: string;
  nickname: string | null;
  server: string | null;
  isNew: boolean;
}

async function authedJson<T>(path: string, method: "GET" | "PUT", body?: unknown): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token ?? ""}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
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
  const { isAuthenticated } = useAuth0();
  return useQuery({
    queryKey: ["me"],
    enabled: isAuthenticated,
    queryFn: () => authedJson<Me>("/api/me", "GET"),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { nickname: string; server: string }) =>
      authedJson<Me>("/api/me", "PUT", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
