import type { AssetImage, AssetImageInput, AssetImageStorageAdapter } from "./types";
import { fetchAssetDetail } from "@/lib/api/assets";

const cache = new Map<string, AssetImage[]>();

export const apiAssetImageStorage: AssetImageStorageAdapter = {
  getImages(assetId: string): AssetImage[] {
    return cache.get(assetId) ?? [];
  },

  addImages(assetId: string, inputs: AssetImageInput[]): AssetImage[] {
    const existing = cache.get(assetId) ?? [];
    const created: AssetImage[] = inputs.map((input, index) => ({
      id: `pending-${Date.now()}-${index}`,
      assetId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      uploadDate: new Date().toISOString(),
      imageUrl: input.imageUrl,
      sortOrder: existing.length + index,
    }));
    cache.set(assetId, [...existing, ...created]);
    return created;
  },

  deleteImage(imageId: string): void {
    for (const [assetId, images] of cache.entries()) {
      const next = images.filter((image) => image.id !== imageId);
      if (next.length !== images.length) {
        cache.set(assetId, next);
        return;
      }
    }
  },

  replaceImage(imageId: string, input: AssetImageInput): AssetImage {
    for (const [assetId, images] of cache.entries()) {
      const index = images.findIndex((image) => image.id === imageId);
      if (index === -1) continue;
      const updated: AssetImage = {
        ...images[index],
        fileName: input.fileName,
        fileSize: input.fileSize,
        imageUrl: input.imageUrl,
        uploadDate: new Date().toISOString(),
      };
      const next = [...images];
      next[index] = updated;
      cache.set(assetId, next);
      return updated;
    }
    throw new Error("Image not found");
  },

  reorderImages(assetId: string, orderedIds: string[]): void {
    const images = cache.get(assetId) ?? [];
    const next = orderedIds
      .map((id, index) => {
        const image = images.find((item) => item.id === id);
        return image ? { ...image, sortOrder: index } : null;
      })
      .filter((image): image is AssetImage => image !== null);
    cache.set(assetId, next);
  },

  deleteImagesForAsset(assetId: string): void {
    cache.delete(assetId);
  },
};

export async function loadAssetImages(assetId: string): Promise<AssetImage[]> {
  const { images } = await fetchAssetDetail(assetId);
  cache.set(assetId, images);
  return images;
}

export function primeAssetImages(assetId: string, images: AssetImage[]) {
  cache.set(assetId, images);
}
