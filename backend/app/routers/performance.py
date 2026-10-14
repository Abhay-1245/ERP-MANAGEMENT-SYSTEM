from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/performance", tags=["Performance & Appraisals"])


@router.get("", response_model=list[schemas.PerformanceOut])
def list_performance(db: Session = Depends(get_db)):
    """Fetch employee quarterly performance scores and review remarks."""
    items = db.query(models.Performance).order_by(models.Performance.id.desc()).all()
    result = []
    for p in items:
        result.append(schemas.PerformanceOut(
            id=p.id,
            user_id=p.user_id,
            user_name=p.user.name if p.user else "Unknown Employee",
            score=p.score,
            remarks=p.remarks
        ))
    return result


@router.post("", response_model=schemas.PerformanceOut, status_code=status.HTTP_201_CREATED)
def create_performance(data: schemas.PerformanceCreate, db: Session = Depends(get_db)):
    """Log an appraisal review score for an employee."""
    item = models.Performance(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.PerformanceOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "Unknown Employee",
        score=item.score,
        remarks=item.remarks
    )


@router.delete("/{perf_id}")
def delete_performance(perf_id: int, db: Session = Depends(get_db)):
    """Delete an appraisal review entry."""
    item = db.get(models.Performance, perf_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Performance review #{perf_id} was not found."
        )
    db.delete(item)
    db.commit()
    return {"message": f"Performance review #{perf_id} has been removed successfully."}
