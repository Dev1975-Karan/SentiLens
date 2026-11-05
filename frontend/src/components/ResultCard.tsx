import { useState } from 'react';
import type { AnalysisResult, SectionEntropy, ImportEntry, YaraMatch } from '../types';
import { entropyColor, riskColor, riskLabel, formatBytes } from '../utils';

interface ResultCardProps {
  result: AnalysisResult;
  onReset: () => void;
}

/* ---- Risk ring -------------------------------------------- */
function RiskRing({ score }: { score: number }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const fill = (score / 10) * C;
  const color = riskColor(score);
  const label = riskLabel(score);

  return (
    <div className="risk-badge">
      <span className="risk-badge__label">{label}</span>
      <div className="risk-ring" aria-label={`Risk score: ${score} out of 10`}>
        <svg viewBox="0 0 72 72" aria-hidden="true">
          <circle className="risk-ring__bg" cx="36" cy="36" r={R} />
          <circle
            className="risk-ring__fill"
            cx="36" cy="36" r={R}
            stroke={color}
            strokeDasharray={`${fill} ${C}`}
          />
        </svg>
        <div className="risk-ring__value" style={{ color }}>{score}</div>
      </div>
    </div>
  );
}

/* ---- Section entropy bars --------------------------------- */
function EntropySection({ sections }: { sections: SectionEntropy[] }) {
  return (
    <div className="result-section">
      <h3 className="result-section__title">Section Entropy</h3>
      {sections.map((s) => (
        <div key={s.name} className="entropy-item">
          <span className="entropy-item__name mono" title={s.name}>{s.name}</span>
          <div className="entropy-item__bar-wrap">
            <div
              className="entropy-item__bar-fill"
              style={{
                width: `${(s.entropy / 8) * 100}%`,
                background: entropyColor(s.entropy),
              }}
            />
          </div>
          <span className="entropy-item__val">{s.entropy.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Imports table ---------------------------------------- */
const DANGEROUS_FUNS = new Set([
  'CreateRemoteThread', 'VirtualAllocEx', 'WriteProcessMemory',
  'ShellExecute', 'WinExec', 'CreateProcess', 'LoadLibrary',
  'GetProcAddress', 'OpenProcess', 'AdjustTokenPrivileges',
]);

function ImportsSection({ imports, dangerous }: { imports: ImportEntry[]; dangerous: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const dangerSet = new Set(dangerous);

  const rows: Array<{ dll: string; fn: string }> = [];
  for (const imp of imports) {
    for (const fn of imp.functions) {
      rows.push({ dll: imp.dll, fn });
    }
  }
  const visible = expanded ? rows : rows.slice(0, 20);

  return (
    <div className="result-section">
      <h3 className="result-section__title">Import Table ({rows.length} functions)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="imports-table">
          <thead>
            <tr>
              <th>DLL</th>
              <th>Function</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                <td className={dangerSet.has(r.dll) ? 'danger-dll' : ''}>{r.dll}</td>
                <td className={(DANGEROUS_FUNS.has(r.fn) || dangerSet.has(r.fn)) ? 'danger-fn' : ''}>
                  {r.fn}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 20 && (
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 12, fontSize: '0.8rem' }}
          onClick={() => setExpanded((x) => !x)}
        >
          {expanded ? '▲ Show less' : `▼ Show all ${rows.length} functions`}
        </button>
      )}
    </div>
  );
}

/* ---- YARA matches ----------------------------------------- */
function YaraSection({ matches }: { matches: YaraMatch[] }) {
  if (matches.length === 0) {
    return (
      <div className="result-section">
        <h3 className="result-section__title">YARA Signatures</h3>
        <p style={{ color: 'var(--clr-safe)', fontSize: '0.875rem' }}>
          ✅ No YARA rules triggered
        </p>
      </div>
    );
  }

  return (
    <div className="result-section">
      <h3 className="result-section__title">YARA Signatures ({matches.length} match{matches.length > 1 ? 'es' : ''})</h3>
      <div className="yara-list">
        {matches.map((m, i) => (
          <div
            key={i}
            className={`yara-match${m.severity === 'medium' ? ' yara-match--warning' : ''}`}
          >
            <span className="yara-match__icon" aria-hidden="true">
              {m.severity === 'high' ? '🔴' : m.severity === 'medium' ? '🟡' : '🟢'}
            </span>
            <div>
              <div className="yara-match__rule">{m.rule}</div>
              <div className="yara-match__desc">{m.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Remediation steps (FR-06) ---------------------------- */
function RemediationSection({ steps }: { steps?: string[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="result-section">
      <h3 className="result-section__title">Actionable Containment & Remediation</h3>
      <div className="remediation-list">
        {steps.map((step, idx) => (
          <div key={idx} className="remediation-item">
            <span className="remediation-item__num">STEP {idx + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Hash display ----------------------------------------- */
function HashRow({ algo, value }: { algo: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="hash-row">
      <span className="hash-row__algo">{algo}</span>
      <span className="hash-row__val mono" title={value}>{value}</span>
      <button
        type="button"
        className="hash-row__copy"
        onClick={copy}
        aria-label={`Copy ${algo} hash`}
      >
        {copied ? '✓' : 'copy'}
      </button>
    </div>
  );
}

/* ---- Main result card ------------------------------------- */
export function ResultCard({ result, onReset }: ResultCardProps) {
  const ts = new Date(result.timestamp).toLocaleString();

  return (
    <section className="glass-card results-panel fade-in" aria-label="Analysis results">
      {/* Header */}
      <div className="results-header">
        <div>
          <div className="results-header__title">Analysis Complete</div>
          <div className="results-header__filename mono">{result.filename}</div>
          <div style={{ fontSize: '0.73rem', color: 'var(--clr-muted)', marginTop: 4 }}>
            {ts} · {formatBytes(result.file_size)} · {result.file_type}
          </div>
        </div>
        <RiskRing score={result.risk_score} />
      </div>

      {/* Threat story */}
      <div className="threat-story">
        <h3 className="threat-story__heading">AI Threat Summary</h3>
        <p className="threat-story__text">{result.threat_summary}</p>
      </div>

      {/* Quick stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">File Type</div>
          <div className="stat-card__value">{result.file_type}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Sections</div>
          <div className="stat-card__value">{result.sections.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Imports</div>
          <div className="stat-card__value">{result.imports.reduce((s, i) => s + i.functions.length, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">YARA Hits</div>
          <div className="stat-card__value" style={{ color: result.yara_matches.length > 0 ? 'var(--clr-danger)' : 'var(--clr-safe)' }}>
            {result.yara_matches.length}
          </div>
        </div>
      </div>

      {/* Hashes */}
      <div className="result-section">
        <h3 className="result-section__title">File Hashes</h3>
        <HashRow algo="MD5" value={result.md5} />
        <HashRow algo="SHA‑256" value={result.sha256} />
      </div>

      {/* Entropy */}
      {result.sections.length > 0 && <EntropySection sections={result.sections} />}

      {/* Imports */}
      {result.imports.length > 0 && (
        <ImportsSection imports={result.imports} dangerous={result.dangerous_imports} />
      )}

      {/* YARA */}
      <YaraSection matches={result.yara_matches} />

      {/* Remediation (FR-06) */}
      <RemediationSection steps={result.remediation_steps} />

      {/* Actions */}
      <div className="upload-actions">
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          ← Analyse another file
        </button>
      </div>
    </section>
  );
}
