import { apiDownload, apiGet } from "./axios";

export type AssetReportFilters = {
  category?: string;
  vendor?: string;
  employee?: string;
  status?: string;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  warrantyFrom?: string;
  warrantyTo?: string;
};

export async function fetchAssetReport(filters?: AssetReportFilters) {
  return apiGet<unknown[]>("/reports/assets", filters);
}

export async function fetchEmployeeReport() {
  return apiGet<unknown[]>("/reports/employees");
}

export async function fetchVendorReport() {
  return apiGet<unknown[]>("/reports/vendors");
}

export async function fetchAssignmentReport() {
  return apiGet<unknown[]>("/reports/assignments");
}

export async function fetchWarrantyExpiringReport(days = 30) {
  return apiGet<unknown[]>("/reports/warranty-expiring", { days });
}

export async function downloadAssetsExcel(filters?: AssetReportFilters) {
  const date = new Date().toISOString().slice(0, 10);
  await apiDownload(`/reports/assets/export/excel`, `assets-report-${date}.xlsx`, filters);
}

export async function downloadAssetsPdf(filters?: AssetReportFilters) {
  const date = new Date().toISOString().slice(0, 10);
  await apiDownload(`/reports/assets/export/pdf`, `assets-report-${date}.pdf`, filters);
}

export async function downloadAssignmentsExcel() {
  const date = new Date().toISOString().slice(0, 10);
  await apiDownload(`/reports/assignments/export/excel`, `assignments-report-${date}.xlsx`);
}

export async function downloadAssignmentsPdf() {
  const date = new Date().toISOString().slice(0, 10);
  await apiDownload(`/reports/assignments/export/pdf`, `assignments-report-${date}.pdf`);
}
