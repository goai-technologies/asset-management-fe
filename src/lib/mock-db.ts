import { getAssetImageStorage } from "@/lib/asset-images";
import { NotificationEvents } from "@/lib/notifications";

export type Category = { id: string; category_name: string };
export type Vendor = { id: string; vendor_name: string };
export type Employee = {
  id: string;
  employee_code: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  location?: string | null;
  status?: "active" | "inactive";
};

export type EmployeeRow = Employee & {
  assigned_asset_count: number;
};
export type Asset = {
  id: string;
  asset_code: string;
  asset_name: string;
  category_id: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  purchase_cost_inr: number | null;
  invoice_number: string | null;
  vendor_id: string | null;
  warranty_expiry: string | null;
  status: string;
  location: string | null;
  remarks: string | null;
  assigned_employee_id: string | null;
  created_at: string;
  isDeleted?: boolean;
  deleted_at?: string | null;
};
export type Assignment = {
  id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  returned_date: string | null;
  status: string;
  notes: string | null;
  reason?: string | null;
  performed_by?: string | null;
  created_at: string;
};

// Joined types
export type AssetRow = Asset & {
  categories: Category | null;
  vendors: Vendor | null;
  employees: Employee | null;
};
export type AssignmentRow = Assignment & {
  assets: Asset | null;
  employees: Employee | null;
};

export const UNASSIGN_REASONS = [
  "Employee Left Company",
  "Sent for Repair",
  "Asset Replacement",
  "Temporary Collection",
  "Other",
] as const;

export const DISPOSAL_REASONS = [
  "End of Life",
  "Damaged Beyond Repair",
  "Obsolete Technology",
  "Sold",
  "Donated",
  "Other",
] as const;

export type UnassignReason = (typeof UNASSIGN_REASONS)[number];

export type Repair = {
  id: string;
  asset_id: string;
  vendor_id: string | null;
  repair_cost: number | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  repair_notes: string | null;
  status: "in_progress" | "completed" | "cancelled";
  unassign_reason: string | null;
  created_at: string;
  completed_at: string | null;
};

export type RepairRow = Repair & {
  assets: Asset | null;
  vendors: Vendor | null;
};

const DB_KEY = "eams_mock_db";

type DBSchema = {
  categories: Category[];
  vendors: Vendor[];
  employees: Employee[];
  assets: Asset[];
  assignments: Assignment[];
  repairs: Repair[];
};

const DEFAULT_DB: DBSchema = {
  categories: [
    { id: "c1", category_name: "Laptops" },
    { id: "c2", category_name: "Monitors" },
    { id: "c3", category_name: "Phones" },
    { id: "c4", category_name: "Peripherals" },
  ],
  vendors: [
    { id: "v1", vendor_name: "Dell Technologies" },
    { id: "v2", vendor_name: "Apple Inc." },
    { id: "v3", vendor_name: "Amazon Business" },
  ],
  employees: [
    { id: "e1", employee_code: "EMP-1001", name: "John Doe", email: "john@example.com", phone: "+1 555-0101", department: "Engineering", designation: "Developer", location: "New York", status: "active" },
    { id: "e2", employee_code: "EMP-1002", name: "Jane Smith", email: "jane@example.com", phone: "+1 555-0102", department: "Design", designation: "UI/UX Designer", location: "San Francisco", status: "active" },
  ],
  assets: [
    {
      id: "a1", asset_code: "LT-2001", asset_name: "MacBook Pro M2", category_id: "c1", brand: "Apple", model: "14-inch 2023",
      serial_number: "C02G123456", purchase_date: "2023-01-15", purchase_cost: null, purchase_cost_inr: 199900, invoice_number: "INV-2023-0015",
      vendor_id: "v2", warranty_expiry: "2026-01-15",
      status: "assigned", location: "New York", remarks: "", assigned_employee_id: "e1", created_at: new Date().toISOString()
    },
    {
      id: "a2", asset_code: "MN-1002", asset_name: "Dell UltraSharp 27", category_id: "c2", brand: "Dell", model: "U2723QE",
      serial_number: "CN-0V00V0", purchase_date: "2022-11-20", purchase_cost: null, purchase_cost_inr: 49800, invoice_number: "INV-2022-1120",
      vendor_id: "v1", warranty_expiry: "2025-11-20",
      status: "available", location: "HQ Storage", remarks: "", assigned_employee_id: null, created_at: new Date().toISOString()
    }
  ],
  assignments: [
    {
      id: "as1", asset_id: "a1", employee_id: "e1", assigned_date: "2023-02-01", returned_date: null,
      status: "assigned", notes: "Initial setup", created_at: new Date().toISOString()
    }
  ],
  repairs: [],
};

function getDb(): DBSchema {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
    return DEFAULT_DB;
  }
  const parsed = JSON.parse(data) as DBSchema;
  let needsSave = false;
  if (!parsed.repairs) {
    parsed.repairs = [];
    needsSave = true;
  }
  parsed.employees = parsed.employees.map((e, i) => {
    let next = e;
    if (!e.employee_code) {
      needsSave = true;
      next = { ...next, employee_code: `EMP-${1001 + i}` };
    }
    if (!next.status) {
      needsSave = true;
      next = { ...next, status: "active" as const };
    }
    return next;
  });
  if (needsSave) saveDb(parsed);
  return parsed;
}

function saveDb(db: DBSchema) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("eams:mock-db-changed"));
  }
}

// Generate unique ID
export const genId = () => Math.random().toString(36).substring(2, 9);
export const genAssetCode = (cat: string) => `${cat.substring(0,2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
export const genEmployeeCode = () => `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

function isActiveAsset(asset: Asset): boolean {
  return !asset.isDeleted;
}

function joinAssetRow(db: DBSchema, a: Asset): AssetRow {
  return {
    ...a,
    isDeleted: a.isDeleted ?? false,
    categories: db.categories.find(c => c.id === a.category_id) || null,
    vendors: db.vendors.find(v => v.id === a.vendor_id) || null,
    employees: db.employees.find(e => e.id === a.assigned_employee_id) || null,
  };
}

function countAssignedAssets(db: DBSchema, employeeId: string): number {
  return db.assets.filter((a) => isActiveAsset(a) && a.assigned_employee_id === employeeId).length;
}

function releaseActiveAssignment(
  db: DBSchema,
  asset: Asset,
  options: { reason: string; remarks?: string; performedBy?: string },
) {
  if (!asset.assigned_employee_id) return;

  const employee_id = asset.assigned_employee_id;
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  const activeAssignment = db.assignments.find(
    (a) => a.asset_id === asset.id && a.status === "assigned" && !a.returned_date,
  );
  if (activeAssignment) {
    activeAssignment.returned_date = today;
    activeAssignment.status = "returned";
  }

  db.assignments.push({
    id: genId(),
    asset_id: asset.id,
    employee_id,
    assigned_date: now,
    returned_date: null,
    status: "unassigned",
    notes: options.remarks?.trim() || null,
    reason: options.reason,
    performed_by: options.performedBy ?? "System",
    created_at: now,
  });

  asset.assigned_employee_id = null;
}

function joinEmployeeRow(db: DBSchema, employee: Employee): EmployeeRow {
  return {
    ...employee,
    status: employee.status ?? "active",
    assigned_asset_count: countAssignedAssets(db, employee.id),
  };
}

export const MockDB = {
  getCategories: () => getDb().categories,
  getVendors: () => getDb().vendors,
  getEmployees: () => getDb().employees,

  getEmployeeRows: (): EmployeeRow[] => {
    const db = getDb();
    return db.employees.map((e) => joinEmployeeRow(db, e));
  },

  getEmployeeById: (id: string): EmployeeRow | null => {
    const db = getDb();
    const employee = db.employees.find((e) => e.id === id);
    return employee ? joinEmployeeRow(db, employee) : null;
  },

  getEmployeeAssignedAssets: (employee_id: string): AssetRow[] => {
    const db = getDb();
    return db.assets
      .filter((a) => isActiveAsset(a) && a.assigned_employee_id === employee_id)
      .map((a) => joinAssetRow(db, a));
  },

  getEmployeeAssignments: (employee_id: string): AssignmentRow[] => {
    const db = getDb();
    const activeAssetIds = new Set(db.assets.filter(isActiveAsset).map((a) => a.id));
    return db.assignments
      .filter((a) => a.employee_id === employee_id && activeAssetIds.has(a.asset_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((as) => ({
        ...as,
        assets: db.assets.find((a) => a.id === as.asset_id) || null,
        employees: db.employees.find((e) => e.id === as.employee_id) || null,
      }));
  },

  getEmployeeRepairHistory: (employee_id: string): RepairRow[] => {
    const db = getDb();
    const assetIds = new Set(
      db.assignments.filter((a) => a.employee_id === employee_id).map((a) => a.asset_id),
    );
    db.assets
      .filter((a) => a.assigned_employee_id === employee_id)
      .forEach((a) => assetIds.add(a.id));

    return db.repairs
      .filter((r) => assetIds.has(r.asset_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((r) => ({
        ...r,
        assets: db.assets.find((a) => a.id === r.asset_id) || null,
        vendors: db.vendors.find((v) => v.id === r.vendor_id) || null,
      }));
  },

  getEmployeeAssignedAssetCount: (employee_id: string): number => {
    return countAssignedAssets(getDb(), employee_id);
  },
  
  getAssets: (options?: { includeDeleted?: boolean }): AssetRow[] => {
    const db = getDb();
    return db.assets
      .filter((a) => (options?.includeDeleted ? a.isDeleted : isActiveAsset(a)))
      .map((a) => joinAssetRow(db, a));
  },

  getArchivedAssets: (): AssetRow[] => {
    const db = getDb();
    return db.assets
      .filter((a) => a.isDeleted === true)
      .map((a) => joinAssetRow(db, a));
  },

  getRecentAssignments: (limit: number = 6): AssignmentRow[] => {
    const db = getDb();
    const activeAssetIds = new Set(db.assets.filter(isActiveAsset).map((a) => a.id));
    return [...db.assignments]
      .filter((a) => activeAssetIds.has(a.asset_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(as => ({
        ...as,
        assets: db.assets.find(a => a.id === as.asset_id) || null,
        employees: db.employees.find(e => e.id === as.employee_id) || null,
      }));
  },

  addAsset: (asset: Omit<Asset, "id" | "created_at" | "asset_code">) => {
    const db = getDb();
    const cat = db.categories.find(c => c.id === asset.category_id)?.category_name || "AS";
    const newAsset: Asset = {
      ...asset,
      id: genId(),
      asset_code: genAssetCode(cat),
      created_at: new Date().toISOString(),
      isDeleted: false,
      deleted_at: null,
    };
    db.assets.push(newAsset);
    saveDb(db);
    NotificationEvents.assetAdded({ id: newAsset.id, asset_name: newAsset.asset_name });
    return newAsset;
  },

  updateAsset: (id: string, updates: Partial<Asset>) => {
    const db = getDb();
    const idx = db.assets.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.assets[idx] = { ...db.assets[idx], ...updates };
      saveDb(db);
      const updated = db.assets[idx];
      NotificationEvents.assetUpdated({ id: updated.id, asset_name: updated.asset_name });
    }
  },

  softDeleteAsset: (id: string) => {
    const db = getDb();
    const asset = db.assets.find((a) => a.id === id);
    if (!asset) throw new Error("Asset not found");
    asset.isDeleted = true;
    asset.deleted_at = new Date().toISOString();
    saveDb(db);
    NotificationEvents.assetDeleted({ id: asset.id, asset_name: asset.asset_name });
  },

  restoreAsset: (id: string) => {
    const db = getDb();
    const asset = db.assets.find((a) => a.id === id);
    if (!asset) throw new Error("Asset not found");
    asset.isDeleted = false;
    asset.deleted_at = null;
    saveDb(db);
  },

  permanentlyDeleteAsset: (id: string) => {
    const db = getDb();
    const asset = db.assets.find((a) => a.id === id);
    db.assets = db.assets.filter(a => a.id !== id);
    db.assignments = db.assignments.filter(a => a.asset_id !== id);
    db.repairs = db.repairs.filter(r => r.asset_id !== id);
    getAssetImageStorage().deleteImagesForAsset(id);
    saveDb(db);
    if (asset) {
      NotificationEvents.assetDeleted({ id: asset.id, asset_name: asset.asset_name });
    }
  },

  /** @deprecated Use softDeleteAsset or permanentlyDeleteAsset */
  deleteAsset: (id: string) => {
    MockDB.softDeleteAsset(id);
  },

  addEmployee: (employee: Omit<Employee, "id">) => {
    const db = getDb();
    const newEmp: Employee = {
      ...employee,
      id: genId(),
      employee_code: employee.employee_code || genEmployeeCode(),
      status: employee.status ?? "active",
    };
    db.employees.push(newEmp);
    saveDb(db);
    NotificationEvents.employeeAdded({ id: newEmp.id, name: newEmp.name });
    return newEmp;
  },

  updateEmployee: (id: string, updates: Partial<Omit<Employee, "id">>) => {
    const db = getDb();
    const idx = db.employees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Employee not found");
    db.employees[idx] = { ...db.employees[idx], ...updates };
    saveDb(db);
    return db.employees[idx];
  },

  deleteEmployee: (id: string) => {
    const db = getDb();
    const employee = db.employees.find((e) => e.id === id);
    if (!employee) throw new Error("Employee not found");

    const assignedCount = countAssignedAssets(db, id);
    if (assignedCount > 0) {
      const error = new Error("ASSIGNED_ASSETS") as Error & { assignedCount: number };
      error.assignedCount = assignedCount;
      throw error;
    }

    db.employees = db.employees.filter((e) => e.id !== id);
    saveDb(db);
    NotificationEvents.employeeDeleted({ id: employee.id, name: employee.name });
  },

  assignAsset: (asset_id: string, employee_id: string, assigned_date: string, expected_return: string | null, notes: string | null) => {
    const db = getDb();
    const asset = db.assets.find(a => a.id === asset_id);
    if (!asset) throw new Error("Asset not found");
    if (asset.status === "disposed" || asset.status === "inactive") {
      throw new Error("This asset cannot be assigned");
    }
    if (asset.assigned_employee_id) {
      throw new Error("Asset is already assigned");
    }
    // Update asset
    asset.status = "assigned";
    asset.assigned_employee_id = employee_id;
    // Add assignment record
    db.assignments.push({
      id: genId(),
      asset_id,
      employee_id,
      assigned_date,
      returned_date: null,
      status: "assigned",
      notes,
      created_at: new Date().toISOString()
    });
    saveDb(db);
    const employee = db.employees.find((e) => e.id === employee_id);
    if (asset && employee) {
      NotificationEvents.assetAssigned(
        { id: asset.id, asset_name: asset.asset_name },
        { id: employee.id, name: employee.name },
      );
    }
  },

  unassignAsset: (
    asset_id: string,
    options: { reason: string; remarks?: string; performedBy?: string },
  ) => {
    const db = getDb();
    const asset = db.assets.find(a => a.id === asset_id);
    if (!asset?.assigned_employee_id) {
      throw new Error("Asset has no owner");
    }

    const employee_id = asset.assigned_employee_id;
    const employee = db.employees.find(e => e.id === employee_id);
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const sentForRepair = options.reason === "Sent for Repair";

    const activeAssignment = db.assignments.find(
      a => a.asset_id === asset_id && a.status === "assigned" && !a.returned_date
    );
    if (activeAssignment) {
      activeAssignment.returned_date = today;
      activeAssignment.status = "returned";
    }

    db.assignments.push({
      id: genId(),
      asset_id,
      employee_id,
      assigned_date: now,
      returned_date: null,
      status: "unassigned",
      notes: options.remarks?.trim() || null,
      reason: options.reason,
      performed_by: options.performedBy ?? "System",
      created_at: now,
    });

    asset.assigned_employee_id = null;
    asset.status = sentForRepair ? "repair" : "available";

    if (sentForRepair) {
      db.repairs.push({
        id: genId(),
        asset_id,
        vendor_id: null,
        repair_cost: null,
        expected_return_date: null,
        actual_return_date: null,
        repair_notes: options.remarks?.trim() || null,
        status: "in_progress",
        unassign_reason: options.reason,
        created_at: now,
        completed_at: null,
      });
    }

    saveDb(db);

    if (asset && employee) {
      if (sentForRepair) {
        NotificationEvents.assetSentForRepair({ id: asset.id, asset_name: asset.asset_name });
      } else {
        NotificationEvents.assetUnassigned(
          { id: asset.id, asset_name: asset.asset_name },
          { id: employee.id, name: employee.name },
        );
      }
    }

    return { employeeName: employee?.name ?? "Unknown", sentForRepair };
  },

  disposeAsset: (
    asset_id: string,
    options: { reason: string; disposal_date: string; remarks?: string; performedBy?: string },
  ) => {
    const db = getDb();
    const asset = db.assets.find((a) => a.id === asset_id);
    if (!asset) throw new Error("Asset not found");
    if (asset.status === "disposed") throw new Error("Asset is already disposed");
    if (asset.assigned_employee_id) {
      throw new Error("Unassign the asset before disposing");
    }

    const now = new Date().toISOString();
    asset.status = "disposed";

    db.assignments.push({
      id: genId(),
      asset_id,
      employee_id: "",
      assigned_date: options.disposal_date,
      returned_date: null,
      status: "disposed",
      notes: options.remarks?.trim() || null,
      reason: options.reason,
      performed_by: options.performedBy ?? "System",
      created_at: now,
    });

    saveDb(db);
    return asset;
  },

  deactivateAsset: (
    asset_id: string,
    options?: { remarks?: string; performedBy?: string },
  ) => {
    const db = getDb();
    const asset = db.assets.find((a) => a.id === asset_id);
    if (!asset) throw new Error("Asset not found");
    if (asset.status === "disposed") throw new Error("Disposed assets cannot be deactivated");
    if (asset.status === "inactive") throw new Error("Asset is already inactive");

    const now = new Date().toISOString();

    if (asset.assigned_employee_id) {
      releaseActiveAssignment(db, asset, {
        reason: "Asset Deactivated",
        remarks: options?.remarks,
        performedBy: options?.performedBy,
      });
    }

    asset.status = "inactive";

    db.assignments.push({
      id: genId(),
      asset_id,
      employee_id: "",
      assigned_date: now.split("T")[0],
      returned_date: null,
      status: "inactive",
      notes: options?.remarks?.trim() || null,
      reason: "Asset Deactivated",
      performed_by: options?.performedBy ?? "System",
      created_at: now,
    });

    saveDb(db);
    return asset;
  },

  getAssetRepairs: (asset_id: string): RepairRow[] => {
    const db = getDb();
    return db.repairs
      .filter(r => r.asset_id === asset_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(r => ({
        ...r,
        assets: db.assets.find(a => a.id === r.asset_id) || null,
        vendors: db.vendors.find(v => v.id === r.vendor_id) || null,
      }));
  },

  updateRepair: (repair_id: string, updates: Partial<Repair>) => {
    const db = getDb();
    const repair = db.repairs.find(r => r.id === repair_id);
    if (!repair) throw new Error("Repair not found");
    Object.assign(repair, updates);
    saveDb(db);
    return repair;
  },

  completeRepair: (repair_id: string, updates?: Partial<Pick<Repair, "vendor_id" | "repair_cost" | "expected_return_date" | "actual_return_date" | "repair_notes">>) => {
    const db = getDb();
    const repair = db.repairs.find(r => r.id === repair_id);
    if (!repair) throw new Error("Repair not found");

    const now = new Date().toISOString();
    const today = now.split("T")[0];
    Object.assign(repair, updates, {
      status: "completed",
      actual_return_date: updates?.actual_return_date ?? today,
      completed_at: now,
    });

    const asset = db.assets.find(a => a.id === repair.asset_id);
    if (asset) {
      asset.status = "available";
    }

    saveDb(db);
    if (asset) {
      NotificationEvents.repairCompleted({ id: asset.id, asset_name: asset.asset_name });
    }
    return repair;
  },

  getAssetAssignments: (asset_id: string): AssignmentRow[] => {
    const db = getDb();
    return db.assignments
      .filter(a => a.asset_id === asset_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(as => ({
        ...as,
        assets: db.assets.find(a => a.id === as.asset_id) || null,
        employees: db.employees.find(e => e.id === as.employee_id) || null,
      }));
  },
  
  getDashboardStats: () => {
    const db = getDb();
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    db.assets.filter(isActiveAsset).forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      const catName = db.categories.find(c => c.id === a.category_id)?.category_name || "Uncategorized";
      byCategory[catName] = (byCategory[catName] || 0) + 1;
    });

    const activeAssetIds = new Set(db.assets.filter(isActiveAsset).map((a) => a.id));
    const openRepairTickets = db.repairs.filter(
      (r) => r.status === "in_progress" && activeAssetIds.has(r.asset_id),
    ).length;

    return {
      totalAssets: db.assets.filter(isActiveAsset).length,
      totalEmployees: db.employees.length,
      byStatus,
      byCategory,
      openRepairTickets,
    };
  },

  getOpenRepairs: (): RepairRow[] => {
    const db = getDb();
    const activeAssetIds = new Set(db.assets.filter(isActiveAsset).map((a) => a.id));
    return db.repairs
      .filter((r) => r.status === "in_progress" && activeAssetIds.has(r.asset_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((r) => ({
        ...r,
        assets: db.assets.find((a) => a.id === r.asset_id) || null,
        vendors: db.vendors.find((v) => v.id === r.vendor_id) || null,
      }));
  },
};
