import { apiGet } from "./axios";
import { mapDashboardData } from "./mappers";
import type { ApiAssetSummary, ApiAssignment } from "./mappers";
import type { DashboardData } from "@/lib/types/asset-management";
import { normalizeAssetStatus } from "./mappers";

export async function fetchDashboardSummary() {
  return apiGet<{
    totalAssets: number;
    availableAssets: number;
    assignedAssets: number;
    underRepair: number;
    inactiveAssets: number;
    employees: number;
    vendors: number;
    categories: number;
  }>("/dashboard/summary");
}

export async function fetchAssetsByCategory() {
  return apiGet<{ category: string; count: number }[]>("/dashboard/assets-by-category");
}

export async function fetchAssetsByStatus() {
  return apiGet<{ status: string; count: number }[]>("/dashboard/assets-by-status");
}

export async function fetchRecentActivities() {
  return apiGet<
    {
      id: string;
      action: string;
      description: string | null;
      entityId: string;
      performedBy: string | null;
      createdAt: string;
    }[]
  >("/dashboard/recent-activities");
}

export async function fetchWarrantyExpiring() {
  return apiGet<
    {
      assetId: string;
      assetCode: string;
      assetName: string;
      warrantyExpiry: string;
      daysUntilExpiry: number;
    }[]
  >("/dashboard/warranty-expiring");
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [summary, byCategory, byStatus, assignments, warrantyExpiring, assets] = await Promise.all([
    fetchDashboardSummary(),
    fetchAssetsByCategory(),
    fetchAssetsByStatus(),
    apiGet<ApiAssignment[]>("/assignments"),
    fetchWarrantyExpiring(),
    apiGet<ApiAssetSummary[]>("/assets"),
  ]);

  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
    .slice(0, 10);

  const repairAssets = assets.filter((asset) => normalizeAssetStatus(asset.status) === "repair");

  return mapDashboardData({
    summary,
    byCategory,
    byStatus,
    recentAssignments,
    warrantyExpiring,
    repairAssets,
  });
}
