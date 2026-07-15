import sys
import os
import base64
from datetime import datetime, timedelta
from jose import jwt
import requests
import pytest

# Secret from main.py
JWT_SECRET = os.getenv("JWT_SECRET", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970")

def generate_test_token(email: str = "admin@medpulse.com", role: str = "ADMIN", expires_in_hours: int = 1) -> str:
    secret_bytes = base64.b64decode(JWT_SECRET)
    payload = {
        "sub": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    return jwt.encode(payload, secret_bytes, algorithm="HS256")

@pytest.fixture
def auth_headers():
    token = generate_test_token()
    return {"Authorization": f"Bearer {token}"}

def test_chat_hello(auth_headers):
    url = "http://127.0.0.1:8000/ai/chat"
    resp = requests.post(
        url,
        json={"message": "Hello", "session_id": "test_sess_hello"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "GENERAL"
    assert "MediPulse AI" in data["response"]
    assert "help" in data["response"].lower() or "greeting" in data["response"].lower() or "hello" in data["response"].lower()

def test_chat_math_5_plus_5(auth_headers):
    url = "http://127.0.0.1:8000/ai/chat"
    resp = requests.post(
        url,
        json={"message": "5+5", "session_id": "test_sess_math1"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "GENERAL"
    assert data["response"].strip() == "10"

def test_chat_math_large(auth_headers):
    url = "http://127.0.0.1:8000/ai/chat"
    resp = requests.post(
        url,
        json={"message": "44489+848945", "session_id": "test_sess_math2"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "GENERAL"
    assert data["response"].strip() == "893434"

def test_chat_what_is_ai(auth_headers):
    url = "http://127.0.0.1:8000/ai/chat"
    resp = requests.post(
        url,
        json={"message": "What is AI?", "session_id": "test_sess_ai"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "GENERAL"
    assert "Artificial Intelligence" in data["response"]
    assert "simulation" in data["response"].lower()

def test_chat_explain_diabetes(auth_headers):
    url = "http://127.0.0.1:8000/ai/chat"
    resp = requests.post(
        url,
        json={"message": "Explain diabetes", "session_id": "test_sess_diabetes"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "GENERAL"
    assert "chronic condition" in data["response"].lower()
    assert "blood sugar" in data["response"].lower() or "glucose" in data["response"].lower()

def test_chat_who_are_you(auth_headers):
    url = "http://127.0.0.1:8000/ai/chat"
    resp = requests.post(
        url,
        json={"message": "Who are you?", "session_id": "test_sess_who"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "GENERAL"
    assert "MediPulse AI" in data["response"]
    assert "assistant" in data["response"].lower()
