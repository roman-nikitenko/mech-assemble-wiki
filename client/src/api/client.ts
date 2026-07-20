import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccessoryInput, AccessorySummary, GameType, MechDetail, MechInput, MechRank, MechSummary, Pilot, PilotInput, PostedBuild, TypeInput, WeaponInput, WeaponSummary } from "./types";
import { adminHeaders } from "../auth/adminSession";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Thrown on HTTP 404 so pages can show "not found" instead of a generic error. */
export class NotFoundError extends Error {}

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (res.status === 404) throw new NotFoundError(`404 for ${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

export interface MechFilters {
  typeId?: string;
  rank?: MechRank;
}

/** Browse list. The filters are part of the query KEY, so changing a filter
    is a different cache entry and triggers its own fetch. */
export function useMechs(filters: MechFilters) {
  const params = new URLSearchParams();
  if (filters.typeId) params.set("typeId", filters.typeId);
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
    // The build editor calls useMech("") before a mech is chosen — don't fetch.
    enabled: id !== "",
    retry: (failureCount, error) =>
      !(error instanceof NotFoundError) && failureCount < 3,
  });
}

/** Absolute URL for an /uploads path — images live on the API server
    (:3000), not the Vite dev server (:5173). */
export function imageSrc(path: string) {
  return `${API_URL}${path}`;
}

// Shared helper for JSON write requests. The API sends {error: "..."} for
// 400/404/409 — we surface that message so forms can show it to the admin.
async function sendJson<T>(path: string, method: "POST" | "PUT", body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useCreateMech() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MechInput) => sendJson<MechSummary>("/api/mechs", "POST", input),
    // Invalidating ["mechs"] makes BOTH the admin list and the public browse
    // page refetch — that's how a new mech "appears on the front page".
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mechs"] });
      qc.invalidateQueries({ queryKey: ["pilots"] });
    },
  });
}

export function useUpdateMech(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MechInput) => sendJson<MechSummary>(`/api/mechs/${id}`, "PUT", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mechs"] });
      qc.invalidateQueries({ queryKey: ["mech", id] });
      qc.invalidateQueries({ queryKey: ["pilots"] });
    },
  });
}

export function useDeleteMech() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/mechs/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mechs"] }),
  });
}

/** Uploads an image file; resolves to the public URL for imageUrl. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  // NOTE: no Content-Type header — the browser sets the multipart boundary.
  const res = await fetch(`${API_URL}/api/uploads`, { method: "POST", headers: adminHeaders(), body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export function usePilots() {
  return useQuery({ queryKey: ["pilots"], queryFn: () => fetchJson<Pilot[]>("/api/pilots") });
}

export function useCreatePilot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PilotInput) => sendJson<Pilot>("/api/pilots", "POST", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pilots"] });
      // linking/unlinking can change which mech "has" a pilot
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["weapons"] });
    },
  });
}

export function useUpdatePilot(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PilotInput) => sendJson<Pilot>(`/api/pilots/${id}`, "PUT", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pilots"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["weapons"] });
    },
  });
}

export function useDeletePilot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/pilots/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pilots"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["weapons"] });
    },
  });
}

export function useTypes() {
  return useQuery({ queryKey: ["types"], queryFn: () => fetchJson<GameType[]>("/api/types") });
}

export function useCreateType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TypeInput) => sendJson<GameType>("/api/types", "POST", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["types"] }),
  });
}

export function useUpdateType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TypeInput) => sendJson<GameType>(`/api/types/${id}`, "PUT", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["types"] });
      // a renamed type / new icon shows on mech cards too
      qc.invalidateQueries({ queryKey: ["mechs"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
    },
  });
}

export function useDeleteType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/types/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["types"] }),
  });
}

export function useWeapons() {
  return useQuery({ queryKey: ["weapons"], queryFn: () => fetchJson<WeaponSummary[]>("/api/weapons") });
}

export function useCreateWeapon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WeaponInput) => sendJson<WeaponSummary>("/api/weapons", "POST", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weapons"] });
      // owner/pilot links may have moved
      qc.invalidateQueries({ queryKey: ["mechs"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["pilots"] });
    },
  });
}

export function useUpdateWeapon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WeaponInput) => sendJson<WeaponSummary>(`/api/weapons/${id}`, "PUT", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weapons"] });
      qc.invalidateQueries({ queryKey: ["mechs"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["pilots"] });
    },
  });
}

export function useDeleteWeapon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/weapons/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weapons"] });
      qc.invalidateQueries({ queryKey: ["mechs"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["pilots"] });
    },
  });
}

export function useAccessories() {
  return useQuery({ queryKey: ["accessories"], queryFn: () => fetchJson<AccessorySummary[]>("/api/accessories") });
}

export function useCreateAccessory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AccessoryInput) => sendJson<AccessorySummary>("/api/accessories", "POST", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accessories"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["mechs"] });
    },
  });
}

export function useUpdateAccessory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AccessoryInput) => sendJson<AccessorySummary>(`/api/accessories/${id}`, "PUT", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accessories"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["mechs"] });
    },
  });
}

export function useDeleteAccessory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/accessories/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accessories"] });
      qc.invalidateQueries({ queryKey: ["mech"] });
      qc.invalidateQueries({ queryKey: ["mechs"] });
    },
  });
}

/** Community build feed — all posted builds, newest first. Public, no auth. */
export function usePostedBuilds() {
  return useQuery({
    queryKey: ["posted-builds"],
    queryFn: () => fetchJson<PostedBuild[]>("/api/builds"),
  });
}

/** Single posted build by id — used by the detail page. */
export function usePostedBuild(id: string) {
  return useQuery({
    queryKey: ["posted-builds", id],
    queryFn: () => fetchJson<PostedBuild>(`/api/builds/${id}`),
    retry: (failureCount, error) => !(error instanceof NotFoundError) && failureCount < 3,
  });
}
