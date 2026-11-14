// Informe y recuperación de expedientes (lógica pura, P6).

/** Nombre de archivo seguro para descargar el informe Markdown de un expediente. */
export function reportFileName(researchId: string): string {
  void researchId; throw new Error("Pendiente de implementación.");
}

/** Referencias persistidas por la interfaz (localStorage, con try/catch): últimos expedientes abiertos, más reciente primero, sin duplicados, máx. 10. */
export function loadRecentRuns(storage?: Pick<Storage, "getItem">): string[] {
  void storage; throw new Error("Pendiente de implementación.");
}
export function rememberRun(researchId: string, storage?: Pick<Storage, "getItem" | "setItem">): string[] {
  void researchId; void storage; throw new Error("Pendiente de implementación.");
}
