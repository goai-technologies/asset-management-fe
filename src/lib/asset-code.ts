const ASSET_ID_PREFIX = "AI-";

/** Known category name → 3-letter abbreviation (case-insensitive). */
const CATEGORY_ABBREVIATIONS: Record<string, string> = {
  laptop: "LAP",
  laptops: "LAP",
  keyboard: "KEY",
  keyboards: "KEY",
  mouse: "MOU",
  mice: "MOU",
  monitor: "MON",
  monitors: "MON",
  desktop: "DES",
  desktops: "DES",
  printer: "PRI",
  printers: "PRI",
  mobile: "MOB",
  mobiles: "MOB",
  phone: "MOB",
  phones: "MOB",
  server: "SER",
  servers: "SER",
  router: "ROU",
  routers: "ROU",
  tablet: "TAB",
  tablets: "TAB",
  peripheral: "PER",
  peripherals: "PER",
  "docking station": "DOC",
  furniture: "FUR",
  other: "OTH",
};

/** Derive a 3-letter abbreviation from a category name. */
export function categoryToAbbreviation(categoryName: string): string {
  const normalized = categoryName.trim().toLowerCase();
  if (!normalized) return "AST";

  if (CATEGORY_ABBREVIATIONS[normalized]) {
    return CATEGORY_ABBREVIATIONS[normalized];
  }

  const firstWord = normalized.split(/\s+/)[0]?.replace(/[^a-z]/g, "") ?? "";
  if (firstWord.length >= 3) {
    return firstWord.slice(0, 3).toUpperCase();
  }
  if (firstWord.length > 0) {
    return firstWord.toUpperCase().padEnd(3, "X");
  }

  const letters = normalized.replace(/[^a-z]/g, "").toUpperCase();
  return (letters.slice(0, 3) || "AST").padEnd(3, "X");
}

type AssetCodeSource = {
  asset_code: string;
  category_id: string | null;
};

/**
 * Generate the next sequential Asset ID for a category: AI-{ABB}{001-999}.
 * Sequence increments independently per category_id.
 */
export function generateCategoryAssetCode(
  categoryId: string | null,
  categoryName: string,
  existingAssets: AssetCodeSource[],
): string {
  const abbrev = categoryToAbbreviation(categoryName);
  const codePrefix = `${ASSET_ID_PREFIX}${abbrev}`;
  const pattern = new RegExp(`^AI-${abbrev}(\\d{3})$`, "i");

  const categoryAssets = categoryId
    ? existingAssets.filter((asset) => asset.category_id === categoryId)
    : [];

  let maxSequence = 0;
  for (const asset of categoryAssets) {
    const match = asset.asset_code.match(pattern);
    if (match) {
      maxSequence = Math.max(maxSequence, Number.parseInt(match[1], 10));
    }
  }

  // Legacy IDs in the same category (non AI-XXX###) still consume sequence slots.
  if (maxSequence === 0 && categoryAssets.length > 0) {
    maxSequence = categoryAssets.length;
  }

  const nextSequence = maxSequence + 1;
  if (nextSequence > 999) {
    throw new Error(`Asset ID limit reached for category "${categoryName}"`);
  }

  return `${codePrefix}${String(nextSequence).padStart(3, "0")}`;
}
