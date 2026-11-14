"""Versioned software scales and canonical units (see METHOD.md)."""

from flamelab.domain.contracts import (
    CONDITION_KEYS, CONDITION_UNITS, METRIC_UNITS, ConditionStage, Trial,
)

# These are normalization scales, not measured domains or physical validity limits.
GOWER_SCALES_V1 = {
    "oxygen_pct": 100.0,
    "pressure_kpa": 200.0,
    "flow_velocity_cm_s": 100.0,
    "thickness_mm": 100.0,
    "diameter_mm": 1000.0,
    "sample_width_mm": 1000.0,
    "oxygen_initial_pct": 100.0,
    "oxygen_final_pct": 100.0,
    "burning_faces": 2.0,
    "burn_duration_s": 600.0,
}

MISSING_STATUSES = ("known", "not_measured", "not_reported", "not_extracted", "not_applicable")


def effective_conditions(trial: Trial, stage: ConditionStage | None):
    """Inherit trial conditions unless the stage explicitly supplies a value or absence."""
    return trial.conditions | stage.conditions if stage else trial.conditions


__all__ = ["CONDITION_KEYS", "CONDITION_UNITS", "GOWER_SCALES_V1", "METRIC_UNITS", "MISSING_STATUSES"]
