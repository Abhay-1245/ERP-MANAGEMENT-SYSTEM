from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Date, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class Department(Base):
    """Organizational business unit or division."""
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    users = relationship("User", back_populates="department")

    def __repr__(self):
        return f"<Department id={self.id} name='{self.name}'>"

class User(Base):
    """Staff member, manager, or system administrator."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="employee")
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    department = relationship("Department", back_populates="users")
    attendance = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    leaves = relationship("LeaveRequest", back_populates="user", cascade="all, delete-orphan")
    finance_records = relationship("FinanceRecord", back_populates="user")
    performances = relationship("Performance", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} name='{self.name}' role='{self.role}'>"

class Attendance(Base):
    """Daily check-in and shift presence record."""
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), default="present")
    
    user = relationship("User", back_populates="attendance")

    def __repr__(self):
        return f"<Attendance id={self.id} user_id={self.user_id} date={self.date} status='{self.status}'>"

class LeaveRequest(Base):
    """Employee time-off request with approval status."""
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")
    
    user = relationship("User", back_populates="leaves")

    def __repr__(self):
        return f"<LeaveRequest id={self.id} user_id={self.user_id} status='{self.status}'>"

class FinanceRecord(Base):
    """General ledger transaction, revenue entry, or operating expense."""
    __tablename__ = "finance_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    record_type = Column(String(30), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    description = Column(Text)
    
    user = relationship("User", back_populates="finance_records")

    def __repr__(self):
        return f"<FinanceRecord id={self.id} type='{self.record_type}' amount={self.amount} status='{self.status}'>"

class Performance(Base):
    """Employee periodic evaluation and appraisal score."""
    __tablename__ = "performance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False)
    remarks = Column(Text)
    
    user = relationship("User", back_populates="performances")

    def __repr__(self):
        return f"<Performance id={self.id} user_id={self.user_id} score={self.score}>"

class Notice(Base):
    """Company-wide announcement or departmental bulletin."""
    __tablename__ = "notices"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    author = relationship("User")

    def __repr__(self):
        return f"<Notice id={self.id} title='{self.title[:30]}'>"

