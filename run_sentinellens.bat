@echo off
title SentinelLens - Binary Threat Triage
echo ===================================================
echo        SentinelLens - Binary Threat Triage
echo ===================================================
echo.

cd /d "%~dp0"

REM Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your system PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

REM Set up virtual environment if missing
if not exist ".venv" (
    echo [*] Creating virtual environment (.venv)...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [*] Installing required dependencies...
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r backend\requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation encountered an issue.
        pause
        exit /b 1
    )
) else (
    call .venv\Scripts\activate.bat
)

echo [*] Starting SentinelLens on http://127.0.0.1:8000 ...
start "" http://127.0.0.1:8000

cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

pause
