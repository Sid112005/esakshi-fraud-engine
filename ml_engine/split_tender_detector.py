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


class SplitTenderDetector:
    """Compatibility wrapper for the backend API expected by the Flask/FastAPI app."""

    def __init__(self, similarity_threshold: float = 0.65, window_days: int = 30):
        self.similarity_threshold = similarity_threshold
        self.window_days = window_days

    def analyze_split_tender(
        self,
        project_description: str,
        sanctioned_amount: float,
        project_id: str = "",
        district: str = "",
        sanction_date: Optional[str] = None,
        comparison_projects: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Return a dictionary shaped like the backend expects for split-tender alerts."""
        description = str(project_description or "").strip()
        if not description:
            return {
                "is_split_tender": False,
                "similarity_score": 0.0,
                "explanation": "No project description provided for split-tender analysis.",
                "matches": [],
            }

        comparison_records = list(comparison_projects or [])

        # Automatically fall back to synthetic data if no comparison list is passed
        if not comparison_records and os.path.exists(DEFAULT_DATA_PATH):
            try:
                df = pd.read_csv(DEFAULT_DATA_PATH)
                # Filter by district if provided to keep processing fast and relevant
                if district:
                    filtered_df = df[df["district"].astype(str).str.strip().str.lower() == str(district).strip().lower()]
                    comparison_records = filtered_df.to_dict(orient="records") if not filtered_df.empty else df.to_dict(orient="records")
                else:
                    comparison_records = df.to_dict(orient="records")
            except Exception:
                comparison_records = []

        current_record = {
            "project_id": project_id or "CURRENT_PROJECT",
            "district": district or "UNKNOWN",
            "project_description": description,
            "sanction_date": sanction_date or datetime.utcnow().strftime("%Y-%m-%d"),
            "sanctioned_amount_inr": sanctioned_amount,
        }

        if not comparison_records:
            return {
                "is_split_tender": False,
                "similarity_score": 0.0,
                "explanation": "No comparable project records available for semantic split-tender detection.",
                "matches": [],
            }

        district_records = comparison_records
        if district:
            district_records = [
                record for record in comparison_records
                if str(record.get("district", "")).strip().lower() == str(district).strip().lower()
            ]

        if not district_records:
            district_records = comparison_records

        # For a single incoming project, ignore the 30-day temporal window and compare
        # against all historical records in the same district. We still use cosine
        # similarity on normalized embeddings, which is equivalent to dot product.
        model = get_embedding_model()
        historical_descriptions = [
            str(record.get("project_description", "") or "")
            for record in district_records
            if str(record.get("project_id", "")) != str(project_id or "")
        ]

        if not historical_descriptions:
            return {
                "is_split_tender": False,
                "similarity_score": 0.0,
                "explanation": "No historical projects in the same district were available for comparison.",
                "matches": [],
            }

        embeddings = model.encode(
            historical_descriptions + [description],
            batch_size=64,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        current_embedding = embeddings[-1]

        relevant = []
        for idx, record in enumerate(district_records):
            if str(record.get("project_id", "")) == str(project_id or ""):
                continue

            sim = float(np.dot(current_embedding, embeddings[idx]))
            if sim >= self.similarity_threshold:
                relevant.append({
                    "project_a_id": project_id or current_record["project_id"],
                    "project_b_id": record.get("project_id"),
                    "district": district or str(record.get("district", "UNKNOWN")).strip(),
                    "description_a": description,
                    "description_b": record.get("project_description"),
                    "sanction_date_a": sanction_date or current_record["sanction_date"],
                    "sanction_date_b": record.get("sanction_date"),
                    "days_apart": None,
                    "amount_a": sanctioned_amount,
                    "amount_b": record.get("sanctioned_amount_inr"),
                    "similarity_score": round(sim, 4),
                    "flag": True,
                })

        if not relevant:
            return {
                "is_split_tender": False,
                "similarity_score": 0.0,
                "explanation": "No semantic similarity match exceeded the split-tender threshold for this project.",
                "matches": [],
            }

        best_match = max(relevant, key=lambda item: float(item.get("similarity_score", 0.0) or 0.0))
        match_score = float(best_match.get("similarity_score", 0.0) or 0.0)
        return {
            "is_split_tender": True,
            "similarity_score": round(match_score, 4),
            "explanation": (
                f"Sentence-BERT identified a semantic similarity of {match_score:.2f} with a historical project in {district or 'the same district'}, "
                "indicating potential contract fragmentation to bypass procurement thresholds."
            ),
            "matches": relevant,
        }


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
    
    flagged_project_ids = set()
    for pair in flagged_pairs:
        flagged_project_ids.add(pair["project_a_id"])
        flagged_project_ids.add(pair["project_b_id"])

    gt_split_df = df[df["fraud_type"] == "Tender Splitting"]
    gt_split_ids = set(gt_split_df["project_id"])
    
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
    results = evaluate_split_tender_detector()