import type {
  Asset,
  AssetRow,
  Assignment,
  AssignmentRow,
  Category,
  CategoryRow,
  DashboardData,
  Employee,
  EmployeeRow,
  RepairRow,
  Vendor,
  VendorRow,
} from "@/lib/types/asset-management";
import { resolveUploadUrl } from "./axios";

type ApiCategory = {
  id: string;
  categoryCode: string;
  name: string;
  description: string | null;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
};

type ApiVendor = {
  id: string;
  vendorCode: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
};

type ApiEmployee = {
  id: string;
  employeeCode: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  location: string;
  status: string;
  assignedAssets: number;
  createdAt: string;
  updatedAt: string;
};

type ApiAssetSummary = {
  id: string;
  assetId: string;
  name: string;
  brand: string | null;
  serialNumber: string | null;
  category: { id: string; name: string } | null;
  vendor: { id: string; name: string; vendorCode: string } | null;
  purchaseCost: number | null;
  invoiceNumber: string | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  status: string;
  assignedEmployee: { id: string; name: string; employeeId: string } | null;
  thumbnailImage: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiAssetDetail = ApiAssetSummary & {
  description: string | null;
  specifications: string | null;
  notes: string | null;
  images: {
    id: string;
    fileName: string;
    fileSize: number;
    imageUrl: string;
    sortOrder: number;
    uploadDate: string;
  }[];
};

type ApiAssignment = {
  id: string;
  asset: { id: string; assetCode: string; category: string | null };
  employee: { id: string; name: string; employeeId: string } | null;
  assignedDate: string;
  expectedReturnDate: string | null;
  returnedDate: string | null;
  assignedBy: string | null;
  returnedBy: string | null;
  status: string;
  remarks: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiDashboardSummary = {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  underRepair: number;
  inactiveAssets: number;
  employees: number;
  vendors: number;
  categories: number;
};

type ApiAssetsByCategory = { category: string; count: number };
type ApiAssetsByStatus = { status: string; count: number };
type ApiWarrantyExpiring = {
  assetId: string;
  assetCode: string;
  assetName: string;
  warrantyExpiry: string;
  daysUntilExpiry: number;
};

const CATEGORY_CODE_PATTERN = /^[A-Z][A-Z0-9]{2,9}$/;

export function normalizeAssetStatus(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized === "under_repair") return "repair";
  if (normalized === "retired") return "inactive";
  return normalized;
}

export function normalizeAssignmentStatus(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") return "assigned";
  return normalized;
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.includes("T") ? value.split("T")[0] : value;
}

export function mapCategory(api: ApiCategory): Category {
  const icon = CATEGORY_CODE_PATTERN.test(api.categoryCode) ? api.categoryCode : null;
  return {
    id: api.id,
    category_name: api.name,
    description: api.description,
    status: "active",
    icon,
  };
}

export function mapCategoryRow(api: ApiCategory): CategoryRow {
  return { ...mapCategory(api), asset_count: api.assetCount };
}

export function mapVendor(api: ApiVendor): Vendor {
  return {
    id: api.id,
    vendor_code: api.vendorCode,
    vendor_name: api.name,
    contact_person: api.contactPerson || null,
    email: api.email || null,
    phone: api.phone || null,
    office_address: api.address || null,
    vendor_type: "General Supplier",
    status: "active",
    website: null,
    gst_number: null,
    notes: null,
  };
}

export function mapVendorRow(api: ApiVendor): VendorRow {
  return { ...mapVendor(api), linked_asset_count: api.assetCount };
}

export function mapEmployee(api: ApiEmployee): Employee {
  return {
    id: api.id,
    employee_code: api.employeeId,
    name: api.name,
    email: api.email,
    phone: api.phone || null,
    department: api.department || null,
    designation: api.designation || null,
    location: api.location || null,
    status: api.status.toLowerCase() === "inactive" ? "inactive" : "active",
  };
}

export function mapEmployeeRow(api: ApiEmployee): EmployeeRow {
  return { ...mapEmployee(api), assigned_asset_count: api.assignedAssets };
}

export function mapAssetSummary(api: ApiAssetSummary): Asset {
  return {
    id: api.id,
    asset_code: api.assetId,
    asset_name: api.name,
    category_id: api.category?.id ?? null,
    brand: api.brand,
    model: null,
    serial_number: api.serialNumber,
    purchase_date: toDateOnly(api.purchaseDate),
    purchase_cost: api.purchaseCost,
    purchase_cost_inr: api.purchaseCost,
    invoice_number: api.invoiceNumber,
    vendor_id: api.vendor?.id ?? null,
    warranty_expiry: toDateOnly(api.warrantyExpiry),
    status: normalizeAssetStatus(api.status),
    location: null,
    remarks: null,
    assigned_employee_id: api.assignedEmployee?.id ?? null,
    created_at: api.createdAt,
  };
}

export function mapAssetDetail(api: ApiAssetDetail): Asset {
  return {
    ...mapAssetSummary(api),
    asset_name: api.description?.trim() || api.name,
    model: api.specifications,
    remarks: api.notes,
  };
}

export function mapAssetRow(api: ApiAssetSummary): AssetRow {
  const asset = mapAssetSummary(api);
  return {
    ...asset,
    categories: api.category
      ? { id: api.category.id, category_name: api.category.name, status: "active" }
      : null,
    vendors: api.vendor
      ? {
          id: api.vendor.id,
          vendor_code: api.vendor.vendorCode,
          vendor_name: api.vendor.name,
        }
      : null,
    employees: api.assignedEmployee
      ? {
          id: api.assignedEmployee.id,
          employee_code: api.assignedEmployee.employeeId,
          name: api.assignedEmployee.name,
          email: "",
        }
      : null,
  };
}

export function mapAssignment(api: ApiAssignment): Assignment {
  return {
    id: api.id,
    asset_id: api.asset.id,
    employee_id: api.employee?.id ?? "",
    assigned_date: api.assignedDate,
    returned_date: api.returnedDate,
    status: normalizeAssignmentStatus(api.status),
    notes: api.remarks,
    reason: null,
    performed_by: api.assignedBy,
    created_at: api.createdAt,
  };
}

export function mapAssignmentRow(api: ApiAssignment): AssignmentRow {
  const assignment = mapAssignment(api);
  return {
    ...assignment,
    assets: {
      id: api.asset.id,
      asset_code: api.asset.assetCode,
      asset_name: api.asset.assetCode,
      category_id: null,
      brand: null,
      model: null,
      serial_number: null,
      purchase_date: null,
      purchase_cost: null,
      purchase_cost_inr: null,
      invoice_number: null,
      vendor_id: null,
      warranty_expiry: null,
      status: "assigned",
      location: null,
      remarks: null,
      assigned_employee_id: api.employee?.id ?? null,
      created_at: api.createdAt,
    },
    employees: api.employee
      ? {
          id: api.employee.id,
          employee_code: api.employee.employeeId,
          name: api.employee.name,
          email: "",
        }
      : null,
  };
}

export function mapDashboardData(input: {
  summary: ApiDashboardSummary;
  byCategory: ApiAssetsByCategory[];
  byStatus: ApiAssetsByStatus[];
  recentAssignments: ApiAssignment[];
  warrantyExpiring: ApiWarrantyExpiring[];
  repairAssets: ApiAssetSummary[];
}): DashboardData {
  const byStatus: Record<string, number> = {};
  for (const row of input.byStatus) {
    byStatus[normalizeAssetStatus(row.status)] = row.count;
  }

  const byCategory: Record<string, number> = {};
  for (const row of input.byCategory) {
    byCategory[row.category] = row.count;
  }

  const warrantyExpiring: AssetRow[] = input.warrantyExpiring.map((row) => ({
    id: row.assetId,
    asset_code: row.assetCode,
    asset_name: row.assetName,
    category_id: null,
    brand: null,
    model: null,
    serial_number: null,
    purchase_date: null,
    purchase_cost: null,
    purchase_cost_inr: null,
    invoice_number: null,
    vendor_id: null,
    warranty_expiry: row.warrantyExpiry,
    status: "available",
    location: null,
    remarks: null,
    assigned_employee_id: null,
    created_at: new Date().toISOString(),
    categories: null,
    vendors: null,
    employees: null,
  }));

  const openRepairs: RepairRow[] = input.repairAssets.map((asset) => ({
    id: `repair-${asset.id}`,
    asset_id: asset.id,
    vendor_id: null,
    repair_cost: null,
    expected_return_date: null,
    actual_return_date: null,
    repair_notes: null,
    status: "in_progress",
    unassign_reason: "Under Repair",
    created_at: asset.updatedAt,
    completed_at: null,
    assets: mapAssetRow(asset),
    vendors: null,
  }));

  return {
    stats: {
      totalAssets: input.summary.totalAssets,
      totalEmployees: input.summary.employees,
      byStatus,
      byCategory,
      openRepairTickets: input.summary.underRepair,
    },
    recentAssignments: input.recentAssignments.map(mapAssignmentRow),
    openRepairs,
    warrantyExpiring,
  };
}

export function mapAssetImages(api: ApiAssetDetail["images"], assetId: string) {
  return api.map((image) => ({
    id: image.id,
    assetId,
    fileName: image.fileName,
    fileSize: image.fileSize,
    uploadDate: image.uploadDate,
    imageUrl: resolveUploadUrl(image.imageUrl),
    sortOrder: image.sortOrder,
  }));
}

export type {
  ApiAssetDetail,
  ApiAssetSummary,
  ApiAssignment,
  ApiCategory,
  ApiEmployee,
  ApiVendor,
};
