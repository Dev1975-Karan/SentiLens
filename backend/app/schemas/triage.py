"""Pydantic schemas for SentinelLens API responses.
These mirror the TypeScript interfaces defined in the frontend (`src/types.ts`).
"""

from pydantic import BaseModel, Field
from typing import List, Optional

class SectionEntropy(BaseModel):
    name: str
    entropy: float
    size: int
    virtual_address: str

class ImportEntry(BaseModel):
    dll: str
    functions: List[str]

class YaraMatch(BaseModel):
    rule: str
    description: str
    severity: str = Field(..., description="One of 'high', 'medium', 'low'")

class AnalysisResult(BaseModel):
    filename: str
    file_size: int
    md5: str
    sha256: str
    file_type: str
    is_pe: bool
    sections: List[SectionEntropy]
    imports: List[ImportEntry]
    yara_matches: List[YaraMatch]
    risk_score: int
    threat_summary: str
    dangerous_imports: List[str]
    timestamp: str
    remediation_steps: Optional[List[str]] = None
