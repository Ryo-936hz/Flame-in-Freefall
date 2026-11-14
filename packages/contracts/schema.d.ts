// Generated from packages/contracts/openapi.json. Do not edit.
export interface paths {
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
            /**
             * N Condition Stages
             * @default 0
             */
            n_condition_stages?: number;
            /** N Independent Units */
            n_independent_units: number;
            /** N Observations */
            n_observations: number;
            /** N Trials */
            n_trials: number;
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
            /** Condition Ids */
            condition_ids?: string[];
            /**
             * Metric
             * @default flame_spread_rate_mm_s
             * @enum {string}
             */
            metric?: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "other";
            /** Trial Ids */
            trial_ids: string[];
            /** Vary */
            vary?: ("oxygen_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "oxygen_initial_pct" | "oxygen_final_pct" | "burning_faces" | "burn_duration_s")[];
            /**
             * X Condition
             * @default flow_velocity_cm_s
             * @enum {string}
             */
            x_condition?: "oxygen_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "oxygen_initial_pct" | "oxygen_final_pct" | "burning_faces" | "burn_duration_s";
        };
        /** ComparisonResponse */
        ComparisonResponse: {
            /** Groups */
            groups: components["schemas"]["ComparisonGroup"][];
            /**
             * Metric
             * @enum {string}
             */
            metric: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "other";
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
            x_condition?: "oxygen_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "oxygen_initial_pct" | "oxygen_final_pct" | "burning_faces" | "burn_duration_s";
            /**
             * X Unit
             * @default cm/s
             */
            x_unit?: string | null;
        };
        /** ConditionStage */
        ConditionStage: {
            /** Conditions */
            conditions: {
                [key: string]: components["schemas"]["ConditionValue"];
            };
            /** Id */
            id: string;
            /** Order */
            order: number;
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
            /** Condition Id */
            condition_id?: string | null;
            /** Evidence Ids */
            evidence_ids: string[];
            /** Group Id */
            group_id: string;
            /** Independent Unit Id */
            independent_unit_id: string;
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
            /** Missing By Stage Condition */
            missing_by_stage_condition?: {
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
            /**
             * N Condition Stages
             * @default 0
             */
            n_condition_stages?: number;
            /** N Independent Units */
            n_independent_units: number;
            /** N Observations */
            n_observations: number;
            /** N Studies */
            n_studies: number;
            /** N Trials */
            n_trials: number;
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
            /** Eligible Condition Ids */
            eligible_condition_ids?: string[];
            /** Evidence Ids */
            evidence_ids: string[];
            /**
             * Provenance
             * @enum {string}
             */
            provenance: "published" | "digitized" | "derived" | "synthetic";
            /** Reasons */
            reasons: string[];
            /** Scored Condition Id */
            scored_condition_id?: string | null;
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
            variable: "oxygen_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "oxygen_initial_pct" | "oxygen_final_pct" | "burning_faces" | "burn_duration_s";
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
            required_match?: ("oxygen_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "oxygen_initial_pct" | "oxygen_final_pct" | "burning_faces" | "burn_duration_s")[];
            /** Study Ids */
            study_ids?: string[];
            /** Target */
            target?: {
                [key: string]: number | string;
            };
            /** Vary */
            vary?: ("oxygen_pct" | "pressure_kpa" | "flow_velocity_cm_s" | "material" | "geometry" | "thickness_mm" | "diameter_mm" | "sample_width_mm" | "flow_direction" | "gravity_regime" | "oxygen_initial_pct" | "oxygen_final_pct" | "burning_faces" | "burn_duration_s")[];
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
            metric?: "flame_spread_rate_mm_s" | "extinction_oxygen_pct" | "heat_release_w" | "other";
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
            /**
             * Provider
             * @enum {string}
             */
            provider: "demo" | "openai";
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
            scenario_a: components["schemas"]["RankingRequest"];
            scenario_b: components["schemas"]["RankingRequest"];
        };
        /** ScenarioComparisonResponse */
        ScenarioComparisonResponse: {
            /**
             * Label
             * @default evidence_comparison_not_physical_simulation
             * @constant
             */
            label?: "evidence_comparison_not_physical_simulation";
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
        /** Trial */
        Trial: {
            /** Condition Stages */
            condition_stages?: components["schemas"]["ConditionStage"][];
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
