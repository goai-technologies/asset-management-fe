import { apiDelete, apiGet, apiPost, apiSendFormData } from "./axios";
import {
  mapAssetDetail,
  mapAssetImages,
  mapAssetRow,
  type ApiAssetDetail,
  type ApiAssetSummary,
} from "./mappers";
import type { Asset, AssetRow } from "@/lib/types/asset-management";

export type AssetWritePayload = Partial<Asset> & {
  _imageFiles?: File[];
};

function buildAssetFormData(asset: AssetWritePayload): FormData {
  const formData = new FormData();

  if (asset.category_id) formData.append("categoryId", asset.category_id);
  if (asset.brand) formData.append("brand", asset.brand);
  if (asset.serial_number) formData.append("serialNumber", asset.serial_number);
  if (asset.invoice_number) formData.append("invoiceNumber", asset.invoice_number);
  if (asset.purchase_date) formData.append("purchaseDate", asset.purchase_date);
  if (asset.warranty_expiry) formData.append("warrantyExpiry", asset.warranty_expiry);
  if (asset.vendor_id) formData.append("vendorId", asset.vendor_id);

  const purchaseCost = asset.purchase_cost_inr ?? asset.purchase_cost;
  if (purchaseCost != null) formData.append("purchaseCost", String(purchaseCost));

  if (asset.asset_name) formData.append("description", asset.asset_name);
  if (asset.model) formData.append("specifications", asset.model);
  if (asset.remarks) formData.append("notes", asset.remarks);

  for (const file of asset._imageFiles ?? []) {
    formData.append("images", file);
  }

  return formData;
}

export async function fetchAssets(): Promise<AssetRow[]> {
  const rows = await apiGet<ApiAssetSummary[]>("/assets");
  return rows.map(mapAssetRow);
}

export async function fetchArchivedAssets(): Promise<AssetRow[]> {
  const rows = await apiGet<ApiAssetSummary[]>("/assets/archived");
  return rows.map(mapAssetRow);
}

export async function fetchAssetById(id: string): Promise<AssetRow> {
  const detail = await apiGet<ApiAssetDetail>(`/assets/${id}`);
  return mapAssetRow(detail);
}

export async function fetchAssetDetail(id: string) {
  const detail = await apiGet<ApiAssetDetail>(`/assets/${id}`);
  return {
    asset: mapAssetDetail(detail),
    images: mapAssetImages(detail.images, id),
  };
}

export async function createAsset(
  asset: Omit<Asset, "id" | "created_at" | "asset_code"> & { _imageFiles?: File[] },
): Promise<Asset> {
  const detail = await apiSendFormData<ApiAssetDetail>(
    "/assets",
    buildAssetFormData(asset),
    "POST",
  );
  return mapAssetDetail(detail);
}

export async function updateAsset(id: string, updates: AssetWritePayload): Promise<Asset> {
  const detail = await apiSendFormData<ApiAssetDetail>(
    `/assets/${id}`,
    buildAssetFormData(updates),
    "PUT",
  );
  return mapAssetDetail(detail);
}

export async function softDeleteAsset(id: string): Promise<void> {
  await apiDelete(`/assets/${id}`);
}

export async function restoreAsset(id: string): Promise<Asset> {
  const detail = await apiPost<ApiAssetDetail>(`/assets/${id}/restore`);
  return mapAssetDetail(detail);
}

export async function permanentlyDeleteAsset(_id: string): Promise<void> {
  throw new Error("Permanent delete is not supported by the REST API.");
}

export async function disposeAsset(
  assetId: string,
  options: { reason: string; disposal_date: string; remarks?: string; performedBy?: string },
): Promise<AssetRow> {
  const detail = await apiPost<ApiAssetDetail>(`/assets/${assetId}/dispose`, {
    reason: options.reason,
    disposalDate: options.disposal_date,
    notes: options.remarks,
  });
  return mapAssetRow(detail);
}

export async function deactivateAsset(
  assetId: string,
  options?: { remarks?: string; performedBy?: string },
): Promise<AssetRow> {
  const detail = await apiPost<ApiAssetDetail>(`/assets/${assetId}/deactivate`, {
    notes: options?.remarks,
  });
  return mapAssetRow(detail);
}

export async function markAssetAvailable(assetId: string): Promise<AssetRow> {
  const detail = await apiPost<ApiAssetDetail>(`/assets/${assetId}/available`);
  return mapAssetRow(detail);
}

export async function sendAssetForRepair(
  assetId: string,
  options?: { remarks?: string },
): Promise<AssetRow> {
  const detail = await apiPost<ApiAssetDetail>(`/assets/${assetId}/repair`, {
    notes: options?.remarks,
  });
  return mapAssetRow(detail);
}
