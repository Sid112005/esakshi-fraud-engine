export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ActionRecommended =
  | "AUTO_APPROVE"
  | "ADDITIONAL_INVOICE_SCRUTINY"
  | "MANUAL_VIGILANCE_REVIEW"
  | "FREEZE_FUNDS_AND_AUDIT"
  | string;

export interface FraudAlert {
  alert_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  description: string;
}

export interface ProjectSanctionRequest {
  project_id: string;
  mp_name: string;
  state?: string;
  district: string;
  work_category: string;
  project_description: string;
  sanctioned_amount_inr: number;
  implementing_agency: string;
  sanction_date: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
}

export interface RiskAssessmentResponse {
  project_id: string;
  overall_risk_score: number;
  risk_level: RiskLevel;
  action_recommended: ActionRecommended;
  alerts: FraudAlert[];
  timestamp: string;
}

export interface AuditHistoryItem {
  id: string;
  request: ProjectSanctionRequest;
  response: RiskAssessmentResponse;
  analyzedAt: string;
}

export interface SchemeTrendsResponse {
  filter_applied: { state?: string; district?: string };
  total_sanctioned_inr: number;
  total_projects: number;
  delayed_projects_count: number;
  fraud_cases_count: number;
  monthly_trends: { month: string; total_sanctioned: number; project_count: number }[];
  state_breakdown: { state: string; total_sanctioned: number; project_count: number; fraud_count: number }[];
  district_breakdown: { district: string; state: string; total_sanctioned: number; project_count: number; fraud_count: number }[];
  category_breakdown: { category: string; total_sanctioned: number; project_count: number }[];
}

export interface PredictiveAlert {
  entity: string;
  state: string;
  district: string;
  alert_type: string;
  severity: string;
  current_spend_inr: number;
  allocated_ceiling_inr: number;
  projected_spend_inr: number;
  projected_overrun_inr: number;
  burn_rate_daily_inr: number;
  projected_exhaustion_date: string;
  explanation: string;
}
