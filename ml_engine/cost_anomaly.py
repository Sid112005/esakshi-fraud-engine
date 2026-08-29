"""
Cost Anomaly Detection Engine for MPLADS Works.
SIH26102 - e-SAKSHI Fraud Detection Engine.

Uses Isolation Forest with domain-specific feature engineering
to identify inflated project sanctions and statistical cost outliers.
"""

import os
from typing import Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report


DEFAULT_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic", "mplads_synthetic_data.csv")

# Baseline category fallback medians in INR if category is unknown or data missing
FALLBACK_CATEGORY_MEDIANS = {
    "Solar Street Light": 75000.0,
    "Community Hall": 1500000.0,
    "Drinking Water Plant": 500000.0,
    "School Boundary Wall": 300000.0,
    "Road Repair": 800000.0
}


class CostAnomalyDetector:
    """
    Unsupervised Isolation Forest detector for project cost inflation.
    """

    def __init__(self, data_path: Optional[str] = None, contamination: float = 0.05, random_state: int = 42):
        self.data_path = data_path or DEFAULT_DATA_PATH
        self.contamination = contamination
        self.random_state = random_state
        self.model: Optional[IsolationForest] = None
        self.scaler = StandardScaler()
        self.category_stats: Dict[str, Dict[str, float]] = {}
        self.min_score_val: float = -0.5
        self.max_score_val: float = 0.5
        self._is_fitted = False
        
        if os.path.exists(self.data_path):
            self.fit_from_csv(self.data_path)

    def _compute_category_stats(self, df: pd.DataFrame):
        """Compute category-wise median, mean, and std for robust feature engineering."""
        self.category_stats = {}
        for cat, group in df.groupby("work_category"):
            median_val = float(group["sanctioned_amount_inr"].median())
            std_val = float(group["sanctioned_amount_inr"].std()) if len(group) > 1 else 1.0
            if std_val == 0 or np.isnan(std_val):
                std_val = max(median_val * 0.1, 1.0)
            self.category_stats[cat] = {
                "median": median_val,
                "mean": float(group["sanctioned_amount_inr"].mean()),
                "std": std_val
            }

    def _extract_features(self, df_or_record: pd.DataFrame) -> np.ndarray:
        """Extract domain features: cost_ratio, log_cost, z_score, absolute_diff."""
        features = []
        for _, row in df_or_record.iterrows():
            cat = str(row.get("work_category", "Road Repair"))
            amount = float(row.get("sanctioned_amount_inr", 0.0))
            
            stats = self.category_stats.get(cat)
            if not stats:
                fallback_med = FALLBACK_CATEGORY_MEDIANS.get(cat, 500000.0)
                stats = {"median": fallback_med, "std": fallback_med * 0.15, "mean": fallback_med}
            
            median_cost = stats["median"]
            std_cost = stats["std"]
            
            cost_ratio = amount / max(median_cost, 1.0)
            z_score = (amount - median_cost) / max(std_cost, 1.0)
            abs_diff = amount - median_cost
            log_amount = np.log1p(max(amount, 0.0))
            
            features.append([cost_ratio, z_score, abs_diff, log_amount])
            
        return np.array(features, dtype=np.float32)

    def fit_from_csv(self, csv_path: str):
        """Train Isolation Forest on synthetic/historical MPLADS data."""
        df = pd.read_csv(csv_path)
        self._compute_category_stats(df)
        
        X = self._extract_features(df)
        X_scaled = self.scaler.fit_transform(X)
        
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=self.random_state,
            n_jobs=None
        )
        self.model.fit(X_scaled)
        
        # Calibration bounds for 0-1 anomaly score
        raw_scores = self.model.decision_function(X_scaled)
        self.min_score_val = float(np.min(raw_scores))
        self.max_score_val = float(np.max(raw_scores))
        self._is_fitted = True

    def score(self, project: Dict[str, Any], flag_threshold: float = 0.65) -> Dict[str, Any]:
        """
        Score a single project for cost inflation.
        Returns:
            {"anomaly_score": float (0-1, higher = more anomalous), "flag": bool}
        """
        if not self._is_fitted:
            if os.path.exists(self.data_path):
                self.fit_from_csv(self.data_path)
            else:
                # Fallback rule-based if data file is absent
                cat = project.get("work_category", "Road Repair")
                med = FALLBACK_CATEGORY_MEDIANS.get(cat, 500000.0)
                ratio = float(project.get("sanctioned_amount_inr", 0.0)) / med
                score_val = min(max((ratio - 1.0) / 4.0, 0.0), 1.0)
                return {"anomaly_score": round(score_val, 4), "flag": score_val >= flag_threshold}

        df_single = pd.DataFrame([project])
        X = self._extract_features(df_single)
        X_scaled = self.scaler.transform(X)
        
        raw_score = float(self.model.decision_function(X_scaled)[0])
        # Invert and normalize decision function: lower raw score -> higher anomaly
        denom = max(self.max_score_val - self.min_score_val, 1e-6)
        normalized = 1.0 - ((raw_score - self.min_score_val) / denom)
        normalized = float(np.clip(normalized, 0.0, 1.0))
        
        # High cost ratio threshold confirmation
        cat = project.get("work_category", "Road Repair")
        med = self.category_stats.get(cat, {}).get("median", FALLBACK_CATEGORY_MEDIANS.get(cat, 500000.0))
        cost_ratio = float(project.get("sanctioned_amount_inr", 0.0)) / med
        
        # Direct flag: IsolationForest prediction (-1 is anomaly) or anomaly_score >= threshold
        is_anomaly = bool(normalized >= flag_threshold or (cost_ratio >= 2.5 and normalized >= 0.50))
        
        return {
            "anomaly_score": round(normalized, 4),
            "flag": is_anomaly
        }


# Global detector singleton
_detector_instance: Optional[CostAnomalyDetector] = None

def _get_detector() -> CostAnomalyDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = CostAnomalyDetector()
    return _detector_instance

def score_cost_anomaly(project: Dict[str, Any], flag_threshold: float = 0.65) -> Dict[str, Any]:
    """
    Score cost anomaly for a project sanction record.
    
    Args:
        project: dict with keys like 'work_category', 'sanctioned_amount_inr', etc.
        flag_threshold: float between 0 and 1
        
    Returns:
        {"anomaly_score": float (0-1), "flag": bool}
    """
    detector = _get_detector()
    return detector.score(project, flag_threshold=flag_threshold)

def evaluate_cost_model(csv_path: Optional[str] = None, flag_threshold: float = 0.65) -> Dict[str, Any]:
    """
    Evaluate model precision and recall specifically on 'Cost Inflation' fraud cases.
    """
    path = csv_path or DEFAULT_DATA_PATH
    df = pd.read_csv(path)
    detector = CostAnomalyDetector(data_path=path)
    
    y_true_cost_inflation = (df["fraud_type"] == "Cost Inflation").astype(int).values
    
    predictions = []
    scores = []
    for _, row in df.iterrows():
        res = detector.score(row.to_dict(), flag_threshold=flag_threshold)
        predictions.append(1 if res["flag"] else 0)
        scores.append(res["anomaly_score"])
        
    y_pred = np.array(predictions)
    
    precision = precision_score(y_true_cost_inflation, y_pred, zero_division=0)
    recall = recall_score(y_true_cost_inflation, y_pred, zero_division=0)
    f1 = f1_score(y_true_cost_inflation, y_pred, zero_division=0)
    
    results = {
        "total_records": len(df),
        "cost_inflation_cases": int(y_true_cost_inflation.sum()),
        "flagged_total": int(y_pred.sum()),
        "cost_inflation_precision": round(float(precision), 4),
        "cost_inflation_recall": round(float(recall), 4),
        "cost_inflation_f1": round(float(f1), 4),
        "threshold": flag_threshold
    }
    
    print("\n=== Cost Anomaly Detection Model Evaluation ===")
    print(f"Total Records Tested: {results['total_records']}")
    print(f"Ground Truth 'Cost Inflation' Cases: {results['cost_inflation_cases']}")
    print(f"Total Projects Flagged: {results['flagged_total']}")
    print(f"Precision on Cost Inflation: {results['cost_inflation_precision']:.2%}")
    print(f"Recall on Cost Inflation: {results['cost_inflation_recall']:.2%}")
    print(f"F1-Score: {results['cost_inflation_f1']:.2%}")
    print("================================================\n")
    
    return results


if __name__ == "__main__":
    # Run standalone evaluation
    eval_results = evaluate_cost_model()
    
    # Test sample normal project
    normal_sample = {
        "project_id": "TEST-NORM-01",
        "work_category": "Solar Street Light",
        "sanctioned_amount_inr": 78000.0,
        "district": "Pune"
    }
    print("Normal Sample Score:", score_cost_anomaly(normal_sample))
    
    # Test sample inflated project
    inflated_sample = {
        "project_id": "TEST-INFL-01",
        "work_category": "Solar Street Light",
        "sanctioned_amount_inr": 350000.0, # 4.6x higher
        "district": "Pune"
    }
    print("Inflated Sample Score:", score_cost_anomaly(inflated_sample))
