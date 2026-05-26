export function normalizeSourceUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    u.search = "";
    let path = u.pathname.replace(/\/$/, "");
    return `${u.hostname}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}
