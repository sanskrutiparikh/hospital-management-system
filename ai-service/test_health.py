import sys
import os
import requests

def test_health():
    url = "http://127.0.0.1:8000/ai/health"
    print(f"\n--- Running Health Endpoint Test (URL: {url}) ---")
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Health check failed with status: {response.status_code}"
        data = response.json()
        
        # Verify JSON keys (Phase 5)
        expected_keys = ["status", "gemini", "database", "vector_store", "embeddings", "sql_agent", "rag", "pdf", "version"]
        for key in expected_keys:
            assert key in data, f"Missing key: {key}"
        
        # Verify status values
        assert data["status"] in ["UP", "DEGRADED", "DOWN"], f"Invalid status: {data['status']}"
        assert data["gemini"] in ["CONNECTED", "MOCK", "ERROR"], f"Invalid gemini status: {data['gemini']}"
        assert data["database"] in ["CONNECTED", "ERROR"], f"Invalid database status: {data['database']}"
        assert data["vector_store"] in ["READY", "ERROR"], f"Invalid vector_store status: {data['vector_store']}"
        assert data["embeddings"] in ["READY", "ERROR"], f"Invalid embeddings status: {data['embeddings']}"
        assert data["sql_agent"] in ["READY", "ERROR"], f"Invalid sql_agent status: {data['sql_agent']}"
        assert data["rag"] in ["READY", "ERROR"], f"Invalid rag status: {data['rag']}"
        assert data["pdf"] in ["READY", "ERROR"], f"Invalid pdf status: {data['pdf']}"
        assert isinstance(data["version"], str), "version should be a string"
        
        print("SUCCESS: Health Endpoint Test Passed Successfully!")
    except Exception as e:
        print(f"FAIL: Health endpoint check failed: {e}")
        sys.exit(1)

def test_health_details():
    url = "http://127.0.0.1:8000/ai/health/details"
    print(f"\n--- Running Health Details Endpoint Test (URL: {url}) ---")
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response Summary: {list(response.json().keys())}")
        
        assert response.status_code == 200, f"Health details failed: {response.status_code}"
        data = response.json()
        
        assert "timestamp" in data
        assert "version" in data
        assert "subsystems" in data
        
        subsystems = data["subsystems"]
        for sub in ["gemini", "database", "vector_store", "embeddings", "sql_agent", "rag", "pdf"]:
            assert sub in subsystems, f"Missing subsystem in details: {sub}"
            assert "status" in subsystems[sub], f"Missing status inside subsystem: {sub}"
            
        print("SUCCESS: Health Details Endpoint Test Passed Successfully!")
    except Exception as e:
        print(f"FAIL: Health details check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_health()
    test_health_details()
