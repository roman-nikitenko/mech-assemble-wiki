import { useQuery } from "@tanstack/react-query";
import type { MechDetail, MechRank, MechSummary, MechType } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Thrown on HTTP 404 so pages can show "not found" instead of a generic error. */
export class NotFoundError extends Error {}

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (res.status === 404) throw new NotFoundError(`404 for ${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

export interface MechFilters {
  type?: MechType;
  rank?: MechRank;
}

/** Browse list. The filters are part of the query KEY, so changing a filter
    is a different cache entry and triggers its own fetch. */
export function useMechs(filters: MechFilters) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.rank) params.set("rank", filters.rank);
  const qs = params.toString();
  return useQuery({
    queryKey: ["mechs", filters],
    queryFn: () => fetchJson<MechSummary[]>(`/api/mechs${qs ? `?${qs}` : ""}`),
  });
}

/** One mech with everything nested. Doesn't retry 404s — a missing mech
    stays missing; retrying only delays the "not found" screen. */
export function useMech(id: string) {
  return useQuery({
    queryKey: ["mech", id],
    queryFn: () => fetchJson<MechDetail>(`/api/mechs/${id}`),
    retry: (failureCount, error) =>
      !(error instanceof NotFoundError) && failureCount < 3,
  });
}
