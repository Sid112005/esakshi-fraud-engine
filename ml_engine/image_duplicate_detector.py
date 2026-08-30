import io
import json
import os
from typing import Dict, Any, Optional
from PIL import Image
import imagehash

DEFAULT_REGISTRY_PATH = os.path.join("data", "photo_registry.json")

def compute_image_hash(image_bytes: bytes) -> str:
    """
    Computes a 64-bit Perceptual Hash (pHash) string for the given raw image bytes.
    Perceptual hashing remains invariant under compression, scaling, minor brightness
    adjustments, and format conversions.
    """
    image = Image.open(io.BytesIO(image_bytes))
    # Convert image to RGB to handle palette / alpha modes gracefully
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    hash_obj = imagehash.phash(image)
    return str(hash_obj)

def check_duplicate(
    new_hash: str,
    historical_hashes: Optional[Dict[str, str]] = None,
    threshold: int = 8,
) -> Dict[str, Any]:
    """
    Compares the Hamming distance between a newly computed pHash and all historical
    project hashes. A Hamming distance <= threshold indicates reuse / near-duplicate.
    """
    if historical_hashes is None:
        historical_hashes = {}

    if not historical_hashes:
        return {
            "is_duplicate": False,
            "matched_project_id": None,
            "hamming_distance": None,
            "similarity_pct": 0.0,
            "explanation": "No prior photo records in registry for comparison."
        }

    try:
        new_hash_obj = imagehash.hex_to_hash(new_hash)
    except Exception as e:
        return {
            "is_duplicate": False,
            "matched_project_id": None,
            "hamming_distance": None,
            "error": f"Invalid hash string: {e}"
        }

    min_distance = 65
    matched_project = None

    for proj_id, hist_hash in historical_hashes.items():
        try:
            hist_hash_obj = imagehash.hex_to_hash(hist_hash)
            distance = new_hash_obj - hist_hash_obj  # Computes Hamming distance
            if distance < min_distance:
                min_distance = distance
                matched_project = proj_id
        except Exception:
            continue

    is_dup = bool(min_distance <= threshold)
    similarity_pct = float(round(max(0.0, (1.0 - (min_distance / 64.0)) * 100.0), 2))

    return {
        "is_duplicate": is_dup,
        "matched_project_id": str(matched_project) if (is_dup and matched_project) else None,
        "hamming_distance": int(min_distance) if min_distance <= 64 else None,
        "similarity_pct": similarity_pct,
        "explanation": (
            f"Perceptual Hash match found with project '{matched_project}' (Hamming distance: {min_distance}/64, {similarity_pct}% visual match)."
            if is_dup
            else f"Unique milestone completion photo verified (Minimum Hamming distance: {min_distance}/64 against all historical records)."
        )
    }

class ImageDuplicateDetector:
    """
    AI Check 3 Service: Photo-based Milestone Verification for MPLADS works.
    Detects contractors reusing duplicate or modified completion photos across multiple project invoices.
    """

    def __init__(self, registry_path: str = DEFAULT_REGISTRY_PATH, threshold: int = 8):
        self.registry_path = registry_path
        self.threshold = threshold
        self._ensure_registry()

    def _ensure_registry(self):
        if not os.path.exists(self.registry_path):
            os.makedirs(os.path.dirname(self.registry_path), exist_ok=True)
            with open(self.registry_path, "w", encoding="utf-8") as f:
                json.dump({}, f, indent=2)

    def load_registry(self) -> Dict[str, str]:
        if not os.path.exists(self.registry_path):
            return {}
        try:
            with open(self.registry_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception:
            return {}

    def save_registry(self, registry: Dict[str, str]):
        os.makedirs(os.path.dirname(self.registry_path), exist_ok=True)
        with open(self.registry_path, "w", encoding="utf-8") as f:
            json.dump(registry, f, indent=2)

    def register_photo(self, project_id: str, photo_hash: str) -> bool:
        registry = self.load_registry()
        registry[project_id] = photo_hash
        self.save_registry(registry)
        return True

    def verify_milestone_photo(self, project_id: str, image_bytes: bytes) -> Dict[str, Any]:
        new_hash = compute_image_hash(image_bytes)
        historical = self.load_registry()
        
        # Don't compare a project against its own exact previous upload if re-evaluating
        comparison_set = {k: v for k, v in historical.items() if k != project_id}
        
        result = check_duplicate(new_hash, comparison_set, threshold=self.threshold)
        result["computed_hash"] = new_hash
        result["project_id"] = project_id

        # If clean / not a duplicate of another project, register this as the verified photo
        if not result["is_duplicate"]:
            self.register_photo(project_id, new_hash)
            result["registered"] = True
        else:
            result["registered"] = False

        return result

image_duplicate_detector = ImageDuplicateDetector()
