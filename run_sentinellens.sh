#!/usr/bin/env bash
set -e

# Resolve the project root (directory of this script)
PROJECT_ROOT="$(cd "$(dirname "$(realpath "$0")")" && pwd)"

# Activate Python virtual environment from project root
if [ -d "$PROJECT_ROOT/.venv" ]; then
  source "$PROJECT_ROOT/.venv/bin/activate"
fi

# Backend
cd "$PROJECT_ROOT/backend"
# Run backend in background
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo "Backend started (PID $BACKEND_PID) on http://127.0.0.1:8000"

# Frontend
cd "$PROJECT_ROOT/frontend"
# Install dependencies if needed
if [ ! -d node_modules ]; then
  npm install
fi

# Open browser if graphical environment is available
if [ -n "$DISPLAY" ] && command -v xdg-open >/dev/null 2>&1; then
  (sleep 2 && xdg-open http://localhost:3000) &
fi

# Run dev server (foreground)
npm run dev

# When frontend stops, kill backend
kill $BACKEND_PID 2>/dev/null || true
