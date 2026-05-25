export function inferEventCategory(
  title: string,
  description?: string | null,
): string {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  if (
    /\bdrive\b|heading to|head to|~.*\bmin\b.*drive|en route/.test(text)
  ) {
    return "travel";
  }
  if (/\bcoffee\b|burrito|espresso|cafe/.test(text)) return "coffee";
  if (
    /\bdinner\b|\blunch\b|\bbreakfast\b|steak|restaurant|kitchen in the desert|eat\b|meal/.test(
      text,
    )
  ) {
    return "meal";
  }
  if (/\bcamp\b|sleep|hotel|airbnb|lodging|apartment/.test(text)) {
    return "lodging";
  }
  return "activity";
}

export function isDriveEvent(
  title: string,
  category: string | null | undefined,
): boolean {
  if (category === "travel") return true;
  return /\bdrive\b|en route|heading to/i.test(title);
}
