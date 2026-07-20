import type { AssetImage, AssetImageInput, AssetImageStorageAdapter } from "./types";

const STORAGE_KEY = "eams_asset_images";

type ImageStore = { images: AssetImage[] };

function loadStore(): ImageStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { images: [] };
    return JSON.parse(raw) as ImageStore;
  } catch {
    return { images: [] };
  }
}

function saveStore(store: ImageStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

const genId = () => Math.random().toString(36).substring(2, 11);

export const localAssetImageStorage: AssetImageStorageAdapter = {
  getImages(assetId: string): AssetImage[] {
    return loadStore()
      .images.filter((img) => img.assetId === assetId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  addImages(assetId: string, inputs: AssetImageInput[]): AssetImage[] {
    const store = loadStore();
    const existing = store.images.filter((img) => img.assetId === assetId);
    const baseOrder = existing.length;
    const now = new Date().toISOString();

    const created: AssetImage[] = inputs.map((input, i) => ({
      id: genId(),
      assetId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      uploadDate: now,
      imageUrl: input.imageUrl,
      sortOrder: baseOrder + i,
    }));

    store.images.push(...created);
    saveStore(store);
    return created;
  },

  deleteImage(imageId: string): void {
    const store = loadStore();
    store.images = store.images.filter((img) => img.id !== imageId);
    saveStore(store);
  },

  replaceImage(imageId: string, input: AssetImageInput): AssetImage {
    const store = loadStore();
    const idx = store.images.findIndex((img) => img.id === imageId);
    if (idx === -1) throw new Error("Image not found");

    const updated: AssetImage = {
      ...store.images[idx],
      fileName: input.fileName,
      fileSize: input.fileSize,
      imageUrl: input.imageUrl,
      uploadDate: new Date().toISOString(),
    };
    store.images[idx] = updated;
    saveStore(store);
    return updated;
  },

  reorderImages(assetId: string, orderedIds: string[]): void {
    const store = loadStore();
    orderedIds.forEach((id, index) => {
      const img = store.images.find((i) => i.id === id && i.assetId === assetId);
      if (img) img.sortOrder = index;
    });
    saveStore(store);
  },

  deleteImagesForAsset(assetId: string): void {
    const store = loadStore();
    store.images = store.images.filter((img) => img.assetId !== assetId);
    saveStore(store);
  },
};
