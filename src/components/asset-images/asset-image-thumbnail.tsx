import { useRef, useState } from "react";
import { X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/asset-images";
import type { ImageUploadItem } from "@/lib/asset-images";

export function AssetImageThumbnail({
  image,
  onRemove,
  onPreview,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
}: {
  image: ImageUploadItem;
  onRemove?: () => void;
  onPreview: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  isDragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card overflow-hidden transition-opacity",
        isDragging && "opacity-50",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {draggable && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-white drop-shadow" />
        </div>
      )}

      <button
        type="button"
        className="block w-full aspect-square overflow-hidden bg-muted"
        onClick={onPreview}
      >
        <img
          src={image.imageUrl}
          alt={image.fileName}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </button>

      <div className="p-2 space-y-0.5">
        <p className="text-xs font-medium truncate" title={image.fileName}>{image.fileName}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(image.fileSize)}</p>
      </div>

      {onRemove && (
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Remove image"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function useImageFileInput(onFiles: (files: File[]) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const open = () => inputRef.current?.click();

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      multiple
      className="hidden"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length) onFiles(files);
        e.target.value = "";
      }}
    />
  );

  return { inputRef, input, open };
}

export function UploadProgressBar({ progress }: { progress: number | null }) {
  if (progress === null) return null;
  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
      <div
        className="h-full bg-primary transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
