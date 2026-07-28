import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  type AssetImage,
  validateImageFile,
  validateImageBatch,
  downloadImage,
  MAX_IMAGES_PER_ASSET,
} from "@/lib/asset-images";
import { loadAssetImages } from "@/lib/asset-images/api-storage-adapter";
import { updateAsset } from "@/lib/api/assets";
import { EmptyState } from "@/components/empty-state";
import { AssetImageLightbox } from "./asset-image-lightbox";
import { AssetImageThumbnail, useImageFileInput, UploadProgressBar } from "./asset-image-thumbnail";

export function AssetImageGallery({
  assetId,
  canManage = false,
  onChange,
}: {
  assetId: string;
  canManage?: boolean;
  onChange?: () => void;
}) {
  const [images, setImages] = useState<AssetImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const replaceTargetRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const loaded = await loadAssetImages(assetId);
    setImages(loaded);
    onChange?.();
  }, [assetId, onChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadToServer = async (files: File[]) => {
    await updateAsset(assetId, { _imageFiles: files });
    await refresh();
  };

  const processUpload = async (files: File[], replaceId?: string) => {
    if (replaceId) {
      const file = files[0];
      if (!file) return;
      const error = validateImageFile(file);
      if (error) { toast.error(error); return; }
      setUploadProgress(0);
      try {
        await uploadToServer([file]);
        toast.success("Image uploaded");
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setUploadProgress(null);
        replaceTargetRef.current = null;
      }
      return;
    }

    const { valid, errors } = validateImageBatch(files, images.length);
    errors.forEach((msg) => toast.error(msg));
    if (!valid.length) return;

    setUploadProgress(0);
    try {
      await uploadToServer(valid);
      toast.success(`${valid.length} image${valid.length > 1 ? "s" : ""} uploaded`);
    } catch {
      toast.error("Failed to upload images");
    } finally {
      setUploadProgress(null);
    }
  };

  const { input, open } = useImageFileInput((files) => {
    processUpload(files, replaceTargetRef.current ?? undefined);
  });

  const handleDelete = (_image: AssetImage) => {
    toast.error("Image deletion is not supported via the REST API yet.");
  };

  const handleDownload = (image: AssetImage) => {
    downloadImage(image.imageUrl, image.fileName);
  };

  const handleReplace = (imageId: string) => {
    replaceTargetRef.current = imageId;
    open();
  };

  if (images.length === 0) {
    return (
      <div>
        {input}
        <EmptyState
          icon={Camera}
          title="📷 No images uploaded for this asset."
          description="Upload photos to document the asset's condition and appearance."
          actionLabel={canManage ? "Upload Images" : undefined}
          onAction={canManage ? open : undefined}
        />
        <UploadProgressBar progress={uploadProgress} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {input}
      {canManage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {images.length} / {MAX_IMAGES_PER_ASSET} images
          </p>
          {images.length < MAX_IMAGES_PER_ASSET && (
            <Button variant="outline" size="sm" onClick={open}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
          )}
        </div>
      )}
      <UploadProgressBar progress={uploadProgress} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, index) => (
          <div key={img.id} className="space-y-2">
            <AssetImageThumbnail
              image={img}
              onPreview={() => setLightboxIndex(index)}
            />
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => handleDownload(img)}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    title="Replace image"
                    onClick={() => handleReplace(img.id)}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    title="Delete image"
                    onClick={() => handleDelete(img)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <AssetImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onOpenChange={(open) => !open && setLightboxIndex(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
