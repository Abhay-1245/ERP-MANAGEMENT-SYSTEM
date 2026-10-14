"""
Smart ERP Enterprise Management System - Core API Application
High-performance REST API built with FastAPI, SQLAlchemy ORM, and JWT role-based security.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .config import settings
from .seed import seed_database
from .routers import (
    auth,
    dashboard,
    users,
    departments,
    attendance,
    leaves,
    finance,
    performance,
    notices
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Initializes database schema and ensures seed data is available on first launch.
    """
    Base.metadata.create_all(bind=engine)
    seed_database(force_reseed=False)
    yield


app = FastAPI(
    title="Smart ERP Enterprise Suite API",
    description="Enterprise resource planning platform powering human resources, departmental hierarchy, "
                "attendance tracking, corporate leave governance, treasury operations, and employee performance appraisals.",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Cross-Origin Resource Sharing (CORS) Configuration
allowed_origins = [orig.strip() for orig in settings.cors_origins.split(",") if orig.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers Mount
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(attendance.router)
app.include_router(leaves.router)
app.include_router(finance.router)
app.include_router(performance.router)
app.include_router(notices.router)


@app.get("/", tags=["System"])
def root_info():
    """System heartbeat and version metadata."""
    return {
        "system": "Smart ERP Enterprise Platform",
        "status": "operational",
        "version": "1.2.0",
        "documentation": "/docs"
    }


@app.get("/api/health", tags=["System"])
def health_check():
    """Health check probe for load balancers and orchestrators."""
    return {"status": "healthy", "service": "erp-backend-api"}
