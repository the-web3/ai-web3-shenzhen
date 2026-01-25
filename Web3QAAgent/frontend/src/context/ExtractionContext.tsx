import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  apiService,
  ExtractionResponse,
  ExtractionItem,
  ScenarioType,
  ScenarioInfo,
  SampleReport,
  AddExtractionsResponse,
} from '../services/api';

interface ExtractionState {
  // 输入状态
  inputText: string;
  scenario: ScenarioType;
  documentTitle: string;  // 文档标题（用于存储到知识库）

  // 提取状态
  isExtracting: boolean;
  extractionResult: ExtractionResponse | null;
  extractionError: string | null;

  // 知识库存储状态
  isSavingToKnowledge: boolean;
  lastSaveResult: AddExtractionsResponse | null;

  // 场景信息
  scenarios: ScenarioInfo[];
  samples: SampleReport[];

  // API 状态
  isApiHealthy: boolean;
  apiModel: string;
}

interface ExtractionContextType extends ExtractionState {
  // 输入操作
  setInputText: (text: string) => void;
  setScenario: (scenario: ScenarioType) => void;
  setDocumentTitle: (title: string) => void;

  // API 操作
  checkApiHealth: () => Promise<boolean>;
  loadScenarios: () => Promise<void>;
  loadSamples: (scenarioId: string) => Promise<void>;

  // 提取操作
  extractText: (text?: string) => Promise<ExtractionResponse | null>;
  clearResult: () => void;

  // 知识库操作
  saveExtractionsToKnowledge: (title?: string) => Promise<AddExtractionsResponse | null>;

  // 转换提取结果为 UI 格式
  getExtractedItems: () => ExtractedItemUI[];
}

// UI 用的提取项格式
export interface ExtractedItemUI {
  id: string;
  type: string;
  value: string;
  role: string;
  highlight: string;
  pass: 1 | 2;
  confidence: number;
  attributes?: Record<string, string>;
}

const ExtractionContext = createContext<ExtractionContextType | null>(null);

export function ExtractionProvider({ children }: { children: ReactNode }) {
  // 状态
  const [inputText, setInputText] = useState('');
  const [scenario, setScenario] = useState<ScenarioType>('web3_dev');
  const [documentTitle, setDocumentTitle] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isSavingToKnowledge, setIsSavingToKnowledge] = useState(false);
  const [lastSaveResult, setLastSaveResult] = useState<AddExtractionsResponse | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [samples, setSamples] = useState<SampleReport[]>([]);
  const [isApiHealthy, setIsApiHealthy] = useState(false);
  const [apiModel, setApiModel] = useState('');

  // 检查 API 健康状态
  const checkApiHealth = useCallback(async (): Promise<boolean> => {
    try {
      const health = await apiService.healthCheck();
      setIsApiHealthy(health.status === 'ok');
      setApiModel(health.model);
      return health.status === 'ok';
    } catch (error) {
      console.error('API health check failed:', error);
      setIsApiHealthy(false);
      return false;
    }
  }, []);

  // 加载场景列表
  const loadScenarios = useCallback(async () => {
    try {
      const data = await apiService.getScenarios();
      setScenarios(data);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  }, []);

  // 加载场景示例
  const loadSamples = useCallback(async (scenarioId: string) => {
    try {
      const data = await apiService.getScenarioSamples(scenarioId);
      setSamples(data);
    } catch (error) {
      console.error('Failed to load samples:', error);
    }
  }, []);

  // 执行提取
  const extractText = useCallback(
    async (text?: string): Promise<ExtractionResponse | null> => {
      const textToExtract = text || inputText;
      if (!textToExtract.trim()) {
        setExtractionError('请输入要分析的文本');
        return null;
      }

      setIsExtracting(true);
      setExtractionError(null);

      try {
        const result = await apiService.extract({
          text: textToExtract,
          scenario,
        });

        setExtractionResult(result);

        if (!result.success) {
          setExtractionError(result.error || '提取失败');
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : '网络错误';
        setExtractionError(message);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    [inputText, scenario]
  );

  // 清除结果
  const clearResult = useCallback(() => {
    setExtractionResult(null);
    setExtractionError(null);
    setLastSaveResult(null);
  }, []);

  // 保存提取结果到知识库
  const saveExtractionsToKnowledge = useCallback(
    async (title?: string): Promise<AddExtractionsResponse | null> => {
      if (!extractionResult || !extractionResult.extractions.length) {
        console.warn('没有提取结果可保存');
        return null;
      }

      const docTitle = title || documentTitle || `提取文档-${new Date().toLocaleString()}`;
      setIsSavingToKnowledge(true);

      try {
        // 转换提取结果为知识库格式
        const extractions = extractionResult.extractions.map(item => ({
          extraction_class: item.extraction_class,
          extraction_text: item.extraction_text,
          char_interval: item.char_interval,
          attributes: item.attributes || {},
        }));

        const result = await apiService.addExtractions({
          doc_title: docTitle,
          extractions,
          markdown: inputText,
        });

        setLastSaveResult(result);
        console.log(`成功保存 ${result.chunk_count} 条提取结果到知识库`);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : '保存失败';
        console.error('保存提取结果到知识库失败:', message);
        setLastSaveResult({
          success: false,
          doc_id: '',
          chunk_count: 0,
          error: message,
        });
        return null;
      } finally {
        setIsSavingToKnowledge(false);
      }
    },
    [extractionResult, documentTitle]
  );

  // 转换提取结果为 UI 格式
  const getExtractedItems = useCallback((): ExtractedItemUI[] => {
    if (!extractionResult || !extractionResult.extractions) {
      return [];
    }

    return extractionResult.extractions.map((item, index) => ({
      id: `item-${index}`,
      type: item.extraction_class,
      value: item.extraction_text,
      role: item.attributes?.['类型'] || item.attributes?.['职位'] || item.extraction_class,
      highlight: item.extraction_text,
      pass: index < extractionResult.extractions.length / 2 ? 1 : 2,
      confidence: 85 + Math.random() * 14, // 模拟置信度
      attributes: item.attributes,
    }));
  }, [extractionResult]);

  const value: ExtractionContextType = {
    // 状态
    inputText,
    scenario,
    documentTitle,
    isExtracting,
    extractionResult,
    extractionError,
    isSavingToKnowledge,
    lastSaveResult,
    scenarios,
    samples,
    isApiHealthy,
    apiModel,

    // 操作
    setInputText,
    setScenario,
    setDocumentTitle,
    checkApiHealth,
    loadScenarios,
    loadSamples,
    extractText,
    clearResult,
    saveExtractionsToKnowledge,
    getExtractedItems,
  };

  return (
    <ExtractionContext.Provider value={value}>
      {children}
    </ExtractionContext.Provider>
  );
}

export function useExtraction() {
  const context = useContext(ExtractionContext);
  if (!context) {
    throw new Error('useExtraction must be used within ExtractionProvider');
  }
  return context;
}
