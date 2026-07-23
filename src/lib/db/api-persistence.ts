import { getStoredToken } from "@/lib/api/client";
import type {
  Asset,
  Assignment,
  Category,
  Employee,
  Repair,
  Vendor,
} from "@/lib/mock-db";
import { loadAssetDbFn, persistAssetDbFn } from "@/functions/asset-db";

export type AssetDbSnapshot = {
  categories: Category[];
  vendors: Vendor[];
  employees: Employee[];
  assets: Asset[];
  assignments: Assignment[];
  repairs: Repair[];
};

function authOpts() {
  const token = getStoredToken();
  return token
    ? { headers: { Authorization: `Bearer ${token}` } as HeadersInit }
    : {};
}

export function isApiPersistenceEnabled(): boolean {
  return true;
}

export async function loadAssetDbFromApi(): Promise<AssetDbSnapshot | null> {
  try {
    const token = getStoredToken();
    const result = await loadAssetDbFn({
      data: { token: token ?? undefined },
      ...authOpts(),
    });
    if ("error" in result && result.error) {
      console.warn("[AssetDB] API load failed:", result.error);
      return null;
    }
    return result.data ?? null;
  } catch (error) {
    console.warn("[AssetDB] API load failed:", error);
    return null;
  }
}

export async function persistAssetDbToApi(
  snapshot: AssetDbSnapshot,
): Promise<{ snapshot: AssetDbSnapshot; ok: boolean }> {
  try {
    const token = getStoredToken();
    const result = await persistAssetDbFn({
      data: { snapshot, token: token ?? undefined },
      ...authOpts(),
    });
    if ("error" in result && result.error) {
      console.error("[AssetDB] API persist failed:", result.error);
      return { snapshot, ok: false };
    }
    return result;
  } catch (error) {
    console.error("[AssetDB] API persist failed:", error);
    return { snapshot, ok: false };
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistInFlight: Promise<void> | null = null;

export function scheduleAssetDbPersist(snapshot: AssetDbSnapshot) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistInFlight = persistAssetDbToApi(snapshot).then(({ snapshot: migrated, ok }) => {
      persistInFlight = null;
      if (!ok || typeof window === "undefined") return;
      localStorage.setItem("eams_mock_db", JSON.stringify(migrated));
      window.dispatchEvent(new CustomEvent("eams:mock-db-changed"));
    });
  }, 150);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
      const raw = localStorage.getItem("eams_mock_db");
      if (raw) {
        try {
          const snapshot = JSON.parse(raw) as AssetDbSnapshot;
          void persistAssetDbToApi(snapshot);
        } catch {
          // ignore malformed cache
        }
      }
    }
  });
}

export function flushAssetDbPersist(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const runFlush = (snapshot: AssetDbSnapshot) => {
    persistInFlight = persistAssetDbToApi(snapshot).then(({ snapshot: migrated, ok }) => {
      persistInFlight = null;
      if (!ok || typeof window === "undefined") return;
      localStorage.setItem("eams_mock_db", JSON.stringify(migrated));
      window.dispatchEvent(new CustomEvent("eams:mock-db-changed"));
    });
    return persistInFlight;
  };

  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
    const raw = localStorage.getItem("eams_mock_db");
    if (raw) {
      try {
        return runFlush(JSON.parse(raw) as AssetDbSnapshot);
      } catch {
        return persistInFlight ?? Promise.resolve();
      }
    }
  }

  return persistInFlight ?? Promise.resolve();
}

function countRecords(snapshot: AssetDbSnapshot): number {
  return (
    snapshot.categories.length +
    snapshot.vendors.length +
    snapshot.employees.length +
    snapshot.assets.length +
    snapshot.assignments.length +
    snapshot.repairs.length
  );
}

function hasUserData(snapshot: AssetDbSnapshot): boolean {
  return (
    snapshot.assets.length > 0 ||
    snapshot.employees.length > 0 ||
    snapshot.categories.length > 0 ||
    snapshot.vendors.length > 0
  );
}

let initPromise: Promise<AssetDbSnapshot | null> | null = null;

export function initAssetDbFromApi(
  getLocalSnapshot: () => AssetDbSnapshot,
  applySnapshot: (snapshot: AssetDbSnapshot) => void,
): Promise<AssetDbSnapshot | null> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        if (typeof window === "undefined") return null;

        const local = getLocalSnapshot();
        const remote = await loadAssetDbFromApi();

        if (hasUserData(local)) {
          const localCount = countRecords(local);
          const remoteCount = remote ? countRecords(remote) : 0;

          if (!remote || localCount >= remoteCount) {
            const { snapshot: synced, ok } = await persistAssetDbToApi(local);
            applySnapshot(synced);
            if (!ok) {
              console.warn(
                "[AssetDB] Could not sync to PostgreSQL — data is kept in this browser.",
              );
            }
            return synced;
          }
        }

        if (remote) {
          applySnapshot(remote);
          return remote;
        }

        return null;
      } catch (error) {
        console.error("[AssetDB] Init failed:", error);
        return null;
      }
    })();
  }

  return initPromise;
}
