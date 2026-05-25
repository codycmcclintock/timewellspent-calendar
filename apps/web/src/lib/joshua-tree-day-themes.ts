export const JOSHUA_TREE_DAY_THEMES: Record<
  string,
  { title: string; subtitle: string }
> = {
  "2026-05-15": {
    title: "Slow LA night",
    subtitle: "Relax, fuel up, sleep early.",
  },
  "2026-05-16": {
    title: "Desert arrival",
    subtitle: "Market, camp, stargaze.",
  },
  "2026-05-17": {
    title: "Sunrise horseback → hikes → dinner",
    subtitle: "The big day.",
  },
  "2026-05-18": {
    title: "Laguna reset",
    subtitle: "Ocean, gym, work day.",
  },
};

export function dayThemeFor(dateKey: string) {
  return (
    JOSHUA_TREE_DAY_THEMES[dateKey] ?? {
      title: "Adventure",
      subtitle: "Your shared day.",
    }
  );
}
