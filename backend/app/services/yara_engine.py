import yara
from pathlib import Path
from ..config import settings

# Minimal rule set – kept lightweight (~5 rules)
RULES_PATH = Path(__file__).parent / "rules.yar"

# Example rule: high entropy section detection (entropy > 7.0) – YARA can't compute entropy directly, so we match a known packer signature.
# For demo we include a simple generic rule for packed executables (UPX)
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

def compile_rules() -> yara.Rules:
    if RULES_PATH.is_file():
        return yara.compile(filepath=str(RULES_PATH))
    else:
        # Write default rules to file for future reuse
        RULES_PATH.write_text(DEFAULT_RULES)
        return yara.compile(source=DEFAULT_RULES)

YARA_RULES = compile_rules()

def scan_with_yara(data: bytes):
    matches = YARA_RULES.match(data=data)
    results = []
    for m in matches:
        # YARA python provides rule name, meta dict and matching strings – we map to our YaraMatch schema
        severity = "high" if "packed" in m.rule.lower() else "low"
        description = m.meta.get("description", "")
        results.append({"rule": m.rule, "description": description, "severity": severity})
    return results
