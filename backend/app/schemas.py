from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"
    department_id: int | None = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str
    department_id: int | None = None
    department_name: str | None = None
    is_active: bool = True

class DepartmentCreate(BaseModel):
    name: str
    description: str | None = None

class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str | None = None
    employee_count: int = 0

class AttendanceCreate(BaseModel):
    user_id: int
    date: date
    status: str = "present"

class AttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    user_name: str | None = None
    date: date
    status: str

class LeaveCreate(BaseModel):
    user_id: int
    start_date: date
    end_date: date
    reason: str

class LeaveStatus(BaseModel):
    status: str

class LeaveOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    user_name: str | None = None
    start_date: date
    end_date: date
    reason: str
    status: str

class FinanceCreate(BaseModel):
    user_id: int | None = None
    record_type: str
    amount: float
    status: str = "pending"
    description: str | None = None

class FinanceStatus(BaseModel):
    status: str

class FinanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int | None = None
    user_name: str | None = None
    record_type: str
    amount: float
    status: str
    description: str | None = None

class PerformanceCreate(BaseModel):
    user_id: int
    score: float
    remarks: str | None = None

class PerformanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    user_name: str | None = None
    score: float
    remarks: str | None = None

class NoticeCreate(BaseModel):
    title: str
    content: str
    author_id: int | None = None

class NoticeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    content: str
    author_id: int | None = None
    author_name: str | None = None
    created_at: datetime | None = None

