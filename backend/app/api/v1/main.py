"""
StriveNest ERP - API v1 Router Aggregator
Combines all v1 router modules into main API router.
"""

from fastapi import APIRouter
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.audit import router as audit_router
from app.routers.employee import router as employee_router
from app.routers.portal import router as portal_router
from app.routers.attendance import router as attendance_router
from app.routers.leave import router as leave_router
from app.routers.project import router as project_router
from app.routers.task import router as task_router
from app.routers.calendar import router as calendar_router
from app.routers.notification import router as notification_router
from app.api.v1.admin_leave import router as admin_leave_router

api_v1_router = APIRouter()

# Include router modules under /api/v1
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(employee_router)
api_v1_router.include_router(portal_router)
api_v1_router.include_router(attendance_router)
api_v1_router.include_router(leave_router)
api_v1_router.include_router(project_router)
api_v1_router.include_router(task_router)
api_v1_router.include_router(calendar_router)
api_v1_router.include_router(notification_router)
api_v1_router.include_router(admin_leave_router)


