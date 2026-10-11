import io
import json
import os
import sys
from PIL import Image, ImageDraw

# Ensure workspace root is in sys.path
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

def run_test():
    print("--- MEDIWALLET PRESCRIPTION OCR SYNTHETIC TEST ---")
    
    # 1. Generate synthetic prescription image
    img = Image.new("RGB", (800, 600), color="white")
    draw = ImageDraw.Draw(img)

    text_lines = [
        "Dr. S. K. Mukherjee, MBBS, MD",
        "Care & Cure Clinic, Bengaluru",
        "Date: 22/10/2025",
        "Patient Name: Aarav Sharma   Age: 42 Yrs",
        "Diagnosis: Essential Hypertension & Dyslipidemia",
        "Rx:",
        "1. Tab Telmisartan 40mg  1-0-0  30 days  (Morning after food)",
        "2. Tab Atorvastatin 20mg  0-0-1  30 days  (At bedtime)",
        "3. Tab Pantoprazole 40mg  1-0-0  15 days  (Empty stomach)",
        "Advice: Low salt diet, regular morning walk."
    ]

    y = 30
    for line in text_lines:
        draw.text((40, y), line, fill="black")
        y += 45

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    image_bytes = buf.getvalue()

    # 2. Use FastAPI TestClient for in-process testing
    try:
        from fastapi.testclient import TestClient
        from services.api.app.main import app

        client = TestClient(app)

        # Test model-info endpoint
        print("\n1. Testing GET /api/v1/prescriptions/model-info...")
        info_resp = client.get("/api/v1/prescriptions/model-info")
        print(f"Status: {info_resp.status_code}")
        hw_info = info_resp.json()
        print(f"  Primary Model: {hw_info.get('primary_model_id')} ({hw_info.get('primary_model_size_gb')} GB)")
        print(f"  CUDA Available: {hw_info.get('cuda_available')}")
        print(f"  Fallback Model: {hw_info.get('fallback_model_id')}")

        # Test scan endpoint with synthetic image
        print("\n2. Testing POST /api/v1/prescriptions/scan...")
        scan_resp = client.post(
            "/api/v1/prescriptions/scan?preferred_model=primary",
            files={"file": ("test_prescription.jpg", image_bytes, "image/jpeg")}
        )
        print(f"Status: {scan_resp.status_code}")
        assert scan_resp.status_code == 200, f"Scan failed: {scan_resp.text}"
        res = scan_resp.json()

        print(f"  Prescription ID: {res.get('prescription_id')}")
        print(f"  Model Used: {res.get('model_used')}")
        print(f"  Model Status: {res.get('model_status')}")
        if res.get("blocker_details"):
            print(f"  Blocker Transparency: {res.get('blocker_details')[:90]}...")
        print(f"  Doctor Details: {res.get('doctor_details')}")
        print(f"  Patient Details: {res.get('patient_details')}")
        print(f"  Diagnosis: {res.get('diagnosis')}")
        print(f"  Confidence Score: {res.get('confidence_score')}")
        print(f"  Medicines Extracted ({len(res.get('extracted_medicines', []))}):")
        for m in res.get("extracted_medicines", []):
            print(f"    - {m.get('name')} | Dose: {m.get('strength')} | Freq: {m.get('frequency')} | Dur: {m.get('duration')} | Needs Review: {m.get('needs_review')}")

        rx_id = res.get("prescription_id")
        assert rx_id is not None, "Missing prescription_id"
        assert len(res.get("extracted_medicines", [])) > 0, "No medicines extracted"

        # Test explicit confirmation endpoint (user reviewed & edited)
        print("\n3. Testing PUT /api/v1/prescriptions/{id}/confirm (Explicit Confirmation)...")
        confirm_payload = {
            "extracted_medicines": res.get("extracted_medicines", []),
            "doctor_details": res.get("doctor_details"),
            "patient_details": res.get("patient_details"),
            "diagnosis": res.get("diagnosis"),
            "doctor_notes": "Reviewed and verified by patient. Low salt diet.",
            "status": "confirmed"
        }
        confirm_resp = client.put(f"/api/v1/prescriptions/{rx_id}/confirm", json=confirm_payload)
        print(f"Status: {confirm_resp.status_code}")
        assert confirm_resp.status_code == 200, f"Confirm failed: {confirm_resp.text}"
        c_res = confirm_resp.json()
        print(f"  Status: {c_res.get('status')}")
        print(f"  Message: {c_res.get('message')}")

        print("\n--- ALL PRESCRIPTION OCR TESTS PASSED SUCCESSFULLY! ---")

    except Exception as e:
        print(f"Test failed with error: {e}")
        raise e

if __name__ == "__main__":
    run_test()
