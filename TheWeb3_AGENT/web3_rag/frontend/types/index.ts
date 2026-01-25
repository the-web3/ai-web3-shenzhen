export interface Source {
  file_name: string;
  text: string;
  score: number;
  page?: number | null;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  query_time_ms: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  queryTimeMs?: number;
  timestamp: Date;
}

export interface HealthStatus {
  status: string;
  model: string;
  index_loaded: boolean;
}
