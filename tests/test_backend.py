from fastapi.testclient import TestClient
from backend.app.main import app
from ml_engine.split_tender_detector import SplitTenderDetector

client = TestClient(app)


def test_split_tender_detector_class_exists_and_works():
    detector = SplitTenderDetector(similarity_threshold=0.0)
    records = [{
        "project_id": "A-1",
        "district": "Pune",
        "project_description": "Repair of internal road in Sector 4",
        "sanction_date": "2025-05-10",
        "sanctioned_amount_inr": 980000.0,
    }, {
        "project_id": "A-2",
        "district": "Pune",
        "project_description": "Road repair work Sector 4 internal",
        "sanction_date": "2025-05-12",
        "sanctioned_amount_inr": 975000.0,
    }]

    result = detector.analyze_split_tender(
        project_description="Road repair work Sector 4 internal",
        sanctioned_amount=975000.0,
        project_id="A-2",
        district="Pune",
        sanction_date="2025-05-12",
        comparison_projects=records[:-1],
    )

    assert isinstance(result, dict)
    assert "is_split_tender" in result


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "active"

def test_detect_fraud_normal_project():
    payload = {
        "project_id": "TEST-2026-001",
        "mp_name": "AASHTIKAR PATIL NAGESH BAPURAO",
        "district": "Hingoli",
        "work_category": "Community Hall",
        "project_description": "Standard community hall construction",
        "sanctioned_amount_inr": 1000000.0,
        "implementing_agency": "Standard Village Panchayat",
        "sanction_date": "2026-08-25"
    }
    response = client.post("/api/v1/detect-fraud", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "TEST-2026-001"
    assert "overall_risk_score" in data

def test_detect_fraud_anomaly_and_budget():
    payload = {
        "project_id": "TEST-2026-002",
        "mp_name": "AASHTIKAR PATIL NAGESH BAPURAO",
        "district": "Hingoli",
        "work_category": "Solar Street Light",
        "project_description": "Massive solar street light inflation",
        "sanctioned_amount_inr": 5000000.0,
        "implementing_agency": "Apex Infra Pvt Ltd",
        "sanction_date": "2026-08-25"
    }
    response = client.post("/api/v1/detect-fraud", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_risk_score"] > 40
    assert len(data["alerts"]) > 0