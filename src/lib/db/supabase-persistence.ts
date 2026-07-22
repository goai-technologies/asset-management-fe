import { supabase } from "@/integrations/supabase/client";
import type {
  Asset,
  Assignment,
  Category,
  Employee,
  Repair,
  Vendor,
} from "@/lib/mock-db";

export type AssetDbSnapshot = {
  categories: Category[];
  vendors: Vendor[];
  employees: Employee[];
  assets: Asset[];
  assignments: Assignment[];
  repairs: Repair[];
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupabasePersistenceEnabled(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function ensureUuid(value: string): string {
  return isUuid(value) ? value : crypto.randomUUID();
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.includes("T") ? value.split("T")[0] : value;
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    category_name: String(row.category_name),
    description: (row.description as string | null) ?? null,
    status: (row.status as Category["status"]) ?? "active",
    icon: (row.icon as string | null) ?? null,
  };
}

function mapVendor(row: Record<string, unknown>): Vendor {
  return {
    id: String(row.id),
    vendor_code: String(row.vendor_code ?? `VND-${String(row.id).slice(0, 8)}`),
    vendor_name: String(row.vendor_name),
    contact_person: (row.contact_person as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    office_address:
      (row.office_address as string | null) ??
      (row.address as string | null) ??
      null,
    vendor_type: (row.vendor_type as string | null) ?? "General Supplier",
    status: (row.status as Vendor["status"]) ?? "active",
    website: (row.website as string | null) ?? null,
    gst_number: (row.gst_number as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  };
}

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: String(row.id),
    employee_code: String(row.employee_code),
    name: String(row.name),
    email: String(row.email),
    phone: (row.phone as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    designation: (row.designation as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    status: (row.status as Employee["status"]) ?? "active",
  };
}

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: String(row.id),
    asset_code: String(row.asset_code),
    asset_name: String(row.asset_name),
    category_id: row.category_id ? String(row.category_id) : null,
    brand: (row.brand as string | null) ?? null,
    model: (row.model as string | null) ?? null,
    serial_number: (row.serial_number as string | null) ?? null,
    purchase_date: toDateOnly(row.purchase_date as string | null),
    purchase_cost: row.purchase_cost != null ? Number(row.purchase_cost) : null,
    purchase_cost_inr:
      row.purchase_cost_inr != null
        ? Number(row.purchase_cost_inr)
        : row.purchase_cost != null
          ? Number(row.purchase_cost)
          : null,
    invoice_number: (row.invoice_number as string | null) ?? null,
    vendor_id: row.vendor_id ? String(row.vendor_id) : null,
    warranty_expiry: toDateOnly(row.warranty_expiry as string | null),
    status: String(row.status),
    location: (row.location as string | null) ?? null,
    remarks: (row.remarks as string | null) ?? null,
    assigned_employee_id: row.assigned_employee_id
      ? String(row.assigned_employee_id)
      : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    isDeleted: Boolean(row.is_deleted),
    deleted_at: (row.deleted_at as string | null) ?? null,
  };
}

function mapAssignment(row: Record<string, unknown>): Assignment {
  return {
    id: String(row.id),
    asset_id: String(row.asset_id),
    employee_id: row.employee_id ? String(row.employee_id) : "",
    assigned_date: toDateOnly(String(row.assigned_date)) ?? String(row.assigned_date),
    returned_date: toDateOnly(row.returned_date as string | null),
    status: String(row.status),
    notes: (row.notes as string | null) ?? null,
    reason: (row.reason as string | null) ?? null,
    performed_by: (row.performed_by as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapRepair(row: Record<string, unknown>): Repair {
  return {
    id: String(row.id),
    asset_id: String(row.asset_id),
    vendor_id: row.vendor_id ? String(row.vendor_id) : null,
    repair_cost: row.repair_cost != null ? Number(row.repair_cost) : null,
    expected_return_date: toDateOnly(row.expected_return_date as string | null),
    actual_return_date: toDateOnly(
      (row.actual_return_date as string | null) ?? (row.completed_date as string | null),
    ),
    repair_notes:
      (row.repair_notes as string | null) ??
      (row.notes as string | null) ??
      null,
    status: String(row.status) as Repair["status"],
    unassign_reason: (row.unassign_reason as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    completed_at:
      (row.completed_at as string | null) ??
      (row.completed_date ? String(row.completed_date) : null),
  };
}

function toDbAssignmentStatus(status: string): string {
  switch (status) {
    case "assigned":
      return "active";
    case "unassigned":
    case "disposed":
    case "inactive":
      return "returned";
    default:
      return status;
  }
}

function toDbAssetStatus(status: string): string {
  return status === "inactive" ? "retired" : status;
}

function normalizeSnapshotIds(snapshot: AssetDbSnapshot): AssetDbSnapshot {
  const idMap = new Map<string, string>();

  const remap = (id: string) => {
    if (!id) return id;
    if (isUuid(id)) return id;
    if (!idMap.has(id)) idMap.set(id, crypto.randomUUID());
    return idMap.get(id)!;
  };

  const categories = snapshot.categories.map((c) => ({ ...c, id: remap(c.id) }));
  const vendors = snapshot.vendors.map((v) => ({ ...v, id: remap(v.id) }));
  const employees = snapshot.employees.map((e) => ({ ...e, id: remap(e.id) }));
  const assets = snapshot.assets.map((a) => ({
    ...a,
    id: remap(a.id),
    category_id: a.category_id ? remap(a.category_id) : null,
    vendor_id: a.vendor_id ? remap(a.vendor_id) : null,
    assigned_employee_id: a.assigned_employee_id
      ? remap(a.assigned_employee_id)
      : null,
  }));
  const assignments = snapshot.assignments.map((a) => ({
    ...a,
    id: remap(a.id),
    asset_id: remap(a.asset_id),
    employee_id: a.employee_id ? remap(a.employee_id) : "",
  }));
  const repairs = snapshot.repairs.map((r) => ({
    ...r,
    id: remap(r.id),
    asset_id: remap(r.asset_id),
    vendor_id: r.vendor_id ? remap(r.vendor_id) : null,
  }));

  return { categories, vendors, employees, assets, assignments, repairs };
}

export async function loadAssetDbFromSupabase(): Promise<AssetDbSnapshot | null> {
  if (!isSupabasePersistenceEnabled()) return null;

  const [
    categoriesRes,
    vendorsRes,
    employeesRes,
    assetsRes,
    assignmentsRes,
    repairsRes,
  ] = await Promise.all([
    supabase.from("categories").select("*").order("category_name"),
    supabase.from("vendors").select("*").order("vendor_name"),
    supabase.from("employees").select("*").order("employee_code"),
    supabase.from("assets").select("*").order("created_at"),
    supabase.from("assignments").select("*").order("created_at"),
    supabase.from("repairs").select("*").order("created_at"),
  ]);

  const firstError =
    categoriesRes.error ??
    vendorsRes.error ??
    employeesRes.error ??
    assetsRes.error ??
    assignmentsRes.error ??
    repairsRes.error;

  if (firstError) {
    console.warn("[AssetDB] Supabase load failed:", firstError.message);
    return null;
  }

  const hasSeedData =
    (categoriesRes.data?.length ?? 0) > 0 ||
    (assetsRes.data?.length ?? 0) > 0 ||
    (employeesRes.data?.length ?? 0) > 0;

  if (!hasSeedData) return null;

  return {
    categories: (categoriesRes.data ?? []).map((row) => mapCategory(row)),
    vendors: (vendorsRes.data ?? []).map((row) => mapVendor(row)),
    employees: (employeesRes.data ?? []).map((row) => mapEmployee(row)),
    assets: (assetsRes.data ?? []).map((row) => mapAsset(row)),
    assignments: (assignmentsRes.data ?? []).map((row) => mapAssignment(row)),
    repairs: (repairsRes.data ?? []).map((row) => mapRepair(row)),
  };
}

export async function persistAssetDbToSupabase(
  snapshot: AssetDbSnapshot,
): Promise<{ snapshot: AssetDbSnapshot; ok: boolean }> {
  if (!isSupabasePersistenceEnabled()) return { snapshot, ok: false };

  const normalized = normalizeSnapshotIds(snapshot);

  const categoryRows = normalized.categories.map((c) => ({
    id: ensureUuid(c.id),
    category_name: c.category_name,
    description: c.description ?? null,
    status: c.status ?? "active",
    icon: c.icon ?? null,
  }));

  const vendorRows = normalized.vendors.map((v) => ({
    id: ensureUuid(v.id),
    vendor_code: v.vendor_code,
    vendor_name: v.vendor_name,
    contact_person: v.contact_person ?? null,
    email: v.email ?? null,
    phone: v.phone ?? null,
    office_address: v.office_address ?? null,
    vendor_type: v.vendor_type ?? "General Supplier",
    status: v.status ?? "active",
    website: v.website ?? null,
    gst_number: v.gst_number ?? null,
    notes: v.notes ?? null,
  }));

  const employeeRows = normalized.employees.map((e) => ({
    id: ensureUuid(e.id),
    employee_code: e.employee_code,
    name: e.name,
    email: e.email,
    phone: e.phone ?? null,
    department: e.department ?? null,
    designation: e.designation ?? null,
    location: e.location ?? null,
    status: e.status ?? "active",
  }));

  const assetRows = normalized.assets.map((a) => ({
    id: ensureUuid(a.id),
    asset_code: a.asset_code,
    asset_name: a.asset_name,
    category_id: a.category_id ? ensureUuid(a.category_id) : null,
    brand: a.brand ?? null,
    model: a.model ?? null,
    serial_number: a.serial_number ?? null,
    purchase_date: toDateOnly(a.purchase_date),
    purchase_cost: a.purchase_cost ?? a.purchase_cost_inr ?? null,
    purchase_cost_inr: a.purchase_cost_inr ?? a.purchase_cost ?? null,
    invoice_number: a.invoice_number ?? null,
    vendor_id: a.vendor_id ? ensureUuid(a.vendor_id) : null,
    warranty_expiry: toDateOnly(a.warranty_expiry),
    status: toDbAssetStatus(a.status),
    assigned_employee_id: a.assigned_employee_id
      ? ensureUuid(a.assigned_employee_id)
      : null,
    location: a.location ?? null,
    remarks: a.remarks ?? null,
    is_deleted: a.isDeleted ?? false,
    deleted_at: a.deleted_at ?? null,
    created_at: a.created_at,
  }));

  const assignmentRows = normalized.assignments.map((a) => ({
    id: ensureUuid(a.id),
    asset_id: ensureUuid(a.asset_id),
    employee_id: a.employee_id ? ensureUuid(a.employee_id) : null,
    assigned_date: toDateOnly(a.assigned_date) ?? a.assigned_date,
    returned_date: toDateOnly(a.returned_date),
    status: toDbAssignmentStatus(a.status),
    notes: a.notes ?? null,
    reason: a.reason ?? null,
    performed_by: a.performed_by ?? null,
    created_at: a.created_at,
  }));

  const repairRows = normalized.repairs.map((r) => ({
    id: ensureUuid(r.id),
    asset_id: ensureUuid(r.asset_id),
    vendor_id: r.vendor_id ? ensureUuid(r.vendor_id) : null,
    issue: r.unassign_reason ?? "Repair",
    repair_cost: r.repair_cost ?? null,
    expected_return_date: toDateOnly(r.expected_return_date),
    actual_return_date: toDateOnly(r.actual_return_date),
    repair_notes: r.repair_notes ?? null,
    unassign_reason: r.unassign_reason ?? null,
    status: r.status,
    repair_date: toDateOnly(r.created_at) ?? new Date().toISOString().split("T")[0],
    completed_at: r.completed_at ?? null,
    created_at: r.created_at,
  }));

  const upsertOrder = [
    { name: "categories" as const, rows: categoryRows },
    { name: "vendors" as const, rows: vendorRows },
    { name: "employees" as const, rows: employeeRows },
    { name: "assets" as const, rows: assetRows },
    { name: "assignments" as const, rows: assignmentRows },
    { name: "repairs" as const, rows: repairRows },
  ];

  async function upsertTable(
    name: (typeof upsertOrder)[number]["name"],
    rows: Record<string, unknown>[],
    fallbackRows?: Record<string, unknown>[],
  ): Promise<boolean> {
    if (rows.length === 0) return true;

    const { error } = await supabase.from(name).upsert(rows, { onConflict: "id" });
    if (!error) return true;

    if (fallbackRows) {
      const { error: retryError } = await supabase
        .from(name)
        .upsert(fallbackRows, { onConflict: "id" });
      if (!retryError) return true;
      console.error(`[AssetDB] Supabase upsert ${name} failed:`, retryError.message);
      return false;
    }

    console.error(`[AssetDB] Supabase upsert ${name} failed:`, error.message);
    return false;
  }

  const vendorFallback = normalized.vendors.map((v) => ({
    id: ensureUuid(v.id),
    vendor_name: v.vendor_name,
    contact_person: v.contact_person ?? null,
    email: v.email ?? null,
    phone: v.phone ?? null,
    address: v.office_address ?? null,
  }));

  const categoryFallback = normalized.categories.map((c) => ({
    id: ensureUuid(c.id),
    category_name: c.category_name,
  }));

  const employeeFallback = normalized.employees.map((e) => ({
    id: ensureUuid(e.id),
    employee_code: e.employee_code,
    name: e.name,
    email: e.email,
    department: e.department ?? null,
    designation: e.designation ?? null,
    location: e.location ?? null,
  }));

  const assetFallback = normalized.assets.map((a) => ({
    id: ensureUuid(a.id),
    asset_code: a.asset_code,
    asset_name: a.asset_name,
    category_id: a.category_id ? ensureUuid(a.category_id) : null,
    brand: a.brand ?? null,
    model: a.model ?? null,
    serial_number: a.serial_number ?? null,
    purchase_date: toDateOnly(a.purchase_date),
    purchase_cost: a.purchase_cost ?? a.purchase_cost_inr ?? null,
    invoice_number: a.invoice_number ?? null,
    vendor_id: a.vendor_id ? ensureUuid(a.vendor_id) : null,
    warranty_expiry: toDateOnly(a.warranty_expiry),
    status: toDbAssetStatus(a.status),
    assigned_employee_id: a.assigned_employee_id
      ? ensureUuid(a.assigned_employee_id)
      : null,
    location: a.location ?? null,
    remarks: a.remarks ?? null,
    created_at: a.created_at,
  }));

  const assignmentFallback = normalized.assignments.map((a) => ({
    id: ensureUuid(a.id),
    asset_id: ensureUuid(a.asset_id),
    employee_id: a.employee_id ? ensureUuid(a.employee_id) : null,
    assigned_date: toDateOnly(a.assigned_date) ?? a.assigned_date,
    returned_date: toDateOnly(a.returned_date),
    status: toDbAssignmentStatus(a.status),
    notes: a.notes ?? null,
    created_at: a.created_at,
  }));

  const repairFallback = normalized.repairs.map((r) => ({
    id: ensureUuid(r.id),
    asset_id: ensureUuid(r.asset_id),
    vendor_id: r.vendor_id ? ensureUuid(r.vendor_id) : null,
    issue: r.unassign_reason ?? "Repair",
    repair_cost: r.repair_cost ?? null,
    status: r.status,
    repair_date: toDateOnly(r.created_at) ?? new Date().toISOString().split("T")[0],
    notes: r.repair_notes ?? null,
    created_at: r.created_at,
  }));

  const fallbacks: Record<string, Record<string, unknown>[]> = {
    categories: categoryFallback,
    vendors: vendorFallback,
    employees: employeeFallback,
    assets: assetFallback,
    assignments: assignmentFallback,
    repairs: repairFallback,
  };

  for (const table of upsertOrder) {
    const ok = await upsertTable(table.name, table.rows, fallbacks[table.name]);
    if (!ok) return { snapshot, ok: false };
  }

  return { snapshot: normalized, ok: true };
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistInFlight: Promise<void> | null = null;

export function scheduleAssetDbPersist(snapshot: AssetDbSnapshot) {
  if (!isSupabasePersistenceEnabled()) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistInFlight = persistAssetDbToSupabase(snapshot).then(({ snapshot: migrated, ok }) => {
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
          void persistAssetDbToSupabase(snapshot);
        } catch {
          // ignore malformed cache
        }
      }
    }
  });
}

/** Wait for any pending Supabase write before navigating away or reloading. */
export function flushAssetDbPersist(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const runFlush = (snapshot: AssetDbSnapshot) => {
    persistInFlight = persistAssetDbToSupabase(snapshot).then(({ snapshot: migrated, ok }) => {
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

export function initAssetDbFromSupabase(
  getLocalSnapshot: () => AssetDbSnapshot,
  applySnapshot: (snapshot: AssetDbSnapshot) => void,
): Promise<AssetDbSnapshot | null> {
  if (!isSupabasePersistenceEnabled()) return Promise.resolve(null);

  if (!initPromise) {
    initPromise = (async () => {
      try {
        if (typeof window === "undefined") return null;

        const local = getLocalSnapshot();
        const remote = await loadAssetDbFromSupabase();

        // Prefer local data when the user has been working in this browser.
        if (hasUserData(local)) {
          const localCount = countRecords(local);
          const remoteCount = remote ? countRecords(remote) : 0;

          if (!remote || localCount >= remoteCount) {
            const { snapshot: synced, ok } = await persistAssetDbToSupabase(local);
            applySnapshot(synced);
            if (!ok) {
              console.warn(
                "[AssetDB] Could not sync to Supabase — data is kept in this browser. " +
                  "Ensure you are logged in as Admin/IT and migrations are applied.",
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
