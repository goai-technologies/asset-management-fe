import { apiGet, apiPost } from "./axios";
import { mapAssignment, mapAssignmentRow, type ApiAssignment } from "./mappers";
import type { AssignmentRow, Repair, RepairRow } from "@/lib/types/asset-management";
import { sendAssetForRepair } from "./assets";

function isActiveAssignment(assignment: ApiAssignment): boolean {
  const status = assignment.status.toLowerCase();
  return (status === "active" || status === "assigned" || status === "overdue") && !assignment.returnedDate;
}

export async function fetchAssignments(): Promise<AssignmentRow[]> {
  const rows = await apiGet<ApiAssignment[]>("/assignments");
  return rows.map(mapAssignmentRow);
}

export async function fetchAssetAssignments(assetId: string): Promise<AssignmentRow[]> {
  const rows = await apiGet<ApiAssignment[]>(`/assignments/asset/${assetId}`);
  return rows.map(mapAssignmentRow);
}

export async function fetchEmployeeAssignments(employeeId: string): Promise<AssignmentRow[]> {
  const rows = await apiGet<ApiAssignment[]>(`/assignments/employee/${employeeId}`);
  return rows.map(mapAssignmentRow);
}

export async function assignAsset(
  assetId: string,
  employeeId: string,
  assignedDate: string,
  expectedReturn: string | null,
  notes: string | null,
): Promise<void> {
  await apiPost("/assignments", {
    assetId,
    employeeId,
    assignedDate,
    expectedReturnDate: expectedReturn,
    remarks: notes,
  });
}

export async function unassignAsset(
  assetId: string,
  options: { reason: string; remarks?: string; performedBy?: string },
): Promise<{ sentForRepair: boolean }> {
  const assignments = await apiGet<ApiAssignment[]>(`/assignments/asset/${assetId}`);
  const active = assignments.find(isActiveAssignment);
  if (!active) {
    throw new Error("No active assignment found for this asset");
  }

  await apiPost(`/assignments/${active.id}/unassign`, {
    reason: options.reason,
    remarks: options.remarks,
  });

  const sentForRepair = options.reason === "Sent for Repair";
  if (sentForRepair) {
    await sendAssetForRepair(assetId, { remarks: options.remarks });
  }

  return { sentForRepair };
}

export async function returnAssignment(
  assignmentId: string,
  returnedDate: string,
  remarks?: string | null,
): Promise<void> {
  await apiPost(`/assignments/${assignmentId}/return`, {
    returnedDate,
    remarks,
  });
}

export async function fetchEmployeeAssignedAssets(employeeId: string) {
  const { fetchAssets } = await import("./assets");
  const assets = await fetchAssets();
  return assets.filter((asset) => asset.assigned_employee_id === employeeId);
}

export async function fetchAssetRepairs(_assetId: string): Promise<RepairRow[]> {
  return [];
}

export async function fetchEmployeeRepairHistory(_employeeId: string): Promise<RepairRow[]> {
  return [];
}

export async function updateRepair(
  _repairId: string,
  _updates: Partial<Repair>,
): Promise<Repair> {
  throw new Error("Repair management is not available via the REST API.");
}

export async function completeRepair(
  _repairId: string,
  _updates?: Partial<
    Pick<Repair, "vendor_id" | "repair_cost" | "expected_return_date" | "actual_return_date" | "repair_notes">
  >,
): Promise<Repair> {
  throw new Error("Repair management is not available via the REST API.");
}

export async function fetchAssignmentRowsForReports(): Promise<AssignmentRow[]> {
  return fetchAssignments();
}

export { mapAssignment };
