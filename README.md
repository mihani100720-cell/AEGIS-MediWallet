 # 🛡️ AEGIS MediWallet

### Your Health. Your Records. Your Control.

AEGIS MediWallet is a digital healthcare management platform designed to bring medical records, prescriptions, appointments, and healthcare-related services together in one place. Built with Next.js and FastAPI, the project explores secure, organized, and accessible digital healthcare management.

## 🌐 Live Demo

- **Frontend:** https://aegis-mediwallet-web-copy-name.onrender.com/
- **Backend API:** https://aegis-mediwallet.onrender.com/
- **API Documentation (Swagger):** https://aegis-mediwallet.onrender.com/docs
- **GitHub Repository:** https://github.com/mihani100720-cell/AEGIS-MediWallet

## 📌 Overview

Healthcare information is often scattered across prescriptions, medical documents, appointment records, and different healthcare services. AEGIS MediWallet aims to provide a centralized digital platform for organizing healthcare information and accessing related services.

The application combines a modern web interface with a Python-based backend to support healthcare management workflows, authentication, medical records, prescriptions, appointments, consent, auditing, and AI-assisted services.

### 🎯 Project Objectives

- Centralize healthcare information in one digital platform.
- Simplify medical-record and prescription management.
- Support appointment and doctor-related workflows.
- Explore OCR-based medical document processing.
- Integrate AI-assisted healthcare services.
- Improve the organization and accessibility of healthcare information.

## ✨ Key Features

### 🏥 Medical Records Management
- Medical-record-related API workflows.
- Support for organizing healthcare information.
- Record and folder management functionality.

### 💊 Prescription and Medicine Management
- Prescription-related operations.
- Medicine management workflows.
- Support for digitized healthcare information.

### 📄 OCR and Document Processing
- OCR-related components for text extraction from documents.
- Medical-document processing workflows.
- A foundation for reducing manual data entry.

### 📅 Appointments and Doctor Management
- Appointment-related API endpoints.
- Doctor-related information workflows.
- Healthcare coordination functionality.

### 🔐 Authentication and Vault Services
- Authentication-related API functionality.
- JWT-related dependencies.
- Vault and record-handling services.

### 🤝 Consent and Audit
- Consent-related workflows.
- Audit-related functionality.
- A foundation for tracking access and application activities.

### 🚨 Emergency and Family Features
- Emergency-related workflows.
- Family-related functionality.
- Additional healthcare management capabilities.

### 🧠 AI-Assisted Healthcare
- AI chat-related API functionality.
- Diet-related services.
- AI integration components for supported application workflows.

*Note: Feature availability depends on the current implementation and configuration. Not every module has been independently verified as fully functional.*

## 🛠️ Technology Stack

### Frontend
- Next.js
- React
- JavaScript / TypeScript
- Node.js
- npm

### Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- PyJWT
- argon2-cffi

### AI and Document Processing
- AI service integrations
- OCR-related components
- Document-processing workflows

### Development and Deployment
- Git
- GitHub
- Render
- Environment variables

## 🏗️ System Architecture

```text
                    USER
                      |
                      v
           +----------------------+
           |   Next.js Frontend   |
           |   React Interface    |
           +----------------------+
                      |
                      | HTTP Requests
                      v
           +----------------------+
           |    FastAPI Backend   |
           |    Uvicorn Server    |
           +----------------------+
                      |
         +------------+------------+
         |            |            |
         v            v            v
   Medical Records  Authentication  AI / OCR
   Prescriptions    Consent / Audit Services
         |            |            |
         +------------+------------+
                      |
                      v
           +----------------------+
           |  SQLAlchemy / ORM    |
           +----------------------+
                      |
                      v
                  Database
```

## 📂 Project Structure

```text
AEGIS-MediWallet/
│
├── apps/
│   └── web/
│       └── ...                 # Next.js frontend
│
├── services/
│   └── api/
│       ├── app/
│       │   ├── main.py         # FastAPI entry point
│       │   ├── api/
│       │   │   └── v1/
│       │   │       └── endpoints/
│       │   │           ├── ai_chat.py
│       │   │           ├── appointments.py
│       │   │           ├── audit.py
│       │   │           ├── auth.py
│       │   │           ├── consent.py
│       │   │           ├── diet.py
│       │   │           ├── doctors.py
│       │   │           ├── emergency.py
│       │   │           ├── family.py
│       │   │           ├── folders.py
│       │   │           ├── medicines.py
│       │   │           ├── prescriptions.py
│       │   │           └── records.py
│       │   ├── core/
│       │   ├── models/
│       │   ├── services/
│       │   └── ...
│       └── requirements.txt
│
├── models/
├── README.md
├── README_OCR.md
└── .env.example
```

*This is a simplified overview; the repository may contain additional files and directories.*

## ⚙️ Getting Started

### Prerequisites

Install Python, Node.js, npm, and Git before running the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/mihani100720-cell/AEGIS-MediWallet.git
cd AEGIS-MediWallet
```

### 2. Set Up the Backend

```bash
cd services/api
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Configure the required environment variables according to the application's configuration. Do not commit secrets or `.env` files to GitHub.

Start the backend:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend URLs:

- API: http://127.0.0.1:8000/
- Swagger documentation: http://127.0.0.1:8000/docs
- Health endpoint: http://127.0.0.1:8000/api/v1/health

If port 8000 is occupied, use another available port.

### 3. Set Up the Frontend

Open a second terminal from the repository root:

```bash
cd apps/web
npm install
```

Configure the frontend's backend URL using the environment-variable name expected by the application.

For local development, the backend address is:

```text
http://127.0.0.1:8000
```

Start the frontend development server:

```bash
npm run dev
```

Open the local URL printed in the terminal, commonly:

http://localhost:3000

### 4. Build the Frontend

```bash
npm run build
```

The build command should complete successfully before deployment.

## 🔌 API Documentation

Explore the deployed API through FastAPI's interactive Swagger interface.

- **Live API:** https://aegis-mediwallet.onrender.com/
- **Swagger UI:** https://aegis-mediwallet.onrender.com/docs
- **Health Check:** https://aegis-mediwallet.onrender.com/api/v1/health

### API Modules

| Module | Purpose |
|---|---|
| Authentication | Authentication workflows |
| Records | Medical-record operations |
| Prescriptions | Prescription workflows |
| Appointments | Appointment operations |
| Doctors | Doctor-related functionality |
| Medicines | Medicine management |
| Consent | Consent workflows |
| Audit | Audit-related operations |
| Emergency | Emergency-related functionality |
| Family | Family-related workflows |
| Folders | Folder management |
| Diet | Diet-related functionality |
| AI Chat | AI-assisted interactions |

The Swagger documentation shows the routes currently exposed by the deployed backend.

## ☁️ Deployment on Render

The frontend and backend are deployed as separate Render services.

### Backend Configuration

| Setting | Value |
|---|---|
| Runtime | Python 3 |
| Root Directory | `services/api` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Hosting | Render |

### Frontend Configuration

| Setting | Value |
|---|---|
| Runtime | Node |
| Root Directory | `apps/web` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start` |
| Hosting | Render |

The frontend must be configured to communicate with the deployed backend. Configure the required environment variables and allow the correct frontend origin in the backend's CORS settings.

## 🔒 Security and Privacy

Healthcare information is sensitive. A successful deployment does not automatically mean that an application is ready for real patient data.

Before using real medical information, verify:

- Strong, unique server secrets stored in environment variables.
- Secure password hashing.
- Authentication and authorization for sensitive operations.
- Properly restricted CORS origins.
- Appropriate encryption and key management.
- Persistent database and document storage.
- Safe handling of uploaded files.
- Audit logging and error handling.
- Backup and recovery procedures.
- Applicable healthcare privacy and data-protection requirements.

**Important:** Use fictional test data during development. Do not store real patient information in the deployed demo until security and data persistence have been properly verified.

A local SQLite database on a hosted service may not provide reliable persistence across restarts or redeployments unless appropriate persistent storage is configured.

## 🧪 Testing

The backend includes testing dependencies such as `pytest` and `httpx`.

Run backend tests from the backend directory:

```bash
python -m pytest
```

Recommended testing areas include:

- Backend startup and health checks.
- Frontend-to-backend communication.
- Authentication and authorization.
- Medical-record and prescription workflows.
- OCR and AI integrations.
- Database persistence.
- Error handling and external-service failures.

## 🚀 Future Improvements

Potential areas for future development include:

- More comprehensive automated testing.
- Stronger role-based access controls.
- Improved medical-document extraction and validation.
- Enhanced consent and audit workflows.
- Reliable database persistence and backups.
- Improved accessibility and multilingual support.
- Better monitoring and error reporting.
- Automated deployment checks.

These are possible enhancements and are not claims that every feature is currently implemented.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Run the relevant tests.
5. Submit a pull request describing your contribution.

Please do not commit secrets, private medical information, or sensitive user data.

## 📄 License

No open-source license has been specified in this README. Add a `LICENSE` file if you intend to distribute the project under a particular open-source license.

## 👩‍💻 Project Information

- **Project Name:** AEGIS MediWallet
- **Domain:** Healthcare Technology / Digital Health
- **Frontend:** Next.js and React
- **Backend:** Python and FastAPI
- **Database:** SQLite default configuration; verify deployed persistence
- **Deployment:** Render
- **Repository:** https://github.com/mihani100720-cell/AEGIS-MediWallet

---

### AEGIS MediWallet

*Making healthcare information more organized, accessible, and easier to manage.*
