import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "../api/client";
import type { BuildPostInput, PostedBuild } from "../api/types";
import { getAccessToken } from "./authToken";

type HeartResult = { hearts: number; userHearted: boolean };

async function authedFetch(
  path: string,
  method: "POST" | "DELETE",
  body?: unknown
): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token ?? ""}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Post a build to the community feed. Requires a logged-in user. */
export function usePostBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BuildPostInput): Promise<PostedBuild> => {
      const res = await authedFetch("/api/builds", "POST", input);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posted-builds"] }),
  });
}

/** Toggle heart on a posted build. Updates the cached hearts count and
    sets userHearted in the cached build so the button reacts instantly. */
export function useToggleHeart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (buildId: string): Promise<HeartResult> => {
      const res = await authedFetch(`/api/builds/${buildId}/heart`, "POST");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
      return res.json();
    },
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

/** Delete one of your own posted builds. */
export function useDeletePostedBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authedFetch(`/api/builds/${id}`, "DELETE");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posted-builds"] }),
  });
}
