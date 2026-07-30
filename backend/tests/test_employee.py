"""
StriveNest ERP - Employee Management Unit & Integration Tests
Tests for Employee CRUD, Approval Workflow, Profile, Documents, Audit History, and Self-Service Access Control.
"""

import uuid
import pytest
from app.models.user import User, UserRole, UserStatus
from app.core.security import hash_password, create_access_token


@pytest.fixture
def superadmin_token(db_session):
    admin = db_session.query(User).filter(User.email == "admin.test@strivenest.com").first()
    if not admin:
        admin = User(
            id=str(uuid.uuid4()),
            employee_id=f"EMP-ADM-{uuid.uuid4().hex[:6]}",
            first_name="Super",
            last_name="Admin",
            email="admin.test@strivenest.com",
            password_hash=hash_password("SuperAdmin123!"),
            role=UserRole.SUPER_ADMIN.value,
            status=UserStatus.ACTIVE.value,
            is_active=True,
        )
        db_session.add(admin)
        db_session.commit()
    token = create_access_token({"sub": admin.id, "email": admin.email, "role": admin.role})
    return token


@pytest.fixture
def employee_token(db_session):
    emp = db_session.query(User).filter(User.email == "john.doe@strivenest.com").first()
    if not emp:
        emp = User(
            id=str(uuid.uuid4()),
            employee_id=f"EMP-TST-{uuid.uuid4().hex[:6]}",
            first_name="John",
            last_name="Doe",
            email="john.doe@strivenest.com",
            password_hash=hash_password("Employee123!"),
            role=UserRole.EMPLOYEE.value,
            status=UserStatus.ACTIVE.value,
            is_active=True,
        )
        db_session.add(emp)
        db_session.commit()
    token = create_access_token({"sub": emp.id, "email": emp.email, "role": emp.role})
    return token, emp


def test_create_and_list_employees(client, superadmin_token):
    headers = {"Authorization": f"Bearer {superadmin_token}"}
    unique_email = f"alice.smith.{uuid.uuid4().hex[:6]}@strivenest.com"

    # 1. Create Employee
    payload = {
        "first_name": "Alice",
        "last_name": "Smith",
        "email": unique_email,
        "phone": f"+1555{uuid.uuid4().hex[:4]}",
        "department": "Engineering",
        "designation": "Software Engineer",
        "role": "EMPLOYEE",
        "status": "PENDING"
    }
    response = client.post("/api/v1/employees", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == unique_email
    assert data["status"] == "PENDING"
    assert data["employee_id"].startswith("EMP-")

    # 2. List Employees
    res_list = client.get("/api/v1/employees", headers=headers)
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] >= 1


def test_approve_and_reject_employee(client, superadmin_token):
    headers = {"Authorization": f"Bearer {superadmin_token}"}
    unique_email = f"bob.jones.{uuid.uuid4().hex[:6]}@strivenest.com"

    # Create Pending Employee
    create_res = client.post("/api/v1/employees", json={
        "first_name": "Bob",
        "last_name": "Jones",
        "email": unique_email,
        "status": "PENDING"
    }, headers=headers)
    assert create_res.status_code == 201
    emp_id = create_res.json()["id"]

    # Approve Employee
    approve_res = client.post(f"/api/v1/employees/{emp_id}/approve", headers=headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "ACTIVE"
    assert approve_res.json()["is_active"] is True

    # Reject Employee
    reject_res = client.post(f"/api/v1/employees/{emp_id}/reject?reason=Incomplete+docs", headers=headers)
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
    assert reject_res.json()["is_active"] is False


def test_employee_self_service_security(client, employee_token, superadmin_token):
    token, emp = employee_token
    emp_headers = {"Authorization": f"Bearer {token}"}
    admin_headers = {"Authorization": f"Bearer {superadmin_token}"}

    unique_email = f"charlie.b.{uuid.uuid4().hex[:6]}@strivenest.com"

    # Create another employee
    other_res = client.post("/api/v1/employees", json={
        "first_name": "Charlie",
        "last_name": "Brown",
        "email": unique_email,
        "status": "ACTIVE"
    }, headers=admin_headers)
    assert other_res.status_code == 201
    other_id = other_res.json()["id"]

    # Employee tries to list all employees -> Forbidden
    res_list = client.get("/api/v1/employees", headers=emp_headers)
    assert res_list.status_code == 403

    # Employee tries to view another employee -> Forbidden
    res_other = client.get(f"/api/v1/employees/{other_id}", headers=emp_headers)
    assert res_other.status_code == 403

    # Employee views own profile -> Allowed
    res_me = client.get("/api/v1/employees/me", headers=emp_headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "john.doe@strivenest.com"


def test_employee_documents_and_audit_history(client, superadmin_token):
    headers = {"Authorization": f"Bearer {superadmin_token}"}
    unique_email = f"david.m.{uuid.uuid4().hex[:6]}@strivenest.com"

    # Create employee
    emp_res = client.post("/api/v1/employees", json={
        "first_name": "David",
        "last_name": "Miller",
        "email": unique_email,
        "status": "ACTIVE"
    }, headers=headers)
    assert emp_res.status_code == 201
    emp_id = emp_res.json()["id"]

    # Upload document
    doc_payload = {
        "document_type": "ID Proof",
        "document_name": "Passport Copy",
        "file_name": "passport_david.pdf",
        "file_url": "/uploads/documents/passport_david.pdf",
        "file_size": 2048500,
        "mime_type": "application/pdf"
    }
    doc_res = client.post(f"/api/v1/employees/{emp_id}/documents", json=doc_payload, headers=headers)
    assert doc_res.status_code == 201
    doc_data = doc_res.json()
    assert doc_data["document_name"] == "Passport Copy"
    doc_id = doc_data["id"]

    # List documents
    docs_list = client.get(f"/api/v1/employees/{emp_id}/documents", headers=headers)
    assert docs_list.status_code == 200
    assert docs_list.json()["total"] == 1

    # Get audit history
    audit_res = client.get(f"/api/v1/employees/{emp_id}/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    assert audit_res.json()["total"] >= 2  # EMPLOYEE_CREATED, DOCUMENT_UPLOADED

    # Delete document
    del_doc = client.delete(f"/api/v1/employees/{emp_id}/documents/{doc_id}", headers=headers)
    assert del_doc.status_code == 200
