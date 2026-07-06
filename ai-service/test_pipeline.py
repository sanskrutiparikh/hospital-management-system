"""
End-to-end verification of the PDF analysis pipeline.
Tests both the direct FastAPI endpoint and the API Gateway route.
"""
import requests
import os
import json

GATEWAY_URL = "http://localhost:9090"
DIRECT_URL  = "http://localhost:8000"

def login():
    """Get JWT token via API Gateway."""
    resp = requests.post(f"{GATEWAY_URL}/auth/login", json={
        "email": "admin@medpulse.com",
        "password": "password"
    })
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    token = resp.json().get("token")
    assert token, "No token in login response"
    return token

def test_upload(base_url, token, label):
    """Upload sample_report.pdf and validate the response."""
    print(f"\n{'='*60}")
    print(f"  TEST: {label}")
    print(f"  URL : {base_url}/ai/upload-report")
    print(f"{'='*60}")
    
    headers = {"Authorization": f"Bearer {token}"}
    file_path = "sample_report.pdf"
    
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{base_url}/ai/upload-report",
            headers=headers,
            files={"file": (os.path.basename(file_path), f, "application/pdf")}
        )
    
    print(f"  Status Code : {resp.status_code}")
    print(f"  Content-Type: {resp.headers.get('content-type', 'N/A')}")
    
    # Must be JSON
    try:
        data = resp.json()
    except Exception as e:
        print(f"  FAIL: Response is not valid JSON!")
        print(f"  Raw response: {resp.text[:500]}")
        return False
    
    print(f"  JSON Response: {json.dumps(data, indent=2)}")
    
    # Validate structure
    checks = {
        "success field present":    "success" in data,
        "success is True":          data.get("success") == True,
        "patient_name present":     bool(data.get("patient_name")),
        "diagnosis present":        bool(data.get("diagnosis")),
        "medicines is list":        isinstance(data.get("medicines"), list),
        "doctor present":           bool(data.get("doctor")),
        "recommendations is list":  isinstance(data.get("recommendations"), list),
    }
    
    all_pass = True
    for check_name, passed in checks.items():
        status = "PASS" if passed else "FAIL"
        if not passed: all_pass = False
        print(f"  [{status}] {check_name}")
    
    return all_pass

def test_error_handling(base_url, token):
    """Upload an invalid (non-PDF) file and verify error response is JSON."""
    print(f"\n{'='*60}")
    print(f"  TEST: Error handling (invalid file)")
    print(f"{'='*60}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = requests.post(
        f"{base_url}/ai/upload-report",
        headers=headers,
        files={"file": ("not_a_pdf.txt", b"hello world", "text/plain")}
    )
    
    print(f"  Status Code : {resp.status_code}")
    
    try:
        data = resp.json()
        print(f"  JSON Response: {json.dumps(data, indent=2)}")
        
        has_success_false = data.get("success") == False
        has_error_msg     = bool(data.get("error"))
        
        print(f"  [{'PASS' if has_success_false else 'FAIL'}] success is False")
        print(f"  [{'PASS' if has_error_msg else 'FAIL'}] error message present")
        return has_success_false and has_error_msg
    except:
        print(f"  FAIL: Error response is not valid JSON!")
        print(f"  Raw: {resp.text[:500]}")
        return False

if __name__ == "__main__":
    print("Logging in...")
    token = login()
    print("Login successful.\n")
    
    results = []
    
    # Test 1: Direct FastAPI
    results.append(("Direct FastAPI Upload", test_upload(DIRECT_URL, token, "Direct FastAPI (port 8000)")))
    
    # Test 2: Via API Gateway
    results.append(("API Gateway Upload", test_upload(GATEWAY_URL, token, "Via API Gateway (port 9090)")))
    
    # Test 3: Error handling (direct)
    results.append(("Error Handling (Direct)", test_error_handling(DIRECT_URL, token)))
    
    # Test 4: Error handling (gateway)
    results.append(("Error Handling (Gateway)", test_error_handling(GATEWAY_URL, token)))
    
    # Summary
    print(f"\n{'='*60}")
    print(f"  FINAL RESULTS")
    print(f"{'='*60}")
    for name, passed in results:
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}")
    
    all_pass = all(p for _, p in results)
    print(f"\n  Overall: {'ALL TESTS PASSED' if all_pass else 'SOME TESTS FAILED'}")
