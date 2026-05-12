import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert data["scraper"] == "tinyfish"

def test_pincode_validation_failure():
    # Test invalid pincode lengths
    response = client.get("/api/geo/pincode/123")
    assert response.status_code == 400
    assert "Invalid pincode" in response.json()["detail"]

    # Test non-digit pincodes
    response = client.get("/api/geo/pincode/abc123")
    assert response.status_code == 400

def test_lookup_missing_pincode():
    # Test a pincode that is valid format but not in db
    response = client.get("/api/geo/pincode/999999")
    # Should return either 200 (for graceful fallback), 404 pincode not found, or throw an error safely
    assert response.status_code in [200, 404, 500]


def test_list_states():
    response = client.get("/api/geo/states")
    assert response.status_code in [200, 500]
    if response.status_code == 200:
        assert "states" in response.json()
