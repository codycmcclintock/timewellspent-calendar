export type ItemType =
  | "drive"
  | "coffee"
  | "hike"
  | "meal"
  | "activity"
  | "shop"
  | "stay"
  | "moment"
  | "transit";

export function inferItemType(
  title: string,
  description?: string | null,
): ItemType {
  const t = `${title} ${description ?? ""}`.toLowerCase();
  if (t.includes("drive to") || (t.includes("drive ") && !t.includes("kitchen"))) {
    return "drive";
  }
  if (/\bdrive\b|heading to|head to|en route/.test(t)) return "drive";
  if (t.includes("coffee") || t.includes("burrito")) return "coffee";
  if (
    t.includes("hike") ||
    t.includes("rock") ||
    t.includes("valley") ||
    t.includes("hall of") ||
    t.includes("keys view")
  ) {
    return "hike";
  }
  if (
    t.includes("dinner") ||
    t.includes("breakfast") ||
    t.includes("lunch") ||
    t.includes("kitchen in the desert")
  ) {
    return "meal";
  }
  if (t.includes("horseback") || t.includes("cascade")) return "activity";
  if (
    t.includes("thrifting") ||
    t.includes("market") ||
    t.includes("community goods")
  ) {
    return "shop";
  }
  if (
    t.includes("camp") ||
    t.includes("sleep") ||
    t.includes("apartment") ||
    t.includes("wake up")
  ) {
    return "stay";
  }
  if (t.includes("sunset") || t.includes("transmission") || t.includes("picnic")) {
    return "moment";
  }
  if (t.includes("workout") || t.includes("gym")) return "activity";
  return "activity";
}

export function itemTypeIcon(type: string | null | undefined): string {
  switch (type) {
    case "drive":
    case "transit":
      return "🚗";
    case "coffee":
      return "☕";
    case "hike":
      return "🥾";
    case "meal":
      return "🍽";
    case "shop":
      return "🛍";
    case "stay":
      return "🏨";
    case "moment":
      return "💫";
    case "activity":
    default:
      return "🎟";
  }
}
