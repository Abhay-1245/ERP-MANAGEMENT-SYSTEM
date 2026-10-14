from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.get("", response_model=list[schemas.DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    """List organizational business units and headcount counts."""
    departments_list = db.query(models.Department).order_by(models.Department.id.asc()).all()
    result = []
    for d in departments_list:
        count = db.query(models.User).filter(models.User.department_id == d.id).count()
        result.append(schemas.DepartmentOut(
            id=d.id,
            name=d.name,
            description=d.description,
            employee_count=count
        ))
    return result


@router.post("", response_model=schemas.DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(data: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    """Establish a new enterprise department."""
    if db.query(models.Department).filter(models.Department.name == data.name.strip()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A department named '{data.name.strip()}' already exists. Please choose a different name."
        )
    
    item = models.Department(name=data.name.strip(), description=data.description)
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.DepartmentOut(
        id=item.id,
        name=item.name,
        description=item.description,
        employee_count=0
    )


@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    """Dissolve department and unassign affiliated personnel."""
    dept = db.get(models.Department, dept_id)
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department #{dept_id} was not found."
        )
    
    dept_name = dept.name
    db.query(models.User).filter(models.User.department_id == dept_id).update({"department_id": None})
    db.delete(dept)
    db.commit()
    return {"message": f"Department '{dept_name}' has been dissolved and members unassigned successfully."}
