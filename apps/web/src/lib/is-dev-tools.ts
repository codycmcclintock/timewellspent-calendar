/** Dev-only settings and destructive actions. */
export function isDevToolsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_LOGIN === "true"
  );
}
