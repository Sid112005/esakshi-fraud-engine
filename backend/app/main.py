from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

app = FastAPI(
    title="e-SAKSHI Forensic Intelligence Engine API",
    description="AI-powered forensic audit and anomaly detection system for MPLADS Scheme (SIH26102)",
    version="1.0.0"
)

# Enable CORS for frontend integration (Flutter / React / Streamlit)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Data Models -----------------

class ProjectSanctionRequest(BaseModel):
    project_id: str = Field(..., example="MPLAD-2026-1045")
    district: str = Field(..., example="Thane")
    work_category: str = Field(..., example="Solar Street Light")
    project_description: str = Field(..., example="Installation of 20 high-mast solar lights in Sector 4")
    sanctioned_amount_inr: float = Field(..., example=3750000.0)
    implementing_agency: str = Field(..., example="Apex Infra Pvt Ltd")
    sanction_date: str = Field(..., example="2026-08-25")

class FraudAlert(BaseModel):
    alert_type: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    description: str

class RiskAssessmentResponse(BaseModel):
    project_id: str
    overall_risk_score: int  # 0 to 100
    risk_level: str          # LOW, MEDIUM, HIGH, CRITICAL
    action_recommended: str
    alerts: List[FraudAlert]
    timestamp: str

# ----------------- Mock Baseline Stats -----------------

# Baseline median costs for quick validation (will be replaced by ML model)
BENCHMARK_COSTS = {
    "Solar Street Light": 75000.0,
    "Community Hall": 1500000.0,
    "Drinking Water Plant": 500000.0,
    "School Boundary Wall": 300000.0
}

# ----------------- API Endpoints -----------------

@app.get("/")
def health_check():
    return {
        "status": "active",
        "service": "e-SAKSHI Forensic Engine API",
        "version": "1.0.0"
    }

@app.post("/api/v1/detect-fraud", response_model=RiskAssessmentResponse)
def analyze_project_fraud(project: ProjectSanctionRequest):
    alerts = []
    risk_score = 10  # Baseline low risk

    # 1. Cost Outlier Check
    benchmark = BENCHMARK_COSTS.get(project.work_category, 500000.0)
    cost_ratio = project.sanctioned_amount_inr / benchmark

    if cost_ratio > 3.0:
        risk_score += 50
        alerts.append(FraudAlert(
            alert_type="COST_INFLATION_OUTLIER",
            severity="CRITICAL",
            description=f"Sanctioned amount (₹{project.sanctioned_amount_inr:,.0f}) is {cost_ratio:.1f}x higher than the district median benchmark (₹{benchmark:,.0f})."
        ))
    elif cost_ratio > 1.5:
        risk_score += 25
        alerts.append(FraudAlert(
            alert_type="COST_DEVIATION",
            severity="MEDIUM",
            description=f"Sanctioned amount is {cost_ratio:.1f}x higher than standard benchmark."
        ))

    # 2. Split Tender / Threshold Evasion Check (< ₹10 Lakhs heuristic)
    if 900000.0 <= project.sanctioned_amount_inr < 1000000.0:
        risk_score += 25
        alerts.append(FraudAlert(
            alert_type="TENDER_SPLITTING_HEURISTIC",
            severity="HIGH",
            description="Sanction amount sits just below the ₹10 Lakh mandatory open tender threshold. Flagged for semantic duplicate audit."
        ))

    # Determine risk category
    risk_score = min(risk_score, 100)
    if risk_score >= 75:
        risk_level = "CRITICAL"
        action = "FREEZE_FUNDS_AND_AUDIT"
    elif risk_score >= 45:
        risk_level = "HIGH"
        action = "MANUAL_VIGILANCE_REVIEW"
    elif risk_score >= 25:
        risk_level = "MEDIUM"
        action = "ADDITIONAL_INVOICE_SCRUTINY"
    else:
        risk_level = "LOW"
        action = "AUTO_APPROVE"

    return RiskAssessmentResponse(
        project_id=project.project_id,
        overall_risk_score=risk_score,
        risk_level=risk_level,
        action_recommended=action,
        alerts=alerts,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )