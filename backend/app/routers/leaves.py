from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])


@router.get("", response_model=list[schemas.LeaveOut])
def list_leaves(db: Session = Depends(get_db)):
    """List leave requests across all personnel."""
    items = db.query(models.LeaveRequest).order_by(models.LeaveRequest.id.desc()).all()
    result = []
    for l in items:
        result.append(schemas.LeaveOut(
            id=l.id,
            user_id=l.user_id,
            user_name=l.user.name if l.user else "Unknown Employee",
            start_date=l.start_date,
            end_date=l.end_date,
            reason=l.reason,
            status=l.status
        ))
    return result


@router.post("", response_model=schemas.LeaveOut, status_code=status.HTTP_201_CREATED)
def create_leave(data: schemas.LeaveCreate, db: Session = Depends(get_db)):
    """Submit a formal leave request for approval."""
    item = models.LeaveRequest(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.LeaveOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "Unknown Employee",
        start_date=item.start_date,
        end_date=item.end_date,
        reason=item.reason,
        status=item.status
    )


@router.patch("/{leave_id}", response_model=schemas.LeaveOut)
def update_leave_status(leave_id: int, data: schemas.LeaveStatus, db: Session = Depends(get_db)):
    """Approve or reject a leave application."""
    item = db.get(models.LeaveRequest, leave_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave request #{leave_id} could not be found."
        )
    item.status = data.status
    db.commit()
    db.refresh(item)
    return schemas.LeaveOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "Unknown Employee",
        start_date=item.start_date,
        end_date=item.end_date,
        reason=item.reason,
        status=item.status
    )


@router.delete("/{leave_id}")
def delete_leave(leave_id: int, db: Session = Depends(get_db)):
    """Cancel or purge a leave request."""
    item = db.get(models.LeaveRequest, leave_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave request #{leave_id} could not be found."
        )
    db.delete(item)
    db.commit()
    return {"message": f"Leave application #{leave_id} has been cancelled successfully."}
