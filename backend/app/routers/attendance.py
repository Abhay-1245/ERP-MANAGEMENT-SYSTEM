from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.get("", response_model=list[schemas.AttendanceOut])
def list_attendance(db: Session = Depends(get_db)):
    """Fetch recent workforce attendance and shift logs."""
    items = db.query(models.Attendance).order_by(models.Attendance.date.desc(), models.Attendance.id.desc()).all()
    result = []
    for a in items:
        result.append(schemas.AttendanceOut(
            id=a.id,
            user_id=a.user_id,
            user_name=a.user.name if a.user else "Unknown Employee",
            date=a.date,
            status=a.status
        ))
    return result


@router.post("", response_model=schemas.AttendanceOut)
def record_attendance(data: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    """Record or update attendance check-in for an employee on a given date."""
    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == data.user_id,
        models.Attendance.date == data.date
    ).first()
    
    if existing:
        existing.status = data.status
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = models.Attendance(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
    
    return schemas.AttendanceOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "Unknown Employee",
        date=item.date,
        status=item.status
    )
