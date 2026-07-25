import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "../api/client";

export interface Me {
  id: string;
  // Display name from the social provider (Google name / Discord global_name);
  // shown in the admin Users list.
  name: string | null;
  nickname: string | null;
  server: string | null;
  isNew: boolean;
}

/** Fetch that sends the session cookie. Returns null on 401 (guest) so the
    query resolves to "not logged in" instead of throwing. */
async function meFetch(method: "GET" | "PUT", body?: unknown): Promise<Me | null> {
  const res = await fetch(`${API_URL}/api/me`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<Me>;
}

/** Our profile row, or null when logged out. */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => meFetch("GET"),
    retry: false,
    staleTime: 60_000,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { nickname: string; server: string }) => meFetch("PUT", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
