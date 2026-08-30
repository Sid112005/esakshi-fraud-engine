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
  district: string;
  work_category: string;
  project_description: string;
  sanctioned_amount_inr: number;
  implementing_agency: string;
  sanction_date: string;
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
