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

def test_ai_chat_flow():
    url = "http://127.0.0.1:8000/ai/chat"
    print(f"\n--- Running AI Chat and JWT Authentication Tests (URL: {url}) ---")
    
    try:
        # 1. Test JWT Authentication - Unauthorized (No Token) - returns 403 by default in FastAPI HTTPBearer
        print("Testing Unauthorized access (No Token)...")
        resp = requests.post(url, json={"message": "hello", "session_id": "test_sess"})
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 403
        assert resp.json()["success"] is False
        assert "error" in resp.json()

        # 2. Test JWT Authentication - Invalid Token - returns 401
        print("Testing Unauthorized access (Invalid Token)...")
        headers = {"Authorization": "Bearer invalid_token_value"}
        resp = requests.post(url, json={"message": "hello", "session_id": "test_sess"}, headers=headers)
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 401
        assert resp.json()["success"] is False

        # Generate valid token
        admin_token = generate_test_token(email="admin@medpulse.com", role="ADMIN")
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        # 3. Test AI Chat - General Query Routing
        print("Testing General Chat Query...")
        resp = requests.post(
            url,
            json={"message": "Hello, how can you help me today?", "session_id": "test_sess"},
            headers=auth_headers
        )
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data
        assert data["category"] == "GENERAL"

        # 4. Test AI Chat - SQL Query Routing
        print("Testing SQL Query Routing...")
        resp = requests.post(
            url,
            json={"message": "Show all active doctors and patients registered.", "session_id": "test_sess"},
            headers=auth_headers
        )
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data
        assert data["category"] == "SQL"

        # 5. Test AI Chat - RAG Query Routing
        print("Testing RAG Query Routing...")
        resp = requests.post(
            url,
            json={"message": "What is the emergency admission policy guideline?", "session_id": "test_sess"},
            headers=auth_headers
        )
        print(f"Status: {resp.status_code}, Response: {resp.json()}")
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data
        assert data["category"] == "RAG"

        print("SUCCESS: AI Chat & JWT Authentication Tests Passed Successfully!")
    except Exception as e:
        print(f"FAIL: AI Chat tests failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_ai_chat_flow()
