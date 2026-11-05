from pathlib import Path
from ..config import settings

RULES_PATH = Path(__file__).parent / "rules.yar"

DEFAULT_RULES = """
rule UPX_Packed {
    meta:
        description = "Detects UPX packed executables"
        author = "SentinelLens"
        reference = "https://upx.github.io"
    strings:
        $upx = "UPX!" ascii
    condition:
        $upx
}
"""

try:
    import yara

    def compile_rules():
        try:
            if RULES_PATH.is_file():
                return yara.compile(filepath=str(RULES_PATH))
            else:
                try:
                    RULES_PATH.write_text(DEFAULT_RULES)
                except Exception:
                    pass
                return yara.compile(source=DEFAULT_RULES)
        except Exception:
            return None

    YARA_RULES = compile_rules()
except (ImportError, Exception):
    yara = None
    YARA_RULES = None


def scan_with_yara(data: bytes):
    if YARA_RULES is not None:
        try:
            matches = YARA_RULES.match(data=data)
            results = []
            for m in matches:
                severity = "high" if "packed" in m.rule.lower() else "low"
                description = m.meta.get("description", "")
                results.append({"rule": m.rule, "description": description, "severity": severity})
            return results
        except Exception:
            pass

    # Pure Python fallback scanner (active on serverless/Vercel or if libyara is unavailable)
    results = []
    if b"UPX!" in data:
        results.append({
            "rule": "UPX_Packed",
            "description": "Detects UPX packed executables",
            "severity": "high",
        })
    if b"mimikatz" in data.lower():
        results.append({
            "rule": "Credential_Dumping_Keyword",
            "description": "Contains strings associated with credential dumping tools",
            "severity": "high",
        })
    return results
