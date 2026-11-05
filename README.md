# AI Intelligence Radar

> **Real-Time AI News & Research Intelligence Platform**  
> Automated multi-source news discovery, rigorous deduplication, fact-grounded Gemini intelligence synthesis, and automated daily intelligence reports delivered at **07:00 AM IST** via Hostinger SMTP.

---

## 1. System Overview

AI Intelligence Radar solves the noise, exaggeration, and fragmentation of modern AI news. Rather than scraping randomly or hallucinating summaries, the platform:
1. **Polls verified, authentic RSS/Atom feeds** across top AI frontier labs (Google AI, DeepMind, OpenAI, Anthropic, NVIDIA, Meta, Microsoft, Hugging Face, Mistral) and academic archives (arXiv `cs.AI`, `cs.LG`, `cs.CL`).
2. **Deduplicates stories** using URL canonicalization, content hashing, and lexical sequence similarity.
3. **Classifies developments** into 13 structured technical domains (Model Releases, AI Research, Open Source, Agents, Multimodal AI, Robotics, Hardware, AI Safety, Policy, etc.).
4. **Calculates objective importance ratings (1.0 to 10.0)** with explicit reasons and distinguishes:
   - *Confirmed announcements*
   - *Research findings*
   - *Company claims*
   - *Reported developments*
   - *Unverified claims*
5. **Generates an executive Daily Intelligence Brief** powered by Gemini API, strictly isolating untrusted article content to prevent prompt injection.
6. **Dispatches automated email briefings at 07:00 AM IST** using Hostinger SMTP.

---

## 2. Architecture

```text
[Verified RSS Feeds / arXiv] 
            │
            ▼
┌───────────────────────────────┐
│   Backend News Engine         │
│   (FastAPI + Python 3.13)     │
│  - feedparser & httpx (SSRF)  │
│  - Deduplication & Hashing    │
│  - Objective Importance Rank  │
│  - Gemini Structured Analysis │
│  - APScheduler (15m + 7 AM)   │
└──────────────┬────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐ ┌───────────────────────────┐
│ SQLite / PG  │ │ Hostinger SMTP Delivery   │
│ Persistence  │ │ (07:00 AM IST Daily Brief)│
└──────────────┘ └───────────────────────────┘
        ▲
        │
┌───────────────────────────────┐
│ Frontend Intelligence Portal  │
│ (React + Vite + TypeScript)   │
│ - Intelligence Dashboard      │
│ - Daily Brief Explorer        │
│ - News Explorer & Duplicates  │
│ - AI Models Tracker           │
│ - Research Radar (arXiv)      │
│ - Source Management & Health  │
│ - System Settings             │
└───────────────────────────────┘
```

---

## 3. Strict Design Standards

The user interface adheres to a clean, professional research intelligence philosophy:
- **Background**: `#F7F9FC`
- **Surface**: `#FFFFFF`
- **Primary Text**: `#172033` (Graphite)
- **Secondary Text**: `#64748B`
- **Primary Accent**: `#2563EB` (Professional Blue)
- **Borders**: `#E5EAF1`
- **Zero Purple Gradients, Zero Dark Mode Forced, Zero Fake Counters or Emojis.**
- **Honest Empty States**: If no verified data exists in a category, the interface explicitly displays: *"No verified articles are currently available in this category."*

---

## 4. Setup and Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Backend Setup
1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   ```powershell
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Run database migrations / seed verified feeds and launch the backend:
   ```bash
   python run.py
   ```
   The backend API will be live at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

### Frontend Setup
1. In another terminal, navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at `http://localhost:5173`.

---

## 5. Environment Variables (`.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./ai_radar.db` |
| `GEMINI_API_KEY` | Google Gemini API Key | `your_gemini_api_key` |
| `GEMINI_MODEL` | Configurable model identifier | `gemini-2.5-flash` |
| `SMTP_HOST` | Hostinger SMTP host | `smtp.hostinger.com` |
| `SMTP_PORT` | Hostinger SSL port | `465` |
| `SMTP_USERNAME` | SMTP authentication user | `news@yourdomain.com` |
| `SMTP_PASSWORD` | SMTP password | `your_mailbox_password` |
| `SMTP_USE_SSL` | Enable SSL encryption | `true` |
| `EMAIL_RECIPIENT` | Target recipient address | `recipient@example.com` |
| `TIMEZONE` | Timezone for scheduler | `Asia/Kolkata` |
| `NEWS_COLLECTION_INTERVAL_MINUTES` | Frequency of background polling | `15` |
| `DAILY_REPORT_HOUR` | Scheduled hour for daily brief | `7` |
| `DAILY_REPORT_MINUTE` | Scheduled minute | `0` |

---

## 6. Testing

Run backend tests verifying deduplication, feed processing, classification, HTML email generation, and security:
```powershell
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\pytest backend\tests
```
