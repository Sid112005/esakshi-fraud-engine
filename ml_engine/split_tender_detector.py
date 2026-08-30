"""
Semantic Duplicate & Split Tender Detection Engine.
SIH26102 - e-SAKSHI Fraud Detection Engine.

Uses Sentence-Transformers (all-MiniLM-L6-v2) and temporal-spatial-category
clustering (District + Work Category + 14-day rolling window) to identify
artificially fragmented contracts and split tenders below procurement thresholds.
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


class SplitTenderDetector:
    """Compatibility wrapper and service for live backend API split-tender detection."""

    def __init__(
        self,
        similarity_threshold: float = 0.80,
        window_days: int = 14,
        match_category: bool = True,
        match_agency: bool = False,
    ):
        self.similarity_threshold = similarity_threshold
        self.window_days = window_days
        self.match_category = match_category
        self.match_agency = match_agency

    def analyze_split_tender(
        self,
        project_description: str,
        sanctioned_amount: float,
        project_id: str = "",
        district: str = "",
        sanction_date: Optional[str] = None,
        work_category: Optional[str] = None,
        implementing_agency: Optional[str] = None,
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

        # Automatically load synthetic baseline data if no comparison list is passed
        if not comparison_records and os.path.exists(DEFAULT_DATA_PATH):
            try:
                df = pd.read_csv(DEFAULT_DATA_PATH)
                comparison_records = df.to_dict(orient="records")
            except Exception:
                comparison_records = []

        current_date_obj = _parse_date(sanction_date) or datetime.utcnow()
        current_date_str = current_date_obj.strftime("%Y-%m-%d")

        current_record = {
            "project_id": project_id or "CURRENT_PROJECT",
            "district": district or "UNKNOWN",
            "work_category": work_category or "",
            "implementing_agency": implementing_agency or "",
            "project_description": description,
            "sanction_date": current_date_str,
            "sanctioned_amount_inr": sanctioned_amount,
        }

        if not comparison_records:
            return {
                "is_split_tender": False,
                "similarity_score": 0.0,
                "explanation": "No comparable project records available for semantic split-tender detection.",
                "matches": [],
            }

        # Filter comparison records by district
        filtered_records = []
        for record in comparison_records:
            # Skip exact same project ID
            if str(record.get("project_id", "")) == str(project_id or ""):
                continue

            # District match (mandatory for geographic proximity)
            rec_dist = str(record.get("district", "")).strip().lower()
            if district and rec_dist and rec_dist != str(district).strip().lower():
                continue

            # Work category match if enabled and available
            if self.match_category and work_category:
                rec_cat = str(record.get("work_category", "")).strip().lower()
                if rec_cat and rec_cat != str(work_category).strip().lower():
                    continue

            # Implementing agency match if enabled
            if self.match_agency and implementing_agency:
                rec_agency = str(record.get("implementing_agency", "")).strip().lower()
                if rec_agency and rec_agency != str(implementing_agency).strip().lower():
                    continue

            # Temporal window filter if dates exist
            rec_date = _parse_date(record.get("sanction_date"))
            days_diff = None
            if current_date_obj and rec_date:
                days_diff = abs((current_date_obj - rec_date).days)
                if self.window_days and days_diff > self.window_days:
                    continue

            record_copy = dict(record)
            record_copy["_days_apart"] = days_diff
            filtered_records.append(record_copy)

        if not filtered_records:
            return {
                "is_split_tender": False,
                "similarity_score": 0.0,
                "explanation": f"No recent historical projects in {district or 'district'} within {self.window_days} days were found for comparison.",
                "matches": [],
            }

        model = get_embedding_model()
        historical_descriptions = [
            str(record.get("project_description", "") or "")
            for record in filtered_records
        ]

        embeddings = model.encode(
            historical_descriptions + [description],
            batch_size=64,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        current_embedding = embeddings[-1]

        relevant = []
        for idx, record in enumerate(filtered_records):
            sim = float(np.dot(current_embedding, embeddings[idx]))
            if sim >= self.similarity_threshold:
                relevant.append({
                    "project_a_id": project_id or current_record["project_id"],
                    "project_b_id": record.get("project_id"),
                    "district": district or str(record.get("district", "UNKNOWN")).strip(),
                    "description_a": description,
                    "description_b": record.get("project_description"),
                    "sanction_date_a": current_date_str,
                    "sanction_date_b": record.get("sanction_date"),
                    "days_apart": record.get("_days_apart"),
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
                f"Sentence-BERT identified a semantic similarity of {match_score:.2f} with a proximate project ({best_match.get('project_b_id')}) in {district or 'the same district'}, "
                f"within {best_match.get('days_apart', 'N/A')} days, indicating potential contract splitting."
            ),
            "matches": relevant,
        }


def detect_split_tenders(
    projects: List[Dict[str, Any]],
    similarity_threshold: float = 0.85,
    window_days: int = 14,
    match_category: bool = True,
    match_contractor: bool = False,
) -> List[Dict[str, Any]]:
    """
    Detect pairs of projects in the same district + category within rolling time window
    with semantic similarity >= similarity_threshold.
    """
    if not projects or len(projects) < 2:
        return []

    model = get_embedding_model()
    
    # Extract descriptions and compute embeddings in batch
    descriptions = [p.get("project_description", "") or "" for p in projects]
    embeddings = model.encode(descriptions, batch_size=128, show_progress_bar=False, normalize_embeddings=True)
    
    # Group indices by (district, [work_category], [implementing_agency])
    groups: Dict[Any, List[int]] = {}
    for idx, p in enumerate(projects):
        dist = str(p.get("district", "UNKNOWN")).strip()
        cat = str(p.get("work_category", "UNKNOWN")).strip() if match_category else ""
        agency = str(p.get("implementing_agency", "")).strip() if match_contractor else ""
        key = (dist, cat, agency)
        groups.setdefault(key, []).append(idx)

    flagged_pairs = []

    for key, indices in groups.items():
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
                    if window_days and days_diff > window_days:
                        continue

                # Cosine similarity on normalized embeddings is dot product
                sim = float(np.dot(embeddings[idx_a], embeddings[idx_b]))

                if sim >= similarity_threshold:
                    flagged_pairs.append({
                        "project_a_id": proj_a.get("project_id"),
                        "project_b_id": proj_b.get("project_id"),
                        "district": proj_a.get("district", "UNKNOWN"),
                        "work_category": proj_a.get("work_category", ""),
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
    window_days: int = 14,
    match_category: bool = True,
    match_contractor: bool = False,
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
        window_days=window_days,
        match_category=match_category,
        match_contractor=match_contractor,
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
        "window_days": window_days,
        "match_category": match_category,
        "match_contractor": match_contractor,
    }

    print("\n=== Split Tender Detector Evaluation ===")
    print(f"Total Dataset Records: {results['total_records']}")
    print(f"Ground Truth 'Tender Splitting' Projects: {results['ground_truth_split_tenders']}")
    print(f"Grouping: District {'+ Work Category' if match_category else ''} {'+ Contractor' if match_contractor else ''}")
    print(f"Time Window: {window_days} days | Similarity Threshold: {similarity_threshold}")
    print(f"Total Unique Projects Flagged: {results['total_flagged_projects']}")
    print(f"Total Suspicious Pairs Found: {results['flagged_pairs_count']}")
    print(f"True Positives Detected: {results['true_positives_detected']}")
    print(f"Precision on Tender Splitting: {results['split_tender_precision']:.2%}")
    print(f"Recall on Tender Splitting: {results['split_tender_recall']:.2%}")
    print(f"F1-Score: {results['split_tender_f1']:.2%}")
    print("=========================================\n")

    return results


if __name__ == "__main__":
    results = evaluate_split_tender_detector(similarity_threshold=0.85, window_days=14, match_category=True, match_contractor=True)