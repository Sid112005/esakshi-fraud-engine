"""
Semantic Duplicate & Split Tender Detection Engine.
SIH26102 - e-SAKSHI Fraud Detection Engine.

Uses Sentence-Transformers (all-MiniLM-L6-v2) and temporal-spatial
clustering (District + 30-day rolling window) to identify artificially
fragmented contracts and split tenders below procurement thresholds.
"""

import os
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


DEFAULT_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic", "mplads_synthetic_data.csv")
MODEL_NAME = "all-MiniLM-L6-v2"

# Singleton model holder
_model_instance: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    """Lazy load and cache SentenceTransformer model."""
    global _model_instance
    if _model_instance is None:
        _model_instance = SentenceTransformer(MODEL_NAME)
    return _model_instance


def _parse_date(date_str: Any) -> Optional[datetime]:
    """Parse date string into datetime object safely."""
    if pd.isna(date_str) or not date_str:
        return None
    try:
        return datetime.strptime(str(date_str)[:10], "%Y-%m-%d")
    except Exception:
        return None


def detect_split_tenders(
    projects: List[Dict[str, Any]],
    similarity_threshold: float = 0.85,
    window_days: int = 30
) -> List[Dict[str, Any]]:
    """
    Detect pairs of projects in the same district and rolling time window
    with semantic similarity >= similarity_threshold.

    Args:
        projects: List of project dictionaries containing 'project_id', 'district',
                  'project_description', 'sanction_date', 'sanctioned_amount_inr', etc.
        similarity_threshold: Cosine similarity cutoff (default 0.85).
        window_days: Maximum days between sanctions to consider (default 30).

    Returns:
        List of flagged split-tender pair dictionaries.
    """
    if not projects or len(projects) < 2:
        return []

    model = get_embedding_model()
    
    # Extract descriptions and compute embeddings in batch
    descriptions = [p.get("project_description", "") or "" for p in projects]
    embeddings = model.encode(descriptions, batch_size=64, show_progress_bar=False, normalize_embeddings=True)
    
    # Group indices by district for spatial constraint
    district_groups: Dict[str, List[int]] = {}
    for idx, p in enumerate(projects):
        dist = str(p.get("district", "UNKNOWN")).strip()
        district_groups.setdefault(dist, []).append(idx)

    flagged_pairs = []

    for dist, indices in district_groups.items():
        n = len(indices)
        if n < 2:
            continue

        for i in range(n):
            idx_a = indices[i]
            proj_a = projects[idx_a]
            date_a = _parse_date(proj_a.get("sanction_date"))

            for j in range(i + 1, n):
                idx_b = indices[j]
                proj_b = projects[idx_b]
                date_b = _parse_date(proj_b.get("sanction_date"))

                # Check temporal window if dates are available
                days_diff = None
                if date_a and date_b:
                    days_diff = abs((date_a - date_b).days)
                    if days_diff > window_days:
                        continue

                # Cosine similarity on normalized embeddings is dot product
                sim = float(np.dot(embeddings[idx_a], embeddings[idx_b]))

                if sim >= similarity_threshold:
                    flagged_pairs.append({
                        "project_a_id": proj_a.get("project_id"),
                        "project_b_id": proj_b.get("project_id"),
                        "district": dist,
                        "description_a": proj_a.get("project_description"),
                        "description_b": proj_b.get("project_description"),
                        "sanction_date_a": str(proj_a.get("sanction_date")),
                        "sanction_date_b": str(proj_b.get("sanction_date")),
                        "days_apart": days_diff,
                        "amount_a": proj_a.get("sanctioned_amount_inr"),
                        "amount_b": proj_b.get("sanctioned_amount_inr"),
                        "similarity_score": round(sim, 4),
                        "flag": True
                    })

    return flagged_pairs


def evaluate_split_tender_detector(
    csv_path: Optional[str] = None,
    similarity_threshold: float = 0.85,
    window_days: int = 30
) -> Dict[str, Any]:
    """
    Evaluate split tender detector against ground-truth 'Tender Splitting' cases.
    """
    path = csv_path or DEFAULT_DATA_PATH
    df = pd.read_csv(path)
    records = df.to_dict(orient="records")
    
    flagged_pairs = detect_split_tenders(
        records,
        similarity_threshold=similarity_threshold,
        window_days=window_days
    )
    
    # Collect all unique flagged project IDs
    flagged_project_ids = set()
    for pair in flagged_pairs:
        flagged_project_ids.add(pair["project_a_id"])
        flagged_project_ids.add(pair["project_b_id"])

    # Ground truth
    gt_split_df = df[df["fraud_type"] == "Tender Splitting"]
    gt_split_ids = set(gt_split_df["project_id"])
    
    # True positives: ground truth split projects that got flagged
    true_positives = len(flagged_project_ids.intersection(gt_split_ids))
    total_gt = len(gt_split_ids)
    total_flagged = len(flagged_project_ids)
    
    recall = true_positives / total_gt if total_gt > 0 else 0.0
    precision = true_positives / total_flagged if total_flagged > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    results = {
        "total_records": len(df),
        "ground_truth_split_tenders": total_gt,
        "total_flagged_projects": total_flagged,
        "flagged_pairs_count": len(flagged_pairs),
        "true_positives_detected": true_positives,
        "split_tender_precision": round(precision, 4),
        "split_tender_recall": round(recall, 4),
        "split_tender_f1": round(f1, 4),
        "similarity_threshold": similarity_threshold,
        "window_days": window_days
    }

    print("\n=== Split Tender Detector Evaluation ===")
    print(f"Total Dataset Records: {results['total_records']}")
    print(f"Ground Truth 'Tender Splitting' Projects: {results['ground_truth_split_tenders']}")
    print(f"Total Unique Projects Flagged: {results['total_flagged_projects']}")
    print(f"Total Suspicious Pairs Found: {results['flagged_pairs_count']}")
    print(f"True Positives Detected: {results['true_positives_detected']}")
    print(f"Precision on Tender Splitting: {results['split_tender_precision']:.2%}")
    print(f"Recall on Tender Splitting: {results['split_tender_recall']:.2%}")
    print(f"F1-Score: {results['split_tender_f1']:.2%}")
    print("=========================================\n")

    return results


if __name__ == "__main__":
    # Run evaluation
    results = evaluate_split_tender_detector()
    
    # Test on a mini batch
    demo_projects = [
        {
            "project_id": "MPLAD-TEST-01",
            "district": "Pune",
            "project_description": "Repair of internal road in Sector 4",
            "sanction_date": "2025-05-10",
            "sanctioned_amount_inr": 980000.0
        },
        {
            "project_id": "MPLAD-TEST-02",
            "district": "Pune",
            "project_description": "Road repair work Sector 4 internal",
            "sanction_date": "2025-05-12",
            "sanctioned_amount_inr": 975000.0
        },
        {
            "project_id": "MPLAD-TEST-03",
            "district": "Pune",
            "project_description": "Installation of 20 solar street lights in Sector 9",
            "sanction_date": "2025-05-11",
            "sanctioned_amount_inr": 80000.0
        }
    ]
    flagged = detect_split_tenders(demo_projects)
    print("Demo Detection Output:")
    for f in flagged:
        print(f"  Flagged Pair: {f['project_a_id']} <-> {f['project_b_id']} (Sim: {f['similarity_score']})")
