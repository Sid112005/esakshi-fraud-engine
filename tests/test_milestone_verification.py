import io
import os
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def run_tests():
    print("=== TESTING MILESTONE PHOTO VERIFICATION ENDPOINT ===")
    
    # 1. Test Duplicate Detection with a slightly modified / resized image
    # Take an existing seeded demo image (MPLADS-004_school_building.jpg -> seeded as MPLAD-DEMO-004)
    orig_path = os.path.join("data", "demo_images", "MPLADS-004_school_building.jpg")
    with open(orig_path, "rb") as f:
        orig_bytes = f.read()

    # Create a modified copy: resize by 80% and save as compressed JPEG
    orig_img = Image.open(io.BytesIO(orig_bytes))
    modified_img = orig_img.resize((int(orig_img.width * 0.8), int(orig_img.height * 0.8)))
    buf = io.BytesIO()
    modified_img.save(buf, format="JPEG", quality=75)
    modified_bytes = buf.getvalue()

    print("\n[TEST 1] Uploading modified/re-compressed image for NEW project 'MPLAD-2026-CLAIM-99'...")
    res1 = client.post(
        "/api/v1/verify-milestone-photo",
        data={"project_id": "MPLAD-2026-CLAIM-99"},
        files={"file": ("completion_proof_mod.jpg", modified_bytes, "image/jpeg")}
    )
    print("Status:", res1.status_code)
    data1 = res1.json()
    print("Response JSON:")
    import json
    print(json.dumps(data1, indent=2))
    assert res1.status_code == 200
    assert data1["is_duplicate"] is True
    assert data1["matched_project_id"] == "MPLAD-DEMO-004"
    assert data1["hamming_distance"] <= 8
    print("-> PASS: Duplicate correctly detected and matched to MPLAD-DEMO-004!")

    # 2. Test Clean / Unique Image Registration
    # Generate a brand new unique synthetic pattern image
    unique_img = Image.new("RGB", (300, 300), color=(34, 139, 34))
    # Add unique pixels
    from PIL import ImageDraw
    d = ImageDraw.Draw(unique_img)
    d.rectangle([50, 50, 250, 250], fill=(255, 215, 0), outline=(255, 0, 0))
    d.text((80, 140), "AUTHENTIC SITE 2026", fill=(0, 0, 0))
    buf2 = io.BytesIO()
    unique_img.save(buf2, format="JPEG")
    unique_bytes = buf2.getvalue()

    print("\n[TEST 2] Uploading genuinely new unique image for project 'MPLAD-2026-CLEAN-01'...")
    res2 = client.post(
        "/api/v1/verify-milestone-photo",
        data={"project_id": "MPLAD-2026-CLEAN-01"},
        files={"file": ("site_authentic.jpg", unique_bytes, "image/jpeg")}
    )
    print("Status:", res2.status_code)
    data2 = res2.json()
    print("Response JSON:")
    print(json.dumps(data2, indent=2))
    assert res2.status_code == 200
    assert data2["is_duplicate"] is False
    assert data2["matched_project_id"] is None
    assert data2["registered"] is True
    print("-> PASS: Clean photo verified and registered!")

if __name__ == "__main__":
    run_tests()
