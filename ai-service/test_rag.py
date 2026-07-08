import sys
import os
import base64
import requests
from datetime import datetime, timedelta
from jose import jwt

# Match secret from environment/main.py
JWT_SECRET = os.getenv("JWT_SECRET", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970")

def generate_test_token(email: str = "admin@medpulse.com", role: str = "ADMIN", expires_in_hours: int = 1) -> str:
    secret_bytes = base64.b64decode(JWT_SECRET)
    payload = {
        "sub": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    return jwt.encode(payload, secret_bytes, algorithm="HS256")

def test_rag_flow():
    url_policy = "http://127.0.0.1:8000/ai/upload-policy"
    url_chat = "http://127.0.0.1:8000/ai/chat"
    print(f"\n--- Running SOP Policy Upload and RAG Retrieval Tests ---")
    
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(curr_dir, "sample_report.pdf")
    
    if not os.path.exists(pdf_path):
        with open(pdf_path, "wb") as f:
            f.write(b"%PDF-1.4...")
            
    admin_token = generate_test_token(email="admin@medpulse.com", role="ADMIN")
    doctor_token = generate_test_token(email="doctor@medpulse.com", role="DOCTOR")
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}

    try:
        # 1. Test Role Restrictions (Only Admin can upload policy)
        print("Testing Doctor role access for policy upload (Should be Forbidden)...")
        with open(pdf_path, "rb") as f:
            resp = requests.post(
                url_policy,
                headers=doctor_headers,
                files={"file": ("policy.pdf", f, "application/pdf")}
            )
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 403
        assert resp.json()["success"] is False

        # 2. Test Success Upload for Admin
        print("Testing Admin role uploading policy...")
        with open(pdf_path, "rb") as f:
            resp = requests.post(
                url_policy,
                headers=admin_headers,
                files={"file": ("policy_guidelines.pdf", f, "application/pdf")}
            )
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 200
        assert "status" in resp.json()
        assert resp.json()["status"] == "Success"

        # 3. Test RAG retrieval via chat
        print("Testing RAG chat query after indexing policy...")
        resp = requests.post(
            url_chat,
            json={"message": "What is the emergency admission policy guideline?", "session_id": "test_sess_rag"},
            headers=admin_headers
        )
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data
        assert data["category"] == "RAG"
        print("SUCCESS: SOP Policy Upload & RAG Retrieval Tests Passed Successfully!")
    except Exception as e:
        print(f"FAIL: RAG tests failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_rag_flow()
