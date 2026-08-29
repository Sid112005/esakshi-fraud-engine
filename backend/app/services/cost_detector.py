import os
import joblib
import numpy as np

MODEL_PATH = os.path.join("ml_engine", "saved_models", "cost_isolation_forest.joblib")

class CostAnomalyService:
    def __init__(self):
        if os.path.exists(MODEL_PATH):
            artifact = joblib.load(MODEL_PATH)
            self.model = artifact["model"]
            self.baselines = artifact["category_baselines"]
            self.is_ready = True
        else:
            self.model = None
            self.baselines = {}
            self.is_ready = False

    def predict_cost_anomaly(self, work_category: str, sanctioned_amount: float):
        if not self.is_ready:
            return {"is_anomaly": False, "cost_ratio": 1.0, "anomaly_score": 0.0}

        base_info = self.baselines.get(work_category, {"median": 500000.0})
        median_cost = base_info["median"]
        cost_ratio = sanctioned_amount / median_cost

        # Predict anomaly: -1 = Anomaly / Outlier, 1 = Normal
        prediction = self.model.predict(np.array([[cost_ratio]]))[0]
        score = self.model.decision_function(np.array([[cost_ratio]]))[0]

        return {
            "is_anomaly": bool(prediction == -1),
            "cost_ratio": round(float(cost_ratio), 2),
            "anomaly_score": round(float(score), 4),
            "category_median": median_cost
        }

cost_detector_service = CostAnomalyService()