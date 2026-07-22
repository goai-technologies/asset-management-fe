export function getGoogleMapsSearchUrl(address: string): string {
  const query = address.trim();
  if (!query) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
