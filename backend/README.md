# StriveNest ERP System - Backend Foundation (Phase 1)

Production-ready backend architecture for the StriveNest ERP System built with **FastAPI**, **Python 3.12+**, **PostgreSQL / SQLite**, **SQLAlchemy 2.x**, **Alembic**, and **Pydantic v2**.

---

## 🏛️ Architecture Overview

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── main.py          # API v1 Router aggregator
│   │       └── routers/         # API Routers
│   ├── core/
│   │   ├── config.py            # Pydantic v2 BaseSettings
│   │   ├── constants.py         # System constants & error messages
│   │   ├── database.py          # SQLAlchemy engine, session maker, connection pool
│   │   ├── dependencies.py      # FastAPI Dependency injection
│   │   ├── logging.py           # Enterprise structured logging
│   │   └── middleware.py        # Request logging, Request-ID, Process time
│   ├── models/
│   │   └── base.py              # DeclarativeBase, UUIDModel, TimestampMixin
│   ├── schemas/
│   │   └── common.py            # APIResponse, ErrorDetail, Health schemas
│   ├── routers/
│   │   └── health.py            # Health, Readiness, and Liveness endpoints
│   ├── services/
│   │   └── base.py              # BaseService for CRUD & business logic
│   ├── utils/
│   │   ├── exceptions.py        # Domain exception hierarchy
│   │   ├── helpers.py           # DateTime, ISO 8601, and timezone utilities
│   │   ├── responses.py         # Standard success, error, paginated builders
│   │   └── validators.py        # UUID, pagination, DB URL validators
│   └── main.py                  # FastAPI Application Factory & OpenAPI Docs
├── alembic/                      # Alembic schema migrations
│   ├── versions/
│   ├── env.py
│   ├── README
│   └── script.py.mako
├── tests/                        # Pytest Test Suite
│   ├── conftest.py
│   ├── test_health.py
│   └── test_responses.py
├── alembic.ini                   # Alembic configuration
├── .env                          # Local environment variables
├── .env.example                  # Environment template
├── requirements.txt              # Python dependency manifest
├── run.py                        # Uvicorn entrypoint script
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Database Migrations
```bash
alembic upgrade head
```

### 4. Start the Application
```bash
python run.py
# Or with uvicorn directly:
uvicorn app.main:app --reload --port 8000
```

---

## 🌐 Standard Response Schema Contract

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... },
  "errors": [],
  "timestamp": "2026-07-28T22:39:20Z"
}
```

### Error Response (`400`, `401`, `403`, `404`, `422`, `500`)
```json
{
  "success": false,
  "message": "Validation failed for request parameters.",
  "data": null,
  "errors": [
    {
      "field": "email",
      "code": null,
      "message": "field required"
    }
  ],
  "timestamp": "2026-07-28T22:39:20Z"
}
```

---

## 🩺 Health Check APIs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Comprehensive system & database health check |
| `GET` | `/api/v1/health/ready` | Readiness check (validates DB connectivity) |
| `GET` | `/api/v1/health/live` | Liveness check (validates server process execution) |

---

## 📑 Interactive API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Spec**: `http://localhost:8000/openapi.json`

---

## 🧪 Running Tests

Execute pytest from the `backend/` directory:
```bash
pytest -v
```
