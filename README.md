<div align="center">

# 🛡️ SentinelX

### AI-Based Phishing Detection & Threat Intelligence Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

**A production-level cybersecurity platform for detecting phishing URLs, analyzing suspicious emails, and aggregating threat intelligence — powered by Machine Learning and real-time data from VirusTotal, AbuseIPDB, and WHOIS.**

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Features

### 🔗 URL Phishing Detection
- AI-powered analysis using Random Forest & Logistic Regression
- 20+ URL feature extraction (length, entropy, typosquatting, suspicious TLDs, etc.)
- Real-time phishing probability scoring (0-100)
- Human-readable AI explanations

### 📧 Email Phishing Analyzer
- NLP-based email content analysis
- Detects urgency language, credential theft attempts, social engineering
- Suspicious keyword highlighting
- Comprehensive risk report generation

### 🌐 Threat Intelligence
- **VirusTotal** integration for URL/IP/domain scanning
- **AbuseIPDB** integration for IP reputation checks
- **WHOIS** lookup for domain registration data
- **IP Geolocation** for threat source mapping
- Aggregated threat scores with cached results

### 📊 SOC Dashboard
- Real-time threat monitoring widgets
- Interactive threat trend charts
- Animated world map visualization
- Live threat feed with severity indicators
- Recent scans table with risk badges

### 👤 Authentication & Authorization
- JWT-based authentication
- Role-based access control (User / Admin)
- Secure password hashing with bcrypt
- Session management & token expiration

### 🔧 Admin Panel
- User management (view, ban/unban)
- Platform-wide scan analytics
- API usage monitoring
- Audit log tracking
- Report export capabilities

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                    │
│         Tailwind CSS • Framer Motion • Recharts              │
│                    Port: 5173                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend (Node.js + Express)                  │
│        JWT Auth • Helmet • Rate Limiting • CORS              │
│                    Port: 5000                                 │
├────────────┬────────────┬────────────┬───────────────────────┤
│  MongoDB   │ ML Service │ VirusTotal │ AbuseIPDB / WHOIS     │
│  (Atlas)   │  (FastAPI) │   API v3   │ / IP Geolocation      │
│            │  Port:8000 │            │                        │
└────────────┴────────────┴────────────┴───────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v20+ ([download](https://nodejs.org))
- **Python** 3.9+ ([download](https://python.org))
- **MongoDB Atlas** account ([free tier](https://www.mongodb.com/atlas))
- **Git** ([download](https://git-scm.com))

### 1. Clone & Configure

```bash
git clone https://github.com/yourusername/sentinelx.git
cd sentinelx

# Copy environment template
cp .env.example .env
# Edit .env with your MongoDB URI and API keys
```

### 2. Start the ML Service

```bash
cd ml-service

# Create virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the ML model (first time only)
python -m app.training.train_model

# Start the service
uvicorn app.main:app --reload --port 8000
```

### 3. Start the Backend

```bash
cd backend

# Install dependencies
npm install

# Copy env file
cp ../.env.example .env
# Edit .env with your settings

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

### 4. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Open in Browser

Navigate to **http://localhost:5173**

Default admin credentials (after seeding):
- Email: `admin@sentinelx.io`
- Password: `Admin@SentinelX2026`

---

## 🐳 Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# ML API:   http://localhost:8000
# MongoDB:  localhost:27017
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Password reset |

### Scanning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan/url` | Scan URL for phishing |
| POST | `/api/scan/email` | Analyze email content |
| GET | `/api/scan/history` | Get scan history |
| GET | `/api/scan/:id` | Get scan details |

### Threat Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/threat/ip` | IP reputation lookup |
| POST | `/api/threat/domain` | Domain intelligence |
| GET | `/api/threat/feed` | Latest threat feed |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/trend` | Threat trends |
| GET | `/api/dashboard/recent` | Recent scans |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/ban` | Ban/unban user |
| GET | `/api/admin/analytics` | Platform analytics |
| GET | `/api/admin/logs` | Audit logs |

### ML Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ml/health` | Health check |
| POST | `/api/ml/predict-url` | URL phishing prediction |
| POST | `/api/ml/analyze-email` | Email analysis |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite 6
- **Tailwind CSS v4** (utility-first styling)
- **Framer Motion** (animations)
- **Recharts** (data visualization)
- **React Router v6** (routing)
- **Axios** (HTTP client)
- **Lucide React** (icons)

### Backend
- **Express.js 5** (REST API)
- **Mongoose 8** (MongoDB ODM)
- **JWT** (authentication)
- **Helmet** (security headers)
- **Express Rate Limit** (API protection)
- **Express Validator** (input validation)
- **PDFKit** (report generation)

### ML Service
- **FastAPI** (Python API framework)
- **Scikit-learn** (ML models)
- **Pandas / NumPy** (data processing)
- **NLTK** (NLP analysis)
- **TLDExtract** (URL parsing)

### Infrastructure
- **MongoDB Atlas** (database)
- **Docker** (containerization)
- **Nginx** (reverse proxy)

---

## 🔒 Security

- JWT token authentication with expiration
- Password hashing with bcrypt (12 salt rounds)
- Helmet security headers
- CORS configuration
- API rate limiting (100 req/15min)
- Input validation & sanitization
- XSS protection
- Role-based access control

---

## 📁 Project Structure

```
sentinelx/
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── contexts/   # React contexts (Auth, Theme)
│   │   ├── pages/      # Page components
│   │   ├── services/   # API service layer
│   │   └── styles/     # Global CSS & animations
│   └── ...
├── backend/            # Node.js + Express API
│   ├── src/
│   │   ├── config/     # Database & JWT config
│   │   ├── controllers/# Request handlers
│   │   ├── middleware/  # Auth, validation, errors
│   │   ├── models/     # Mongoose schemas
│   │   ├── routes/     # API routes
│   │   ├── services/   # External API integrations
│   │   └── utils/      # Helpers & seed data
│   └── ...
├── ml-service/         # Python FastAPI ML service
│   ├── app/
│   │   ├── models/     # ML model & email analyzer
│   │   ├── features/   # Feature extraction
│   │   └── training/   # Model training & dataset
│   └── ...
├── docker-compose.yml  # Multi-service orchestration
└── README.md
```

---

## 🔑 API Keys Setup

| Service | Free Tier | Get Key |
|---------|-----------|---------|
| VirusTotal | 4 req/min, 500 req/day | [virustotal.com](https://www.virustotal.com/gui/join-us) |
| AbuseIPDB | 1000 req/day | [abuseipdb.com](https://www.abuseipdb.com/register) |
| IP Geolocation | Unlimited (non-commercial) | [ip-api.com](http://ip-api.com) (no key needed) |

> **Note:** The application works without API keys using realistic mock data. Add keys for live threat intelligence.

---

## 📄 License

This project is built for educational and portfolio purposes.

---

<div align="center">

**Built with ❤️ for cybersecurity**

*SentinelX — Detect. Analyze. Protect.*

</div>
