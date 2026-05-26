export function mapsDirectionsUrl(
  address: string | null,
  placeName: string | null,
): string | null {
  const q = address ?? placeName;
  if (!q?.trim()) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}
