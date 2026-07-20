export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const MAX_IMAGES_PER_ASSET = 10;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function isAllowedImageType(file: File): boolean {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return (
    ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]) ||
    ALLOWED_IMAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])
  );
}

export function validateImageFile(file: File): string | null {
  if (!isAllowedImageType(file)) {
    return `"${file.name}" is not supported. Please use JPG, JPEG, PNG, or WEBP.`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `"${file.name}" exceeds the 5 MB size limit.`;
  }
  return null;
}

export function validateImageBatch(
  files: File[],
  currentCount: number,
): { valid: File[]; errors: string[] } {
  const errors: string[] = [];
  const valid: File[] = [];
  const remaining = MAX_IMAGES_PER_ASSET - currentCount;

  if (remaining <= 0) {
    return { valid: [], errors: [`Maximum of ${MAX_IMAGES_PER_ASSET} images per asset reached.`] };
  }

  if (files.length > remaining) {
    errors.push(`You can only add ${remaining} more image${remaining === 1 ? "" : "s"} (max ${MAX_IMAGES_PER_ASSET} per asset).`);
  }

  for (const file of files.slice(0, remaining)) {
    const error = validateImageFile(file);
    if (error) errors.push(error);
    else valid.push(file);
  }

  return { valid, errors };
}
