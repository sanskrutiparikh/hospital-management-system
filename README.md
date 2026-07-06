<div align="center">

# 🏥 MediPulse — Hospital Management System

**A full-stack, microservices-based Hospital Management System with AI-powered features**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://docs.docker.com/compose/)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Microservices](#-microservices)
- [AI Features](#-ai-features)
- [Installation](#-installation)
- [Docker Deployment](#-docker-deployment)
- [Screenshots](#-screenshots)
- [API Endpoints](#-api-endpoints)
- [Folder Structure](#-folder-structure)
- [Future Enhancements](#-future-enhancements)
- [Author](#-author)
- [License](#-license)

---

## 🔍 Project Overview

**MediPulse** is an enterprise-grade Hospital Management System built on a microservices architecture. It streamlines healthcare operations — from patient registration and doctor management to appointment scheduling, billing, and AI-assisted diagnostics.

The system features **role-based access control** (Admin, Doctor, Patient), a modern **React** dashboard, and an **AI service** powered by **Google Gemini** and **LangChain** for intelligent medical assistance.

---

## ✨ Features

### Core Functionality
- 🔐 **Authentication & Authorization** — JWT-based login/signup with role-based access (Admin, Doctor, Patient)
- 👨‍⚕️ **Doctor Management** — Add, update, view, and manage doctor profiles and specializations
- 🧑‍🤝‍🧑 **Patient Management** — Patient registration, profile management, and doctor assignment
- 📅 **Appointment Scheduling** — Book, update, cancel, and track appointments with status management
- 💰 **Billing System** — Generate, view, and manage patient bills with payment status tracking

### AI-Powered Features
- 🤖 **Medical AI Chatbot** — Context-aware medical assistant powered by Google Gemini
- 📊 **AI Report Analysis** — Upload and analyze medical reports (PDF) with AI-generated insights
- 🧠 **AI SQL Insights** — Natural language to SQL queries for data analytics
- 📄 **Document Intelligence** — RAG-based document processing with ChromaDB vector storage

### System Features
- 🌐 **Service Discovery** — Netflix Eureka for automatic service registration
- 🚪 **API Gateway** — Spring Cloud Gateway for unified API routing
- 🐳 **Docker Support** — Full containerization with Docker Compose
- 📱 **Responsive UI** — Modern React dashboard with Tailwind CSS

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7, Recharts, Axios |
| **Backend** | Java 21, Spring Boot 3, Spring Security, Spring Data JPA |
| **AI Service** | Python 3.12, FastAPI, LangChain, Google Gemini, ChromaDB |
| **Database** | MySQL 8.0 |
| **Service Discovery** | Netflix Eureka |
| **API Gateway** | Spring Cloud Gateway |
| **Authentication** | JWT (JSON Web Tokens) |
| **Containerization** | Docker, Docker Compose |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HMS Frontend                             │
│                     (React + Vite + Tailwind)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API Gateway (:9090)                         │
│                   (Spring Cloud Gateway)                         │
└────┬──────┬──────┬──────┬──────┬──────┬─────────────────────────┘
     │      │      │      │      │      │
     ▼      ▼      ▼      ▼      ▼      ▼
┌────────┐┌────┐┌──────┐┌──────┐┌──────┐┌────────┐
│  Auth  ││Pat.││ Doc. ││Appt. ││Bill. ││   AI   │
│ :8081  ││8080││ 8082 ││ 8083 ││ 8084 ││ :8000  │
└───┬────┘└─┬──┘└──┬───┘└──┬───┘└──┬───┘└───┬────┘
    │       │      │       │       │        │
    └───────┴──────┴───┬───┴───────┘        │
                       ▼                    │
              ┌─────────────────┐           │
              │   MySQL 8.0    │           │
              │   (:3306)      │◄──────────┘
              └─────────────────┘
                       ▲
              ┌────────┴────────┐
              │  Eureka Server  │
              │    (:8761)      │
              └─────────────────┘
```

---

## 🔧 Microservices

| Service | Port | Description |
|---------|------|-------------|
| **Eureka Server** | `8761` | Service discovery and registration |
| **API Gateway** | `9090` | Unified API routing and load balancing |
| **Auth Service** | `8081` | JWT authentication, user registration, role management |
| **Patient Service** | `8080` | Patient CRUD, doctor assignment |
| **Doctor Service** | `8082` | Doctor profiles, specialization management |
| **Appointment Service** | `8083` | Appointment scheduling and status tracking |
| **Billing Service** | `8084` | Bill generation and payment management |
| **AI Service** | `8000` | Medical chatbot, report analysis, SQL insights (Python/FastAPI) |
| **HMS Frontend** | `80` | React SPA dashboard |

---

## 🤖 AI Features

### Medical AI Chatbot
Conversational medical assistant powered by **Google Gemini** with conversation history, context awareness, and role-based access.

### Medical Report Analysis
Upload medical reports (PDF) for AI-powered analysis:
- **Document Classification** — Automatically detects report type (Blood Test, X-Ray, etc.)
- **Key Findings Extraction** — Identifies critical values and abnormalities
- **Health Recommendations** — Generates actionable health suggestions
- **RAG Pipeline** — Uses ChromaDB for vector-based document retrieval

### AI SQL Insights
Natural language queries translated to SQL for real-time hospital analytics. Ask questions like:
- *"How many patients were admitted this month?"*
- *"Show revenue by department"*
- *"List all appointments for today"*

---

## 🚀 Installation

### Prerequisites

- **Java 21** (JDK)
- **Maven 3.9+**
- **Node.js 18+** & **npm**
- **Python 3.12+**
- **MySQL 8.0**
- **Docker & Docker Compose** (optional, for containerized deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/sanskrutiparikh/hospital-management-system.git
cd hospital-management-system
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
DB_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Locally (Windows)

Start all services using the PowerShell script:

```powershell
.\run-all.ps1
```

Stop all services:

```powershell
.\stop-all.ps1
```

### 4. Run the Frontend

```bash
cd HMS_frontend
npm install
npm run dev
```

### 5. Run the AI Service

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🐳 Docker Deployment

Start the entire stack with a single command:

```bash
docker-compose up --build
```

This launches all services:

| Service | URL |
|---------|-----|
| Frontend | [http://localhost](http://localhost) |
| API Gateway | [http://localhost:9090](http://localhost:9090) |
| Eureka Dashboard | [http://localhost:8761](http://localhost:8761) |
| AI Service | [http://localhost:8000/docs](http://localhost:8000/docs) |

To stop:

```bash
docker-compose down
```

---

## 📸 Screenshots

> Screenshots will be added here. To contribute screenshots, place them in the `docs/` directory.

<!--
![Login Page](docs/screenshots/login.png)
![Admin Dashboard](docs/screenshots/dashboard.png)
![AI Chatbot](docs/screenshots/ai-chatbot.png)
![Report Analysis](docs/screenshots/report-analysis.png)
-->

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |

### Patients (`/api/patients`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients` | Get all patients |
| `GET` | `/api/patients/{id}` | Get patient by ID |
| `POST` | `/api/patients` | Create a new patient |
| `PUT` | `/api/patients/{id}` | Update patient |
| `DELETE` | `/api/patients/{id}` | Delete patient |

### Doctors (`/api/doctors`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/doctors` | Get all doctors |
| `GET` | `/api/doctors/{id}` | Get doctor by ID |
| `POST` | `/api/doctors` | Add a new doctor |
| `PUT` | `/api/doctors/{id}` | Update doctor |
| `DELETE` | `/api/doctors/{id}` | Delete doctor |

### Appointments (`/api/appointments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/appointments` | Get all appointments |
| `POST` | `/api/appointments` | Book an appointment |
| `PUT` | `/api/appointments/{id}` | Update appointment |
| `DELETE` | `/api/appointments/{id}` | Cancel appointment |

### Billing (`/api/bills`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bills` | Get all bills |
| `POST` | `/api/bills` | Create a bill |
| `PUT` | `/api/bills/{id}` | Update bill |

### AI Service (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | Medical AI chatbot |
| `POST` | `/api/ai/analyze-report` | Analyze medical report (PDF upload) |
| `POST` | `/api/ai/sql-insights` | Natural language to SQL analytics |
| `GET` | `/api/ai/health` | AI service health check |

---

## 📁 Folder Structure

```
hospital-management-system/
│
├── HMS_frontend/              # React frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React context providers
│   │   ├── pages/             # Page components (Login, Dashboard, AI, etc.)
│   │   ├── services/          # API service layer (Axios)
│   │   └── styles/            # CSS stylesheets
│   ├── Dockerfile
│   └── package.json
│
├── eureka-server/             # Netflix Eureka service discovery
├── api-gateway/               # Spring Cloud API Gateway
├── auth-service/              # Authentication & authorization (JWT)
├── patient-service/           # Patient management microservice
├── doctor-service/            # Doctor management microservice
├── appointment-service/       # Appointment scheduling microservice
├── billing-service/           # Billing & payment microservice
│
├── ai-service/                # Python AI microservice (FastAPI)
│   ├── main.py                # AI endpoints (chatbot, report analysis, SQL)
│   ├── requirements.txt       # Python dependencies
│   ├── sample_report.pdf      # Sample medical report for testing
│   ├── test_classification.py # Classification tests
│   ├── test_pipeline.py       # Pipeline tests
│   └── Dockerfile
│
├── database/
│   └── migration.sql          # Database schema and seed data
│
├── docs/                      # Documentation and screenshots
│
├── docker-compose.yml         # Full-stack Docker orchestration
├── .env.example               # Environment variable template
├── run-all.ps1                # Start all services (Windows)
├── stop-all.ps1               # Stop all services (Windows)
├── LICENSE                    # MIT License
└── README.md                  # This file
```

---

## 🔮 Future Enhancements

- 📊 **Advanced Analytics Dashboard** — Real-time hospital statistics and visualizations
- 📧 **Email & SMS Notifications** — Appointment reminders and alerts
- 💳 **Payment Gateway Integration** — Online payment processing
- 📋 **Electronic Health Records (EHR)** — Complete patient medical history
- 🧪 **Lab Management Module** — Lab test ordering and results tracking
- 📱 **Mobile Application** — React Native companion app
- 🔄 **CI/CD Pipeline** — Automated testing and deployment with GitHub Actions
- 📈 **Performance Monitoring** — Spring Boot Actuator + Prometheus + Grafana

---

## 👤 Author

**Sanskruti Parikh**

- GitHub: [@sanskrutiparikh](https://github.com/sanskrutiparikh)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

</div>
