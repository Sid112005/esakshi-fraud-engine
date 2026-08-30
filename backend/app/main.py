from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from backend.app.services.cost_detector import cost_detector_service
from backend.app.services.budget_verifier import budget_verifier_service
from backend.app.services.collusion_detector import collusion_detector_service
from backend.app.services.graph_service import cartel_graph_service
from ml_engine.split_tender_detector import SplitTenderDetector
from backend.app.routers.milestone_verification import milestone_router
from backend.app.routers.analytics import analytics_router

# Instantiate the co-lead's SBERT split tender service object
split_tender_service = SplitTenderDetector()

app = FastAPI(
    title="e-SAKSHI Forensic Intelligence Engine API",
    description="AI-powered forensic audit and anomaly detection system for MPLADS Scheme (SIH26102)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(milestone_router)
app.include_router(analytics_router)

class ProjectSanctionRequest(BaseModel):
    project_id: str = Field(..., example="MPLAD-2026-1045")
    mp_name: str = Field(..., example="AASHTIKAR PATIL NAGESH BAPURAO")
    state: Optional[str] = Field(None, example="Maharashtra")
    district: str = Field(..., example="Thane")
    work_category: str = Field(..., example="Solar Street Light")
    project_description: str = Field(..., example="Installation of 20 high-mast solar lights in Sector 4")
    sanctioned_amount_inr: float = Field(..., example=3750000.0)
    implementing_agency: str = Field(..., example="Apex Infra Pvt Ltd")
    sanction_date: str = Field(..., example="2026-08-25")
    expected_completion_date: Optional[str] = Field(None, example="2026-11-25")
    actual_completion_date: Optional[str] = Field(None, example="2027-02-15")

class FraudAlert(BaseModel):
    alert_type: str
    severity: str
    description: str

class RiskAssessmentResponse(BaseModel):
    project_id: str
    overall_risk_score: int
    risk_level: str
    action_recommended: str
    alerts: List[FraudAlert]
    timestamp: str

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
    risk_score = 10

    # 1. AI-Driven Cost Anomaly Detection
    ml_result = cost_detector_service.predict_cost_anomaly(
        work_category=project.work_category,
        sanctioned_amount=project.sanctioned_amount_inr
    )

    if ml_result["is_anomaly"] or ml_result["cost_ratio"] >= 2.0:
        risk_score += 45
        alerts.append(FraudAlert(
            alert_type="ML_ISOLATION_FOREST_OUTLIER",
            severity="CRITICAL" if ml_result["cost_ratio"] >= 3.0 else "HIGH",
            description=f"Isolation Forest flagged cost as statistical outlier. Sanctioned amount (₹{project.sanctioned_amount_inr:,.0f}) is {ml_result['cost_ratio']}x the historical median (₹{ml_result['category_median']:,.0f})."
        ))

    # 2. AI-Driven Split Tender Semantic Detector (Sentence-BERT)
    split_result = split_tender_service.analyze_split_tender(
        project_description=project.project_description,
        sanctioned_amount=project.sanctioned_amount_inr,
        project_id=project.project_id,
        district=project.district,
        sanction_date=project.sanction_date
    )

    # Debug print to check exact SBERT output in your terminal
    print("SBERT DEBUG RESULT:", split_result)

    if split_result.get("is_split_tender", False):
        risk_score += 25
        alerts.append(FraudAlert(
            alert_type="SEMANTIC_SPLIT_TENDER_ANOMALY",
            severity="HIGH",
            description=split_result.get("explanation", "Sentence-BERT detected semantic fragmentation patterns indicative of intentional threshold evasion.")
        ))

    # 3. MoSPI Allocation & Budget Compliance Check
    budget_result = budget_verifier_service.verify_mp_budget(
        mp_name=project.mp_name,
        requested_amount=project.sanctioned_amount_inr
    )

    if not budget_result["verified"]:
        risk_score += 20
        alerts.append(FraudAlert(
            alert_type="UNVERIFIED_MP_RECORD",
            severity="MEDIUM",
            description=budget_result["reason"]
        ))
    elif budget_result["allocation_exceeded"]:
        risk_score += 50
        alerts.append(FraudAlert(
            alert_type="BUDGET_OVERRUN_VIOLATION",
            severity="CRITICAL",
            description=f"Sanction amount exceeds the total MoSPI allocated ceiling (₹{budget_result['total_allocated']:,.2f}) for constituency {budget_result['constituency']}."
        ))
    elif budget_result["excessive_single_draw"]:
        risk_score += 15
        alerts.append(FraudAlert(
            alert_type="HIGH_CAPITAL_CONCENTRATION",
            severity="LOW",
            description=f"Single work consumes {budget_result['draw_percentage']}% of the MP's total multi-year fund."
        ))

    # 4. Implementing Agency Collusion Check
    collusion_result = collusion_detector_service.check_agency_risk(
        implementing_agency=project.implementing_agency,
        district=project.district
    )

    if collusion_result["collusion_suspected"]:
        risk_score += 20
        for flag in collusion_result["flags"]:
            alerts.append(FraudAlert(
                alert_type=flag["type"],
                severity="MEDIUM",
                description=flag["message"]
            ))

    # 5. Graph Network Cartel Check
    graph_result = cartel_graph_service.check_cartel_rings(
        implementing_agency=project.implementing_agency
    )

    if graph_result.get("cartel_detected"):
        risk_score += 30
        alerts.append(FraudAlert(
            alert_type="GRAPH_CARTEL_RING",
            severity="CRITICAL",
            description="Entity shares confidential attributes with blacklisted shell syndicates."
        ))

    # 6. Project Timeline & Milestone Delay Check (Task 2)
    if project.expected_completion_date:
        try:
            exp_dt = datetime.strptime(project.expected_completion_date.strip(), "%Y-%m-%d")
            if project.actual_completion_date:
                act_dt = datetime.strptime(project.actual_completion_date.strip(), "%Y-%m-%d")
                if act_dt > exp_dt:
                    delay_days = (act_dt - exp_dt).days
                    if delay_days > 90:
                        risk_score += 25
                        alerts.append(FraudAlert(
                            alert_type="DELAYED_PROJECT",
                            severity="HIGH",
                            description=f"Project completed {delay_days} days past the scheduled deadline ({project.expected_completion_date}), indicating chronic execution lag."
                        ))
                    elif delay_days > 30:
                        risk_score += 15
                        alerts.append(FraudAlert(
                            alert_type="DELAYED_PROJECT",
                            severity="MEDIUM",
                            description=f"Project completed {delay_days} days past the scheduled deadline ({project.expected_completion_date})."
                        ))
            else:
                now_dt = datetime.now()
                if exp_dt < now_dt:
                    overdue_days = (now_dt - exp_dt).days
                    if overdue_days > 60:
                        risk_score += 25
                        alerts.append(FraudAlert(
                            alert_type="DELAYED_PROJECT",
                            severity="HIGH",
                            description=f"Project is currently {overdue_days} days overdue past the target completion date ({project.expected_completion_date}) with no completion record."
                        ))
                    elif overdue_days > 15:
                        risk_score += 15
                        alerts.append(FraudAlert(
                            alert_type="DELAYED_PROJECT",
                            severity="MEDIUM",
                            description=f"Project is {overdue_days} days overdue past target completion date ({project.expected_completion_date})."
                        ))
        except Exception:
            pass

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