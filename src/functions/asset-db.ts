import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { loadAssetDb, persistAssetDb, type AssetDbSnapshot } from "@/db-server/asset-db";
import { requireAuthFromToken } from "@/db-server/auth";

function getBearerFromRequest(): string | null {
  const auth = getRequestHeader("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export const loadAssetDbFn = createServerFn({ method: "GET" })
  .inputValidator((data: { token?: string } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const token = data?.token ?? getBearerFromRequest();
    if (!token) return { error: "Unauthorized" as const };
    await requireAuthFromToken(token);
    const snapshot = await loadAssetDb();
    return { data: snapshot };
  });

export const persistAssetDbFn = createServerFn({ method: "POST" })
  .inputValidator((data: { snapshot: AssetDbSnapshot; token?: string }) => data)
  .handler(async ({ data }) => {
    const token = data.token ?? getBearerFromRequest();
    if (!token) return { error: "Unauthorized" as const, snapshot: data.snapshot, ok: false };
    await requireAuthFromToken(token);
    return persistAssetDb(data.snapshot);
  });

export type { AssetDbSnapshot };
