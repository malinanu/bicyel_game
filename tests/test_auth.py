import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Milo Campaign API"
    assert response.json()["status"] == "running"

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_request_otp_invalid_phone():
    """Test OTP request with invalid phone number"""
    response = client.post("/api/auth/request-otp", json={
        "name": "Test User",
        "phone_number": "1234"  # Invalid phone
    })
    assert response.status_code == 422  # Validation error

def test_verify_otp_missing_fields():
    """Test OTP verification with missing fields"""
    response = client.post("/api/auth/verify-otp", json={
        "phone_number": "0771234567"
        # Missing otp_code
    })
    assert response.status_code == 422  # Validation error

# Note: Add more tests as needed
# For full integration tests, you'll need to set up a test database
