import sqlite3
import os

DB_PATH = os.path.join("data", "esakshi.db")

class BudgetVerifierService:
    def __init__(self):
        self.db_path = DB_PATH

    def get_connection(self):
        if not os.path.exists(self.db_path):
            return None
        return sqlite3.connect(self.db_path)

    def verify_mp_budget(self, mp_name: str, requested_amount: float):
        conn = self.get_connection()
        if not conn:
            return {
                "verified": False,
                "reason": "Database not initialized",
                "allocation_exceeded": False
            }

        cursor = conn.cursor()
        # Query the official MoSPI allocation using fuzzy-safe SQL matching
        cursor.execute(
            "SELECT mp_name, constituency, state, allocated_amount_inr FROM mp_allocations WHERE mp_name LIKE ? LIMIT 1",
            (f"%{mp_name.strip()}%",)
        )
        record = cursor.fetchone()
        conn.close()

        if not record:
            return {
                "verified": False,
                "reason": f"MP '{mp_name}' not found in official MoSPI roster",
                "allocation_exceeded": False,
                "total_allocation": 0.0
            }

        mp_official_name, constituency, state, total_allocated = record

        # Single sanction exceeding 25% of the full multi-year allocation flags high fiscal risk
        is_excessive_single_draw = requested_amount > (0.25 * total_allocated)
        is_over_budget = requested_amount > total_allocated

        return {
            "verified": True,
            "mp_name": mp_official_name,
            "constituency": constituency,
            "state": state,
            "total_allocated": total_allocated,
            "allocation_exceeded": is_over_budget,
            "excessive_single_draw": is_excessive_single_draw,
            "draw_percentage": round((requested_amount / total_allocated) * 100, 2) if total_allocated else 0.0
        }

budget_verifier_service = BudgetVerifierService()