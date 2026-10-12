from datetime import date, datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from .database import Base, engine, get_db, SessionLocal
from . import models, schemas
from .auth import hash_password, verify_password, create_token
from .config import settings

# Create all tables
Base.metadata.create_all(bind=engine)

def seed_database(force_reseed: bool = False):
    db = SessionLocal()
    try:
        user_count = db.query(models.User).count()
        admin_user = db.query(models.User).filter(models.User.role == "admin").first()
        
        # If admin exists but is not Abhaya kumar kar, update admin name
        if admin_user:
            admin_user.name = "Abhaya kumar kar"
            admin_user.email = "abhaya.kar@erp.com"
            db.commit()

        if user_count < 20 or force_reseed:
            print("[DB] Seeding Smart ERP database with comprehensive multi-department dataset...")
            if force_reseed or user_count > 0:
                db.query(models.Attendance).delete()
                db.query(models.LeaveRequest).delete()
                db.query(models.FinanceRecord).delete()
                db.query(models.Performance).delete()
                db.query(models.Notice).delete()
                db.query(models.User).delete()
                db.query(models.Department).delete()
                db.commit()

            # 1. DEPARTMENTS (9 Comprehensive Enterprise Units)
            dept_eng = models.Department(
                name="Engineering & Technology",
                description="Cloud Architecture, Distributed Microservices, DevOps CI/CD & Platform Engineering"
            )
            dept_hr = models.Department(
                name="Human Resources & People",
                description="Talent Acquisition, Culture, Global Payroll Operations & Employee Success"
            )
            dept_fin = models.Department(
                name="Finance & Corporate Accounting",
                description="Treasury Management, Financial Auditing, Strategic Growth Projections & Tax Compliance"
            )
            dept_mkt = models.Department(
                name="Global Sales & Marketing",
                description="Enterprise Account Expansion, Digital Marketing, Demand Generation & Brand Communications"
            )
            dept_cs = models.Department(
                name="Customer Success & Support",
                description="24/7 Global Client Solutions, SLA Management, Enterprise Onboarding & Technical Support"
            )
            dept_ai = models.Department(
                name="AI & Data Intelligence",
                description="Predictive Machine Learning, Large Language Model Automation, Big Data Pipelines & Analytics"
            )
            dept_legal = models.Department(
                name="Legal, Risk & Compliance",
                description="Corporate Governance, IP Protection, SOC-2/ISO Regulatory Adherence & Commercial Contracts"
            )
            dept_design = models.Department(
                name="Product Strategy & UX",
                description="User Experience Research, Next-Gen UI Design Systems, Usability Testing & Product Roadmaps"
            )
            dept_ops = models.Department(
                name="Operations & Supply Chain",
                description="Global Logistics, Facilities Management, IT Procurement & Enterprise Vendor Operations"
            )

            all_depts = [dept_eng, dept_hr, dept_fin, dept_mkt, dept_cs, dept_ai, dept_legal, dept_design, dept_ops]
            db.add_all(all_depts)
            db.commit()

            # 2. USERS (33 Personnel & Students Distributed Across All Departments)
            default_pwd = hash_password("user123")
            admin_pwd = hash_password("admin123")

            users_data = [
                # Engineering & Technology
                {"name": "Abhaya kumar kar", "email": "abhaya.kar@erp.com", "role": "admin", "pwd": admin_pwd, "dept": dept_eng.id},
                {"name": "Aarav Sharma", "email": "aarav.s@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_eng.id},
                {"name": "Ananya Patel", "email": "ananya.p@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_eng.id},
                {"name": "Rohan Verma", "email": "rohan.v@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_eng.id},
                {"name": "Aditya Nair", "email": "aditya.n@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_eng.id},

                # Human Resources & People
                {"name": "Pooja Sundaram", "email": "pooja.s@erp.com", "role": "manager", "pwd": default_pwd, "dept": dept_hr.id},
                {"name": "Sneha Iyer", "email": "sneha.i@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_hr.id},
                {"name": "Kavita Reddy", "email": "kavita.r@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_hr.id},
                {"name": "Ishaan Joshi", "email": "ishaan.j@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_hr.id},

                # Finance & Corporate Accounting
                {"name": "Rajeshwari Menon", "email": "rajeshwari.m@erp.com", "role": "manager", "pwd": default_pwd, "dept": dept_fin.id},
                {"name": "Rahul Deshmukh", "email": "rahul.d@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_fin.id},
                {"name": "Neha Gupta", "email": "neha.g@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_fin.id},
                {"name": "Tanvi Kulkarni", "email": "tanvi.k@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_fin.id},

                # Global Sales & Marketing
                {"name": "Arjun Singhania", "email": "arjun.s@erp.com", "role": "manager", "pwd": default_pwd, "dept": dept_mkt.id},
                {"name": "Siddharth Sengupta", "email": "siddharth.s@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_mkt.id},
                {"name": "Karthik Subramanian", "email": "karthik.s@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_mkt.id},
                {"name": "Meera Nambiar", "email": "meera.n@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_mkt.id},

                # Customer Success & Support
                {"name": "Devendra Mukherjee", "email": "devendra.m@erp.com", "role": "manager", "pwd": default_pwd, "dept": dept_cs.id},
                {"name": "Diya Chatterjee", "email": "diya.c@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_cs.id},
                {"name": "Manish Agarwal", "email": "manish.a@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_cs.id},
                {"name": "Vivek Choudhury", "email": "vivek.c@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_cs.id},

                # AI & Data Intelligence
                {"name": "Priya Sharma", "email": "priya.s@erp.com", "role": "manager", "pwd": default_pwd, "dept": dept_ai.id},
                {"name": "Vikram Malhotra", "email": "vikram.m@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_ai.id},
                {"name": "Harshita Saxena", "email": "harshita.s@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_ai.id},
                {"name": "Pranav Pillai", "email": "pranav.p@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_ai.id},

                # Legal, Risk & Compliance
                {"name": "Shreya Banerjee", "email": "shreya.b@erp.com", "role": "manager", "pwd": default_pwd, "dept": dept_legal.id},
                {"name": "Swati Bhattacharya", "email": "swati.b@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_legal.id},
                {"name": "Ritu Roy", "email": "ritu.r@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_legal.id},

                # Product Strategy & UX
                {"name": "Akashdeep Singh", "email": "akashdeep.s@erp.com", "role": "manager", "pwd": default_pwd, "dept": dept_design.id},
                {"name": "Rishabh Tiwari", "email": "rishabh.t@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_design.id},
                {"name": "Gaurav Mishra", "email": "gaurav.m@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_design.id},

                # Operations & Supply Chain
                {"name": "Deepak Chauhan", "email": "deepak.c@erp.com", "role": "manager", "pwd": default_pwd, "dept": dept_ops.id},
                {"name": "Nidhi Varma", "email": "nidhi.v@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_ops.id},
                {"name": "Abhishek Sen", "email": "abhishek.s@erp.com", "role": "student", "pwd": default_pwd, "dept": dept_ops.id},
            ]

            user_models = []
            user_map = {}
            for u in users_data:
                model_obj = models.User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=u["pwd"],
                    role=u["role"],
                    department_id=u["dept"],
                    is_active=True
                )
                user_models.append(model_obj)
            
            db.add_all(user_models)
            db.commit()

            for u in user_models:
                db.refresh(u)
                user_map[u.email] = u

            # 3. ATTENDANCE (Comprehensive 3-Day History for All Students & Faculty)
            today = date.today()
            att_records = []
            
            # Today's attendance
            today_statuses = [
                ("abhaya.kar@erp.com", "present"), ("aarav.s@erp.com", "present"), ("ananya.p@erp.com", "remote"),
                ("rohan.v@erp.com", "present"), ("aditya.n@erp.com", "present"), ("pooja.s@erp.com", "present"),
                ("sneha.i@erp.com", "remote"), ("kavita.r@erp.com", "present"), ("ishaan.j@erp.com", "late"),
                ("rajeshwari.m@erp.com", "present"), ("rahul.d@erp.com", "present"), ("neha.g@erp.com", "remote"),
                ("tanvi.k@erp.com", "present"), ("arjun.s@erp.com", "present"), ("siddharth.s@erp.com", "remote"),
                ("karthik.s@erp.com", "present"), ("meera.n@erp.com", "present"), ("devendra.m@erp.com", "present"),
                ("diya.c@erp.com", "present"), ("manish.a@erp.com", "remote"), ("vivek.c@erp.com", "present"),
                ("priya.s@erp.com", "present"), ("vikram.m@erp.com", "remote"), ("harshita.s@erp.com", "present"),
                ("pranav.p@erp.com", "late"), ("shreya.b@erp.com", "present"), ("swati.b@erp.com", "present"),
                ("ritu.r@erp.com", "remote"), ("akashdeep.s@erp.com", "present"), ("rishabh.t@erp.com", "present"),
                ("gaurav.m@erp.com", "remote"), ("deepak.c@erp.com", "present"), ("nidhi.v@erp.com", "present"),
                ("abhishek.s@erp.com", "late"),
            ]
            for email, status in today_statuses:
                if email in user_map:
                    att_records.append(models.Attendance(user_id=user_map[email].id, date=today, status=status))

            # Yesterday's attendance
            yesterday = today - timedelta(days=1)
            for email in user_map:
                u_obj = user_map[email]
                st = "present" if u_obj.id % 3 != 0 else ("remote" if u_obj.id % 2 == 0 else "late")
                att_records.append(models.Attendance(user_id=u_obj.id, date=yesterday, status=st))

            # 2 Days Ago attendance
            two_days_ago = today - timedelta(days=2)
            for email in user_map:
                u_obj = user_map[email]
                st = "present" if u_obj.id % 4 != 0 else "remote"
                att_records.append(models.Attendance(user_id=u_obj.id, date=two_days_ago, status=st))

            db.add_all(att_records)

            # 4. LEAVE REQUESTS (Academic, Project & Personal Permissions)
            leaves_data = [
                # Engineering Students
                {"email": "aarav.s@erp.com", "start": today + timedelta(days=5), "end": today + timedelta(days=10), "reason": "Smart India Hackathon 2026 Finals (New Delhi)", "status": "pending"},
                {"email": "ananya.p@erp.com", "start": today + timedelta(days=7), "end": today + timedelta(days=8), "reason": "End-Semester Practical Lab Examination", "status": "approved"},
                {"email": "aditya.n@erp.com", "start": today + timedelta(days=14), "end": today + timedelta(days=16), "reason": "AWS Cloud Student Community Day Summit (Bengaluru)", "status": "approved"},
                
                # Human Resources
                {"email": "pooja.s@erp.com", "start": today - timedelta(days=10), "end": today - timedelta(days=8), "reason": "Annual Campus Placement Leadership Drive (IIT/NIT)", "status": "approved"},
                {"email": "sneha.i@erp.com", "start": today + timedelta(days=2), "end": today + timedelta(days=4), "reason": "Medical Recovery & Health Rest", "status": "pending"},
                {"email": "ishaan.j@erp.com", "start": today + timedelta(days=20), "end": today + timedelta(days=22), "reason": "University Convocation Ceremony Attendance", "status": "pending"},

                # Finance
                {"email": "rajeshwari.m@erp.com", "start": today - timedelta(days=25), "end": today - timedelta(days=22), "reason": "Family Emergency Assistance in Chennai", "status": "approved"},
                {"email": "rahul.d@erp.com", "start": today + timedelta(days=6), "end": today + timedelta(days=8), "reason": "CA Final Group-I Examination Preparation", "status": "approved"},
                {"email": "tanvi.k@erp.com", "start": today + timedelta(days=15), "end": today + timedelta(days=19), "reason": "Annual Vacation & Family Festival Leave", "status": "pending"},

                # Sales & Marketing
                {"email": "arjun.s@erp.com", "start": today + timedelta(days=1), "end": today + timedelta(days=3), "reason": "Corporate Partner Roadshow in Mumbai (Bandra-Kurla)", "status": "approved"},
                {"email": "siddharth.s@erp.com", "start": today + timedelta(days=10), "end": today + timedelta(days=12), "reason": "Strategic Key Account Closing Onsite in Pune", "status": "approved"},
                {"email": "karthik.s@erp.com", "start": today + timedelta(days=4), "end": today + timedelta(days=5), "reason": "Personal Time Off & Dental Treatment", "status": "pending"},

                # Customer Success
                {"email": "devendra.m@erp.com", "start": today - timedelta(days=5), "end": today - timedelta(days=3), "reason": "National Student Affairs Executive Summit 2026", "status": "approved"},
                {"email": "manish.a@erp.com", "start": today + timedelta(days=3), "end": today + timedelta(days=12), "reason": "Paternity Leave for Newborn Baby", "status": "approved"},
                {"email": "vivek.c@erp.com", "start": today + timedelta(days=1), "end": today + timedelta(days=2), "reason": "Severe Migraine & Rest Recovery", "status": "pending"},

                # AI & Data Intelligence
                {"email": "priya.s@erp.com", "start": today + timedelta(days=3), "end": today + timedelta(days=6), "reason": "Keynote Speaker at National AI Conclave (Hyderabad)", "status": "approved"},
                {"email": "vikram.m@erp.com", "start": today + timedelta(days=12), "end": today + timedelta(days=15), "reason": "Generative AI Hackathon Mentorship & Project Demo", "status": "pending"},
                {"email": "pranav.p@erp.com", "start": today + timedelta(days=8), "end": today + timedelta(days=9), "reason": "Sister's Wedding Celebration in Kochi", "status": "pending"},

                # Legal & Compliance
                {"email": "shreya.b@erp.com", "start": today - timedelta(days=14), "end": today - timedelta(days=12), "reason": "Supreme Court Bar Association National Forum", "status": "approved"},
                {"email": "swati.b@erp.com", "start": today + timedelta(days=9), "end": today + timedelta(days=11), "reason": "Data Protection Board of India Regulatory Training", "status": "pending"},

                # Product Strategy & UX
                {"email": "akashdeep.s@erp.com", "start": today + timedelta(days=12), "end": today + timedelta(days=16), "reason": "Design Sprint Leadership Retreat (Goa)", "status": "approved"},
                {"email": "rishabh.t@erp.com", "start": today + timedelta(days=5), "end": today + timedelta(days=7), "reason": "NID Design Systems Masterclass 2026", "status": "pending"},
                {"email": "gaurav.m@erp.com", "start": today + timedelta(days=18), "end": today + timedelta(days=20), "reason": "Wellness & Health Rest Days", "status": "pending"},

                # Operations & Supply Chain
                {"email": "deepak.c@erp.com", "start": today - timedelta(days=8), "end": today - timedelta(days=5), "reason": "Campus Data Center & Lab Facility Audit", "status": "approved"},
                {"email": "nidhi.v@erp.com", "start": today + timedelta(days=4), "end": today + timedelta(days=6), "reason": "Equipment Vendor Onsite Quality Verification", "status": "approved"},
                {"email": "abhishek.s@erp.com", "start": today + timedelta(days=11), "end": today + timedelta(days=12), "reason": "Campus Facility Safety & Fire Drill Protocol", "status": "pending"},
            ]

            leaves_models = []
            for item in leaves_data:
                if item["email"] in user_map:
                    leaves_models.append(models.LeaveRequest(
                        user_id=user_map[item["email"]].id,
                        start_date=item["start"],
                        end_date=item["end"],
                        reason=item["reason"],
                        status=item["status"]
                    ))
            db.add_all(leaves_models)

            # 5. FINANCE RECORDS (Revenue, Expenses, Payroll)
            finance_data = [
                # Revenue Records
                {"email": "arjun.s@erp.com", "type": "Revenue", "amt": 2850000.0, "st": "approved", "desc": "Enterprise ERP Multi-Year License - Reliance Jio Digital"},
                {"email": "siddharth.s@erp.com", "type": "Revenue", "amt": 1420000.0, "st": "approved", "desc": "Campus Recruitment & Corporate Partnership - Tata Consultancy Services"},
                {"email": "priya.s@erp.com", "type": "Revenue", "amt": 980000.0, "st": "approved", "desc": "Custom Predictive AI & ML Research Grant - DST Govt of India"},
                {"email": "devendra.m@erp.com", "type": "Revenue", "amt": 540000.0, "st": "approved", "desc": "Annual Student Academic Lab & Resource Subscription Fees"},
                {"email": "abhaya.kar@erp.com", "type": "Revenue", "amt": 760000.0, "st": "approved", "desc": "Strategic Cloud Architecture Consulting - Infosys FinTech Lab"},

                # Payroll Records
                {"email": "rajeshwari.m@erp.com", "type": "Payroll", "amt": 1950000.0, "st": "approved", "desc": "Monthly Faculty, Instructors & Research Staff Remuneration"},
                {"email": "rajeshwari.m@erp.com", "type": "Payroll", "amt": 840000.0, "st": "approved", "desc": "Monthly Student Interns, Mentors & TA Fellowship Stipends"},
                {"email": "rajeshwari.m@erp.com", "type": "Payroll", "amt": 620000.0, "st": "approved", "desc": "Campus Operations, Library & Administrative Staff Payroll"},

                # Department Specific Expenses
                {"email": "abhaya.kar@erp.com", "type": "Expense", "amt": 185000.0, "st": "approved", "desc": "AWS Cloud Multi-Region Mumbai Cluster, GPU Instances & Backups"},
                {"email": "priya.s@erp.com", "type": "Expense", "amt": 64000.0, "st": "approved", "desc": "OpenAI Enterprise Compute & Claude Research Tokens"},
                {"email": "priya.s@erp.com", "type": "Expense", "amt": 82000.0, "st": "approved", "desc": "Snowflake & Databricks High-Throughput Analytics Cluster"},
                {"email": "karthik.s@erp.com", "type": "Expense", "amt": 154000.0, "st": "approved", "desc": "National Student Outreach & Campus Hackathon Sponsorship"},
                {"email": "pooja.s@erp.com", "type": "Expense", "amt": 52000.0, "st": "approved", "desc": "Darwinbox Campus HRIS & Student Placement Portal License"},
                {"email": "shreya.b@erp.com", "type": "Expense", "amt": 89000.0, "st": "approved", "desc": "Annual NAAC, NBA & ISO-27001 Regulatory Legal Audit"},
                {"email": "akashdeep.s@erp.com", "type": "Expense", "amt": 38000.0, "st": "approved", "desc": "Figma Enterprise, MATLAB & IEEE Xplore Subscriptions"},
                {"email": "deepak.c@erp.com", "type": "Expense", "amt": 224000.0, "st": "approved", "desc": "Lab Hardware Upgrade: 20x High-Performance Desktop Units"},
                {"email": "deepak.c@erp.com", "type": "Expense", "amt": 145000.0, "st": "approved", "desc": "Campus High-Speed Dedicated Gigabit Fiber & Facilities"},
                {"email": "devendra.m@erp.com", "type": "Expense", "amt": 28000.0, "st": "approved", "desc": "Student Helpdesk VoIP Telephony & Support Portal"},
                {"email": "rahul.d@erp.com", "type": "Expense", "amt": 95000.0, "st": "pending", "desc": "GST Filing & Annual Corporate Tax Compliance Retainer"},
                {"email": "rohan.v@erp.com", "type": "Expense", "amt": 21000.0, "st": "pending", "desc": "GitHub Campus Enterprise & Server Security Licenses"},
            ]

            fin_models = []
            for f in finance_data:
                uid = user_map[f["email"]].id if f["email"] in user_map else None
                fin_models.append(models.FinanceRecord(
                    user_id=uid,
                    record_type=f["type"],
                    amount=f["amt"],
                    status=f["st"],
                    description=f["desc"]
                ))
            db.add_all(fin_models)

            # 6. PERFORMANCE REVIEWS (Evaluations for Students & Faculty Across Every Department)
            perf_data = [
                # Engineering & Tech Students
                {"email": "abhaya.kar@erp.com", "score": 5.0, "remarks": "Exemplary institutional leadership, architected multi-region cloud platform, 99.99% uptime achievement."},
                {"email": "aarav.s@erp.com", "score": 4.9, "remarks": "Top academic rank holder, winner of Smart India Hackathon 2026 with 9.8 CGPA."},
                {"email": "ananya.p@erp.com", "score": 4.8, "remarks": "Published research paper on distributed cloud architectures with IEEE Xplore citation."},
                {"email": "rohan.v@erp.com", "score": 4.7, "remarks": "Built campus student portal microservices with 100% test coverage."},
                {"email": "aditya.n@erp.com", "score": 4.8, "remarks": "AWS Certified Cloud Practitioner, active technical community lead."},

                # Human Resources
                {"email": "pooja.s@erp.com", "score": 4.9, "remarks": "Achieved record 98.4% campus placement conversion and revamped corporate ties."},
                {"email": "sneha.i@erp.com", "score": 4.7, "remarks": "Ranked 1st in MBA HR Analytics & Talent Acquisition simulation."},
                {"email": "kavita.r@erp.com", "score": 4.6, "remarks": "Spearheaded student mentorship circle with 94% positive peer ratings."},
                {"email": "ishaan.j@erp.com", "score": 4.5, "remarks": "Automated internship verification workflow saving 120+ hours per semester."},

                # Finance
                {"email": "rajeshwari.m@erp.com", "score": 5.0, "remarks": "Flawless fiscal governance, optimized budget allocation, 100% statutory compliance."},
                {"email": "rahul.d@erp.com", "score": 4.8, "remarks": "Secured All-India Top 50 merit rank in CA Intermediate & Tax Law."},
                {"email": "neha.g@erp.com", "score": 4.7, "remarks": "Managed campus entrepreneurship seed fund treasury with zero discrepancy."},
                {"email": "tanvi.k@erp.com", "score": 4.6, "remarks": "100% accuracy in annual financial reconciliations and GST schedules."},

                # Sales & Marketing
                {"email": "arjun.s@erp.com", "score": 4.9, "remarks": "Expanded institutional industry alliances by 45%, signing 14 Tier-1 MoUs."},
                {"email": "siddharth.s@erp.com", "score": 4.8, "remarks": "Led student national digital symposium reaching over 85,000 participants."},
                {"email": "karthik.s@erp.com", "score": 4.6, "remarks": "Ranked top debater in National University Model UN & corporate case challenge."},
                {"email": "meera.n@erp.com", "score": 4.7, "remarks": "Authored institute research newsletter increasing external engagement by 60%."},

                # Customer Success
                {"email": "devendra.m@erp.com", "score": 4.9, "remarks": "Maintained 99.2% student satisfaction rating across academic advising wings."},
                {"email": "diya.c@erp.com", "score": 4.8, "remarks": "Organized successful peer-tutoring initiative helping 250+ first-year students."},
                {"email": "manish.a@erp.com", "score": 4.7, "remarks": "Built automated FAQ chatbot resolving common student requests in seconds."},
                {"email": "vivek.c@erp.com", "score": 4.6, "remarks": "Resolved 100% of student campus accommodation requests with zero escalation."},

                # AI & Data Intelligence
                {"email": "priya.s@erp.com", "score": 5.0, "remarks": "Secured 980,000 DST research grant, published 4 high-impact AI papers."},
                {"email": "vikram.m@erp.com", "score": 4.9, "remarks": "Fine-tuned domain LLM for Indian regional language processing with 99.2% accuracy."},
                {"email": "harshita.s@erp.com", "score": 4.8, "remarks": "Engineered real-time computer vision algorithm for medical imaging analysis."},
                {"email": "pranav.p@erp.com", "score": 4.6, "remarks": "Developed interactive analytics dashboard used across campus departments."},

                # Legal & Compliance
                {"email": "shreya.b@erp.com", "score": 4.9, "remarks": "Led institute through immaculate NAAC A++ accreditation with zero non-compliances."},
                {"email": "swati.b@erp.com", "score": 4.7, "remarks": "Winner of National Moot Court competition on Indian Cyber Security Law."},
                {"email": "ritu.r@erp.com", "score": 4.7, "remarks": "Drafted student intellectual property protection guidelines for campus startups."},

                # Product Strategy & UX
                {"email": "akashdeep.s@erp.com", "score": 5.0, "remarks": "Led complete Smart ERP v3.0 UX redesign with responsive modern interface."},
                {"email": "rishabh.t@erp.com", "score": 4.8, "remarks": "Designed accessible high-contrast component library conforming to WCAG 2.1 AA."},
                {"email": "gaurav.m@erp.com", "score": 4.7, "remarks": "Conducted 50+ user interviews to eliminate workflow friction points."},

                # Operations & Supply Chain
                {"email": "deepak.c@erp.com", "score": 4.9, "remarks": "Modernized campus computing infrastructure and secured 22% vendor volume discount."},
                {"email": "nidhi.v@erp.com", "score": 4.7, "remarks": "Implemented barcode inventory system for all campus science and computing labs."},
                {"email": "abhishek.s@erp.com", "score": 4.6, "remarks": "Maintained 100% lab uptime and expedited hardware maintenance tickets."},
            ]

            perf_models = []
            for p in perf_data:
                if p["email"] in user_map:
                    perf_models.append(models.Performance(
                        user_id=user_map[p["email"]].id,
                        score=p["score"],
                        remarks=p["remarks"]
                    ))
            db.add_all(perf_models)

            # 7. NOTICES & ANNOUNCEMENTS (National & Campus Wide)
            notices_data = [
                {
                    "email": "abhaya.kar@erp.com",
                    "title": "🚀 Strategic Vision 2026: National Townhall & Academic Milestones",
                    "content": "All students, faculty, and team members are invited to our National Townhall this Thursday at 10:00 AM IST. We will present our upcoming AI platform innovations, celebrate our 99.99% system uptime milestone, and recognize outstanding student and departmental achievements."
                },
                {
                    "email": "priya.s@erp.com",
                    "title": "💡 Smart ERP AI Copilot & Student Automation Engine Live",
                    "content": "The AI & Data Intelligence team has officially rolled out the Smart ERP Copilot! Students and staff can now leverage automated financial anomaly detection, intelligent course assistance, and instant report generation."
                },
                {
                    "email": "shreya.b@erp.com",
                    "title": "🔒 Security Notice: Digital Personal Data Protection (DPDP) Act Compliance",
                    "content": "We have officially achieved full compliance with India's DPDP Act and ISO-27001 standards! All students and staff must ensure 2FA authentication and quarterly password updates are maintained."
                },
                {
                    "email": "pooja.s@erp.com",
                    "title": "🏖️ Holiday Calendar: Diwali & National Festival Schedule",
                    "content": "Please review the updated holiday calendar for the upcoming festive season. Ensure planned student vacation and travel leaves are logged early in the ERP portal for semester coordination."
                },
                {
                    "email": "arjun.s@erp.com",
                    "title": "🏆 Campus Placements: Record-Breaking 98.4% Offers Secured",
                    "content": "Huge congratulations to all students and the placement team for securing over 450+ top-tier corporate placement offers! Landmark partnerships finalized with leading tech firms."
                },
                {
                    "email": "akashdeep.s@erp.com",
                    "title": "🎨 Next-Gen ERP Design System v3.0 Released",
                    "content": "The Product Strategy & UX team has published the new Design System v3.0 guidelines featuring fast search filters, clean financial analytics, and an intuitive high-contrast dark/light UI."
                },
                {
                    "email": "devendra.m@erp.com",
                    "title": "⭐ Student Satisfaction & Campus Helpdesk Score Hits 99.2%",
                    "content": "Our Student Affairs & Support division achieved an all-time record satisfaction score of 99.2% for the month of September. Thank you to all mentors for delivering exceptional support!"
                },
            ]

            notice_models = []
            for n in notices_data:
                author_id = user_map[n["email"]].id if n["email"] in user_map else None
                notice_models.append(models.Notice(
                    title=n["title"],
                    content=n["content"],
                    author_id=author_id,
                    created_at=datetime.utcnow()
                ))
            db.add_all(notice_models)

            db.commit()
            print("[DB] Database seeding complete across all 9 departments!")
    except Exception as e:
        db.rollback()
        print(f"[DB] Seed error: {e}")
    finally:
        db.close()

seed_database(force_reseed=True)

app = FastAPI(title="Smart ERP Management System", version="1.0.0")

cors_origins_list = [x.strip() for x in settings.cors_origins.split(",") if x.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list if cors_origins_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Smart ERP Management System API is running smoothly", "docs": "/docs", "version": "1.0.0"}

# AUTH
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
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

@app.post("/api/auth/login")
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    dept_name = user.department.name if user.department else None
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

# USERS
@app.get("/api/users", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    users_list = db.query(models.User).all()
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

@app.post("/api/users", response_model=schemas.UserOut)
def create_user(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
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
    return schemas.UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        department_name=user.department.name if user.department else "Unassigned",
        is_active=user.is_active
    )

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# DEPARTMENTS
@app.get("/api/departments", response_model=list[schemas.DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    departments_list = db.query(models.Department).all()
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

@app.post("/api/departments", response_model=schemas.DepartmentOut)
def create_department(data: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    if db.query(models.Department).filter(models.Department.name == data.name).first():
        raise HTTPException(status_code=400, detail="Department already exists")
    item = models.Department(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.DepartmentOut(id=item.id, name=item.name, description=item.description, employee_count=0)

@app.delete("/api/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.get(models.Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    # unassign users
    db.query(models.User).filter(models.User.department_id == dept_id).update({"department_id": None})
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully"}

# ATTENDANCE
@app.get("/api/attendance", response_model=list[schemas.AttendanceOut])
def list_attendance(db: Session = Depends(get_db)):
    items = db.query(models.Attendance).order_by(models.Attendance.date.desc(), models.Attendance.id.desc()).all()
    result = []
    for a in items:
        result.append(schemas.AttendanceOut(
            id=a.id,
            user_id=a.user_id,
            user_name=a.user.name if a.user else "Unknown",
            date=a.date,
            status=a.status
        ))
    return result

@app.post("/api/attendance", response_model=schemas.AttendanceOut)
def record_attendance(data: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    # Check if already recorded for this user and date
    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == data.user_id,
        models.Attendance.date == data.date
    ).first()
    if existing:
        existing.status = data.status
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = models.Attendance(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
    
    return schemas.AttendanceOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "Unknown",
        date=item.date,
        status=item.status
    )

# LEAVES
@app.get("/api/leaves", response_model=list[schemas.LeaveOut])
def list_leaves(db: Session = Depends(get_db)):
    items = db.query(models.LeaveRequest).order_by(models.LeaveRequest.id.desc()).all()
    result = []
    for l in items:
        result.append(schemas.LeaveOut(
            id=l.id,
            user_id=l.user_id,
            user_name=l.user.name if l.user else "Unknown",
            start_date=l.start_date,
            end_date=l.end_date,
            reason=l.reason,
            status=l.status
        ))
    return result

@app.post("/api/leaves", response_model=schemas.LeaveOut)
def create_leave(data: schemas.LeaveCreate, db: Session = Depends(get_db)):
    item = models.LeaveRequest(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.LeaveOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "Unknown",
        start_date=item.start_date,
        end_date=item.end_date,
        reason=item.reason,
        status=item.status
    )

@app.patch("/api/leaves/{leave_id}", response_model=schemas.LeaveOut)
def update_leave_status(leave_id: int, data: schemas.LeaveStatus, db: Session = Depends(get_db)):
    item = db.get(models.LeaveRequest, leave_id)
    if not item:
        raise HTTPException(status_code=404, detail="Leave request not found")
    item.status = data.status
    db.commit()
    db.refresh(item)
    return schemas.LeaveOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "Unknown",
        start_date=item.start_date,
        end_date=item.end_date,
        reason=item.reason,
        status=item.status
    )

@app.delete("/api/leaves/{leave_id}")
def delete_leave(leave_id: int, db: Session = Depends(get_db)):
    item = db.get(models.LeaveRequest, leave_id)
    if not item:
        raise HTTPException(status_code=404, detail="Leave request not found")
    db.delete(item)
    db.commit()
    return {"message": "Leave request deleted"}

# FINANCE
@app.get("/api/finance", response_model=list[schemas.FinanceOut])
def list_finance(db: Session = Depends(get_db)):
    items = db.query(models.FinanceRecord).order_by(models.FinanceRecord.id.desc()).all()
    result = []
    for f in items:
        result.append(schemas.FinanceOut(
            id=f.id,
            user_id=f.user_id,
            user_name=f.user.name if f.user else "General Organization",
            record_type=f.record_type,
            amount=f.amount,
            status=f.status,
            description=f.description
        ))
    return result

@app.post("/api/finance", response_model=schemas.FinanceOut)
def create_finance(data: schemas.FinanceCreate, db: Session = Depends(get_db)):
    item = models.FinanceRecord(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.FinanceOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "General Organization",
        record_type=item.record_type,
        amount=item.amount,
        status=item.status,
        description=item.description
    )

@app.patch("/api/finance/{record_id}", response_model=schemas.FinanceOut)
def update_finance_status(record_id: int, data: schemas.FinanceStatus, db: Session = Depends(get_db)):
    item = db.get(models.FinanceRecord, record_id)
    if not item:
        raise HTTPException(status_code=404, detail="Finance record not found")
    item.status = data.status
    db.commit()
    db.refresh(item)
    return schemas.FinanceOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "General Organization",
        record_type=item.record_type,
        amount=item.amount,
        status=item.status,
        description=item.description
    )

@app.delete("/api/finance/{record_id}")
def delete_finance(record_id: int, db: Session = Depends(get_db)):
    item = db.get(models.FinanceRecord, record_id)
    if not item:
        raise HTTPException(status_code=404, detail="Finance record not found")
    db.delete(item)
    db.commit()
    return {"message": "Finance record deleted"}

# PERFORMANCE
@app.get("/api/performance", response_model=list[schemas.PerformanceOut])
def list_performance(db: Session = Depends(get_db)):
    items = db.query(models.Performance).order_by(models.Performance.id.desc()).all()
    result = []
    for p in items:
        result.append(schemas.PerformanceOut(
            id=p.id,
            user_id=p.user_id,
            user_name=p.user.name if p.user else "Unknown",
            score=p.score,
            remarks=p.remarks
        ))
    return result

@app.post("/api/performance", response_model=schemas.PerformanceOut)
def create_performance(data: schemas.PerformanceCreate, db: Session = Depends(get_db)):
    item = models.Performance(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.PerformanceOut(
        id=item.id,
        user_id=item.user_id,
        user_name=item.user.name if item.user else "Unknown",
        score=item.score,
        remarks=item.remarks
    )

@app.delete("/api/performance/{perf_id}")
def delete_performance(perf_id: int, db: Session = Depends(get_db)):
    item = db.get(models.Performance, perf_id)
    if not item:
        raise HTTPException(status_code=404, detail="Performance record not found")
    db.delete(item)
    db.commit()
    return {"message": "Performance record deleted"}

# NOTICES
@app.get("/api/notices", response_model=list[schemas.NoticeOut])
def list_notices(db: Session = Depends(get_db)):
    items = db.query(models.Notice).order_by(models.Notice.id.desc()).all()
    result = []
    for n in items:
        result.append(schemas.NoticeOut(
            id=n.id,
            title=n.title,
            content=n.content,
            author_id=n.author_id,
            author_name=n.author.name if n.author else "Management",
            created_at=n.created_at
        ))
    return result

@app.post("/api/notices", response_model=schemas.NoticeOut)
def create_notice(data: schemas.NoticeCreate, db: Session = Depends(get_db)):
    item = models.Notice(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.NoticeOut(
        id=item.id,
        title=item.title,
        content=item.content,
        author_id=item.author_id,
        author_name=item.author.name if item.author else "Management",
        created_at=item.created_at
    )

@app.delete("/api/notices/{notice_id}")
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    item = db.get(models.Notice, notice_id)
    if not item:
        raise HTTPException(status_code=404, detail="Notice not found")
    db.delete(item)
    db.commit()
    return {"message": "Notice deleted"}

# DASHBOARD
@app.get("/api/dashboard")
def dashboard_metrics(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_depts = db.query(models.Department).count()
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    total_revenue = db.query(func.sum(models.FinanceRecord.amount)).filter(models.FinanceRecord.record_type == "Revenue").scalar() or 0.0
    total_expenses = db.query(func.sum(models.FinanceRecord.amount)).filter(models.FinanceRecord.record_type.in_(["Expense", "Payroll"])).scalar() or 0.0
    avg_score = db.query(func.avg(models.Performance.score)).scalar() or 0.0
    
    today_att = db.query(models.Attendance).filter(models.Attendance.date == date.today()).count()
    
    return {
        "users": total_users,
        "departments": total_depts,
        "pending_leaves": pending_leaves,
        "finance_records": db.query(models.FinanceRecord).count(),
        "total_revenue": round(total_revenue, 2),
        "total_expenses": round(total_expenses, 2),
        "net_balance": round(total_revenue - total_expenses, 2),
        "avg_performance": round(avg_score, 2),
        "today_attendance": today_att,
        "notices": db.query(models.Notice).count()
    }

