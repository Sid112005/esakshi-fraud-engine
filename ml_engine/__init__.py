"""
e-SAKSHI ML Forensic Intelligence Engine.
SIH26102 - MPLADS Fraud Detection Subsystem.

Provides unified entry points for:
- Statistical Cost Inflation / Anomaly Scoring (IsolationForest)
- Semantic Near-Duplicate & Split Tender Detection (Sentence-Transformers)
"""

from typing import Dict, Any, List, Optional
from .cost_anomaly import (
    score_cost_anomaly,
    evaluate_cost_model,
    CostAnomalyDetector
)
from .split_tender_detector import (
    detect_split_tenders,
    evaluate_split_tender_detector,
    get_embedding_model
)


def format_project_assessment(
    project: Dict[str, Any],
    split_tender_matches: Optional[List[Dict[str, Any]]] = None,
    cost_threshold: float = 0.65
) -> Dict[str, Any]:
    """
    Combines cost anomaly scoring and semantic split tender detection
    into the standard teammate API integration contract.

    Output format:
    {
        "project_id": str,
        "cost_anomaly_score": float (0-1),
        "cost_anomaly_flag": bool,
        "split_tender_flag": bool,
        "split_tender_matches": list[dict]
    }
    """
    cost_res = score_cost_anomaly(project, flag_threshold=cost_threshold)
    matches = split_tender_matches or []
    
    # Filter matches relevant to this project_id if a broad match list was passed
    p_id = project.get("project_id", "")
    relevant_matches = [
        m for m in matches
        if m.get("project_a_id") == p_id or m.get("project_b_id") == p_id
    ] if matches and p_id else matches

    return {
        "project_id": p_id,
        "cost_anomaly_score": cost_res.get("anomaly_score", 0.0),
        "cost_anomaly_flag": cost_res.get("flag", False),
        "split_tender_flag": len(relevant_matches) > 0,
        "split_tender_matches": relevant_matches
    }


__all__ = [
    "score_cost_anomaly",
    "detect_split_tenders",
    "evaluate_cost_model",
    "evaluate_split_tender_detector",
    "format_project_assessment",
    "CostAnomalyDetector",
    "get_embedding_model"
]
