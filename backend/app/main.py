"""SentinelLens — FastAPI backend entry point.

Serves the /api/analyze endpoint (file upload → static analysis → JSON result)
and a /health check.  CORS is configured to allow the Vite dev server.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db.database import init_db, get_scan_by_hash, insert_scan
from .services.parser import extract_file_info, compute_sha256
from .services.yara_engine import scan_with_yara
from .services.triage_engine import finalize_result
from .schemas.triage import AnalysisResult, YaraMatch


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create the SQLite table if it doesn't exist."""
    await init_db()
    yield


app = FastAPI(
    title="SentinelLens",
    version="0.1.0",
    description="Static binary analysis and YARA scanning demo",
    lifespan=lifespan,
)

# --- CORS (allow the Vite dev server on port 3000) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Health check ---
@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "host": settings.host, "port": settings.port}


# --- Main analysis endpoint ---
ALLOWED_EXT = {ext.lstrip(".") for ext in settings.allowed_extensions}


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze(file: UploadFile = File(...)):
    """Accept a file upload, run the static-analysis pipeline, return JSON."""

    # 1️⃣ Validate file extension (sanitizing any Windows or POSIX paths)
    clean_filename = Path(file.filename or "unknown").name
    ext = clean_filename.rsplit(".", 1)[-1].lower() if "." in clean_filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(ALLOWED_EXT)}",
        )

    # 2️⃣ Read file bytes (enforce max size)
    data = await file.read()
    if len(data) > settings.max_file_size:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit.")

    # 3️⃣ Check cache (by SHA-256)
    sha = compute_sha256(data)
    cached = await get_scan_by_hash(sha)
    if cached:
        return AnalysisResult(**cached)

    # 4️⃣ Parse the file (hashes, PE sections, imports)
    result = extract_file_info(clean_filename, data)

    # 5️⃣ Run YARA scan
    yara_hits = scan_with_yara(data)
    result.yara_matches = [YaraMatch(**h) for h in yara_hits]

    # 6️⃣ Heuristic triage (risk score, threat summary, remediation)
    result = finalize_result(result)

    # 7️⃣ Store in SQLite cache
    await insert_scan(result.sha256, result.model_dump(), result.timestamp)

    return result


# --- Serve Frontend (built React UI with dark cyberpunk theme) ---
dist_candidates = [
    Path(__file__).resolve().parents[2] / "frontend" / "dist",
    Path(__file__).resolve().parents[1] / "dist",
    Path("dist"),
]
for dist_dir in dist_candidates:
    if dist_dir.is_dir() and (dist_dir / "index.html").is_file():
        app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")
        break

