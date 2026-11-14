import type { Models, RankingRequest } from "./client";
import type { Metric } from "./filters";

const CAMPAIGNS: Partial<Record<Metric, { id: string; name: string; material: string }>> = {
  flex_burn_duration_s: { id: "psi:PSI-69", name: "FLEX", material: "methanol" },
  flex_visible_flame_extinction_diameter_mm: { id: "psi:PSI-69", name: "FLEX", material: "methanol" },
  same_reported_mass_loss_rate_mg_min: { id: "psi:PSI-102", name: "SAME", material: "teflon" },
  samer_run_duration_s: { id: "psi:PSI-101", name: "SAME-R", material: "kapton" },
  samer_net_aging_time_s: { id: "psi:PSI-101", name: "SAME-R", material: "kapton" },
  samer_primary_aging_time_s: { id: "psi:PSI-101", name: "SAME-R", material: "kapton" },
  samer_primary_mixing_time_s: { id: "psi:PSI-101", name: "SAME-R", material: "kapton" },
  saffire_reported_burn_duration_s: { id: "psi:PSI-98", name: "Saffire I", material: "sibal fabric" },
  peak_burner_temperature_k: { id: "psi:PSI-159", name: "CFI-G", material: "ethane" },
  cfig_reported_run_duration_s: { id: "psi:PSI-159", name: "CFI-G", material: "ethane" },
};

export function metricPreset(metric: Metric, trials: Models["Trial"][]): { name: string; request: RankingRequest } | undefined {
  const measured = (id: string) => trials.some((trial) => trial.study_id === id && trial.provenance !== "synthetic");
  if (metric === "flame_spread_rate_mm_s" && measured("psi:PSI-25")) {
    return { name: "BASS-II", request: {
      study_ids: ["psi:PSI-25"], condition_scope: "segment", target: { gravity_regime: "microgravity" },
      required_match: ["gravity_regime"], vary: ["flow_velocity_cm_s"], allow_synthetic: false, limit: 20,
    } };
  }
  const campaign = CAMPAIGNS[metric];
  if (!campaign || !measured(campaign.id)) return undefined;
  return { name: campaign.name, request: {
    study_ids: [campaign.id], target: { material: campaign.material }, minimum_coverage: 0, allow_synthetic: false, limit: 20,
  } };
}
