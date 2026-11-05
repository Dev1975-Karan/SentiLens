import { useState, useCallback } from 'react';
import { useDropzone, formatBytes, fileIcon } from '../utils';

interface UploadCardProps {
  onAnalyze: (file: File) => void;
  isLoading: boolean;
  progress: number;
  scanStep: string;
  error?: string;
}

export function UploadCard({
  onAnalyze,
  isLoading,
  progress,
  scanStep,
  error,
}: UploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileSafe = useCallback((file: File, validateFn: (f: File) => string | null) => {
    const err = validateFn(file);
    if (err) { setValidationError(err); setSelectedFile(null); return; }
    setValidationError(null);
    setSelectedFile(file);
  }, []);

  const { isDragOver, validate } = useDropzone({
    onFile: (file) => handleFileSafe(file, validate),
  });

  // validate is stable after first render; this re-wires it cleanly
  const { getRootProps: root, getInputProps: input } = useDropzone({
    onFile: (file) => handleFileSafe(file, validate),
  });

  const clear = () => { setSelectedFile(null); setValidationError(null); };

  const displayError = validationError ?? error;

  const openFilePicker = () => {
    const inp = document.getElementById('file-input') as HTMLInputElement | null;
    inp?.click();
  };

  return (
    <section className="glass-card upload-card fade-in fade-in-delay-1" aria-label="File upload">
      <div
        id="dropzone"
        className={`dropzone${isDragOver ? ' dropzone--drag-over' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Drop file here or click to browse"
        onKeyDown={(e) => { if (e.key === 'Enter') openFilePicker(); }}
        {...root()}
        onClick={openFilePicker}
      >
        <input id="file-input" aria-hidden="true" {...input()} />

        {!selectedFile ? (
          <>
            <span className="dropzone__icon" aria-hidden="true">🛡️</span>
            <p className="dropzone__title">Drop your file here</p>
            <p className="dropzone__sub">or click to browse your machine</p>
            <div className="dropzone__tags" role="list" aria-label="Accepted file types">
              {['.exe', '.dll', '.ps1', '.bat', '.py'].map((ext) => (
                <span key={ext} className="tag" role="listitem">{ext}</span>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={(e) => { e.stopPropagation(); openFilePicker(); }}
            >
              📂 Browse files
            </button>
          </>
        ) : (
          <div className="selected-file" onClick={(e) => e.stopPropagation()}>
            <span className="selected-file__icon" aria-hidden="true">{fileIcon(selectedFile.name)}</span>
            <div className="selected-file__info">
              <div className="selected-file__name">{selectedFile.name}</div>
              <div className="selected-file__size">{formatBytes(selectedFile.size)}</div>
            </div>
            <button
              type="button"
              className="selected-file__remove"
              aria-label="Remove selected file"
              onClick={clear}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {displayError && (
        <div className="upload-error" role="alert">
          <span aria-hidden="true">⚠️</span>
          {displayError}
        </div>
      )}

      {isLoading && (
        <>
          {progress < 100 ? (
            <div className="progress-wrap">
              <div className="progress-label">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="scan-overlay">
              <div className="scan-spinner" aria-label="Analysing" role="status" />
              <p className="scan-title">Analysing…</p>
              <p className="scan-step">{scanStep}</p>
            </div>
          )}
        </>
      )}

      {!isLoading && (
        <div className="upload-actions">
          {selectedFile && (
            <button type="button" className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
          )}
          <button
            id="btn-analyze"
            type="button"
            className="btn btn-primary"
            disabled={!selectedFile || isLoading}
            onClick={() => selectedFile && onAnalyze(selectedFile)}
          >
            🔍 Analyse File
          </button>
        </div>
      )}
    </section>
  );
}
