// Informe y recuperación de expedientes (lógica pura, P6).
// El informe se consume tal cual desde GET /api/v1/research/{id}/report; aquí no se reconstruye.

/** Clave de localStorage con los ids de expedientes abiertos recientemente. */
export const RECENT_RUNS_KEY = "flamelab.recentRuns.v1";
/** Máximo de expedientes recientes recordados. */
export const MAX_RECENT_RUNS = 10;
/** Longitud máxima aceptada para un id recordado (evita llenar el almacenamiento con basura). */
const MAX_ID_LENGTH = 200;

/** Nombre de archivo seguro para descargar el informe Markdown de un expediente. */
export function reportFileName(researchId: string): string {
  const slug = String(researchId ?? "")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120)
    .replace(/[-.]+$/g, "");
  return `flamelab-report-${slug || "research"}.md`;
}

function defaultStorage(): Pick<Storage, "getItem" | "setItem"> | undefined {
  try {
    return typeof globalThis.localStorage === "undefined" ? undefined : globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function cleanId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id && id.length <= MAX_ID_LENGTH ? id : null;
}

function normalize(values: unknown[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    const id = cleanId(value);
    if (id && !out.includes(id)) out.push(id);
    if (out.length >= MAX_RECENT_RUNS) break;
  }
  return out;
}

/** Referencias persistidas por la interfaz (localStorage, con try/catch): últimos expedientes abiertos, más reciente primero, sin duplicados, máx. 10. */
export function loadRecentRuns(storage?: Pick<Storage, "getItem">): string[] {
  try {
    const target = storage ?? defaultStorage();
    if (!target) return [];
    const raw = target.getItem(RECENT_RUNS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? normalize(parsed) : [];
  } catch {
    return [];
  }
}

/** Session ids preserve recency when storage is unavailable or rejects writes. */
export function rememberRun(
  researchId: string, storage?: Pick<Storage, "getItem" | "setItem">, session: readonly string[] = []
): string[] {
  const target = storage ?? defaultStorage();
  const current = normalize([...session, ...loadRecentRuns(target)]);
  const id = cleanId(researchId);
  if (!id) return current;
  const next = normalize([id, ...current]);
  try {
    target?.setItem(RECENT_RUNS_KEY, JSON.stringify(next));
  } catch {
    // Almacenamiento lleno, bloqueado o modo privado: la lista vale solo para esta sesión.
  }
  return next;
}
