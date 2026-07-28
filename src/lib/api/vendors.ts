import { apiDelete, apiGet, apiPost, apiPut } from "./axios";
import { mapVendor, mapVendorRow, type ApiVendor } from "./mappers";
import type { Vendor, VendorRow } from "@/lib/types/asset-management";

function toCreateBody(vendor: Omit<Vendor, "id" | "vendor_code"> & { vendor_code?: string }) {
  return {
    vendorCode: vendor.vendor_code,
    name: vendor.vendor_name,
    contactPerson: vendor.contact_person ?? "",
    email: vendor.email ?? "",
    phone: vendor.phone ?? "",
    address: vendor.office_address ?? "",
  };
}

function toUpdateBody(updates: Partial<Omit<Vendor, "id">>) {
  return {
    vendorCode: updates.vendor_code,
    name: updates.vendor_name,
    contactPerson: updates.contact_person ?? undefined,
    email: updates.email ?? undefined,
    phone: updates.phone ?? undefined,
    address: updates.office_address ?? undefined,
  };
}

export async function fetchVendors(): Promise<Vendor[]> {
  const rows = await apiGet<ApiVendor[]>("/vendors");
  return rows.map(mapVendor);
}

export async function fetchVendorRows(): Promise<VendorRow[]> {
  const rows = await apiGet<ApiVendor[]>("/vendors");
  return rows.map(mapVendorRow);
}

export async function fetchVendorById(id: string): Promise<Vendor> {
  const row = await apiGet<ApiVendor>(`/vendors/${id}`);
  return mapVendor(row);
}

export async function createVendor(
  vendor: Omit<Vendor, "id" | "vendor_code"> & { vendor_code?: string },
): Promise<Vendor> {
  const row = await apiPost<ApiVendor>("/vendors", toCreateBody(vendor));
  return mapVendor(row);
}

export async function updateVendor(id: string, updates: Partial<Omit<Vendor, "id">>): Promise<Vendor> {
  const row = await apiPut<ApiVendor>(`/vendors/${id}`, toUpdateBody(updates));
  return mapVendor(row);
}

export async function deleteVendor(id: string): Promise<void> {
  await apiDelete(`/vendors/${id}`);
}
