import { useCallback, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type ImageUploadItem,
  MAX_IMAGES_PER_ASSET,
  validateImageBatch,
  readFileAsDataUrl,
} from "@/lib/asset-images";
import { AssetImageLightbox } from "./asset-image-lightbox";
import { AssetImageThumbnail, useImageFileInput, UploadProgressBar } from "./asset-image-thumbnail";

const genTempId = () => `temp-${Math.random().toString(36).substring(2, 11)}`;

export function AssetImageUpload({
  value,
  onChange,
  maxImages = MAX_IMAGES_PER_ASSET,
}: {
  value: ImageUploadItem[];
  onChange: (items: ImageUploadItem[]) => void;
  maxImages?: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const processFiles = useCallback(async (files: File[]) => {
    const { valid, errors } = validateImageBatch(files, value.length);
    errors.forEach((msg) => toast.error(msg));
    if (!valid.length) return;

    setUploadProgress(0);
    const newItems: ImageUploadItem[] = [];

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      try {
        const imageUrl = await readFileAsDataUrl(file, (pct) => {
          const overall = Math.round(((i + pct / 100) / valid.length) * 100);
          setUploadProgress(overall);
        });
        newItems.push({
          id: genTempId(),
          fileName: file.name,
          fileSize: file.size,
          imageUrl,
          file,
        });
      } catch {
        toast.error(`Failed to read "${file.name}"`);
      }
    }

    setUploadProgress(null);
    if (newItems.length) onChange([...value, ...newItems]);
  }, [value, onChange]);

  const { input, open } = useImageFileInput(processFiles);

  const removeImage = (id: string) => onChange(value.filter((img) => img.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) processFiles(files);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const atLimit = value.length >= maxImages;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">Asset Images</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Upload one or more images of the asset. Supported formats: JPG, JPEG, PNG, WEBP.
        </p>
      </div>

      {!atLimit && (
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={open}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && open()}
        >
          {input}
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop images here, or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Up to {maxImages} images · 5 MB each · JPG, JPEG, PNG, WEBP
              </p>
            </div>
          </div>
          <UploadProgressBar progress={uploadProgress} />
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" />
              {value.length} / {maxImages} images
            </span>
            {!atLimit && (
              <button type="button" className="text-primary hover:underline" onClick={open}>
                Add more
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {value.map((img, index) => (
              <AssetImageThumbnail
                key={img.id}
                image={img}
                draggable
                isDragging={dragIndex === index}
                onRemove={() => removeImage(img.id)}
                onPreview={() => setLightboxIndex(index)}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) reorder(dragIndex, index);
                  setDragIndex(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <AssetImageLightbox
          images={value}
          initialIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onOpenChange={(open) => !open && setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
