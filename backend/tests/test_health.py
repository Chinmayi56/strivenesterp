"""
StriveNest ERP - Health Endpoints Test Suite
Tests GET /api/v1/health, /ready, and /live endpoints.
"""


def test_health_check(client):
    """Test GET /api/v1/health endpoint response structure and status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    json_data = response.json()

    assert json_data["success"] is True
    assert "data" in json_data
    assert json_data["data"]["status"] == "healthy"
    assert json_data["data"]["database"] == "connected"
    assert json_data["data"]["application"] == "running"
    assert "version" in json_data["data"]
    assert "timestamp" in json_data


def test_health_readiness(client):
    """Test GET /api/v1/health/ready endpoint."""
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    json_data = response.json()

    assert json_data["success"] is True
    assert json_data["data"]["ready"] is True
    assert json_data["data"]["database"] == "connected"


def test_health_liveness(client):
    """Test GET /api/v1/health/live endpoint."""
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    json_data = response.json()

    assert json_data["success"] is True
    assert json_data["data"]["alive"] is True
    assert "uptime_seconds" in json_data["data"]
