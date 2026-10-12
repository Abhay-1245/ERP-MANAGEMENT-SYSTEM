# Smart ERP Management System

Full-stack ERP starter project for organizational resource management.

## Stack
- Frontend: React + Vite
- Backend: FastAPI
- Database: PostgreSQL (SQLAlchemy)
- Authentication: JWT
- Styling: Tailwind CSS
- Charts: Recharts
- Docker support

## Modules
- Admin dashboard
- User management
- Departments
- Attendance
- Leave management
- Finance
- Performance
- Notices
- JWT role-based authentication

## Run Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Default frontend: http://localhost:5173
Backend API/docs: http://127.0.0.1:8000/docs

## PostgreSQL
Create a database named `erp_db`, then configure `.env` from `.env.example`.

The backend creates tables automatically on startup.
