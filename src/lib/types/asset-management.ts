export type Category = {
  id: string;
  category_name: string;
  description?: string | null;
  status?: "active" | "inactive";
  icon?: string | null;
};

export type CategoryRow = Category & {
  asset_count: number;
};

export const VENDOR_TYPES = [
  "Hardware Supplier",
  "Software Vendor",
  "Repair Service",
  "Logistics",
  "General Supplier",
  "Other",
] as const;

export type VendorType = (typeof VENDOR_TYPES)[number];

export type Vendor = {
  id: string;
  vendor_code: string;
  vendor_name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  office_address?: string | null;
  vendor_type?: VendorType | string | null;
  status?: "active" | "inactive";
  website?: string | null;
  gst_number?: string | null;
  notes?: string | null;
};

export type VendorRow = Vendor & {
  linked_asset_count: number;
};

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
  status: "in_progress" | "completed" | "cancelled" | "pending";
  unassign_reason: string | null;
  created_at: string;
  completed_at: string | null;
};

export type RepairRow = Repair & {
  assets: Asset | null;
  vendors: Vendor | null;
};

export type DashboardStats = {
  totalAssets: number;
  totalEmployees: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  openRepairTickets: number;
};

export type DashboardData = {
  stats: DashboardStats;
  recentAssignments: AssignmentRow[];
  openRepairs: RepairRow[];
  warrantyExpiring: AssetRow[];
};

export type AssetDbSnapshot = {
  categories: Category[];
  vendors: Vendor[];
  employees: Employee[];
  assets: Asset[];
  assignments: Assignment[];
  repairs: Repair[];
};
