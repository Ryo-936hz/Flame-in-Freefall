import type { RankingRequest } from "./client";
import type { Metric } from "./filters";

const CAMPAIGNS: Partial<Record<Metric, [string, string, string]>> = {
  flex_burn_duration_s: ["psi:PSI-69", "FLEX", "methanol"],
  flex_visible_flame_extinction_diameter_mm: ["psi:PSI-69", "FLEX", "methanol"],
  same_reported_mass_loss_rate_mg_min: ["psi:PSI-102", "SAME", "teflon"],
  samer_run_duration_s: ["psi:PSI-101", "SAME-R", "kapton"],
  samer_net_aging_time_s: ["psi:PSI-101", "SAME-R", "kapton"],
  samer_primary_aging_time_s: ["psi:PSI-101", "SAME-R", "kapton"],
  samer_primary_mixing_time_s: ["psi:PSI-101", "SAME-R", "kapton"],
  saffire_reported_burn_duration_s: ["psi:PSI-98", "Saffire I", "sibal fabric"],
  peak_burner_temperature_k: ["psi:PSI-159", "CFI-G", "ethane"],
  cfig_reported_run_duration_s: ["psi:PSI-159", "CFI-G", "ethane"],
};

export function metricPreset(metric: Metric): { name: string; request: RankingRequest } | undefined {
  if (metric === "flame_spread_rate_mm_s") return { name: "BASS-II", request: {
    study_ids: ["psi:PSI-25"], condition_scope: "segment", target: { gravity_regime: "microgravity" },
    required_match: ["gravity_regime"], vary: ["flow_velocity_cm_s"], allow_synthetic: false, limit: 20,
  } };
  const campaign = CAMPAIGNS[metric];
  if (!campaign) return;
  const [studyId, name, material] = campaign;
  return { name, request: { study_ids: [studyId], target: { material }, minimum_coverage: 0,
    allow_synthetic: false, limit: 20 } };
}
