# SentinelLens

Instant binary triage web application.

## Features
- Drag‑and‑drop upload (≤ 50 MB) supporting `.exe`, `.dll`, `.ps1`, `.bat`, `.py`
- In‑memory PE parsing, section entropy calculation, import table extraction
- YARA signature scanning
- AI threat story summary and actionable remediation steps
- Heuristic risk scoring (1–10)
- Cyberpunk / SOC Dark Mode aesthetic

## Quick Start with Docker (Recommended)

Run the full stack (FastAPI backend + Nginx-served React frontend) with a single command:

```bash
docker compose up --build
```

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

To stop:
```bash
docker compose down
```

## Running Without Docker

### Linux
```bash
./run_sentinellens.sh
```

### Windows
Double-click `run_sentinellens.bat` (or extract `SentinelLens-Windows.zip`).
