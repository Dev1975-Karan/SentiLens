/* Shared TypeScript types for SentinelLens frontend */

export interface SectionEntropy {
  name: string;
  entropy: number;
  size: number;
  virtual_address: string;
}

export interface ImportEntry {
  dll: string;
  functions: string[];
}

export interface YaraMatch {
  rule: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  filename: string;
  file_size: number;
  md5: string;
  sha256: string;
  file_type: string;
  is_pe: boolean;
  sections: SectionEntropy[];
  imports: ImportEntry[];
  yara_matches: YaraMatch[];
  risk_score: number;
  threat_summary: string;
  dangerous_imports: string[];
  remediation_steps?: string[];
  timestamp: string;
}

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'scanning'; step: string }
  | { status: 'done'; result: AnalysisResult }
  | { status: 'error'; message: string };
