from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/notices", tags=["Corporate Notices"])


@router.get("", response_model=list[schemas.NoticeOut])
def list_notices(db: Session = Depends(get_db)):
    """Fetch company-wide circulars and departmental memos."""
    items = db.query(models.Notice).order_by(models.Notice.id.desc()).all()
    result = []
    for n in items:
        result.append(schemas.NoticeOut(
            id=n.id,
            title=n.title,
            content=n.content,
            author_id=n.author_id,
            author_name=n.author.name if n.author else "Executive Office",
            created_at=n.created_at
        ))
    return result


@router.post("", response_model=schemas.NoticeOut, status_code=status.HTTP_201_CREATED)
def create_notice(data: schemas.NoticeCreate, db: Session = Depends(get_db)):
    """Broadcast an official announcement to the organization."""
    item = models.Notice(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.NoticeOut(
        id=item.id,
        title=item.title,
        content=item.content,
        author_id=item.author_id,
        author_name=item.author.name if item.author else "Executive Office",
        created_at=item.created_at
    )


@router.delete("/{notice_id}")
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    """Archive and delete an announcement."""
    item = db.get(models.Notice, notice_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notice #{notice_id} was not found."
        )
    title = item.title
    db.delete(item)
    db.commit()
    return {"message": f"Notice '{title[:35]}...' has been archived and removed successfully."}
