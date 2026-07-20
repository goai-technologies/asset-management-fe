export type AssetImage = {
  id: string;
  assetId: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  imageUrl: string;
  sortOrder: number;
};

export type AssetImageInput = {
  fileName: string;
  fileSize: number;
  imageUrl: string;
};

export type ImageUploadItem = {
  id: string;
  fileName: string;
  fileSize: number;
  imageUrl: string;
  uploadDate?: string;
  isExisting?: boolean;
  file?: File;
};

export interface AssetImageStorageAdapter {
  getImages(assetId: string): AssetImage[];
  addImages(assetId: string, images: AssetImageInput[]): AssetImage[];
  deleteImage(imageId: string): void;
  replaceImage(imageId: string, image: AssetImageInput): AssetImage;
  reorderImages(assetId: string, orderedIds: string[]): void;
  deleteImagesForAsset(assetId: string): void;
}
