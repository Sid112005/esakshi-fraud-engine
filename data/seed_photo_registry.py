import os
import glob
import json
import sys
sys.path.insert(0, '.')
from ml_engine.image_duplicate_detector import compute_image_hash, ImageDuplicateDetector

DEMO_DIR = os.path.join("data", "demo_images")

def seed_photo_registry():
    detector = ImageDuplicateDetector()
    image_files = sorted(
        glob.glob(os.path.join(DEMO_DIR, "*.jpg*")) + glob.glob(os.path.join(DEMO_DIR, "*.png*"))
    )

    print(f"Found {len(image_files)} demo images in {DEMO_DIR}:")
    seeded_registry = {}

    for idx, filepath in enumerate(image_files, start=1):
        filename = os.path.basename(filepath)
        project_id = f"MPLAD-DEMO-{idx:03d}"
        
        with open(filepath, "rb") as f:
            img_bytes = f.read()

        p_hash = compute_image_hash(img_bytes)
        seeded_registry[project_id] = p_hash
        print(f"  [{idx}] {project_id} -> {filename} | pHash: {p_hash}")

    detector.save_registry(seeded_registry)
    print(f"\nSuccessfully seeded {len(seeded_registry)} historical project photos to {detector.registry_path}")

if __name__ == "__main__":
    seed_photo_registry()
