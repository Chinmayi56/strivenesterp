from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db: Session = SessionLocal()


def seed():

    # ===========================
    # SUPER ADMIN
    # ===========================

    admin = db.query(User).filter(
        User.email == "admin@strivenest.com"
    ).first()

    if not admin:
        admin = User(
            employee_id="SN0001",
            first_name="Super",
            last_name="Admin",
            email="admin@strivenest.com",
            phone="9999999999",
            password_hash=hash_password("Admin@123"),
            role="SUPER_ADMIN",
            status="ACTIVE",
            is_active=True,
            is_verified=True,
        )

        db.add(admin)

    # ===========================
    # EMPLOYEE
    # ===========================

    employee = db.query(User).filter(
        User.email == "employee@test.com"
    ).first()

    if not employee:
        employee = User(
            employee_id="EMP0001",
            first_name="Demo",
            last_name="Employee",
            email="employee@test.com",
            phone="8888888888",
            password_hash=hash_password("Employee@123"),
            role="EMPLOYEE",
            status="PENDING",
            is_active=True,
            is_verified=False,
        )

        db.add(employee)

    db.commit()

    print("=" * 50)
    print("Seed completed successfully.")
    print("=" * 50)
    print("Super Admin")
    print("Email    : admin@strivenest.com")
    print("Password : Admin@123")
    print()
    print("Employee")
    print("Email    : employee@test.com")
    print("Password : Employee@123")
    print("=" * 50)

    db.close()


if __name__ == "__main__":
    seed()