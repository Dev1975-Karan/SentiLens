import math
import pefile
import hashlib
from typing import List

from pathlib import Path
from pefile import PE

from ..config import settings
from ..schemas.triage import SectionEntropy, ImportEntry, AnalysisResult

def compute_md5(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()

def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    byte_counts = [0] * 256
    for b in data:
        byte_counts[b] += 1
    entropy = 0.0
    length = len(data)
    for count in byte_counts:
        if count == 0:
            continue
        p = count / length
        entropy -= p * math.log2(p)
    return entropy

def parse_pe(data: bytes) -> (List[SectionEntropy], List[ImportEntry]):
    pe = PE(data=data, fast_load=True)
    pe.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_IMPORT']])
    # Sections
    sections: List[SectionEntropy] = []
    for sec in pe.sections:
        name = sec.Name.decode(errors='ignore').strip('\x00')
        entropy = sec.get_entropy()
        size = sec.SizeOfRawData
        vaddr = hex(sec.VirtualAddress)
        sections.append(SectionEntropy(name=name, entropy=entropy, size=size, virtual_address=vaddr))
    # Imports
    imports: List[ImportEntry] = []
    if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
        for entry in pe.DIRECTORY_ENTRY_IMPORT:
            dll = entry.dll.decode(errors='ignore')
            funcs = [imp.name.decode(errors='ignore') if imp.name else f"Ordinal_{imp.ordinal}" for imp in entry.imports]
            imports.append(ImportEntry(dll=dll, functions=funcs))
    return sections, imports

def extract_file_info(filename: str, data: bytes) -> AnalysisResult:
    # Sanitize filename (removes any Windows or POSIX directory paths)
    clean_filename = Path(filename).name or "unknown"
    md5 = compute_md5(data)
    sha256 = compute_sha256(data)
    file_type = clean_filename.rsplit('.', 1)[-1].lower() if '.' in clean_filename else 'bin'
    is_pe = file_type in ['exe', 'dll']
    sections: List[SectionEntropy] = []
    imports: List[ImportEntry] = []
    if is_pe:
        try:
            sections, imports = parse_pe(data)
        except Exception:
            # corrupted PE – treat as empty but still provide hashes
            sections = []
            imports = []
    result = AnalysisResult(
        filename=clean_filename,
        file_size=len(data),
        md5=md5,
        sha256=sha256,
        file_type=file_type,
        is_pe=is_pe,
        sections=sections,
        imports=imports,
        yara_matches=[],  # filled later
        risk_score=0,     # filled later
        threat_summary='',
        dangerous_imports=[],
        timestamp="",
    )
    return result
