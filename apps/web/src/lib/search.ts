import { isM13Question } from "./m13Reference";
/**
 * Plain name search over what the app has already loaded: dashboard sections,
 * catalog studies and corpus trials. It does not interpret questions; every
 * query word must appear in the item's text.
 */
export type SearchKind = "section" | "study" | "trial" | "question";

export interface SearchItem {
  kind: SearchKind;
  id: string;
  title: string;
  detail: string;
  /** Extra text that matches but is not shown (ids, families, materials). */
  keywords?: string;
}

export const KIND_ORDER: SearchKind[] = ["question", "section", "study", "trial"];
export const KIND_LABEL: Record<SearchKind, string> = { section: "Sections", study: "Studies", trial: "Trials", question: "Research questions" };

/** Lowercase and drop accents so "catálogo" matches "catalogo". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function score(item: SearchItem, words: string[]): number | null {
  const title = normalize(item.title);
  const all = `${title} ${normalize(item.detail)} ${normalize(item.id)} ${normalize(item.keywords ?? "")}`;
  if (!words.every((word) => all.includes(word))) return null;
  const first = words[0]!;
  if (title.startsWith(first)) return 0;
  if (title.split(/[^a-z0-9]+/).some((part) => part.startsWith(first))) return 1;
  if (title.includes(first)) return 2;
  return 3;
}

/**
 * Matches grouped by kind, best first within each group. An empty query lists
 * only the sections, so the palette doubles as navigation.
 */
export function searchItems(items: SearchItem[], query: string, perKind = 6): SearchItem[] {
  if (isM13Question(query)) return items.filter(item => item.kind === "question" && item.id === "bass-m13-segments");
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return items.filter((item) => item.kind === "section");
  const ranked = items
    .map((item, index) => ({ item, index, rank: score(item, words) }))
    .filter((entry): entry is { item: SearchItem; index: number; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.index - b.index);
  return KIND_ORDER.flatMap((kind) => ranked.filter((entry) => entry.item.kind === kind).slice(0, perKind).map((entry) => entry.item));
}
