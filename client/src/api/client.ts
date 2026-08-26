import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccessoryInput, AccessorySummary, AdminUser, DashboardStats, Drone, DroneInput, DroneType, DroneTypeInput, Feedback, GameType, MechDetail, MechInput, MechRank, MechSummary, ModuleDetail, ModuleInput, ModuleQuality, ModuleQualityInput, ModuleSummary, Pilot, PilotInput, PostedBuild, TypeInput, WeaponDetail, WeaponInput, WeaponSummary } from "./types";
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

// Responsive variant widths the server generates per image (see
// server/src/routes/uploads.ts — these MUST match). The browser picks the
// smallest file that fills the slot, guided by each <img>'s `sizes`.
const VARIANT_WIDTHS = [200, 400, 800, 1200];

/** Build a `srcSet` string for an uploaded image. Swaps the stored file's
    extension for each `-<width>.webp` variant, so it works whether the base
    is .png/.jpg/.webp. Pair with a `sizes` attribute so the browser can pick
    the right width. Falls back to the plain `src` if variants are missing. */
export function srcSet(path: string): string {
  const stem = path.replace(/\.[^./]+$/, "");
  return VARIANT_WIDTHS.map((w) => `${imageSrc(`${stem}-${w}.webp`)} ${w}w`).join(", ");
}

// Default `sizes` for the standard 1/2/3/4-column card grids (mechs, weapons,
// accessories). Roughly: one card's rendered width at each breakpoint.
export const CARD_SIZES =
  "(min-width: 1280px) 270px, (min-width: 1024px) 340px, (min-width: 640px) 48vw, 92vw";

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
      // Linking a weapon/accessory moves its ownership, so refresh those lists.
      qc.invalidateQueries({ queryKey: ["weapons"] });
      qc.invalidateQueries({ queryKey: ["accessories"] });
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
      // Linking a weapon/accessory moves its ownership, so refresh those lists.
      qc.invalidateQueries({ queryKey: ["weapons"] });
      qc.invalidateQueries({ queryKey: ["accessories"] });
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

/** Upload a preview video (mp4/webm); returns its "/uploads/..." URL. Stored
    as-is by the server (no processing), unlike images. */
export async function uploadVideo(file: File): Promise<string> {
  const form = new FormData();
  form.append("video", file);
  const res = await fetch(`${API_URL}/api/uploads/video`, { method: "POST", headers: adminHeaders(), body: form });
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

export function useDrones() {
  return useQuery({ queryKey: ["drones"], queryFn: () => fetchJson<Drone[]>("/api/drones") });
}

export function useCreateDrone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DroneInput) => sendJson<Drone>("/api/drones", "POST", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drones"] }),
  });
}

export function useUpdateDrone(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DroneInput) => sendJson<Drone>(`/api/drones/${id}`, "PUT", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drones"] }),
  });
}

export function useDeleteDrone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/drones/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drones"] }),
  });
}

export function useDroneTypes() {
  return useQuery({ queryKey: ["drone-types"], queryFn: () => fetchJson<DroneType[]>("/api/drone-types") });
}

export function useCreateDroneType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DroneTypeInput) => sendJson<DroneType>("/api/drone-types", "POST", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drone-types"] }),
  });
}

export function useUpdateDroneType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DroneTypeInput) => sendJson<DroneType>(`/api/drone-types/${id}`, "PUT", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drone-types"] }),
  });
}

export function useDeleteDroneType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/drone-types/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drone-types"] }),
  });
}

export function useWeapons() {
  return useQuery({ queryKey: ["weapons"], queryFn: () => fetchJson<WeaponSummary[]>("/api/weapons") });
}

export function useWeapon(id: string) {
  return useQuery({
    queryKey: ["weapon", id],
    queryFn: () => fetchJson<WeaponDetail>(`/api/weapons/${id}`),
    retry: (failureCount, error) =>
      !(error instanceof NotFoundError) && failureCount < 3,
  });
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

// ---------- Admin: user management ----------
// GET /api/admin/users returns PII and is guarded, so (unlike the public
// catalogs) this GET must carry the admin token.
async function adminFetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: adminHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Every registered user, newest first — admin Users page. */
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminFetchJson<AdminUser[]>("/api/admin/users"),
  });
}

/** Admin Dashboard metrics — users + posts from our DB, visitors from GA4. */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminFetchJson<DashboardStats>("/api/admin/stats"),
  });
}

/** Delete a user (cascades their builds + hearts). */
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

// ---------- Feedback (public form + admin Messages) ----------

export interface FeedbackInput {
  name: string;
  message: string;
  website: string; // honeypot — real users leave this empty
}

/** Public submit. Surfaces the server's message (e.g. the 429 "Too fast,
    slow down :)" or a 400 validation message) so the form can show it. */
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async (input: FeedbackInput) => {
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
      return res.json() as Promise<{ ok: true }>;
    },
  });
}

const FEEDBACK_KEY = ["admin-feedback"] as const;
const FEEDBACK_UNREAD_KEY = ["feedback-unread-count"] as const;

/** Admin Messages list — newest first (server-ordered). */
export function useAdminFeedback() {
  return useQuery({
    queryKey: FEEDBACK_KEY,
    queryFn: () => adminFetchJson<Feedback[]>("/api/feedback"),
  });
}

/** Unread count for the admin header bell. */
export function useUnreadFeedbackCount() {
  return useQuery({
    queryKey: FEEDBACK_UNREAD_KEY,
    queryFn: () => adminFetchJson<{ count: number }>("/api/feedback/unread-count"),
  });
}

/** Mark every unread message read (called when the Messages page opens). */
export function useMarkFeedbackRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/feedback/mark-read`, {
        method: "POST",
        headers: adminHeaders(),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FEEDBACK_UNREAD_KEY }),
  });
}

/** Delete one message. */
export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/feedback/${id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEEDBACK_KEY });
      qc.invalidateQueries({ queryKey: FEEDBACK_UNREAD_KEY });
    },
  });
}

// ---- Module qualities (catalog) ----

export function useModuleQualities() {
  return useQuery({ queryKey: ["module-qualities"], queryFn: () => fetchJson<ModuleQuality[]>("/api/module-qualities") });
}

export function useCreateModuleQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ModuleQualityInput) => sendJson<ModuleQuality>("/api/module-qualities", "POST", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["module-qualities"] }),
  });
}

export function useUpdateModuleQuality(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ModuleQualityInput) => sendJson<ModuleQuality>(`/api/module-qualities/${id}`, "PUT", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["module-qualities"] }),
  });
}

export function useDeleteModuleQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/module-qualities/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["module-qualities"] }),
  });
}

/** Create-or-update a module quality: PUT when an id is given, else POST. Lets
    callers (e.g. the module form's per-tier attribute editor) save a tier
    without knowing up front whether its catalog row already exists. */
export function useUpsertModuleQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ModuleQualityInput & { id?: string }) =>
      id
        ? sendJson<ModuleQuality>(`/api/module-qualities/${id}`, "PUT", body)
        : sendJson<ModuleQuality>("/api/module-qualities", "POST", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["module-qualities"] }),
  });
}

// ---- Modules ----

export function useModules() {
  return useQuery({ queryKey: ["modules"], queryFn: () => fetchJson<ModuleSummary[]>("/api/modules") });
}

export function useModule(id: string) {
  return useQuery({
    queryKey: ["module", id],
    queryFn: () => fetchJson<ModuleDetail>(`/api/modules/${id}`),
    enabled: id !== "",
    retry: (failureCount, error) =>
      !(error instanceof NotFoundError) && failureCount < 3,
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ModuleInput) => sendJson<ModuleDetail>("/api/modules", "POST", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
}

export function useUpdateModule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ModuleInput) => sendJson<ModuleDetail>(`/api/modules/${id}`, "PUT", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules"] });
      qc.invalidateQueries({ queryKey: ["module", id] });
    },
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/modules/${id}`, { method: "DELETE", headers: adminHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
}
