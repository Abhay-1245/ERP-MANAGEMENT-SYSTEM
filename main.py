"""
Smart ERP Enterprise Platform - Main Application Entrypoint
Provides direct root-level execution and cloud runner compatibility:
    python main.py
"""

import sys
import os
from pathlib import Path

# Ensure backend directory is in python module search path
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import FastAPI instance from backend/app/main.py
from app.main import app

if __name__ == "__main__":
    import uvicorn
    print("[SmartERP] Starting server on http://127.0.0.1:8000 ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
