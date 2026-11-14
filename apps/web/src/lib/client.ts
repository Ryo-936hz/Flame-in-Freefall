import createClient from "openapi-fetch";
import type { components, paths } from "../../../../packages/contracts/schema";

// All wire models and paths come from the API's generated schema.
export type Models = components["schemas"];
export type RankingRequest = Models["RankingRequest"];
export type ResearchRequest = Models["ResearchRequest"];
export type ResearchResponse = Models["ResearchResponse"];
export type Evidence = Models["Evidence"];
export type Health = Models["HealthResponse"];
export type Profile = Models["ProfileResponse"];
export type ScenarioComparison = Models["ScenarioComparisonResponse"];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(status: number, body: unknown) {
    const error = body && typeof body === "object" ? body as Record<string, unknown> : {};
    super(typeof error.message === "string" ? error.message : `The API responded with HTTP ${status}.`);
    this.name = "ApiError";
    this.status = status;
    this.code = typeof error.code === "string" ? error.code : "http_error";
    this.requestId = typeof error.request_id === "string" ? error.request_id : null;
  }
}

function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (!result.response.ok) throw new ApiError(result.response.status, result.error);
  if (result.data === undefined) throw new ApiError(502, { code: "empty_response", message: "Unexpected empty response." });
  return result.data;
}

export function createApi(baseUrl = "", fetcher: typeof fetch = fetch) {
  const client = createClient<paths>({ baseUrl: baseUrl.replace(/\/$/, ""), fetch: fetcher });
  return {
    health: async () => unwrap(await client.GET("/api/v1/health")),
    studies: async () => unwrap(await client.GET("/api/v1/studies")),
    trials: async (studyId?: string) => unwrap(await client.GET("/api/v1/trials", { params: { query: { study_id: studyId } } })),
    profile: async () => unwrap(await client.GET("/api/v1/datasets/profile")),
    evidence: async (id: string, researchId?: string) => unwrap(await client.GET("/api/v1/evidence/{evidence_id}", { params: { path: { evidence_id: id }, query: { research_id: researchId } } })),
    rank: async (body: RankingRequest) => unwrap(await client.POST("/api/v1/rankings", { body })),
    compare: async (body: Models["ComparisonRequest"]) => unwrap(await client.POST("/api/v1/comparisons", { body })),
    research: async (body: ResearchRequest) => unwrap(await client.POST("/api/v1/research", { body })),
    getResearch: async (id: string) => unwrap(await client.GET("/api/v1/research/{run_id}", { params: { path: { run_id: id } } })),
    scenarios: async (body: Models["ScenarioComparisonRequest"]) => unwrap(await client.POST("/api/v1/scenarios/compare", { body })),
    report: async (id: string) => unwrap(await client.GET("/api/v1/research/{run_id}/report", { params: { path: { run_id: id } }, parseAs: "text" })),
    events: async (id: string) => unwrap(await client.GET("/api/v1/research/{run_id}/events", { params: { path: { run_id: id } }, parseAs: "text" }))
  };
}

export type Api = ReturnType<typeof createApi>;

export function sourceLink(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export const demoRanking: RankingRequest = {
  target: { gravity_regime: "microgravity" },
  required_match: ["gravity_regime"],
  vary: ["flow_velocity_cm_s"],
  allow_synthetic: true,
  minimum_coverage: 0.6,
  limit: 3
};
