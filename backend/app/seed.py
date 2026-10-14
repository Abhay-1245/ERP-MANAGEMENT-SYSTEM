"""
Database seeding module for Smart ERP Management System.
Populates standard enterprise departments, staff personnel, attendance logs,
financial ledger records, performance appraisals, and corporate notices.
"""

from datetime import date, datetime, timedelta
from .database import SessionLocal, engine, Base
from . import models
from .auth import hash_password


def seed_database(force_reseed: bool = False):
    """
    Seeds database with authentic enterprise data if not already populated.
    """
    db = SessionLocal()
    try:
        user_count = db.query(models.User).count()
        if user_count >= 10 and not force_reseed:
            return

        print("[Seed] Initializing enterprise ERP dataset...")

        if force_reseed or user_count > 0:
            db.query(models.Attendance).delete()
            db.query(models.LeaveRequest).delete()
            db.query(models.FinanceRecord).delete()
            db.query(models.Performance).delete()
            db.query(models.Notice).delete()
            db.query(models.User).delete()
            db.query(models.Department).delete()
            db.commit()

        # 1. ENTERPRISE DEPARTMENTS
        departments_data = [
            ("Engineering & Technology", "Cloud Infrastructure, Distributed Systems, Microservices & Core Platforms"),
            ("Human Resources & People", "Talent Acquisition, Total Rewards, People Operations & Workplace Culture"),
            ("Finance & Corporate Treasury", "Financial Planning & Analysis, Treasury, Global Tax Compliance & Auditing"),
            ("Global Sales & Marketing", "Enterprise Solutions, Account Expansion, Digital Marketing & Growth"),
            ("Customer Success & Solutions", "Global Client Onboarding, SLA Governance & 24/7 Technical Support"),
            ("AI & Data Intelligence", "Enterprise Machine Learning, Predictive Data Pipelines & Business Intelligence"),
            ("Legal, Risk & Compliance", "Corporate Governance, Regulatory Adherence, Intellectual Property & Contracts"),
            ("Product Strategy & UX", "User Experience Research, Enterprise Design Systems & Product Roadmaps"),
            ("Operations & Supply Chain", "Facilities, Global Procurement, Vendor Management & Logistics"),
        ]

        depts = {}
        for name, desc in departments_data:
            dept = models.Department(name=name, description=desc)
            db.add(dept)
            depts[name] = dept
        db.commit()

        # Refresh departments to get auto-increment IDs
        for d in depts.values():
            db.refresh(d)

        # 2. PERSONNEL & STAFF
        default_pwd = hash_password("user123")
        admin_pwd = hash_password("admin123")

        users_payload = [
            # Engineering
            {"name": "Abhaya Kumar Kar", "email": "abhaya.kar@erp.com", "role": "admin", "pwd": admin_pwd, "dept": "Engineering & Technology"},
            {"name": "Aarav Sharma", "email": "aarav.s@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Engineering & Technology"},
            {"name": "Ananya Patel", "email": "ananya.p@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Engineering & Technology"},
            {"name": "Rohan Verma", "email": "rohan.v@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Engineering & Technology"},
            {"name": "Aditya Nair", "email": "aditya.n@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Engineering & Technology"},

            # HR
            {"name": "Pooja Sundaram", "email": "pooja.s@erp.com", "role": "manager", "pwd": default_pwd, "dept": "Human Resources & People"},
            {"name": "Sneha Iyer", "email": "sneha.i@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Human Resources & People"},
            {"name": "Kavita Reddy", "email": "kavita.r@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Human Resources & People"},
            {"name": "Ishaan Joshi", "email": "ishaan.j@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Human Resources & People"},

            # Finance
            {"name": "Rajeshwari Menon", "email": "rajeshwari.m@erp.com", "role": "manager", "pwd": default_pwd, "dept": "Finance & Corporate Treasury"},
            {"name": "Rahul Deshmukh", "email": "rahul.d@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Finance & Corporate Treasury"},
            {"name": "Neha Gupta", "email": "neha.g@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Finance & Corporate Treasury"},
            {"name": "Tanvi Kulkarni", "email": "tanvi.k@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Finance & Corporate Treasury"},

            # Sales & Marketing
            {"name": "Arjun Singhania", "email": "arjun.s@erp.com", "role": "manager", "pwd": default_pwd, "dept": "Global Sales & Marketing"},
            {"name": "Siddharth Sengupta", "email": "siddharth.s@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Global Sales & Marketing"},
            {"name": "Karthik Subramanian", "email": "karthik.s@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Global Sales & Marketing"},
            {"name": "Meera Nambiar", "email": "meera.n@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Global Sales & Marketing"},

            # Customer Success
            {"name": "Devendra Mukherjee", "email": "devendra.m@erp.com", "role": "manager", "pwd": default_pwd, "dept": "Customer Success & Solutions"},
            {"name": "Diya Chatterjee", "email": "diya.c@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Customer Success & Solutions"},
            {"name": "Manish Agarwal", "email": "manish.a@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Customer Success & Solutions"},
            {"name": "Vivek Choudhury", "email": "vivek.c@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Customer Success & Solutions"},

            # AI & Data
            {"name": "Priya Sharma", "email": "priya.s@erp.com", "role": "manager", "pwd": default_pwd, "dept": "AI & Data Intelligence"},
            {"name": "Vikram Malhotra", "email": "vikram.m@erp.com", "role": "employee", "pwd": default_pwd, "dept": "AI & Data Intelligence"},
            {"name": "Harshita Saxena", "email": "harshita.s@erp.com", "role": "employee", "pwd": default_pwd, "dept": "AI & Data Intelligence"},
            {"name": "Pranav Pillai", "email": "pranav.p@erp.com", "role": "employee", "pwd": default_pwd, "dept": "AI & Data Intelligence"},

            # Legal
            {"name": "Shreya Banerjee", "email": "shreya.b@erp.com", "role": "manager", "pwd": default_pwd, "dept": "Legal, Risk & Compliance"},
            {"name": "Swati Bhattacharya", "email": "swati.b@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Legal, Risk & Compliance"},
            {"name": "Ritu Roy", "email": "ritu.r@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Legal, Risk & Compliance"},

            # Design & UX
            {"name": "Akashdeep Singh", "email": "akashdeep.s@erp.com", "role": "manager", "pwd": default_pwd, "dept": "Product Strategy & UX"},
            {"name": "Rishabh Tiwari", "email": "rishabh.t@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Product Strategy & UX"},
            {"name": "Gaurav Mishra", "email": "gaurav.m@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Product Strategy & UX"},

            # Operations
            {"name": "Deepak Chauhan", "email": "deepak.c@erp.com", "role": "manager", "pwd": default_pwd, "dept": "Operations & Supply Chain"},
            {"name": "Nidhi Varma", "email": "nidhi.v@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Operations & Supply Chain"},
            {"name": "Abhishek Sen", "email": "abhishek.s@erp.com", "role": "employee", "pwd": default_pwd, "dept": "Operations & Supply Chain"},
        ]

        user_map = {}
        for u in users_payload:
            user = models.User(
                name=u["name"],
                email=u["email"],
                password_hash=u["pwd"],
                role=u["role"],
                department_id=depts[u["dept"]].id,
                is_active=True
            )
            db.add(user)
            user_map[u["email"]] = user
        db.commit()

        for u in user_map.values():
            db.refresh(u)

        # 3. ATTENDANCE LOGS (Last 5 business days)
        today = date.today()
        dates = [today - timedelta(days=i) for i in range(5)]
        statuses = ["present", "present", "present", "late", "remote", "present", "present"]
        
        att_records = []
        for d_idx, d in enumerate(dates):
            for u_idx, u in enumerate(user_map.values()):
                status = statuses[(u_idx + d_idx) % len(statuses)]
                att_records.append(models.Attendance(user_id=u.id, date=d, status=status))
        db.add_all(att_records)

        # 4. LEAVE REQUESTS
        leaves_data = [
            {"email": "ananya.p@erp.com", "start": today + timedelta(days=3), "end": today + timedelta(days=6), "reason": "Attending PyCon APAC Keynote Presentation", "status": "approved"},
            {"email": "rohan.v@erp.com", "start": today + timedelta(days=7), "end": today + timedelta(days=9), "reason": "Family relocation and personal matters", "status": "pending"},
            {"email": "sneha.i@erp.com", "start": today + timedelta(days=4), "end": today + timedelta(days=5), "reason": "Dental surgery and recovery", "status": "approved"},
            {"email": "rahul.d@erp.com", "start": today + timedelta(days=12), "end": today + timedelta(days=15), "reason": "Annual family vacation", "status": "pending"},
            {"email": "karthik.s@erp.com", "start": today + timedelta(days=2), "end": today + timedelta(days=3), "reason": "Client on-site contract signing at Bangalore hub", "status": "approved"},
            {"email": "harshita.s@erp.com", "start": today + timedelta(days=10), "end": today + timedelta(days=12), "reason": "Certification examination preparation", "status": "pending"},
            {"email": "swati.b@erp.com", "start": today + timedelta(days=1), "end": today + timedelta(days=1), "reason": "Personal administrative appointment", "status": "rejected"},
            {"email": "rishabh.t@erp.com", "start": today + timedelta(days=5), "end": today + timedelta(days=8), "reason": "Wedding ceremony attendance", "status": "approved"},
        ]
        for item in leaves_data:
            if item["email"] in user_map:
                db.add(models.LeaveRequest(
                    user_id=user_map[item["email"]].id,
                    start_date=item["start"],
                    end_date=item["end"],
                    reason=item["reason"],
                    status=item["status"]
                ))

        # 5. FINANCIAL LEDGER RECORDS
        finance_data = [
            {"email": "arjun.s@erp.com", "type": "Revenue", "amt": 2850000.0, "st": "approved", "desc": "Enterprise ERP Multi-Year License - Reliance Jio Digital"},
            {"email": "siddharth.s@erp.com", "type": "Revenue", "amt": 1420000.0, "st": "approved", "desc": "Corporate Cloud Modernization Project - Tata Consultancy Services"},
            {"email": "priya.s@erp.com", "type": "Revenue", "amt": 980000.0, "st": "approved", "desc": "Predictive AI & Analytics Enterprise SLA - HDFC Securities"},
            {"email": "abhaya.kar@erp.com", "type": "Revenue", "amt": 760000.0, "st": "approved", "desc": "Strategic Architecture Advisory - Infosys FinTech Lab"},
            {"email": "devendra.m@erp.com", "type": "Revenue", "amt": 540000.0, "st": "approved", "desc": "Customer Success Premier 24/7 SLA Tier Renewal"},
            {"email": "rajeshwari.m@erp.com", "type": "Payroll", "amt": 1950000.0, "st": "approved", "desc": "Executive Engineering, AI Research & Core Leadership Monthly Payroll"},
            {"email": "rajeshwari.m@erp.com", "type": "Payroll", "amt": 840000.0, "st": "approved", "desc": "Associate Developers, UI Designers & QA Engineering Payroll"},
            {"email": "rajeshwari.m@erp.com", "type": "Payroll", "amt": 620000.0, "st": "approved", "desc": "Corporate Operations, HR, Legal & Facilities Support Payroll"},
            {"email": "abhaya.kar@erp.com", "type": "Expense", "amt": 185000.0, "st": "approved", "desc": "AWS Multi-Region Production Cluster, RDS Backups & GPU Nodes"},
            {"email": "priya.s@erp.com", "type": "Expense", "amt": 64000.0, "st": "approved", "desc": "Anthropic Claude & OpenAI Production API Compute Invoicing"},
            {"email": "priya.s@erp.com", "type": "Expense", "amt": 82000.0, "st": "approved", "desc": "Snowflake & Databricks High-Throughput Warehouse Cluster"},
            {"email": "karthik.s@erp.com", "type": "Expense", "amt": 154000.0, "st": "approved", "desc": "Enterprise Solutions Showcase & Tech Leaders Summit Sponsorship"},
            {"email": "pooja.s@erp.com", "type": "Expense", "amt": 52000.0, "st": "approved", "desc": "Enterprise HRIS & Global Talent Pipeline Subscriptions"},
            {"email": "shreya.b@erp.com", "type": "Expense", "amt": 89000.0, "st": "approved", "desc": "Annual SOC-2 Type II Audit, ISO-27001 & Regulatory Compliance"},
            {"email": "akashdeep.s@erp.com", "type": "Expense", "amt": 38000.0, "st": "approved", "desc": "Figma Enterprise Design System & Prototyping Licenses"},
            {"email": "deepak.c@erp.com", "type": "Expense", "amt": 224000.0, "st": "approved", "desc": "Workstation Hardware Refresh: 10x M3 Max Developer Units"},
            {"email": "deepak.c@erp.com", "type": "Expense", "amt": 145000.0, "st": "approved", "desc": "Dedicated 10Gbps Redundant Leased Line & Datacenter Uplink"},
            {"email": "rahul.d@erp.com", "type": "Expense", "amt": 95000.0, "st": "pending", "desc": "Corporate Tax Advisory Retainer & Quarterly GST Audit"},
            {"email": "rohan.v@erp.com", "type": "Expense", "amt": 21000.0, "st": "pending", "desc": "GitHub Enterprise Server & Snyk Security Scanner Seats"},
        ]
        for f in finance_data:
            uid = user_map[f["email"]].id if f["email"] in user_map else None
            db.add(models.FinanceRecord(
                user_id=uid,
                record_type=f["type"],
                amount=f["amt"],
                status=f["st"],
                description=f["desc"]
            ))

        # 6. PERFORMANCE APPRAISALS
        perf_data = [
            {"email": "aarav.s@erp.com", "score": 4.9, "remarks": "Exceeded targets: spearhead of cloud microservices zero-downtime migration."},
            {"email": "ananya.p@erp.com", "score": 4.7, "remarks": "Exceptional work architecting our end-to-end telemetry and monitoring stack."},
            {"email": "rohan.v@erp.com", "score": 4.4, "remarks": "Solid performance in optimizing API payload serialization by 42%."},
            {"email": "sneha.i@erp.com", "score": 4.6, "remarks": "Successfully reduced average time-to-hire by 14 days with structured pipelines."},
            {"email": "rahul.d@erp.com", "score": 4.8, "remarks": "Impeccable accuracy in FY26 Q1 budget forecasting and financial audits."},
            {"email": "siddharth.s@erp.com", "score": 4.9, "remarks": "Top enterprise revenue contributor: closed marquee tech client accounts."},
            {"email": "diya.c@erp.com", "score": 4.8, "remarks": "Customer satisfaction CSAT maintained at 99.4% throughout the quarter."},
            {"email": "vikram.m@erp.com", "score": 4.7, "remarks": "Engineered low-latency vector embeddings search for document workflows."},
            {"email": "swati.b@erp.com", "score": 4.5, "remarks": "Streamlined master service agreement review cycles from 10 days to 48 hours."},
            {"email": "rishabh.t@erp.com", "score": 4.8, "remarks": "Delivered the complete Design System v3.0 component guidelines ahead of schedule."},
            {"email": "nidhi.v@erp.com", "score": 4.6, "remarks": "Negotiated critical cloud infrastructure volume discounts yielding 18% savings."},
        ]
        for p in perf_data:
            if p["email"] in user_map:
                db.add(models.Performance(
                    user_id=user_map[p["email"]].id,
                    score=p["score"],
                    remarks=p["remarks"]
                ))

        # 7. CORPORATE NOTICES
        notices_data = [
            {
                "email": "abhaya.kar@erp.com",
                "title": "Annual Executive Strategy & FY26 Product Roadmap Briefing",
                "content": "All department leads are invited to the Q4 Strategy Session on Thursday at 10:00 AM IST. Key priorities include multi-region cloud scaling, AI automation pipelines, and enterprise ISO re-certifications."
            },
            {
                "email": "shreya.b@erp.com",
                "title": "SOC-2 Type II & ISO-27001 Re-Certification Audit Passed",
                "content": "Our global compliance auditors have officially reaffirmed our SOC-2 Type II and ISO-27001 accreditations with zero non-conformities. Commendations to the Security & DevOps teams."
            },
            {
                "email": "pooja.s@erp.com",
                "title": "Upcoming Festival Holiday Schedule & Remote Work Policy",
                "content": "Please review the updated holiday calendar on the portal. Team members planning extended time off should submit leave requests at least one week in advance for coverage coordination."
            },
            {
                "email": "arjun.s@erp.com",
                "title": "Enterprise Sales Milestone: Landmark Multi-Year Contract Finalized",
                "content": "We have formally closed a multi-year enterprise transformation partnership with Reliance Jio Digital. Hearty congratulations to the entire Sales, Engineering, and Solutions teams!"
            },
            {
                "email": "akashdeep.s@erp.com",
                "title": "Smart ERP Design System v3.0 Guidelines Published",
                "content": "The Product Strategy & UX division has released our upgraded design guidelines focusing on accessibility, high-contrast data visualization, and streamlined keyboard shortcuts."
            },
        ]
        for n in notices_data:
            auth_id = user_map[n["email"]].id if n["email"] in user_map else None
            db.add(models.Notice(
                title=n["title"],
                content=n["content"],
                author_id=auth_id,
                created_at=datetime.utcnow()
            ))

        db.commit()
        print("[Seed] Enterprise ERP dataset successfully seeded.")
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error during seeding: {e}")
    finally:
        db.close()
