"""
StriveNest ERP - Standard Responses & Error Handling Test Suite
Tests 404 handler, custom headers, and response structure compliance.
"""


def test_404_not_found(client):
    """Test 404 response structure formatting."""
    response = client.get("/api/v1/non-existent-path")
    assert response.status_code == 404
    json_data = response.json()

    assert json_data["success"] is False
    assert "data" in json_data
    assert json_data["data"] is None
    assert "timestamp" in json_data


def test_custom_headers_present(client):
    """Test X-Request-ID and X-Process-Time custom response headers."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time" in response.headers
