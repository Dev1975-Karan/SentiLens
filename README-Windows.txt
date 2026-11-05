========================================================================
SentinelLens — Binary Threat Triage (Windows Quick Start)
========================================================================

SentinelLens provides static analysis of PE binaries (.exe, .dll) and scripts
(.ps1, .bat, .py) with YARA signatures, entropy analysis, and risk scoring.

REQUIREMENTS:
- Windows 10 or 11
- Python 3.10+ installed (from https://www.python.org/)
  * Note: Check "Add Python to PATH" when installing Python.

HOW TO RUN:
1. Double-click "run_sentinellens.bat".
2. The script will automatically:
   - Create a local virtual environment (.venv).
   - Install all required Python packages (only on the very first run).
   - Start the SentinelLens server.
   - Open your web browser to http://127.0.0.1:8000 automatically.

HOW TO STOP:
- Close the command prompt window or press Ctrl+C in it.
========================================================================
