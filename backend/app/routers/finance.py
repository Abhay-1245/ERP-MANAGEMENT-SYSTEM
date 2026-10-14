from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/finance", tags=["Finance & Treasury"])


@router.get("", response_model=list[schemas.FinanceOut])
def list_finance(db: Session = Depends(get_db)):
    """Fetch corporate revenue invoices, payroll vouchers, and expense logs."""
    items = db.query(models.FinanceRecord).order_by(models.FinanceRecord.id.desc()).all()
    result = []
    for f in items:
        result.append(schemas.FinanceOut(
            id=f.id,
            user_id=f.user_id,
            user_name=f.user.name if f.user else "General Corporate Account",
            record_type=f.record_type,
            amount=f.amount,
            status=f.status,
            description=f.description
        ))
    return result


@router.post("", response_model=schemas.FinanceOut, status_code=status.HTTP_201_CREATED)
def create_finance(data: schemas.FinanceCreate, db: Session = Depends(get_db)):
    """Post a new journal voucher or financial ledger entry."""
    item = models.FinanceRecord(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.FinanceOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "General Corporate Account",
        record_type=item.record_type,
        amount=item.amount,
        status=item.status,
        description=item.description
    )


@router.patch("/{record_id}", response_model=schemas.FinanceOut)
def update_finance_status(record_id: int, data: schemas.FinanceStatus, db: Session = Depends(get_db)):
    """Authorize, disburse, or flag a financial ledger transaction."""
    item = db.get(models.FinanceRecord, record_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial transaction #{record_id} could not be found."
        )
    item.status = data.status
    db.commit()
    db.refresh(item)
    return schemas.FinanceOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "General Corporate Account",
        record_type=item.record_type,
        amount=item.amount,
        status=item.status,
        description=item.description
    )


@router.delete("/{record_id}")
def delete_finance(record_id: int, db: Session = Depends(get_db)):
    """Void a ledger transaction record."""
    item = db.get(models.FinanceRecord, record_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial transaction #{record_id} could not be found."
        )
    db.delete(item)
    db.commit()
    return {"message": f"Financial transaction #{record_id} has been voided successfully."}
