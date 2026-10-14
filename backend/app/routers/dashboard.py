from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
def dashboard_metrics(db: Session = Depends(get_db)):
    """Aggregated real-time metrics across workforce, finance, leaves, and attendance."""
    total_users = db.query(models.User).count()
    total_depts = db.query(models.Department).count()
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    total_revenue = db.query(func.sum(models.FinanceRecord.amount)).filter(models.FinanceRecord.record_type == "Revenue").scalar() or 0.0
    total_expenses = db.query(func.sum(models.FinanceRecord.amount)).filter(models.FinanceRecord.record_type.in_(["Expense", "Payroll"])).scalar() or 0.0
    avg_score = db.query(func.avg(models.Performance.score)).scalar() or 0.0
    
    today_att = db.query(models.Attendance).filter(models.Attendance.date == date.today()).count()
    
    return {
        "users": total_users,
        "departments": total_depts,
        "pending_leaves": pending_leaves,
        "finance_records": db.query(models.FinanceRecord).count(),
        "total_revenue": round(float(total_revenue), 2),
        "total_expenses": round(float(total_expenses), 2),
        "net_balance": round(float(total_revenue - total_expenses), 2),
        "avg_performance": round(float(avg_score), 2),
        "today_attendance": today_att,
        "notices": db.query(models.Notice).count()
    }
