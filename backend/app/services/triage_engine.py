import datetime
from typing import List

from ..schemas.triage import AnalysisResult, YaraMatch

# List of Windows API functions considered high‑risk (mirrors the frontend DANGEROUS_FUNS set)
DANGEROUS_FUNS = {
    "CreateRemoteThread",
    "VirtualAllocEx",
    "WriteProcessMemory",
    "ShellExecute",
    "WinExec",
    "CreateProcess",
    "LoadLibrary",
    "GetProcAddress",
    "OpenProcess",
    "AdjustTokenPrivileges",
}

def compute_risk_score(result: AnalysisResult) -> int:
    """Simple heuristic risk scoring (1‑10).
    - +2 per YARA match
    - +2 per dangerous import function
    - +1 per section with entropy > 7.0
    Scores are capped at 10 and a minimum of 1.
    """
    yara_points = len(result.yara_matches) * 2
    dangerous_points = len(result.dangerous_imports) * 2
    high_entropy_points = sum(1 for sec in result.sections if sec.entropy > 7.0) * 1
    raw_score = yara_points + dangerous_points + high_entropy_points
    return max(1, min(10, raw_score))

def build_threat_summary(result: AnalysisResult) -> str:
    parts: List[str] = []
    if result.yara_matches:
        parts.append(f"{len(result.yara_matches)} YARA rule(s) triggered")
    if result.dangerous_imports:
        parts.append(f"dangerous API calls detected: {', '.join(result.dangerous_imports)}")
    high_entropy_secs = [s.name for s in result.sections if s.entropy > 7.0]
    if high_entropy_secs:
        parts.append(f"high‑entropy sections: {', '.join(high_entropy_secs)}")
    if not parts:
        return "No obvious malicious indicators found."
    return ". ".join(parts) + "."

def add_remediation_steps(result: AnalysisResult) -> List[str]:
    steps: List[str] = []
    if result.yara_matches:
        steps.append("Update AV/YARA signatures with the matched rules.")
    if result.dangerous_imports:
        steps.append("Isolate the binary and perform deeper sandbox analysis.")
    if any(sec.entropy > 7.0 for sec in result.sections):
        steps.append("Consider unpacking or decompressing the file before further analysis.")
    if not steps:
        steps.append("No immediate action required; file appears benign.")
    return steps

def finalize_result(result: AnalysisResult) -> AnalysisResult:
    # Compute dangerous imports from the import table
    dangerous: List[str] = []
    for imp in result.imports:
        for fn in imp.functions:
            if fn in DANGEROUS_FUNS:
                dangerous.append(fn)
    result.dangerous_imports = dangerous

    # Compute risk score
    result.risk_score = compute_risk_score(result)

    # Build threat summary string
    result.threat_summary = build_threat_summary(result)

    # Add timestamp
    result.timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    # Add remediation steps (optional field for frontend)
    result.remediation_steps = add_remediation_steps(result)

    return result
