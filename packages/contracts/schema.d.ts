// Generated from packages/contracts/openapi.json. Do not edit.
export interface paths {
    "/api/v1/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Chat */
        post: operations["chat_api_v1_chat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/comparisons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Compare */
        post: operations["compare_api_v1_comparisons_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/datasets/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Profile */
        get: operations["profile_api_v1_datasets_profile_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/evidence/{evidence_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Evidence */
        get: operations["evidence_api_v1_evidence__evidence_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_api_v1_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rankings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Rank */
        post: operations["rank_api_v1_rankings_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/research": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Research */
        post: operations["research_api_v1_research_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/research/plan": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Research Plan */
        post: operations["research_plan_api_v1_research_plan_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/research/{run_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Research */
        get: operations["get_research_api_v1_research__run_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/research/{run_id}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Events */
        get: operations["events_api_v1_research__run_id__events_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/research/{run_id}/report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Report */
        get: operations["report_api_v1_research__run_id__report_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/scenarios/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Scenarios */
        post: operations["scenarios_api_v1_scenarios_compare_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Studies */
        get: operations["studies_api_v1_studies_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studies/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Search Studies */
        post: operations["search_studies_api_v1_studies_search_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studies/{study_id}/chart": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Study Chart */
        get: operations["study_chart_api_v1_studies__study_id__chart_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studies/{study_id}/evidence": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Study Evidence */
        get: operations["study_evidence_api_v1_studies__study_id__evidence_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studies/{study_id}/observations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Study Observations */
        get: operations["study_observations_api_v1_studies__study_id__observations_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trials": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Trials */
        get: operations["trials_api_v1_trials_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trials/{trial_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Trial */
        get: operations["trial_api_v1_trials__trial_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** ActivityEvent */
        ActivityEvent: {
            /** Evidence Ids */
            evidence_ids?: string[];
            /** Message */
            message: string;
            /** Sequence */
            sequence: number;
            /**
             * Stage
             * @enum {string}
             */
            stage: "plan" | "retrieve" | "analyze" | "review" | "complete" | "error";
        };
        /** ChatRequest */
        ChatRequest: {
            /** Previous Question */
            previous_question?: string | null;
            /** Question */
            question: string;
            /** Research Id */
            research_id?: string | null;
        };
        /** ChatResponse */
        ChatResponse: {
            /** Answer */
            answer: string;
            /** Comparison Studies */
            comparison_studies?: string[];
            /** Elapsed Ms */
            elapsed_ms: number;
            /**
             * Provider
             * @enum {string}
             */
            provider: "catalog" | "qwen";
            /** Sources */
            sources: components["schemas"]["ChatSource"][];
            /** Suggested Question */
            suggested_question?: string | null;
            /** Technical Details */
            technical_details?: string[];
        };
        /** ChatSource */
        ChatSource: {
            /** Evidence Id */
            evidence_id?: string | null;
            /** Research Id */
            research_id?: string | null;
            /**
             * Section
             * @enum {string}
             */
            section: "dashboard" | "brief" | "canvas" | "ranking" | "lab" | "catalog" | "evidence" | "synthesis";
            /** Study Id */
            study_id?: string | null;
            /** Text */
            text: string;
            /** Title */
            title: string;
        };
        /** Citation */
        Citation: {
            /** Evidence Id */
            evidence_id: string;
            /** Trial Id */
            trial_id?: string | null;
        };
        /** Claim */
        Claim: {
            /** Citations */
            citations: components["schemas"]["Citation"][];
            /**
             * Kind
             * @enum {string}
             */
            kind: "finding" | "inference" | "limitation";
            /** Text */
            text: string;
        };
        /** ComparisonGroup */
        ComparisonGroup: {
            /** Conditions */
            conditions: {
                [key: string]: string;
            };
            /** Id */
            id: string;
            /** Interval */
            interval?: null;
            /** Median */
            median: number | null;
            /** N Independent Units */
            n_independent_units: number;
            /** N Observations */
            n_observations: number;
            /**
             * N Segments
             * @default 0
             */
            n_segments?: number;
            /** N Trials */
            n_trials: number;
            /**
             * N Trials With Unresolved Independence
             * @default 0
             */
            n_trials_with_unresolved_independence?: number;
            /** Trial Ids */
            trial_ids: string[];
            /** Warnings */
            warnings: string[];
        };
        /** ComparisonRequest */
        ComparisonRequest: {
            /**
             * Allow Synthetic
             * @default false
             */
            allow_synthetic?: boolean;
            /**
             * Metric
             * @default flame_spread_rate_mm_s
             * @enum {string}
             */
            metric?: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other";
            /** Segment Ids */
            segment_ids?: string[];
            /** Trial Ids */
            trial_ids: string[];
            /** Vary */
            vary?: ("oxygen_pct" | "oxygen_initial_pct" | "oxygen_final_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "combustion_face" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "burning_faces" | "burn_duration_s" | "test_end" | "test_configuration" | "aging_duration_s" | "ignition_power_w" | "ignition_duration_s")[];
            /**
             * X Condition
             * @default flow_velocity_cm_s
             * @enum {string}
             */
            x_condition?: "oxygen_pct" | "oxygen_initial_pct" | "oxygen_final_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "combustion_face" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "burning_faces" | "burn_duration_s" | "test_end" | "test_configuration" | "aging_duration_s" | "ignition_power_w" | "ignition_duration_s";
        };
        /** ComparisonResponse */
        ComparisonResponse: {
            /** Groups */
            groups: components["schemas"]["ComparisonGroup"][];
            /**
             * Metric
             * @enum {string}
             */
            metric: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other";
            /** Points */
            points: components["schemas"]["PlotPoint"][];
            /** Unit */
            unit: string;
            /** Warnings */
            warnings: string[];
            /**
             * X Condition
             * @default flow_velocity_cm_s
             * @enum {string}
             */
            x_condition?: "oxygen_pct" | "oxygen_initial_pct" | "oxygen_final_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "combustion_face" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "burning_faces" | "burn_duration_s" | "test_end" | "test_configuration" | "aging_duration_s" | "ignition_power_w" | "ignition_duration_s";
            /**
             * X Unit
             * @default cm/s
             */
            x_unit?: string | null;
        };
        /**
         * ConditionSegment
         * @description Source-reported effective conditions within one physical trial.
         */
        ConditionSegment: {
            /** Conditions */
            conditions: {
                [key: string]: components["schemas"]["ConditionValue"];
            };
            /** Evidence Ids */
            evidence_ids: string[];
            /** Id */
            id: string;
            /** Sequence */
            sequence: number;
        };
        /** ConditionValue */
        ConditionValue: {
            /** Evidence Ids */
            evidence_ids?: string[];
            /** Original Unit */
            original_unit?: string | null;
            /** Original Value */
            original_value?: string | null;
            /**
             * Status
             * @default not_reported
             * @enum {string}
             */
            status?: "known" | "not_measured" | "not_reported" | "not_extracted" | "not_applicable";
            /** Unit */
            unit?: string | null;
            /** Value */
            value?: number | string | null;
        };
        /** ErrorResponse */
        ErrorResponse: {
            /** Code */
            code: string;
            /** Message */
            message: string;
            /** Request Id */
            request_id?: string | null;
        };
        /** Evidence */
        Evidence: {
            /** Id */
            id: string;
            /** Locator */
            locator: string;
            /** Page */
            page?: number | null;
            /**
             * Provenance
             * @enum {string}
             */
            provenance: "published" | "digitized" | "derived" | "synthetic";
            /**
             * Reviewed
             * @default false
             */
            reviewed?: boolean;
            /** Source Url */
            source_url?: string | null;
            /** Study Id */
            study_id: string;
            /** Text */
            text: string;
            /** Title */
            title: string;
        };
        /** HealthResponse */
        HealthResponse: {
            /** Ai Provider */
            ai_provider: string;
            /** Data Mode */
            data_mode: string;
            /** Database */
            database: string;
            /** Schema Version */
            schema_version: string;
            /**
             * Status
             * @enum {string}
             */
            status: "ok" | "degraded";
            /** Version */
            version: string;
        };
        /** Hypothesis */
        Hypothesis: {
            /** Alternative Explanation */
            alternative_explanation: string;
            /** Evidence Ids */
            evidence_ids: string[];
            /** Falsification */
            falsification: string;
            /** Id */
            id: string;
            /**
             * Label
             * @enum {string}
             */
            label: "ai_hypothesis" | "prepared_demo_hypothesis";
            /** Next Measurement */
            next_measurement: string;
            /** Rationale */
            rationale: string;
            /** Statement */
            statement: string;
        };
        /** Observation */
        Observation: {
            /** Evidence Ids */
            evidence_ids: string[];
            /** Id */
            id: string;
            /**
             * Metric
             * @enum {string}
             */
            metric: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other";
            /** Original Unit */
            original_unit?: string | null;
            /** Original Value */
            original_value?: string | null;
            /**
             * Provenance
             * @enum {string}
             */
            provenance: "published" | "digitized" | "derived" | "synthetic";
            /** Segment Id */
            segment_id?: string | null;
            /**
             * Status
             * @default known
             * @enum {string}
             */
            status?: "known" | "not_measured" | "not_reported" | "not_extracted" | "not_applicable";
            /** Trial Id */
            trial_id: string;
            /** Uncertainty */
            uncertainty?: null;
            /** Unit */
            unit: string;
            /** Value */
            value?: number | null;
        };
        /** Panel */
        Panel: {
            /**
             * Data Ref
             * @enum {string}
             */
            data_ref: "ranking" | "comparison" | "evidence" | "hypotheses" | "warnings";
            /** Id */
            id: string;
            /**
             * Kind
             * @enum {string}
             */
            kind: "ranking" | "comparison" | "evidence" | "hypotheses" | "limitations";
            /** Title */
            title: string;
        };
        /** PlotPoint */
        PlotPoint: {
            /** Evidence Ids */
            evidence_ids: string[];
            /** Group Id */
            group_id: string;
            /** Independent Unit Id */
            independent_unit_id: string;
            /**
             * Independent Unit Status
             * @default identified
             * @enum {string}
             */
            independent_unit_status?: "identified" | "unresolved";
            /** Observation Id */
            observation_id: string;
            /** Original Unit */
            original_unit?: string | null;
            /** Original Value */
            original_value?: string | null;
            /**
             * Provenance
             * @enum {string}
             */
            provenance: "published" | "digitized" | "derived" | "synthetic";
            /** Segment Id */
            segment_id?: string | null;
            /** Trial Id */
            trial_id: string;
            /** X */
            x: number | null;
            /** Y */
            y: number;
        };
        /** ProfileResponse */
        ProfileResponse: {
            /** Dataset Id */
            dataset_id: string;
            /** Issues */
            issues: string[];
            /** Missing By Condition */
            missing_by_condition: {
                [key: string]: {
                    [key: string]: number;
                };
            };
            /** Missing By Segment Condition */
            missing_by_segment_condition?: {
                [key: string]: {
                    [key: string]: number;
                };
            };
            /** Missing By Study */
            missing_by_study?: {
                [key: string]: {
                    [key: string]: {
                        [key: string]: number;
                    };
                };
            };
            /** N Independent Units */
            n_independent_units: number;
            /** N Observations */
            n_observations: number;
            /**
             * N Segments
             * @default 0
             */
            n_segments?: number;
            /** N Studies */
            n_studies: number;
            /** N Trials */
            n_trials: number;
            /**
             * N Trials With Unresolved Independence
             * @default 0
             */
            n_trials_with_unresolved_independence?: number;
            /** Synthetic Trials */
            synthetic_trials: number;
        };
        /** RankedTrial */
        RankedTrial: {
            /** Contributions */
            contributions: components["schemas"]["RankingContribution"][];
            /** Coverage */
            coverage: number;
            /**
             * Eligibility
             * @enum {string}
             */
            eligibility: "eligible" | "excluded" | "indeterminate";
            /** Eligible Segment Ids */
            eligible_segment_ids?: string[];
            /** Evidence Ids */
            evidence_ids: string[];
            /**
             * Provenance
             * @enum {string}
             */
            provenance: "published" | "digitized" | "derived" | "synthetic";
            /** Reasons */
            reasons: string[];
            /** Scored Segment Id */
            scored_segment_id?: string | null;
            /** Similarity */
            similarity?: number | null;
            /** Trial Id */
            trial_id: string;
        };
        /** RankingContribution */
        RankingContribution: {
            /** Candidate */
            candidate: number | string | null;
            /** Distance */
            distance?: number | null;
            /** Note */
            note: string;
            /** Target */
            target: number | string | null;
            /**
             * Variable
             * @enum {string}
             */
            variable: "oxygen_pct" | "oxygen_initial_pct" | "oxygen_final_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "combustion_face" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "burning_faces" | "burn_duration_s" | "test_end" | "test_configuration" | "aging_duration_s" | "ignition_power_w" | "ignition_duration_s";
            /** Weight */
            weight: number;
        };
        /** RankingRequest */
        RankingRequest: {
            /**
             * Allow Synthetic
             * @default false
             */
            allow_synthetic?: boolean;
            /**
             * Condition Scope
             * @default trial
             * @enum {string}
             */
            condition_scope?: "trial" | "segment";
            /**
             * Limit
             * @default 3
             */
            limit?: number;
            /**
             * Minimum Coverage
             * @default 0.6
             */
            minimum_coverage?: number;
            /** Required Match */
            required_match?: ("oxygen_pct" | "oxygen_initial_pct" | "oxygen_final_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "combustion_face" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "burning_faces" | "burn_duration_s" | "test_end" | "test_configuration" | "aging_duration_s" | "ignition_power_w" | "ignition_duration_s")[];
            /** Study Ids */
            study_ids?: string[];
            /** Target */
            target?: {
                [key: string]: number | string;
            };
            /** Vary */
            vary?: ("oxygen_pct" | "oxygen_initial_pct" | "oxygen_final_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "combustion_face" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "burning_faces" | "burn_duration_s" | "test_end" | "test_configuration" | "aging_duration_s" | "ignition_power_w" | "ignition_duration_s")[];
            /** Weights */
            weights?: {
                [key: string]: number;
            };
        };
        /** RankingResponse */
        RankingResponse: {
            /** Dataset Id */
            dataset_id: string;
            /** Excluded */
            excluded: components["schemas"]["RankedTrial"][];
            /** Items */
            items: components["schemas"]["RankedTrial"][];
            /**
             * Method
             * @default compatibility_then_weighted_gower_v1
             */
            method?: string;
            /**
             * Schema Version
             * @default 1.0
             * @constant
             */
            schema_version?: "1.0";
            /** Warnings */
            warnings: string[];
        };
        /**
         * ResearchPlan
         * @description Inspectable deterministic plan; it is not a model-generated program.
         */
        ResearchPlan: {
            /**
             * Blocked
             * @default false
             */
            blocked?: boolean;
            /**
             * Intent
             * @enum {string}
             */
            intent: "explicit_filters" | "compare_varying_flow" | "scenario_change" | "assess_evidence" | "ambiguous" | "unsupported";
            /** Limits */
            limits?: string[];
            /** Message */
            message: string;
            /**
             * Metric
             * @enum {string}
             */
            metric: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other";
            /**
             * Planning Mode
             * @default explicit
             * @enum {string}
             */
            planning_mode?: "explicit" | "catalog";
            ranking: components["schemas"]["RankingRequest"];
            /** X Condition */
            x_condition?: ("oxygen_pct" | "oxygen_initial_pct" | "oxygen_final_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "combustion_face" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "burning_faces" | "burn_duration_s" | "test_end" | "test_configuration" | "aging_duration_s" | "ignition_power_w" | "ignition_duration_s") | null;
        };
        /** ResearchRequest */
        ResearchRequest: {
            /**
             * Include Hypotheses
             * @default true
             */
            include_hypotheses?: boolean;
            /**
             * Metric
             * @default flame_spread_rate_mm_s
             * @enum {string}
             */
            metric?: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other";
            /**
             * Planning Mode
             * @default explicit
             * @enum {string}
             */
            planning_mode?: "explicit" | "catalog";
            /** Question */
            question: string;
            ranking?: components["schemas"]["RankingRequest"];
        };
        /** ResearchResponse */
        ResearchResponse: {
            /** Claims */
            claims: components["schemas"]["Claim"][];
            comparison: components["schemas"]["ComparisonResponse"] | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Events */
            events: components["schemas"]["ActivityEvent"][];
            /** Evidence */
            evidence: components["schemas"]["Evidence"][];
            /** Hypotheses */
            hypotheses: components["schemas"]["Hypothesis"][];
            /** Id */
            id: string;
            /** Panels */
            panels: components["schemas"]["Panel"][];
            plan?: components["schemas"]["ResearchPlan"] | null;
            /**
             * Provider
             * @enum {string}
             */
            provider: "demo" | "openai" | "qwen";
            /** Question */
            question: string;
            ranking: components["schemas"]["RankingResponse"];
            /**
             * Schema Version
             * @default 1.0
             * @constant
             */
            schema_version?: "1.0";
            /**
             * Status
             * @enum {string}
             */
            status: "completed" | "insufficient_evidence";
            /** Summary */
            summary: string;
            /** Warnings */
            warnings: string[];
        };
        /** ScenarioComparisonRequest */
        ScenarioComparisonRequest: {
            /** Metric */
            metric?: ("flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other") | null;
            /**
             * Name A
             * @default Scenario A
             */
            name_a?: string;
            /**
             * Name B
             * @default Scenario B
             */
            name_b?: string;
            /** Question */
            question?: string | null;
            scenario_a: components["schemas"]["RankingRequest"];
            scenario_b: components["schemas"]["RankingRequest"];
        };
        /** ScenarioComparisonResponse */
        ScenarioComparisonResponse: {
            /** Highlighted Trial Ids */
            highlighted_trial_ids?: string[] | null;
            /**
             * Label
             * @default evidence_comparison_not_physical_simulation
             * @constant
             */
            label?: "evidence_comparison_not_physical_simulation";
            /** Metric */
            metric?: ("flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other") | null;
            /** Name A */
            name_a: string;
            /** Name B */
            name_b: string;
            ranking_a: components["schemas"]["RankingResponse"];
            ranking_b: components["schemas"]["RankingResponse"];
            /** Warnings */
            warnings: string[];
        };
        /** Study */
        Study: {
            /**
             * Dataset Status
             * @enum {string}
             */
            dataset_status: "metadata_only" | "unverified" | "reviewed" | "synthetic";
            /**
             * Description
             * @default
             */
            description?: string;
            /** Family */
            family: string;
            /** Id */
            id: string;
            /** Source Urls */
            source_urls?: string[];
            /** Title */
            title: string;
        };
        /** StudyChartData */
        StudyChartData: {
            /** Metrics */
            metrics: components["schemas"]["StudyMetricSummary"][];
            study: components["schemas"]["Study"];
        };
        /** StudyEvidencePage */
        StudyEvidencePage: {
            /** Items */
            items: components["schemas"]["Evidence"][];
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** StudyMetricSummary */
        StudyMetricSummary: {
            /** Known Observations */
            known_observations: number;
            /** Median */
            median: number;
            /**
             * Metric
             * @enum {string}
             */
            metric: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other";
            /** Unit */
            unit: string;
        };
        /** StudyObservationPage */
        StudyObservationPage: {
            /** Items */
            items: components["schemas"]["Observation"][];
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** StudySearchRequest */
        StudySearchRequest: {
            /** Question */
            question: string;
        };
        /** StudySearchResponse */
        StudySearchResponse: {
            /**
             * Provider
             * @enum {string}
             */
            provider: "catalog" | "qwen";
            /** Studies */
            studies: components["schemas"]["Study"][];
        };
        /** Trial */
        Trial: {
            /** Conditions */
            conditions: {
                [key: string]: components["schemas"]["ConditionValue"];
            };
            /** Evidence Ids */
            evidence_ids: string[];
            /** Id */
            id: string;
            /** Independent Unit Id */
            independent_unit_id: string;
            /**
             * Independent Unit Status
             * @default identified
             * @enum {string}
             */
            independent_unit_status?: "identified" | "unresolved";
            /** Label */
            label: string;
            /** Material Grade */
            material_grade?: string | null;
            /** Notes */
            notes?: string[];
            /**
             * Provenance
             * @enum {string}
             */
            provenance: "published" | "digitized" | "derived" | "synthetic";
            /** Sample Id */
            sample_id: string;
            /** Segments */
            segments?: components["schemas"]["ConditionSegment"][];
            /** Study Id */
            study_id: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    chat_api_v1_chat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChatRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    compare_api_v1_comparisons_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ComparisonRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ComparisonResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    profile_api_v1_datasets_profile_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    evidence_api_v1_evidence__evidence_id__get: {
        parameters: {
            query?: {
                research_id?: string | null;
            };
            header?: never;
            path: {
                evidence_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Evidence"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    health_api_v1_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    rank_api_v1_rankings_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RankingRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RankingResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    research_api_v1_research_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResearchRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResearchResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    research_plan_api_v1_research_plan_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResearchRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResearchPlan"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    get_research_api_v1_research__run_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResearchResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    events_api_v1_research__run_id__events_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Replay of persisted events, not live streaming */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": string;
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    report_api_v1_research__run_id__report_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/markdown": string;
                    "text/plain": string;
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    scenarios_api_v1_scenarios_compare_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScenarioComparisonRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScenarioComparisonResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    studies_api_v1_studies_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Study"][];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    search_studies_api_v1_studies_search_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StudySearchRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudySearchResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    study_chart_api_v1_studies__study_id__chart_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                study_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudyChartData"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    study_evidence_api_v1_studies__study_id__evidence_get: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
            };
            header?: never;
            path: {
                study_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudyEvidencePage"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    study_observations_api_v1_studies__study_id__observations_get: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
                metric?: ("flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "flex_burn_duration_s" | "flex_visible_flame_extinction_diameter_mm" | "same_reported_mass_loss_rate_mg_min" | "samer_run_duration_s" | "samer_net_aging_time_s" | "samer_primary_aging_time_s" | "samer_primary_mixing_time_s" | "saffire_reported_burn_duration_s" | "peak_burner_temperature_k" | "cfig_reported_run_duration_s" | "other") | null;
            };
            header?: never;
            path: {
                study_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudyObservationPage"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    trials_api_v1_trials_get: {
        parameters: {
            query?: {
                study_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Trial"][];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    trial_api_v1_trials__trial_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trial_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Trial"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
