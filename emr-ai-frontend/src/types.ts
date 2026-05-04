export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ScribeResult {
  transcript: string;
  language: string;
  duration_seconds: number | null;
  soap: SoapNote;
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export interface CdsDifferential {
  diagnosis: string;
  reasoning: string;
}

export interface CdsSuggestions {
  differentials: CdsDifferential[];
  recommended_workup: string[];
  treatment_plan: string;
  red_flags: string[];
}

export type CdsState = 'idle' | 'loading' | 'done' | 'error';
