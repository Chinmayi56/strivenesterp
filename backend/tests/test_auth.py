"""
StriveNest ERP - Authentication & RBAC Test Suite
Validates registration, login, JWT validation, refresh token rotation, logout, password reset, and role-based access control.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User, UserRole, UserStatus
from app.core.security import hash_password


client = TestClient(app)


def test_register_employee_success():
    payload = {
        "first_name": "John",
        "last_name": "Smith",
        "email": "john.smith@strivenest.com",
        "phone": "+15551234567",
        "password": "Password123!",
        "role": "EMPLOYEE"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["email"] == "john.smith@strivenest.com"
    assert json_data["data"]["role"] == "EMPLOYEE"
    assert json_data["data"]["employee_id"].startswith("EMP-")


def test_register_duplicate_email_fails():
    payload = {
        "first_name": "John",
        "last_name": "Smith",
        "email": "john.smith@strivenest.com",
        "phone": "+15559876543",
        "password": "Password123!",
        "role": "EMPLOYEE"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422 or response.status_code == 400
    json_data = response.json()
    assert json_data["success"] is False


def test_register_weak_password_fails():
    payload = {
        "first_name": "Weak",
        "last_name": "User",
        "email": "weak@strivenest.com",
        "password": "123",  # Weak
        "role": "EMPLOYEE"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code in (400, 422)
    json_data = response.json()
    assert json_data["success"] is False


def test_login_success():
    payload = {
        "email": "john.smith@strivenest.com",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "access_token" in json_data["data"]
    assert "refresh_token" in json_data["data"]
    assert json_data["data"]["token_type"] == "bearer"
    assert json_data["data"]["user"]["email"] == "john.smith@strivenest.com"


def test_login_invalid_password_fails():
    payload = {
        "email": "john.smith@strivenest.com",
        "password": "WrongPassword123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    json_data = response.json()
    assert json_data["success"] is False


def test_get_me_protected_route():
    # 1. Login to get access token
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "john.smith@strivenest.com",
        "password": "Password123!"
    })
    token = login_resp.json()["data"]["access_token"]

    # 2. Unauthenticated request should fail with 401
    unauth_resp = client.get("/api/v1/auth/me")
    assert unauth_resp.status_code == 401

    # 3. Authenticated request with Bearer token should succeed
    auth_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert auth_resp.status_code == 200
    assert auth_resp.json()["data"]["email"] == "john.smith@strivenest.com"


def test_refresh_token_rotation():
    # 1. Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "john.smith@strivenest.com",
        "password": "Password123!"
    })
    tokens = login_resp.json()["data"]
    old_refresh_token = tokens["refresh_token"]

    # 2. Refresh token
    refresh_resp = client.post("/api/v1/auth/refresh", json={
        "refresh_token": old_refresh_token
    })
    assert refresh_resp.status_code == 200
    new_tokens = refresh_resp.json()["data"]
    assert new_tokens["access_token"] != tokens["access_token"]
    assert new_tokens["refresh_token"] != old_refresh_token

    # 3. Try reusing old refresh token (should fail due to token rotation)
    reuse_resp = client.post("/api/v1/auth/refresh", json={
        "refresh_token": old_refresh_token
    })
    assert reuse_resp.status_code == 401


def test_logout():
    # 1. Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "john.smith@strivenest.com",
        "password": "Password123!"
    })
    tokens = login_resp.json()["data"]
    refresh_token = tokens["refresh_token"]

    # 2. Logout
    logout_resp = client.post("/api/v1/auth/logout", json={
        "refresh_token": refresh_token
    })
    assert logout_resp.status_code == 200

    # 3. Try using revoked refresh token
    refresh_resp = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_resp.status_code == 401


def test_forgot_and_reset_password_flow():
    # 1. Initiate forgot password
    forgot_resp = client.post("/api/v1/auth/forgot-password", json={
        "email": "john.smith@strivenest.com"
    })
    assert forgot_resp.status_code == 200
    reset_token = forgot_resp.json()["data"]["reset_token"]
    assert reset_token is not None

    # 2. Reset password using token
    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "NewSecurePassword456!"
    })
    assert reset_resp.status_code == 200

    # 3. Old password login should fail
    old_login = client.post("/api/v1/auth/login", json={
        "email": "john.smith@strivenest.com",
        "password": "Password123!"
    })
    assert old_login.status_code == 401

    # 4. New password login should succeed
    new_login = client.post("/api/v1/auth/login", json={
        "email": "john.smith@strivenest.com",
        "password": "NewSecurePassword456!"
    })
    assert new_login.status_code == 200


def test_rbac_super_admin_vs_employee():
    # 1. Register Super Admin
    client.post("/api/v1/auth/register", json={
        "first_name": "Super",
        "last_name": "Admin",
        "email": "admin@strivenest.com",
        "password": "AdminPassword123!",
        "role": "SUPER_ADMIN"
    })

    # 2. Login Super Admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@strivenest.com",
        "password": "AdminPassword123!"
    })
    admin_token = admin_login.json()["data"]["access_token"]

    # 3. Login Employee (John Smith)
    emp_login = client.post("/api/v1/auth/login", json={
        "email": "john.smith@strivenest.com",
        "password": "NewSecurePassword456!"
    })
    emp_token = emp_login.json()["data"]["access_token"]

    # 4. Employee attempts Super Admin endpoint -> Forbidden (403)
    emp_admin_resp = client.get(
        "/api/v1/auth/superadmin-only",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert emp_admin_resp.status_code == 403

    # 5. Super Admin attempts Super Admin endpoint -> Granted (200)
    admin_admin_resp = client.get(
        "/api/v1/auth/superadmin-only",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_admin_resp.status_code == 200

    # 6. Employee attempts Employee endpoint -> Granted (200)
    emp_emp_resp = client.get(
        "/api/v1/auth/employee-access",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert emp_emp_resp.status_code == 200


def test_account_lockout_after_failed_attempts():
    # 1. Register a test user for lockout
    client.post("/api/v1/auth/register", json={
        "first_name": "Lockout",
        "last_name": "Test",
        "email": "lockout.test@strivenest.com",
        "password": "CorrectPassword123!",
        "role": "EMPLOYEE"
    })

    # 2. Perform 5 consecutive failed logins (threshold)
    for _ in range(4):
        resp = client.post("/api/v1/auth/login", json={
            "email": "lockout.test@strivenest.com",
            "password": "WrongPassword123!"
        })
        assert resp.status_code == 401

    # 5th attempt triggers lockout (423 status code)
    lockout_resp = client.post("/api/v1/auth/login", json={
        "email": "lockout.test@strivenest.com",
        "password": "WrongPassword123!"
    })
    assert lockout_resp.status_code == 423
    assert "temporarily locked" in lockout_resp.json()["message"]

    # 6. Attempt with CORRECT password while locked should still fail with 423
    correct_pass_locked_resp = client.post("/api/v1/auth/login", json={
        "email": "lockout.test@strivenest.com",
        "password": "CorrectPassword123!"
    })
    assert correct_pass_locked_resp.status_code == 423


def test_audit_logs_endpoint_rbac():
    # 1. Login as Admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@strivenest.com",
        "password": "AdminPassword123!"
    })
    admin_token = admin_login.json()["data"]["access_token"]

    # 2. Login as Employee
    emp_login = client.post("/api/v1/auth/login", json={
        "email": "john.smith@strivenest.com",
        "password": "NewSecurePassword456!"
    })
    emp_token = emp_login.json()["data"]["access_token"]

    # 3. Employee accessing audit logs -> 403 Forbidden
    emp_audit_resp = client.get(
        "/api/v1/audit/authentication",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert emp_audit_resp.status_code == 403

    # 4. Super Admin accessing audit logs -> 200 OK
    admin_audit_resp = client.get(
        "/api/v1/audit/authentication",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_audit_resp.status_code == 200
    json_data = admin_audit_resp.json()
    assert json_data["success"] is True
    assert "items" in json_data["data"]
    assert json_data["data"]["total"] >= 1

