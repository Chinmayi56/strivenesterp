"""
StriveNest ERP - Portal & Employee Self-Service Tests
Unit and integration tests for Dashboard, Attendance, Leaves, Projects, Tasks, Calendar, Notifications, and Password Change.
"""

import uuid
from datetime import date, timedelta
import pytest
from app.models.user import User, UserRole, UserStatus
from app.models.portal import AttendanceRecord, LeaveRequest, Project, ProjectMember, Task, Notification
from app.core.security import hash_password, create_access_token


@pytest.fixture
def employee_user(db_session):
    emp = db_session.query(User).filter(User.email == "emp.portal.test@strivenest.com").first()
    if not emp:
        emp = User(
            id=str(uuid.uuid4()),
            employee_id=f"EMP-PRT-{uuid.uuid4().hex[:6]}",
            first_name="Portal",
            last_name="Tester",
            email="emp.portal.test@strivenest.com",
            password_hash=hash_password("PortalPass123!"),
            role=UserRole.EMPLOYEE.value,
            status=UserStatus.ACTIVE.value,
            is_active=True,
        )
        db_session.add(emp)
        db_session.commit()
    token = create_access_token({"sub": emp.id, "email": emp.email, "role": emp.role})
    return token, emp


@pytest.fixture
def other_employee_user(db_session):
    emp = db_session.query(User).filter(User.email == "other.portal.test@strivenest.com").first()
    if not emp:
        emp = User(
            id=str(uuid.uuid4()),
            employee_id=f"EMP-OTH-{uuid.uuid4().hex[:6]}",
            first_name="Other",
            last_name="User",
            email="other.portal.test@strivenest.com",
            password_hash=hash_password("OtherPass123!"),
            role=UserRole.EMPLOYEE.value,
            status=UserStatus.ACTIVE.value,
            is_active=True,
        )
        db_session.add(emp)
        db_session.commit()
    token = create_access_token({"sub": emp.id, "email": emp.email, "role": emp.role})
    return token, emp


def test_employee_dashboard(client, employee_user):
    token, emp = employee_user
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/portal/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["employee"]["email"] == emp.email
    assert "assigned_projects_count" in data
    assert "pending_tasks_count" in data


def test_attendance_checkin_checkout_flow(client, employee_user):
    token, emp = employee_user
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get Today (Initially None)
    res = client.get("/api/v1/attendance/today", headers=headers)
    assert res.status_code == 200

    # 2. Check In
    res = client.post("/api/v1/attendance/check-in", json={"notes": "Starting day"}, headers=headers)
    assert res.status_code in [200, 201]
    data = res.json()
    assert data["status"] in ["PRESENT", "LATE"]

    # 3. Double Check-In Error
    res = client.post("/api/v1/attendance/check-in", json={}, headers=headers)
    assert res.status_code == 400

    # 4. Check Out
    res = client.post("/api/v1/attendance/check-out", json={"notes": "Finished tasks"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["check_out_time"] is not None

    # 5. History & Summary
    res = client.get("/api/v1/attendance/history", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["items"]) >= 1

    today = date.today()
    res = client.get(f"/api/v1/attendance/summary?year={today.year}&month={today.month}", headers=headers)
    assert res.status_code == 200
    assert res.json()["total_days"] >= 1


def test_leave_management(client, employee_user):
    token, emp = employee_user
    headers = {"Authorization": f"Bearer {token}"}

    start = date.today() + timedelta(days=5)
    end = date.today() + timedelta(days=7)

    # 1. Create Leave Request
    payload = {
        "leave_type": "CASUAL",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "reason": "Personal family trip",
    }
    res = client.post("/api/v1/leaves", json=payload, headers=headers)
    assert res.status_code == 201
    leave_id = res.json()["id"]
    assert res.json()["status"] == "PENDING"

    # 2. List Leaves
    res = client.get("/api/v1/leaves", headers=headers)
    assert res.status_code == 200
    assert any(l["id"] == leave_id for l in res.json()["items"])

    # 3. Cancel Leave
    res = client.post(f"/api/v1/leaves/{leave_id}/cancel", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "CANCELLED"


def test_leave_ownership_isolation(client, employee_user, other_employee_user):
    token1, emp1 = employee_user
    token2, emp2 = other_employee_user

    h1 = {"Authorization": f"Bearer {token1}"}
    h2 = {"Authorization": f"Bearer {token2}"}

    # Employee 1 creates leave
    payload = {
        "leave_type": "SICK",
        "start_date": (date.today() + timedelta(days=10)).isoformat(),
        "end_date": (date.today() + timedelta(days=11)).isoformat(),
        "reason": "Dental appointment",
    }
    res = client.post("/api/v1/leaves", json=payload, headers=h1)
    leave_id = res.json()["id"]

    # Employee 2 attempts to cancel Employee 1's leave -> 403 Forbidden
    res = client.post(f"/api/v1/leaves/{leave_id}/cancel", headers=h2)
    assert res.status_code == 403


def test_projects_and_tasks(client, db_session, employee_user):
    token, emp = employee_user
    headers = {"Authorization": f"Bearer {token}"}

    # Seed a project and assign employee
    proj = Project(
        project_name="StriveNest ERP Dev",
        client_name="Internal",
        status="IN_PROGRESS",
        priority="HIGH",
    )
    db_session.add(proj)
    db_session.commit()

    pm = ProjectMember(project_id=proj.id, employee_id=emp.id, role_in_project="Backend Lead")
    task = Task(
        task_name="Implement Portal Tests",
        project_id=proj.id,
        assigned_to_id=emp.id,
        priority="HIGH",
        status="TODO",
        due_date=date.today() + timedelta(days=3),
    )
    db_session.add_all([pm, task])
    db_session.commit()

    # Get Projects
    res = client.get("/api/v1/projects", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["items"]) >= 1

    # Get Tasks
    res = client.get("/api/v1/tasks", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["items"]) >= 1

    # Update Task Status
    res = client.patch(
        f"/api/v1/tasks/{task.id}/status",
        json={"status": "IN_PROGRESS", "progress_percentage": 50, "notes": "Halfway done"},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "IN_PROGRESS"


def test_calendar_events(client, employee_user):
    token, emp = employee_user
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/calendar/events", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_notifications(client, db_session, employee_user):
    token, emp = employee_user
    headers = {"Authorization": f"Bearer {token}"}

    notif = Notification(
        employee_id=emp.id,
        title="Welcome to Portal",
        message="Your employee portal is active.",
        notification_type="SYSTEM",
    )
    db_session.add(notif)
    db_session.commit()

    # List
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    assert res.json()["unread_count"] >= 1

    # Read
    res = client.patch(f"/api/v1/notifications/{notif.id}/read", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_read"] is True


def test_change_password(client, employee_user):
    token, emp = employee_user
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "current_password": "PortalPass123!",
        "new_password": "NewSecurePass123!",
        "confirm_password": "NewSecurePass123!",
    }
    res = client.post("/api/v1/auth/change-password", json=payload, headers=headers)
    assert res.status_code == 200

    # Try logging in with new password
    login_res = client.post("/api/v1/auth/login", json={"email": emp.email, "password": "NewSecurePass123!"})
    assert login_res.status_code == 200
