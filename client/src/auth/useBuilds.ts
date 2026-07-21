import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { API_URL } from "../api/client";
import type { BuildPostInput, PostedBuild } from "../api/types";
import { getAccessToken } from "./authToken";

type HeartResult = { hearts: number; userHearted: boolean };

/** Authenticated fetch that returns the parsed JSON body (or throws the
    API's {error} message). Used by every builds request that needs a token. */
async function authedJson<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
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
  // 204 No Content (delete) has an empty body.
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/** My builds — every status (Draft/Published/Unposted). Powers the Profile
    list and the build editor. Only fetches once logged in. */
export function useMyBuilds() {
  const { isAuthenticated } = useAuth0();
  return useQuery({
    queryKey: ["my-builds"],
    enabled: isAuthenticated,
    queryFn: () => authedJson<PostedBuild[]>("/api/builds/mine", "GET"),
  });
}

// A create/edit/status change can affect both the owner's list and the public
// feed, so refresh both after any of them.
function invalidateBuilds(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["my-builds"] });
  qc.invalidateQueries({ queryKey: ["posted-builds"] });
}

/** Create a new build. It starts as a Draft — publishing is a separate step. */
export function useCreateBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BuildPostInput) => authedJson<PostedBuild>("/api/builds", "POST", input),
    onSuccess: () => invalidateBuilds(qc),
  });
}

/** Edit an existing build's fields. Status is left unchanged server-side. */
export function useUpdateBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BuildPostInput }) =>
      authedJson<PostedBuild>(`/api/builds/${id}`, "PUT", input),
    onSuccess: () => invalidateBuilds(qc),
  });
}

/** Publish a build (Draft/Unposted → Published), putting it in the feed. */
export function usePublishBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authedJson<PostedBuild>(`/api/builds/${id}/publish`, "POST"),
    onSuccess: () => invalidateBuilds(qc),
  });
}

/** Unpost a build (Published → Unposted), pulling it from the feed. The row
    and its hearts survive, so it can be republished later. */
export function useUnpostBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authedJson<PostedBuild>(`/api/builds/${id}/unpost`, "POST"),
    onSuccess: () => invalidateBuilds(qc),
  });
}

/** Toggle heart on a posted build. Updates the cached hearts count and
    sets userHearted in the cached build so the button reacts instantly. */
export function useToggleHeart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (buildId: string) => authedJson<HeartResult>(`/api/builds/${buildId}/heart`, "POST"),
    onSuccess: (data, buildId) => {
      // Patch the hearts count and userHearted flag in both query caches so
      // the UI updates without a full refetch.
      qc.setQueryData<PostedBuild[]>(["posted-builds"], (old) =>
        old?.map((b) =>
          b.id === buildId ? { ...b, hearts: data.hearts, userHearted: data.userHearted } : b
        )
      );
      qc.setQueryData<PostedBuild>(["posted-builds", buildId], (old) =>
        old ? { ...old, hearts: data.hearts, userHearted: data.userHearted } : old
      );
    },
  });
}

/** Delete one of your own builds (any status). */
export function useDeletePostedBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authedJson<void>(`/api/builds/${id}`, "DELETE"),
    onSuccess: () => invalidateBuilds(qc),
  });
}
