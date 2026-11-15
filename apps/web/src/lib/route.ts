/**
 * Hash routes for the two pages: the welcome page and the dashboard with its
 * views. Plain anchors such as "#brief" or "#evidence" are not routes; they keep
 * the current page so in-page links and skip links still work.
 */
export const VIEWS = ["overview", "investigate", "chat", "ai-research", "lab", "report", "catalog", "saffire"] as const;
export type View = typeof VIEWS[number];
export type Route = { page: "home" } | { page: "dashboard"; view: View; studyIds?: [string, string] };

export const HOME: Route = { page: "home" };

export function isView(value: string | undefined): value is View {
  return (VIEWS as readonly string[]).includes(value ?? "");
}

/** Returns null when the hash is an in-page anchor rather than a route. */
export function parseRoute(hash: string): Route | null {
  if (hash === "" || hash === "#" || hash === "#/") return HOME;
  if (!hash.startsWith("#/")) return null;
  const [page, view] = hash.slice(2).split(/[/?]/);
  if (page !== "dashboard") return HOME;
  if (view === "lab") {
    const studies = new URLSearchParams(hash.split("?")[1]).getAll("study");
    if (studies.length === 2 && studies[0] && studies[1] && studies[0] !== studies[1]) {
      return { page, view, studyIds: [studies[0], studies[1]] };
    }
  }
  return { page: "dashboard", view: isView(view) ? view : "overview" };
}

export function routeHash(route: Route): string {
  if (route.page === "home") return "#/";
  const pair = route.view === "lab" ? route.studyIds : undefined;
  const query = pair ? new URLSearchParams(pair.map((id) => ["study", id])).toString() : "";
  return `#/dashboard/${route.view}${query ? `?${query}` : ""}`;
}
