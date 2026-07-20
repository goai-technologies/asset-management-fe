import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { formatFileSize } from "@/lib/asset-images";
import type { AssetImage, ImageUploadItem } from "@/lib/asset-images";

type LightboxImage = Pick<AssetImage | ImageUploadItem, "id" | "fileName" | "fileSize" | "imageUrl">;

export function AssetImageLightbox({
  images,
  initialIndex,
  open,
  onOpenChange,
  onDownload,
}: {
  images: LightboxImage[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (image: LightboxImage) => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const image = images[index];
  const hasMultiple = images.length > 1;

  const goPrev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setIndex((i) => (i + 1) % images.length);

  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
        <div className="relative flex flex-col">
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            {onDownload && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => onDownload(image)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center min-h-[50vh] max-h-[75vh] p-8">
            {hasMultiple && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-3 text-white hover:bg-white/20"
                onClick={goPrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            <img
              src={image.imageUrl}
              alt={image.fileName}
              className="max-h-[70vh] max-w-full object-contain rounded"
            />
            {hasMultiple && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-3 text-white hover:bg-white/20"
                onClick={goNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>

          <div className="bg-background px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium truncate">{image.fileName}</p>
              <p className="text-muted-foreground text-xs">{formatFileSize(image.fileSize)}</p>
            </div>
            {hasMultiple && (
              <span className="text-muted-foreground text-xs">
                {index + 1} / {images.length}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
