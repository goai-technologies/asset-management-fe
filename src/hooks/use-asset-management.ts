import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assetKeys,
  assignAsset,
  completeRepair,
  createAsset,
  createCategory,
  createEmployee,
  createVendor,
  deactivateAsset,
  deleteCategory,
  deleteEmployee,
  deleteVendor,
  disposeAsset,
  fetchActiveCategories,
  fetchArchivedAssets,
  fetchAssetAssignments,
  fetchAssetRepairs,
  fetchAssets,
  fetchCategories,
  fetchCategoryRows,
  fetchDashboardData,
  fetchEmployeeAssignedAssets,
  fetchEmployeeAssignments,
  fetchEmployeeRepairHistory,
  fetchEmployeeRows,
  fetchEmployees,
  fetchVendorRows,
  fetchVendors,
  permanentlyDeleteAsset,
  restoreAsset,
  softDeleteAsset,
  unassignAsset,
  updateAsset,
  updateCategory,
  updateEmployee,
  updateRepair,
  updateVendor,
} from "@/lib/api/asset-management";
import type {
  Asset,
  Category,
  Employee,
  Repair,
  Vendor,
} from "@/lib/types/asset-management";

export { assetKeys };

export function useInvalidateAssetData() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: assetKeys.all });
}

export function useDashboardData() {
  return useQuery({
    queryKey: assetKeys.dashboard(),
    queryFn: fetchDashboardData,
  });
}

export function useCategories() {
  return useQuery({ queryKey: assetKeys.categories(), queryFn: fetchCategories });
}

export function useActiveCategories() {
  return useQuery({
    queryKey: [...assetKeys.categories(), "active"],
    queryFn: fetchActiveCategories,
  });
}

export function useCategoryRows() {
  return useQuery({ queryKey: assetKeys.categoryRows(), queryFn: fetchCategoryRows });
}

export function useVendors() {
  return useQuery({ queryKey: assetKeys.vendors(), queryFn: fetchVendors });
}

export function useVendorRows() {
  return useQuery({ queryKey: assetKeys.vendorRows(), queryFn: fetchVendorRows });
}

export function useEmployees() {
  return useQuery({ queryKey: assetKeys.employees(), queryFn: fetchEmployees });
}

export function useEmployeeRows() {
  return useQuery({ queryKey: assetKeys.employeeRows(), queryFn: fetchEmployeeRows });
}

export function useAssets() {
  return useQuery({ queryKey: assetKeys.assets(), queryFn: fetchAssets });
}

export function useArchivedAssets() {
  return useQuery({ queryKey: assetKeys.archivedAssets(), queryFn: fetchArchivedAssets });
}

export function useAssetAssignments(assetId: string | undefined) {
  return useQuery({
    queryKey: assetKeys.assetAssignments(assetId ?? ""),
    queryFn: () => fetchAssetAssignments(assetId!),
    enabled: Boolean(assetId),
  });
}

export function useAssetRepairs(assetId: string | undefined) {
  return useQuery({
    queryKey: assetKeys.assetRepairs(assetId ?? ""),
    queryFn: () => fetchAssetRepairs(assetId!),
    enabled: Boolean(assetId),
  });
}

export function useEmployeeAssignedAssets(employeeId: string | undefined) {
  return useQuery({
    queryKey: assetKeys.employeeAssets(employeeId ?? ""),
    queryFn: () => fetchEmployeeAssignedAssets(employeeId!),
    enabled: Boolean(employeeId),
  });
}

export function useEmployeeAssignments(employeeId: string | undefined) {
  return useQuery({
    queryKey: assetKeys.employeeAssignments(employeeId ?? ""),
    queryFn: () => fetchEmployeeAssignments(employeeId!),
    enabled: Boolean(employeeId),
  });
}

export function useEmployeeRepairHistory(employeeId: string | undefined) {
  return useQuery({
    queryKey: assetKeys.employeeRepairs(employeeId ?? ""),
    queryFn: () => fetchEmployeeRepairHistory(employeeId!),
    enabled: Boolean(employeeId),
  });
}

function useAssetMutation<TVariables, TResult = unknown>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useCreateCategoryMutation() {
  return useAssetMutation((category: Omit<Category, "id">) => createCategory(category));
}

export function useUpdateCategoryMutation() {
  return useAssetMutation(({ id, updates }: { id: string; updates: Partial<Omit<Category, "id">> }) =>
    updateCategory(id, updates),
  );
}

export function useDeleteCategoryMutation() {
  return useAssetMutation((id: string) => deleteCategory(id));
}

export function useCreateVendorMutation() {
  return useAssetMutation(
    (vendor: Omit<Vendor, "id" | "vendor_code"> & { vendor_code?: string }) =>
      createVendor(vendor),
  );
}

export function useUpdateVendorMutation() {
  return useAssetMutation(({ id, updates }: { id: string; updates: Partial<Omit<Vendor, "id">> }) =>
    updateVendor(id, updates),
  );
}

export function useDeleteVendorMutation() {
  return useAssetMutation((id: string) => deleteVendor(id));
}

export function useCreateEmployeeMutation() {
  return useAssetMutation((employee: Omit<Employee, "id">) => createEmployee(employee));
}

export function useUpdateEmployeeMutation() {
  return useAssetMutation(
    ({ id, updates }: { id: string; updates: Partial<Omit<Employee, "id">> }) =>
      updateEmployee(id, updates),
  );
}

export function useDeleteEmployeeMutation() {
  return useAssetMutation((id: string) => deleteEmployee(id));
}

export function useCreateAssetMutation() {
  return useAssetMutation(
    (asset: Omit<Asset, "id" | "created_at" | "asset_code">) => createAsset(asset),
  );
}

export function useUpdateAssetMutation() {
  return useAssetMutation(({ id, updates }: { id: string; updates: Partial<Asset> }) =>
    updateAsset(id, updates),
  );
}

export function useSoftDeleteAssetMutation() {
  return useAssetMutation((id: string) => softDeleteAsset(id));
}

export function useRestoreAssetMutation() {
  return useAssetMutation((id: string) => restoreAsset(id));
}

export function usePermanentlyDeleteAssetMutation() {
  return useAssetMutation((id: string) => permanentlyDeleteAsset(id));
}

export function useAssignAssetMutation() {
  return useAssetMutation(
    ({
      assetId,
      employeeId,
      assignedDate,
      expectedReturn,
      notes,
    }: {
      assetId: string;
      employeeId: string;
      assignedDate: string;
      expectedReturn: string | null;
      notes: string | null;
    }) => assignAsset(assetId, employeeId, assignedDate, expectedReturn, notes),
  );
}

export function useUnassignAssetMutation() {
  return useAssetMutation(
    ({
      assetId,
      options,
    }: {
      assetId: string;
      options: { reason: string; remarks?: string; performedBy?: string };
    }) => unassignAsset(assetId, options),
  );
}

export function useDisposeAssetMutation() {
  return useAssetMutation(
    ({
      assetId,
      options,
    }: {
      assetId: string;
      options: { reason: string; disposal_date: string; remarks?: string; performedBy?: string };
    }) => disposeAsset(assetId, options),
  );
}

export function useDeactivateAssetMutation() {
  return useAssetMutation(
    ({
      assetId,
      options,
    }: {
      assetId: string;
      options?: { remarks?: string; performedBy?: string };
    }) => deactivateAsset(assetId, options),
  );
}

export function useUpdateRepairMutation() {
  return useAssetMutation(
    ({ repairId, updates }: { repairId: string; updates: Partial<Repair> }) =>
      updateRepair(repairId, updates),
  );
}

export function useCompleteRepairMutation() {
  return useAssetMutation(
    ({
      repairId,
      updates,
    }: {
      repairId: string;
      updates?: Partial<
        Pick<Repair, "vendor_id" | "repair_cost" | "expected_return_date" | "actual_return_date" | "repair_notes">
      >;
    }) => completeRepair(repairId, updates),
  );
}
