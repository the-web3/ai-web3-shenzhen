/**
 * API 服务层 - 连接后端 LangExtract 提取服务
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export type ScenarioType =
  | 'web3_dev'
  | 'web3_product'
  | 'web3_testing'
  | 'custom';

export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  extract_classes: string[];
}

export interface SampleReport {
  id: string;
  title: string;
  scenario: ScenarioType;
  text: string;
}

export interface CharInterval {
  start_pos: number;
  end_pos: number;
}

export interface ExtractionItem {
  extraction_class: string;
  extraction_text: string;
  attributes?: Record<string, string>;
  char_interval?: CharInterval;
}

export interface SegmentInfo {
  type: string;
  label?: string;
  content: string;
  intervals: CharInterval[];
  significance?: string;
}

export interface ExtractionRequest {
  text: string;
  scenario: ScenarioType;
}

export interface ExtractionResponse {
  success: boolean;
  scenario: ScenarioType;
  segments: SegmentInfo[];
  extractions: ExtractionItem[];
  formatted_text: string;
  sanitized_input: string;
  error?: string;
  processing_time?: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  model: string;
}

// =============================================================================
// RAG 相关接口
// =============================================================================

export interface PDFParseRequest {
  pdf_url: string;
  model_version?: 'vlm' | 'pipeline';
  extract_after_parse?: boolean;
  scenario?: ScenarioType;
}

export interface PDFParseResponse {
  success: boolean;
  task_id?: string;
  markdown?: string;
  source: string;
  parse_time?: number;
  extractions: ExtractionItem[];
  error?: string;
}

export interface PDFTaskStatusResponse {
  task_id: string;
  state: string;
  progress?: {
    extracted_pages?: number;
    total_pages?: number;
  };
  error?: string;
}

export interface SearchRequest {
  query: string;
  top_k?: number;
  doc_id?: string;
  chunk_type?: string;
}

export interface SearchResult {
  score: number;
  chunk_id: string;
  doc_id: string;
  doc_title: string;
  content: string;
  chunk_type: string;
  attributes: Record<string, unknown>;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  total: number;
  error?: string;
}

export interface EntityInfo {
  text: string;
  entity_type: string;
  confidence?: number;
  start_pos?: number;
  end_pos?: number;
}

export interface QARequest {
  question: string;
  top_k?: number;
  system_prompt?: string;
  entities?: Array<{
    text: string;
    entity_type?: string;
    extraction_class?: string;
    confidence?: number;
  }>;
}

export interface QASource {
  doc_id: string;
  doc_title: string;
  content_preview: string;
  score: number;
  chunk_index?: number;
  chunk_type?: string;  // text, entity, relationship
  extraction_class?: string;  // 实体、关系描述、数据指标等
  char_interval?: {
    start_pos: number;
    end_pos: number;
  };
  attributes?: Record<string, any>;  // 实体属性，如：主体1、主体2、关系类型等
}

export interface QAResponse {
  success: boolean;
  question: string;
  answer?: string;
  sources: QASource[];
  context_count: number;
  entities?: EntityInfo[];
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  use_rag?: boolean;
  top_k?: number;
}

export interface ChatResponse {
  success: boolean;
  answer?: string;
  sources: QASource[];
  error?: string;
}

export interface AddDocumentRequest {
  doc_id?: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AddDocumentResponse {
  success: boolean;
  doc_id: string;
  chunk_count: number;
  error?: string;
}

// 知识提取存储相关接口
export interface KnowledgeExtractionItem {
  extraction_class: string;
  extraction_text: string;
  char_interval?: CharInterval;
  attributes?: Record<string, any>;
}

export interface AddExtractionsRequest {
  doc_id?: string;
  doc_title: string;
  extractions: KnowledgeExtractionItem[];
  markdown?: string;
  graph?: Record<string, any>;
}

export interface AddExtractionsResponse {
  success: boolean;
  doc_id: string;
  chunk_count: number;
  error?: string;
}

export interface VectorStoreStats {
  collection_name: string;
  vectors_count: number;
  points_count: number;
}

export interface DocumentInfo {
  doc_id: string;
  title: string;
  content_preview: string;
  chunk_count: number;
  created_at?: string;
}

export interface DocumentChunkInfo {
  chunk_id?: string;
  doc_id: string;
  doc_title: string;
  content: string;
  chunk_type?: string;
  attributes: Record<string, any>;
}

export interface DocumentDetail {
  doc_id: string;
  title: string;
  markdown?: string;
  graph?: Record<string, any>;
  extractions: KnowledgeExtractionItem[];
  created_at?: string;
  updated_at?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        // 处理 FastAPI 422 验证错误
        if (response.status === 422 && error.detail) {
          if (Array.isArray(error.detail)) {
            const messages = error.detail.map((err: any) =>
              `${err.loc.join('.')}: ${err.msg}`
            ).join('; ');
            throw new Error(`参数验证失败: ${messages}`);
          }
          throw new Error(error.detail);
        }
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  /**
   * 获取所有场景列表
   */
  async getScenarios(): Promise<ScenarioInfo[]> {
    return this.request<ScenarioInfo[]>('/scenarios');
  }

  /**
   * 获取场景详情
   */
  async getScenario(scenarioId: string): Promise<ScenarioInfo> {
    return this.request<ScenarioInfo>(`/scenarios/${scenarioId}`);
  }

  /**
   * 获取场景示例
   */
  async getScenarioSamples(scenarioId: string): Promise<SampleReport[]> {
    return this.request<SampleReport[]>(`/scenarios/${scenarioId}/samples`);
  }

  /**
   * 执行文本提取
   */
  async extract(request: ExtractionRequest): Promise<ExtractionResponse> {
    return this.request<ExtractionResponse>('/extract', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/cache/stats');
  }

  /**
   * 清空缓存
   */
  async clearCache(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/cache', {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // RAG 相关 API
  // ===========================================================================

  /**
   * 解析 PDF 文档 (URL)
   */
  async parsePDF(request: PDFParseRequest): Promise<PDFParseResponse> {
    return this.request<PDFParseResponse>('/rag/pdf/parse', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 上传并解析本地 PDF 文件
   */
  async uploadPDF(
    file: File,
    options: {
      modelVersion?: 'vlm' | 'pipeline';
      extractAfterParse?: boolean;
      scenario?: ScenarioType;
    } = {}
  ): Promise<PDFParseResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_version', options.modelVersion || 'vlm');
    formData.append('extract_after_parse', String(options.extractAfterParse || false));
    if (options.scenario) {
      formData.append('scenario', options.scenario);
    }

    const url = `${this.baseUrl}/rag/pdf/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 查询 PDF 解析任务状态
   */
  async getPDFTaskStatus(taskId: string): Promise<PDFTaskStatusResponse> {
    return this.request<PDFTaskStatusResponse>(`/rag/pdf/task/${taskId}`);
  }

  /**
   * 语义搜索
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>('/rag/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 智能问答
   */
  async askQuestion(request: QARequest): Promise<QAResponse> {
    return this.request<QAResponse>('/rag/qa', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 流式智能问答
   */
  async *askQuestionStream(request: QARequest): AsyncGenerator<{type: string, data: any}> {
    const url = `${this.baseUrl}/rag/qa/stream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const message of lines) {
          if (!message.trim()) continue;

          const eventMatch = message.match(/^event:\s*(\w+)/m);
          const dataMatch = message.match(/^data:\s*(.+)/m);

          if (eventMatch) currentEvent = eventMatch[1];
          if (dataMatch) {
            try {
              const data = JSON.parse(dataMatch[1]);
              yield { type: currentEvent, data };
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 多轮对话
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/rag/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 添加文档到知识库
   */
  async addDocument(request: AddDocumentRequest): Promise<AddDocumentResponse> {
    return this.request<AddDocumentResponse>('/rag/documents', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 添加知识提取结果到知识库（支持溯源）
   */
  async addExtractions(request: AddExtractionsRequest): Promise<AddExtractionsResponse> {
    return this.request<AddExtractionsResponse>('/rag/extractions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 删除文档
   */
  async deleteDocument(docId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/rag/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 获取知识库统计
   */
  async getVectorStats(): Promise<VectorStoreStats> {
    return this.request<VectorStoreStats>('/rag/stats');
  }

  /**
   * 获取知识库文档列表
   */
  async listDocuments(limit: number = 200, offset: number = 0): Promise<DocumentInfo[]> {
    return this.request<DocumentInfo[]>(`/rag/documents?limit=${limit}&offset=${offset}`);
  }

  /**
   * 获取指定文档的所有片段/提取结果
   */
  async getDocumentChunks(docId: string, limit: number = 500): Promise<DocumentChunkInfo[]> {
    return this.request<DocumentChunkInfo[]>(`/rag/documents/${docId}/chunks?limit=${limit}`);
  }

  /**
   * 获取知识库文档详情
   */
  async getDocument(docId: string): Promise<DocumentDetail> {
    return this.request<DocumentDetail>(`/rag/documents/${docId}`);
  }

  /**
   * 初始化/重建知识库
   */
  async initVectorStore(recreate: boolean = false): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/rag/init?recreate=${recreate}`, {
      method: 'POST',
    });
  }
}

// 导出单例
export const apiService = new ApiService();

// 导出类以便测试
export { ApiService };
