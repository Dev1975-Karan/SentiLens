import { useState, useCallback, useRef } from 'react';
import { UploadCard } from './components/UploadCard';
import { ResultCard } from './components/ResultCard';
import { analyzeFile } from './api';
import type { AnalysisState } from './types';

const SCAN_STEPS = [
  '⚡ Parsing PE headers…',
  '🔬 Calculating section entropy…',
  '📋 Extracting import table…',
  '🧬 Running YARA signatures…',
  '🤖 Generating threat summary…',
];

export default function App() {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });
  const stepIndexRef = useRef(0);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startScanSteps = useCallback(() => {
    stepIndexRef.current = 0;
    setState({ status: 'scanning', step: SCAN_STEPS[0] });

    stepIntervalRef.current = setInterval(() => {
      stepIndexRef.current = (stepIndexRef.current + 1) % SCAN_STEPS.length;
      setState({ status: 'scanning', step: SCAN_STEPS[stepIndexRef.current] });
    }, 1800);
  }, []);

  const stopScanSteps = useCallback(() => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
  }, []);

  const handleAnalyze = useCallback(
    async (file: File) => {
      setState({ status: 'uploading', progress: 0 });

      try {
        const result = await analyzeFile(file, (progress) => {
          if (progress < 100) {
            setState({ status: 'uploading', progress });
          } else {
            startScanSteps();
          }
        });

        stopScanSteps();
        setState({ status: 'done', result });
      } catch (err) {
        stopScanSteps();
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    [startScanSteps, stopScanSteps],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  const isLoading = state.status === 'uploading' || state.status === 'scanning';
  const progress = state.status === 'uploading' ? state.progress : 100;
  const scanStep = state.status === 'scanning' ? state.step : '';
  const errorMsg = state.status === 'error' ? state.message : undefined;

  return (
    <>
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />

      <div className="app-layout">
        {/* Header */}
        <header className="header">
          <div className="header__logo">
            <div className="header__logo-icon" aria-hidden="true">🛡️</div>
            <span className="header__wordmark">SentinelLens</span>
          </div>
          <div className="header__badge">v0.1 · Static Analysis</div>
        </header>

        {/* Main content */}
        <main className="main" id="main-content">
          {/* Hero */}
          <section className="hero fade-in" aria-labelledby="hero-title">
            <p className="hero__eyebrow">Instant Binary Triage</p>
            <h1 className="hero__title" id="hero-title">
              Decode Threats,<br />Not Hex Dumps
            </h1>
            <p className="hero__sub">
              Upload a PE binary, PowerShell script, or batch file and receive a
              human‑readable threat story with a 1–10 risk score in under 10 seconds.
              Zero setup. No sandboxing. 100% static analysis.
            </p>
          </section>

          {/* Upload */}
          {state.status !== 'done' && (
            <UploadCard
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              progress={progress}
              scanStep={scanStep}
              error={errorMsg}
            />
          )}

          {/* Results */}
          {state.status === 'done' && (
            <ResultCard result={state.result} onReset={reset} />
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          <p className="footer__text">
            SentinelLens performs <strong>static analysis only</strong>. Uploaded files are never executed.
          </p>
          <nav className="footer__links" aria-label="Footer links">
            <a href="#" className="footer__link">Documentation</a>
            <a href="#" className="footer__link">GitHub</a>
            <a href="#" className="footer__link">Security</a>
          </nav>
        </footer>
      </div>
    </>
  );
}
