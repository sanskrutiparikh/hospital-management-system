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

def test_chat():
    url = "http://127.0.0.1:8000/ai/chat"
    print(f"\n--- Running AI Chat Tests (URL: {url}) ---")
    
    admin_token = generate_test_token(email="admin@medpulse.com", role="ADMIN")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    queries = [
        ("Hello", "GENERAL"),
        ("Show all patients", "SQL"),
        ("List diabetic patients above age 50", "SQL"),
        ("Show appointments today", "SQL")
    ]
    
    try:
        for q, expected_cat in queries:
            print(f"Sending Query: '{q}' (Expect Category: {expected_cat})")
            resp = requests.post(
                url,
                json={"message": q, "session_id": "test_chat_sess"},
                headers=headers
            )
            print(f"Status Code: {resp.status_code}")
            print(f"Response: {resp.json()}")
            
            assert resp.status_code == 200, f"Query failed: {resp.status_code}"
            data = resp.json()
            assert "response" in data
            assert data["category"] == expected_cat, f"Expected {expected_cat}, got {data['category']}"
            
        print("SUCCESS: AI Chat Tests Passed Successfully!")
    except Exception as e:
        print(f"FAIL: Chat tests failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_chat()
