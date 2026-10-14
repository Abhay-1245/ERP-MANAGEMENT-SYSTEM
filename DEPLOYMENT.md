# Deployment Guide — Smart ERP Management System

This guide covers the three most common ways to deploy the Smart ERP suite to production:
1. **[Method 1: Docker Compose](#method-1-docker-compose-recommended-for-vps--cloud-vms)** *(Recommended for AWS EC2, DigitalOcean, Linode, Hetzner, or self-hosted servers)*
2. **[Method 2: Managed Cloud Platforms](#method-2-managed-cloud-platforms-render--vercel--railway)** *(Best for serverless/managed deployments with free tiers)*
3. **[Method 3: Native Ubuntu / Debian Linux Server](#method-3-native-ubuntu--debian-linux-server)** *(Traditional Nginx + Systemd + Uvicorn)*

---

## Pre-Deployment Checklist

Before deploying, ensure you configure secure production credentials:
- **`SECRET_KEY`**: Generate a strong random cryptographic key for JWT signing:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- **`DATABASE_URL`**: Production PostgreSQL connection string:
  ```
  postgresql+psycopg2://<user>:<password>@<host>:<port>/<dbname>
  ```
- **`CORS_ORIGINS`**: Set your actual production frontend domain (e.g. `https://erp.yourdomain.com`).

---

## Method 1: Docker Compose (Recommended for VPS / Cloud VMs)

This setup launches **PostgreSQL 16**, the **FastAPI Backend**, and the **Nginx-powered Frontend** with a single command.

### 1. Prerequisites
Install Docker and Docker Compose on your server:
```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
SECRET_KEY=your_generated_32_byte_secret_key
POSTGRES_DB=erp_db
POSTGRES_USER=erp_user
POSTGRES_PASSWORD=your_secure_db_password
CORS_ORIGINS=http://your-server-ip:3000,https://erp.yourdomain.com
```

### 3. Build and Run
From the project root:
```bash
docker compose up -d --build
```

### 4. Verify Containers
```bash
docker compose ps
```
Your services will be running on:
* **Frontend App**: `http://your-server-ip:3000`
* **Backend API Docs**: `http://your-server-ip:8000/docs`

---

## Method 2: Managed Cloud Platforms (Render + Vercel / Railway)

### A. Deploy Backend to Render (or Railway / Fly.io)
1. Push your repository to **GitHub** or **GitLab**.
2. Log in to [Render.com](https://render.com).
3. **Create PostgreSQL Database**:
   * Click **New +** → **PostgreSQL**.
   * Copy the **Internal Database URL** (or External if hosting across providers).
4. **Create Web Service for Backend**:
   * Click **New +** → **Web Service** → Connect your repo.
   * **Root Directory**: `backend`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Environment Variables**:
     * `DATABASE_URL`: Your PostgreSQL connection string (use `postgresql+psycopg2://...`)
     * `SECRET_KEY`: Your generated random secret key
     * `CORS_ORIGINS`: `https://your-frontend.vercel.app`

### B. Deploy Frontend to Vercel (or Netlify / Cloudflare Pages)
1. Log in to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. In Project Settings:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. **Environment Variables**:
   * `VITE_API_BASE`: `https://your-backend-service.onrender.com/api`
5. Click **Deploy**.

---

## Method 3: Native Ubuntu / Debian Linux Server

### 1. Set Up PostgreSQL
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib python3-venv python3-pip nginx
sudo -u postgres psql -c "CREATE DATABASE erp_db;"
sudo -u postgres psql -c "CREATE USER erp_user WITH PASSWORD 'StrongPassword123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE erp_db TO erp_user;"
```

### 2. Set Up Backend Virtual Environment
```bash
cd /var/www/ERP_Management_System/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Create Systemd Service for FastAPI
Create `/etc/systemd/system/erp-backend.service`:
```ini
[Unit]
Description=Smart ERP FastAPI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ERP_Management_System/backend
Environment="PATH=/var/www/ERP_Management_System/backend/venv/bin"
Environment="DATABASE_URL=postgresql+psycopg2://erp_user:StrongPassword123@localhost:5432/erp_db"
Environment="SECRET_KEY=your_generated_secret_key"
Environment="CORS_ORIGINS=https://erp.yourdomain.com"
ExecStart=/var/www/ERP_Management_System/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now erp-backend
```

### 4. Build and Host Frontend with Nginx
```bash
cd /var/www/ERP_Management_System/frontend
npm ci
VITE_API_BASE=https://erp.yourdomain.com/api npm run build
```

Configure Nginx `/etc/nginx/sites-available/erp`:
```nginx
server {
    listen 80;
    server_name erp.yourdomain.com;

    # Frontend Static SPA
    location / {
        root /var/www/ERP_Management_System/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable site and install free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/erp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d erp.yourdomain.com
```
