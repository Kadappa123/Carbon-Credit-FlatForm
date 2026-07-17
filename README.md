# 🌿 CarbonChain Platform
### AI-Based Carbon Credit Trading System
**Stack:** Python + Django · React.js · Ganache (Ethereum) · PostgreSQL · Celery + Redis

---

## 📁 Project Structure

```
carbon-credit-platform/
├── backend/                    ← Django REST API
│   ├── carbon_platform/        ← Django project settings
│   ├── apps/
│   │   ├── authentication/     ← JWT login, register, RBAC
│   │   ├── companies/          ← Company profiles, emission submissions
│   │   ├── ai_engine/          ← CO₂ verification + fraud detection
│   │   ├── government/         ← KYB review, approval workflow
│   │   ├── trading/            ← Marketplace, buy/sell, retire credits
│   │   └── blockchain_integration/ ← Web3.py + Ganache service
│   ├── requirements.txt
│   └── .env
├── blockchain/                 ← Solidity smart contracts
│   ├── contracts/
│   │   └── CarbonCredit.sol    ← Main ERC-like contract
│   ├── migrations/
│   │   └── 2_deploy_carbon_credit.js
│   └── truffle-config.js
├── frontend/                   ← React.js application
│   └── src/
│       ├── pages/
│       │   ├── company/        ← Dashboard, Emissions, Marketplace, etc.
│       │   └── government/     ← Gov Dashboard, Reviews, Companies, Fraud
│       ├── services/api.js     ← All API calls
│       └── store/authStore.js  ← Zustand auth state
└── docker-compose.yml
```

---

## ✅ Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 14+ | https://postgresql.org |
| Redis | 7+ | https://redis.io |
| Ganache (GUI) | Latest | https://trufflesuite.com/ganache |
| Truffle | 5.x | `npm install -g truffle` |
| Git | Any | https://git-scm.com |

---

## 🚀 INSTALLATION STEPS

### STEP 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd carbon-credit-platform
```

---

### STEP 2 — Start Ganache (Blockchain)

1. Open **Ganache GUI** application
2. Click **"Quickstart"** (creates a local blockchain on port 7545)
3. You will see **10 test accounts** with fake ETH
4. Copy the **first account's address** — you'll need it for `.env`
5. Click the **key icon** next to the first account to see its **private key**
6. Keep Ganache running in the background throughout development

> **Important:** Ganache must be running BEFORE you deploy contracts or start the backend.

---

### STEP 3 — Deploy Smart Contract

```bash
# Go to blockchain folder
cd blockchain

# Install Truffle dependencies
npm install

# Compile the Solidity contract
npm run compile
# Expected output: "Compiling your contracts... ✔ Fetching solc..."

# Deploy to Ganache
npm run migrate
# Expected output:
#   Deploying 'CarbonCredit'...
#   ✅ CarbonCredit deployed at: 0xABCD...
#   📋 Add these to your backend/.env:
#      CONTRACT_ADDRESS=0xABCD...
#      DEPLOYER_ADDRESS=0x1234...
```

4. **Copy the printed CONTRACT_ADDRESS and DEPLOYER_ADDRESS** — you need them in Step 5.

---

### STEP 4 — Setup PostgreSQL Database

```bash
# Open PostgreSQL shell (adjust based on your OS)
psql -U postgres

# Inside psql shell:
CREATE DATABASE carbon_credit_db;
\q
```

> On Windows: Use pgAdmin GUI to create database named `carbon_credit_db`

---

### STEP 5 — Configure Backend Environment

```bash
cd backend
```

Edit the `.env` file (already created for you):

```bash
# Open .env and fill in:
nano .env       # Linux/Mac
notepad .env    # Windows
```

Fill in these values:

```env
SECRET_KEY=any-long-random-string-here-eg-abc123xyz789
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=carbon_credit_db
DB_USER=postgres
DB_PASSWORD=postgres          ← your PostgreSQL password
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://localhost:6379/0

GANACHE_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0x...        ← from Step 3 output
DEPLOYER_ADDRESS=0x...        ← from Step 3 output (first Ganache account)
DEPLOYER_PRIVATE_KEY=0x...    ← private key of first Ganache account
```

---

### STEP 6 — Install Backend Dependencies

```bash
# Still inside /backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Install all Python packages
pip install -r requirements.txt
```

---

### STEP 7 — Run Database Migrations

```bash
# Make sure venv is activated and you're in /backend

# Create all database tables
python manage.py makemigrations authentication
python manage.py makemigrations companies
python manage.py makemigrations credits
python manage.py makemigrations trading
python manage.py makemigrations ai_engine
python manage.py makemigrations government
python manage.py makemigrations blockchain_integration
python manage.py migrate

# Create a superuser (government admin account)
python manage.py createsuperuser
# Enter:
#   Email: gov@platform.com
#   Full name: Government Admin
#   Password: admin1234
```

---

### STEP 8 — Create __init__.py files for apps

```bash
# Run this from /backend directory
touch apps/__init__.py
touch apps/authentication/__init__.py
touch apps/companies/__init__.py
touch apps/credits/__init__.py
touch apps/trading/__init__.py
touch apps/ai_engine/__init__.py
touch apps/government/__init__.py
touch apps/blockchain_integration/__init__.py

# Windows equivalent:
# type nul > apps\__init__.py  (repeat for each)
```

---

### STEP 9 — Start Redis (Background Worker)

**Linux/Mac:**
```bash
# Open a NEW terminal window
redis-server
```

**Windows:**
```bash
# Download Redis for Windows from: https://github.com/tporadowski/redis/releases
# Or use WSL2 (recommended)
redis-server
```

---

### STEP 10 — Start Celery Worker (AI Task Queue)

```bash
# Open a NEW terminal window
cd carbon-credit-platform/backend
source venv/bin/activate    # or venv\Scripts\activate on Windows
celery -A carbon_platform worker --loglevel=info
```

You should see:
```
[tasks]
  . apps.ai_engine.tasks.verify_emission_submission
  . apps.ai_engine.tasks.reset_daily_trading_limits
  . apps.ai_engine.tasks.recalculate_esg_scores
```

---

### STEP 11 — Start Django Backend Server

```bash
# Open a NEW terminal window
cd carbon-credit-platform/backend
source venv/bin/activate
python manage.py runserver
```

Expected output:
```
Starting development server at http://127.0.0.1:8000/
```

Test it: Open http://localhost:8000/swagger/ — you should see the API docs.

---

### STEP 12 — Install & Start Frontend

```bash
# Open a NEW terminal window
cd carbon-credit-platform/frontend

# Install Node.js packages
npm install

# Start the React development server
npm start
```

The browser will open at **http://localhost:3000**

---

## 🎯 Running Summary

You need **5 things running simultaneously:**

| # | What | Command | Port |
|---|------|---------|------|
| 1 | Ganache GUI | Open Ganache app | 7545 |
| 2 | Redis | `redis-server` | 6379 |
| 3 | Celery Worker | `celery -A carbon_platform worker` | — |
| 4 | Django Backend | `python manage.py runserver` | 8000 |
| 5 | React Frontend | `npm start` | 3000 |

---

## 👤 Test Accounts

### Government Account
- **URL:** http://localhost:3000/login
- **Email:** gov@platform.com (the superuser you created)
- **Password:** admin1234

### Company Account (create via registration)
1. Go to http://localhost:3000/register
2. Fill in details and register
3. Then go to http://localhost:3000/company/profile
4. Register your company details
5. Government must approve your KYB before you can trade

---

## 🔄 Complete Workflow Test

1. **Login as company** → Register company profile
2. **Login as government** → Approve the company KYB, set emission limit (e.g. 1000 tons)
3. **Login as company** → Submit emission report (e.g. 700 tons CO₂)
4. **Wait ~10 seconds** → Celery runs AI verification automatically
5. **Login as government** → Go to Review Submissions → Approve submission, assign score (e.g. 85) and credits (e.g. 30)
6. **Login as company** → Create a credit listing in the Marketplace
7. **Register a second company** → Login, get approved by government with lower emission limit (e.g. 500 tons), submit high emissions report (e.g. 600 tons), get low score
8. **Second company** → Buy credits from first company on Marketplace
9. **Either company** → Retire credits to generate offset certificate

---

## 🌐 API Documentation

- **Swagger UI:** http://localhost:8000/swagger/
- **ReDoc:** http://localhost:8000/redoc/
- **Django Admin:** http://localhost:8000/admin/ (login with superuser)

---

## 📡 Key API Endpoints

```
POST   /api/auth/login/                        Login
POST   /api/auth/register/                     Register user
GET    /api/companies/profile/                 Get company profile
POST   /api/companies/register/                Register company
POST   /api/companies/emissions/               Submit emission report
GET    /api/companies/emissions/dashboard/     Company dashboard data
GET    /api/trading/marketplace/               Browse listings
POST   /api/trading/purchase/                  Buy credits
POST   /api/trading/listings/create/           Create listing
POST   /api/trading/retire/                    Retire credits
GET    /api/government/dashboard/              Gov overview
GET    /api/government/submissions/            Pending submissions
POST   /api/government/submissions/{id}/review/ Approve/reject
POST   /api/government/companies/{id}/kyb/     KYB review
GET    /api/blockchain/status/                 Blockchain connection
POST   /api/blockchain/wallet/create/          Create wallet
```

---

## 🐳 Docker Setup (Alternative)

If you prefer Docker instead of manual setup:

```bash
# From project root
docker-compose up --build
```

This starts PostgreSQL, Redis, Django, Celery, and React together.
You still need to deploy the smart contract manually (Step 3).

---

## ❗ Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` again |
| `psycopg2 error` | Install: `pip install psycopg2-binary` |
| `connection refused 7545` | Open Ganache GUI and click Quickstart |
| `redis connection error` | Start `redis-server` in terminal |
| Celery not processing tasks | Check Celery worker terminal for errors |
| `CORS error` in browser | Check `CORS_ALLOWED_ORIGINS` in `.env` |
| Contract not found | Re-run `npm run migrate` in `/blockchain` |
| Empty marketplace | Company needs score ≥ 80 and active listing |

---

## 🔐 Security Notes (Production)

- Change `SECRET_KEY` to a strong random value
- Set `DEBUG=False`
- Use HTTPS everywhere
- Store `DEPLOYER_PRIVATE_KEY` in a secrets manager (not `.env`)
- Use a production WSGI server (Gunicorn + Nginx)
- Enable JWT token blacklisting

---

## 📄 License

Government-regulated platform — for educational and development use.
// AI Review Test
