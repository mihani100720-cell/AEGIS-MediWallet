# AEGIS / MediWallet — Secure Patient-Owned Medical Vault

> **AEGIS / MediWallet** is a decentralized, patient-centric healthcare platform featuring AES-GCM encrypted medical records, multilingual Indian language AI assistants, offline emergency QR tokens, and verified clinical sharing workflows.

---

## 🏛️ Project Architecture

```
AEGIS/
├── apps/
│   └── web/                               # Next.js 16 (App Router) + React 19 Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── admin/                 # Healthcare Provider / Admin Portal
│       │   │   ├── dashboard/             # Patient Health Dashboard & Timeline
│       │   │   ├── doctor/                # Doctor / Clinical Verification View
│       │   │   ├── vault/                 # Encrypted Medical Vault & Uploads
│       │   │   ├── login/ & signup/       # Authentication Pages
│       │   │   └── components/            # Reusable UI & Vault Components
│       │   └── lib/                       # API Client & i18n Translations
│       └── package.json
│
├── services/
│   └── api/                               # FastAPI Python Backend
│       ├── app/
│       │   ├── api/v1/endpoints/          # REST Endpoints (Auth, Vault, OCR, AI, QR)
│       │   ├── core/                      # Config, Security, JWT & AES-GCM Cryptography
│       │   ├── models/                    # SQLite Database Models & Clinical Seed Data
│       │   ├── schemas/                   # Pydantic Request/Response Models
│       │   └── services/                  # ML OCR, Vault Encryption & AI Engines
│       ├── data/                          # SQLite DB & Encrypted Record Vault
│       ├── tests/                         # Security & OCR Test Suites
│       └── requirements.txt
│
├── README_OCR.md                          # Clinical OCR Setup & Indian ML Model Docs
└── MediWallet_AEGIS_MedicalVault.zip      # Full Project Source Code Archive
```

---

## 🚀 Quick Start Guide

### 1. Backend (FastAPI Service)

#### Prerequisites
- Python 3.10+

#### Installation & Startup
```bash
# Navigate to the API service directory
cd services/api

# Create & activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 2. Frontend (Next.js Web Portal)

#### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

#### Installation & Startup
```bash
# Navigate to the frontend directory
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

- **Web Application URL:** [http://localhost:3000](http://localhost:3000)

---

## 🔑 Pre-Configured Test Accounts

The SQLite database seeds automatically on first launch with sample patient and clinical accounts:

| Role | Email / ID | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@example.com` | `password123` | Patient Vault, Emergency QR, Multilingual AI, Timeline |
| **Doctor** | `doctor@example.com` | `password123` | Doctor Clinical Portal, Verified Record Access |
| **Admin** | `admin@example.com` | `password123` | Provider Admin Panel, Consent & Audit Logs |

---

## 🛡️ Core Security Features

1. **Client & Server-Side AES-256-GCM Encryption:** Medical documents and prescription images stored with tamper-resistant authentication tags.
2. **Zero-Knowledge Emergency Access:** Offline emergency QR tokens encode vital triage data (Blood type, allergies, emergency contacts) with verification signatures.
3. **Audit Trails & Dynamic Consent:** Every access request generates an immutable audit record and requires explicit patient consent duration.
4. **Multilingual Clinical AI:** Intelligent prescription parsing supporting English, Hindi, Bengali, Tamil, Telugu, and other Indian regional languages.
