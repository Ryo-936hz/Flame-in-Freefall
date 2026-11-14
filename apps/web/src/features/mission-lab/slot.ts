// Frontera de montaje P5 ↔ P6 (propuesta P6 sobre MissionSlotProps de P5).
// P5 monta MissionLabPanel y ReportPanel en su App.tsx y mantiene el estado compartido.
import type { createApi, RankingRequest, ResearchResponse } from "../../lib/client";

export type Api = ReturnType<typeof createApi>;

/** De dónde debe leer el visor común una evidencia. */
export type EvidenceSource =
  /** Snapshot persistido del expediente activo (GET /evidence/{id}?research_id=...). */
  | "record"
  /** Corpus activo actual, sin research_id: p. ej. ensayos que entran en un escenario B. */
  | "corpus";

/** Estado de la investigación activa que mantiene el host (P5). */
export type ResearchState = "idle" | "loading" | "error" | "ready";

export interface MissionSlotProps {
  api: Api;
  /** Investigación activa mostrada por el host; null si no hay. */
  research: ResearchResponse | null;
  /** Filtros actuales del formulario, ya validados por el host; null si el formulario no es válido. */
  request: RankingRequest | null;
  /** Estado de carga/error de la investigación activa en el host (opcional; por defecto deducido de research). */
  researchState?: ResearchState;
  /** Muestra en el host un expediente recuperado o recién creado por P6. */
  onOpenRun: (run: ResearchResponse) => void;
  /** Abre una evidencia en el visor común. source por defecto "record". */
  onOpenEvidence: (evidenceId: string, trialId: string | null, source?: EvidenceSource) => void;
}
