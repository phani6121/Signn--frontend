import type {
  AnalyzeRiderFaceForImpairmentOutput,
  ProvideOptimalRestStopSuggestionsOutput,
} from '@/ai/flows';

export type RiderStatus = 'GREEN' | 'YELLOW' | 'RED';

export type Rider = {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  name: string;
  email: string;
  baselineLatency?: number;
  createdAt?: string;
};

export type ReadinessCheck = {
  id: string;
  riderId: string;
  timestamp: string;
  status: RiderStatus;
  latency?: number;
  impairment?: AnalyzeRiderFaceForImpairmentOutput;
  reason: string;
};

export type RestStopSuggestion = ProvideOptimalRestStopSuggestionsOutput;
