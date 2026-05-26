export function splitLocation(location: string | null | undefined): {
  place_name: string | null;
  address: string | null;
} {
  if (!location?.trim()) return { place_name: null, address: null };
  const idx = location.indexOf(",");
  if (idx === -1) return { place_name: location.trim(), address: null };
  return {
    place_name: location.slice(0, idx).trim(),
    address: location.slice(idx + 1).trim(),
  };
}
