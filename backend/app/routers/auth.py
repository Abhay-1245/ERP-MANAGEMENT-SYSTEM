from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new enterprise user account."""
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        department_id=data.department_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with corporate credentials and issue bearer JWT."""
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or corporate password"
        )
    
    dept_name = user.department.name if user.department else "Unassigned"
    user_out = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id,
        "department_name": dept_name,
        "is_active": user.is_active
    }
    return {
        "access_token": create_token(user.id, user.role),
        "token_type": "bearer",
        "user": user_out
    }
