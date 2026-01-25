import { ChatResponse, HealthStatus } from "@/types";

const API_BASE =
  typeof window !== "undefined" &&
  window.location.hostname === "127.0.0.1" &&
  (window.location.port === "3000" || window.location.port === "3001")
    ? "http://127.0.0.1:8080"
    : "";

export async function sendMessage(
  question: string,
  similarityThreshold?: number,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      show_sources: true,
      similarity_threshold: similarityThreshold,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function sendMessageStream(
  question: string,
  onData: (token: string) => void,
  onMeta?: (data: ChatResponse) => void,
  similarityThreshold?: number,
): Promise<ChatResponse | void> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      show_sources: true,
      similarity_threshold: similarityThreshold,
      stream: true,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data: ChatResponse = await res.json();
    onData(data.answer);
    return data;
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        
        try {
          const parsed = JSON.parse(data);

          if (typeof parsed === "string") {
            onData(parsed);
            continue;
          }

          if (parsed && typeof parsed === "object" && "error" in parsed) {
            throw new Error((parsed as { error?: string }).error);
          }

          if (parsed && typeof parsed === "object" && "sources" in parsed && onMeta) {
            onMeta(parsed as ChatResponse);
            continue;
          }

          onData(data);
        } catch {
          onData(data);
        }
        continue;
      }
    }
  }
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}
