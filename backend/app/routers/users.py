from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import hash_password

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    """Retrieve full workforce personnel directory."""
    users_list = db.query(models.User).order_by(models.User.id.asc()).all()
    result = []
    for u in users_list:
        result.append(schemas.UserOut(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            department_id=u.department_id,
            department_name=u.department.name if u.department else "Unassigned",
            is_active=u.is_active
        ))
    return result


@router.post("", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_user(data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new staff or personnel account."""
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{data.email}' already exists. Please use a distinct email address."
        )
    
    user = models.User(
        name=data.name.strip(),
        email=data.email.strip().lower(),
        password_hash=hash_password(data.password),
        role=data.role,
        department_id=data.department_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        department_name=user.department.name if user.department else "Unassigned",
        is_active=user.is_active
    )


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Decommission and remove a user account."""
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee profile #{user_id} was not found."
        )
    user_name = user.name
    db.delete(user)
    db.commit()
    return {"message": f"Employee profile for {user_name} has been removed successfully."}
