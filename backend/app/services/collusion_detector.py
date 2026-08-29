import sqlite3
import os

DB_PATH = os.path.join("data", "esakshi.db")

class CollusionDetectorService:
    def __init__(self):
        self.db_path = DB_PATH

    def check_agency_risk(self, implementing_agency: str, district: str):
        suspicious_keywords = ["pvt ltd", "associates", "infra solutions", "enterprises"]
        agency_lower = implementing_agency.lower()
        
        risk_flags = []
        is_suspicious = any(kw in agency_lower for kw in suspicious_keywords)
        
        if is_suspicious:
            risk_flags.append({
                "type": "SHELL_COMPANY_PATTERN",
                "message": f"Agency name '{implementing_agency}' matches generic corporate nomenclature common in localized syndicates."
            })

        return {
            "agency": implementing_agency,
            "collusion_suspected": len(risk_flags) > 0,
            "flags": risk_flags
        }

collusion_detector_service = CollusionDetectorService()