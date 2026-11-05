import { useRef, useState, useCallback } from 'react';

const ALLOWED_EXTENSIONS = ['.exe', '.dll', '.ps1', '.bat', '.py'];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

interface UseDropzoneOptions {
  onFile: (file: File) => void;
}

export function useDropzone({ onFile }: UseDropzoneOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'File exceeds the 50 MB limit.';
    }
    return null;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      e.target.value = '';
    },
    [onFile],
  );

  return {
    isDragOver,
    inputRef,
    validate,
    getRootProps: () => ({
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); },
      onDragLeave: () => setIsDragOver(false),
      onDrop: handleDrop,
      onClick: () => inputRef.current?.click(),
    }),
    getInputProps: () => ({
      ref: inputRef,
      type: 'file' as const,
      accept: ALLOWED_EXTENSIONS.join(','),
      style: { display: 'none' },
      onChange: handleChange,
    }),
  };
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Return a CSS color for an entropy value (PDF palette) */
export function entropyColor(entropy: number): string {
  if (entropy > 7.5) return '#EF4444';   /* Crimson Red */
  if (entropy > 6.5) return '#F59E0B';   /* Amber Gold  */
  return '#10B981';                       /* Emerald Green */
}

/** Return risk-score color (PDF palette) */
export function riskColor(score: number): string {
  if (score >= 7) return '#EF4444';       /* Crimson Red — high risk 7-10 */
  if (score >= 4) return '#F59E0B';       /* Amber Gold — medium risk 4-6 */
  return '#10B981';                       /* Emerald Green — low risk 1-3 */
}

/** Return risk label */
export function riskLabel(score: number): string {
  if (score >= 8) return 'CRITICAL';
  if (score >= 6) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  return 'LOW';
}

/** File extension → emoji icon */
export function fileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'exe': return '⚙️';
    case 'dll': return '🔩';
    case 'ps1': return '🔷';
    case 'bat': return '🗒️';
    case 'py':  return '🐍';
    default:    return '📄';
  }
}
