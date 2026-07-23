import { getPool } from "./db";

export type AssetDbSnapshot = {
  categories: Record<string, unknown>[];
  vendors: Record<string, unknown>[];
  employees: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  repairs: Record<string, unknown>[];
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function mapCategory(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    category_name: String(row.category_name),
    description: (row.description as string | null) ?? null,
    status: (row.status as string) ?? "active",
    icon: (row.icon as string | null) ?? null,
  };
}

function mapVendor(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    vendor_code: String(row.vendor_code ?? `VND-${String(row.id).slice(0, 8)}`),
    vendor_name: String(row.vendor_name),
    contact_person: (row.contact_person as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    office_address:
      (row.office_address as string | null) ?? (row.address as string | null) ?? null,
    vendor_type: (row.vendor_type as string | null) ?? "General Supplier",
    status: (row.status as string) ?? "active",
    website: (row.website as string | null) ?? null,
    gst_number: (row.gst_number as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  };
}

function mapEmployee(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    employee_code: String(row.employee_code),
    name: String(row.name),
    email: String(row.email),
    phone: (row.phone as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    designation: (row.designation as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    status: (row.status as string) ?? "active",
  };
}

function mapAsset(row: Record<string, unknown>) {
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
    assigned_employee_id: row.assigned_employee_id ? String(row.assigned_employee_id) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    isDeleted: Boolean(row.is_deleted),
    deleted_at: (row.deleted_at as string | null) ?? null,
  };
}

function mapAssignment(row: Record<string, unknown>) {
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

function mapRepair(row: Record<string, unknown>) {
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
      (row.repair_notes as string | null) ?? (row.notes as string | null) ?? null,
    status: String(row.status),
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

  return {
    categories: snapshot.categories.map((c) => ({ ...c, id: remap(String(c.id)) })),
    vendors: snapshot.vendors.map((v) => ({ ...v, id: remap(String(v.id)) })),
    employees: snapshot.employees.map((e) => ({ ...e, id: remap(String(e.id)) })),
    assets: snapshot.assets.map((a) => ({
      ...a,
      id: remap(String(a.id)),
      category_id: a.category_id ? remap(String(a.category_id)) : null,
      vendor_id: a.vendor_id ? remap(String(a.vendor_id)) : null,
      assigned_employee_id: a.assigned_employee_id
        ? remap(String(a.assigned_employee_id))
        : null,
    })),
    assignments: snapshot.assignments.map((a) => ({
      ...a,
      id: remap(String(a.id)),
      asset_id: remap(String(a.asset_id)),
      employee_id: a.employee_id ? remap(String(a.employee_id)) : "",
    })),
    repairs: snapshot.repairs.map((r) => ({
      ...r,
      id: remap(String(r.id)),
      asset_id: remap(String(r.asset_id)),
      vendor_id: r.vendor_id ? remap(String(r.vendor_id)) : null,
    })),
  };
}

export async function loadAssetDb(): Promise<AssetDbSnapshot | null> {
  const pool = getPool();
  const [categories, vendors, employees, assets, assignments, repairs] = await Promise.all([
    pool.query("SELECT * FROM public.categories ORDER BY category_name"),
    pool.query("SELECT * FROM public.vendors ORDER BY vendor_name"),
    pool.query("SELECT * FROM public.employees ORDER BY employee_code"),
    pool.query("SELECT * FROM public.assets ORDER BY created_at"),
    pool.query("SELECT * FROM public.assignments ORDER BY created_at"),
    pool.query("SELECT * FROM public.repairs ORDER BY created_at"),
  ]);

  const hasSeedData =
    categories.rows.length > 0 || assets.rows.length > 0 || employees.rows.length > 0;

  if (!hasSeedData) return null;

  return {
    categories: categories.rows.map((row) => mapCategory(row)),
    vendors: vendors.rows.map((row) => mapVendor(row)),
    employees: employees.rows.map((row) => mapEmployee(row)),
    assets: assets.rows.map((row) => mapAsset(row)),
    assignments: assignments.rows.map((row) => mapAssignment(row)),
    repairs: repairs.rows.map((row) => mapRepair(row)),
  };
}

async function upsertRows(
  client: import("pg").PoolClient,
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
) {
  if (rows.length === 0) return;

  const colList = columns.map((c) => `"${c}"`).join(", ");
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const updates = columns
    .filter((c) => c !== "id")
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(", ");

  for (const row of rows) {
    const values = columns.map((c) => row[c] ?? null);
    await client.query(
      `INSERT INTO public."${table}" (${colList}) VALUES (${placeholders})
       ON CONFLICT (id) DO UPDATE SET ${updates}`,
      values,
    );
  }
}

export async function persistAssetDb(
  snapshot: AssetDbSnapshot,
): Promise<{ snapshot: AssetDbSnapshot; ok: boolean }> {
  const normalized = normalizeSnapshotIds(snapshot);
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const categoryRows = normalized.categories.map((c) => ({
      id: ensureUuid(String(c.id)),
      category_name: c.category_name,
      description: c.description ?? null,
      status: c.status ?? "active",
      icon: c.icon ?? null,
    }));

    const vendorRows = normalized.vendors.map((v) => ({
      id: ensureUuid(String(v.id)),
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
      id: ensureUuid(String(e.id)),
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
      id: ensureUuid(String(a.id)),
      asset_code: a.asset_code,
      asset_name: a.asset_name,
      category_id: a.category_id ? ensureUuid(String(a.category_id)) : null,
      brand: a.brand ?? null,
      model: a.model ?? null,
      serial_number: a.serial_number ?? null,
      purchase_date: toDateOnly(a.purchase_date as string | null),
      purchase_cost: a.purchase_cost ?? a.purchase_cost_inr ?? null,
      purchase_cost_inr: a.purchase_cost_inr ?? a.purchase_cost ?? null,
      invoice_number: a.invoice_number ?? null,
      vendor_id: a.vendor_id ? ensureUuid(String(a.vendor_id)) : null,
      warranty_expiry: toDateOnly(a.warranty_expiry as string | null),
      status: toDbAssetStatus(String(a.status)),
      assigned_employee_id: a.assigned_employee_id
        ? ensureUuid(String(a.assigned_employee_id))
        : null,
      location: a.location ?? null,
      remarks: a.remarks ?? null,
      is_deleted: a.isDeleted ?? false,
      deleted_at: a.deleted_at ?? null,
      created_at: a.created_at,
    }));

    const assignmentRows = normalized.assignments.map((a) => ({
      id: ensureUuid(String(a.id)),
      asset_id: ensureUuid(String(a.asset_id)),
      employee_id: a.employee_id ? ensureUuid(String(a.employee_id)) : null,
      assigned_date: toDateOnly(String(a.assigned_date)) ?? a.assigned_date,
      returned_date: toDateOnly(a.returned_date as string | null),
      status: toDbAssignmentStatus(String(a.status)),
      notes: a.notes ?? null,
      reason: a.reason ?? null,
      performed_by: a.performed_by ?? null,
      created_at: a.created_at,
    }));

    const repairRows = normalized.repairs.map((r) => ({
      id: ensureUuid(String(r.id)),
      asset_id: ensureUuid(String(r.asset_id)),
      vendor_id: r.vendor_id ? ensureUuid(String(r.vendor_id)) : null,
      issue: r.unassign_reason ?? "Repair",
      repair_cost: r.repair_cost ?? null,
      expected_return_date: toDateOnly(r.expected_return_date as string | null),
      actual_return_date: toDateOnly(r.actual_return_date as string | null),
      repair_notes: r.repair_notes ?? null,
      unassign_reason: r.unassign_reason ?? null,
      status: r.status,
      repair_date:
        toDateOnly(r.created_at as string) ?? new Date().toISOString().split("T")[0],
      completed_at: r.completed_at ?? null,
      created_at: r.created_at,
    }));

    await upsertRows(client, "categories", [
      "id",
      "category_name",
      "description",
      "status",
      "icon",
    ], categoryRows);
    await upsertRows(client, "vendors", [
      "id",
      "vendor_code",
      "vendor_name",
      "contact_person",
      "email",
      "phone",
      "office_address",
      "vendor_type",
      "status",
      "website",
      "gst_number",
      "notes",
    ], vendorRows);
    await upsertRows(client, "employees", [
      "id",
      "employee_code",
      "name",
      "email",
      "phone",
      "department",
      "designation",
      "location",
      "status",
    ], employeeRows);
    await upsertRows(client, "assets", [
      "id",
      "asset_code",
      "asset_name",
      "category_id",
      "brand",
      "model",
      "serial_number",
      "purchase_date",
      "purchase_cost",
      "purchase_cost_inr",
      "invoice_number",
      "vendor_id",
      "warranty_expiry",
      "status",
      "assigned_employee_id",
      "location",
      "remarks",
      "is_deleted",
      "deleted_at",
      "created_at",
    ], assetRows);
    await upsertRows(client, "assignments", [
      "id",
      "asset_id",
      "employee_id",
      "assigned_date",
      "returned_date",
      "status",
      "notes",
      "reason",
      "performed_by",
      "created_at",
    ], assignmentRows);
    await upsertRows(client, "repairs", [
      "id",
      "asset_id",
      "vendor_id",
      "issue",
      "repair_cost",
      "expected_return_date",
      "actual_return_date",
      "repair_notes",
      "unassign_reason",
      "status",
      "repair_date",
      "completed_at",
      "created_at",
    ], repairRows);

    await client.query("COMMIT");
    return { snapshot: normalized, ok: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[AssetDB] Persist failed:", error);
    return { snapshot, ok: false };
  } finally {
    client.release();
  }
}
