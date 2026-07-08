import sys
import os
import base64
import requests
from datetime import datetime, timedelta
from jose import jwt

# Match secret from environment/main.py
JWT_SECRET = os.getenv("JWT_SECRET", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970")

def generate_test_token(email: str = "doctor@medpulse.com", role: str = "DOCTOR", expires_in_hours: int = 1) -> str:
    secret_bytes = base64.b64decode(JWT_SECRET)
    payload = {
        "sub": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    return jwt.encode(payload, secret_bytes, algorithm="HS256")

def test_pdf_analysis():
    url = "http://127.0.0.1:8000/ai/upload-report"
    print(f"\n--- Running PDF Analysis and Upload Tests (URL: {url}) ---")
    
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(curr_dir, "sample_report.pdf")
    
    # Ensure pdf exists
    if not os.path.exists(pdf_path):
        # Basic PDF header dummy
        with open(pdf_path, "wb") as f:
            f.write(b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 40 >>\nstream\nBT /F1 12 Tf 100 700 Td (Patient Name John Doe) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n303\n%%EOF")

    # Tokens
    doctor_token = generate_test_token(email="doctor@medpulse.com", role="DOCTOR")
    patient_token = generate_test_token(email="patient@medpulse.com", role="PATIENT")
    
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
    patient_headers = {"Authorization": f"Bearer {patient_token}"}

    try:
        # 1. Test RBAC Access Denied for Patients
        print("Testing Patient role access (Should be Forbidden)...")
        with open(pdf_path, "rb") as f:
            resp = requests.post(
                url,
                headers=patient_headers,
                files={"file": ("sample_report.pdf", f, "application/pdf")}
            )
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 403
        assert resp.json()["success"] is False

        # 2. Test Invalid File Extension
        print("Testing invalid file extension (Should be Bad Request)...")
        resp = requests.post(
            url,
            headers=doctor_headers,
            files={"file": ("test.txt", b"hello world", "text/plain")}
        )
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 400
        assert resp.json()["success"] is False

        # 3. Test Successful PDF Upload and Extraction
        print("Testing valid PDF upload and extraction...")
        with open(pdf_path, "rb") as f:
            resp = requests.post(
                url,
                headers=doctor_headers,
                files={"file": ("sample_report.pdf", f, "application/pdf")}
            )
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "patient_name" in data
        assert "diagnosis" in data
        assert "medicines" in data
        assert "doctor" in data
        assert "recommendations" in data

        print("SUCCESS: PDF Analysis and Upload Tests Passed Successfully!")
    except Exception as e:
        print(f"FAIL: PDF Analysis tests failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_pdf_analysis()
