/// <reference types="vite/client" />
import type { AnalysisResult } from './types';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? '';

export async function analyzeFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND}/api/analyze`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as AnalysisResult);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        let msg = `Server error ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText) as { detail?: string };
          if (body.detail) msg = body.detail;
        } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error — is the backend running?'));
    xhr.send(form);
  });
}
