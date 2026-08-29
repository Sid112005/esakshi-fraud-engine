from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

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