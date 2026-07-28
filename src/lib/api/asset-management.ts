import type {
  Asset,
  AssetDbSnapshot,
  AssetRow,
  AssignmentRow,
  Category,
  DashboardData,
  Employee,
  EmployeeRow,
  Repair,
  RepairRow,
  Vendor,
  VendorRow,
} from "@/lib/types/asset-management";
import { fetchDashboardData } from "./dashboard";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchCategoryById,
  fetchCategoryRows,
  updateCategory,
} from "./categories";
import {
  createVendor,
  deleteVendor,
  fetchVendorById,
  fetchVendorRows,
  fetchVendors,
  updateVendor,
} from "./vendors";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployeeById,
  fetchEmployeeRows,
  fetchEmployees,
  updateEmployee,
} from "./employees";
import {
  createAsset,
  deactivateAsset,
  disposeAsset,
  fetchArchivedAssets,
  fetchAssetById,
  fetchAssets,
  permanentlyDeleteAsset,
  restoreAsset,
  softDeleteAsset,
  updateAsset,
} from "./assets";
import {
  assignAsset,
  completeRepair,
  fetchAssetAssignments,
  fetchAssetRepairs,
  fetchEmployeeAssignedAssets,
  fetchEmployeeAssignments,
  fetchEmployeeRepairHistory,
  unassignAsset,
  updateRepair,
} from "./assignments";

export const assetKeys = {
  all: ["asset-data"] as const,
  dashboard: () => [...assetKeys.all, "dashboard"] as const,
  categories: () => [...assetKeys.all, "categories"] as const,
  categoryRows: () => [...assetKeys.all, "category-rows"] as const,
  vendors: () => [...assetKeys.all, "vendors"] as const,
  vendorRows: () => [...assetKeys.all, "vendor-rows"] as const,
  employees: () => [...assetKeys.all, "employees"] as const,
  employeeRows: () => [...assetKeys.all, "employee-rows"] as const,
  assets: () => [...assetKeys.all, "assets"] as const,
  archivedAssets: () => [...assetKeys.all, "archived-assets"] as const,
  asset: (id: string) => [...assetKeys.all, "asset", id] as const,
  assetAssignments: (id: string) => [...assetKeys.all, "asset-assignments", id] as const,
  assetRepairs: (id: string) => [...assetKeys.all, "asset-repairs", id] as const,
  employeeAssets: (id: string) => [...assetKeys.all, "employee-assets", id] as const,
  employeeAssignments: (id: string) => [...assetKeys.all, "employee-assignments", id] as const,
  employeeRepairs: (id: string) => [...assetKeys.all, "employee-repairs", id] as const,
};

export {
  fetchDashboardData,
  fetchCategories,
  fetchCategoryRows,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchVendors,
  fetchVendorRows,
  fetchVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  fetchEmployees,
  fetchEmployeeRows,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchAssets,
  fetchArchivedAssets,
  fetchAssetById,
  createAsset,
  updateAsset,
  softDeleteAsset,
  restoreAsset,
  permanentlyDeleteAsset,
  assignAsset,
  unassignAsset,
  disposeAsset,
  deactivateAsset,
  fetchAssetAssignments,
  fetchAssetRepairs,
  fetchEmployeeAssignedAssets,
  fetchEmployeeAssignments,
  fetchEmployeeRepairHistory,
  updateRepair,
  completeRepair,
};

export async function fetchActiveCategories(): Promise<Category[]> {
  const all = await fetchCategories();
  return all.filter((category) => (category.status ?? "active") === "active");
}

export async function exportDataSnapshot(): Promise<AssetDbSnapshot> {
  const [categories, vendors, employees, assets, assignmentRows] = await Promise.all([
    fetchCategories(),
    fetchVendors(),
    fetchEmployees(),
    fetchAssets(),
    import("./assignments").then((m) => m.fetchAssignments()),
  ]);

  return {
    categories,
    vendors,
    employees,
    assets: assets.map((asset: AssetRow) => {
      const { categories: _c, vendors: _v, employees: _e, ...base } = asset;
      return base as Asset;
    }),
    assignments: assignmentRows.map((row) => ({
      id: row.id,
      asset_id: row.asset_id,
      employee_id: row.employee_id,
      assigned_date: row.assigned_date,
      returned_date: row.returned_date,
      status: row.status,
      notes: row.notes,
      reason: row.reason ?? null,
      performed_by: row.performed_by ?? null,
      created_at: row.created_at,
    })),
    repairs: [],
  };
}

export type {
  Asset,
  AssetRow,
  Category,
  DashboardData,
  Employee,
  EmployeeRow,
  Repair,
  RepairRow,
  Vendor,
  VendorRow,
};
