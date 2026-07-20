export type { AssetImage, AssetImageInput, ImageUploadItem, AssetImageStorageAdapter } from "./types";
export {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_IMAGES_PER_ASSET,
  MAX_IMAGE_SIZE_BYTES,
  isAllowedImageType,
  validateImageFile,
  validateImageBatch,
} from "./validation";
export { formatFileSize, readFileAsDataUrl, downloadImage } from "./utils";
export { localAssetImageStorage } from "./local-storage-adapter";

import { localAssetImageStorage } from "./local-storage-adapter";
import type { AssetImageStorageAdapter } from "./types";

let adapter: AssetImageStorageAdapter = localAssetImageStorage;

/** Swap the storage backend (e.g. S3, Azure Blob, Cloudinary) without changing UI components. */
export function setAssetImageStorage(next: AssetImageStorageAdapter) {
  adapter = next;
}

export function getAssetImageStorage(): AssetImageStorageAdapter {
  return adapter;
}
