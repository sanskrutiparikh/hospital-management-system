import sys
import os
import base64
import requests
from datetime import datetime, timedelta
from jose import jwt

# Secret from main.py
JWT_SECRET = os.getenv("JWT_SECRET", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970")

def generate_token(email: str, role: str, expires_in_seconds: int) -> str:
    secret_bytes = base64.b64decode(JWT_SECRET)
    payload = {
        "sub": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(seconds=expires_in_seconds)
    }
    return jwt.encode(payload, secret_bytes, algorithm="HS256")

def test_jwt():
    url = "http://127.0.0.1:8000/ai/chat"
    print(f"\n--- Running JWT Authentication Tests (URL: {url}) ---")
    
    # Test case 1: Missing token (No Authorization header) -> Should return 403
    print("Testing missing token...")
    resp = requests.post(url, json={"message": "Hello", "session_id": "jwt_test"})
    print(f"Status: {resp.status_code}, Response: {resp.json()}")
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    assert resp.json()["success"] is False
    
    # Test case 2: Malformed token -> Should return 401
    print("Testing malformed token...")
    headers = {"Authorization": "Bearer not-a-jwt-token"}
    resp = requests.post(url, json={"message": "Hello", "session_id": "jwt_test"}, headers=headers)
    print(f"Status: {resp.status_code}, Response: {resp.json()}")
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    assert resp.json()["success"] is False

    # Test case 3: Expired token -> Should return 401
    print("Testing expired token...")
    expired_token = generate_token("user@hms.com", "PATIENT", -10)
    headers = {"Authorization": f"Bearer {expired_token}"}
    resp = requests.post(url, json={"message": "Hello", "session_id": "jwt_test"}, headers=headers)
    print(f"Status: {resp.status_code}, Response: {resp.json()}")
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    assert resp.json()["success"] is False

    # Test case 4: Valid token -> Should return 200
    print("Testing valid token...")
    valid_token = generate_token("user@hms.com", "PATIENT", 60)
    headers = {"Authorization": f"Bearer {valid_token}"}
    resp = requests.post(url, json={"message": "Hello", "session_id": "jwt_test"}, headers=headers)
    print(f"Status: {resp.status_code}, Response: {resp.json()}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    assert resp.json()["category"] == "GENERAL"

    print("SUCCESS: JWT Authentication Tests Passed Successfully!")

if __name__ == "__main__":
    try:
        test_jwt()
    except Exception as e:
        print(f"FAIL: JWT tests failed: {e}")
        sys.exit(1)
