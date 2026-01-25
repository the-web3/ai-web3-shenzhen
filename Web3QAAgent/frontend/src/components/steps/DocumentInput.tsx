import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Copy, Check, AlertCircle, File, Hash, Tag, Loader2, Wifi, WifiOff, X, Trash2 } from 'lucide-react';
import { apiService, ScenarioType, DocumentInfo, DocumentDetail } from '../../services/api';

interface DocumentInputProps {
  onNext: () => void;
  selectedDocument: string | null;
  setSelectedDocument: (doc: string) => void;
}

type TabType = 'upload' | 'paste' | 'knowledge';

// 场景映射 - 增强版，包含颜色和描述
const scenarioOptions: {
  id: ScenarioType;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}[] = [
  {
    id: 'web3_dev',
    name: 'Web3 开发学习',
    icon: '🧩',
    color: 'text-emerald-700',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100',
    borderColor: 'border-emerald-300',
    description: '合约、工具、安全'
  },
  {
    id: 'web3_product',
    name: 'Web3 产品学习',
    icon: '🧭',
    color: 'text-indigo-700',
    bgColor: 'bg-gradient-to-br from-indigo-50 to-blue-100',
    borderColor: 'border-indigo-300',
    description: '产品、指标、经济'
  },
  {
    id: 'web3_testing',
    name: 'Web3 测试学习',
    icon: '🛡️',
    color: 'text-amber-700',
    bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    borderColor: 'border-amber-300',
    description: '用例、风险、工具'
  },
];

export function DocumentInput({ onNext, selectedDocument, setSelectedDocument }: DocumentInputProps) {
  const [activeTab, setActiveTab] = useState<TabType>('paste');
  const [pastedText, setPastedText] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);

  // 粘贴文本相关状态 - 默认选择金融分析场景
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('web3_dev');
  const [isApiHealthy, setIsApiHealthy] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [apiModel, setApiModel] = useState('');
  const [pastedTextConfirmed, setPastedTextConfirmed] = useState(false);

  // PDF 文件上传相关状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const [parseError, setParseError] = useState('');
  const [parsedMarkdown, setParsedMarkdown] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 已保存的知识库文档
  const [knowledgeDocs, setKnowledgeDocs] = useState<DocumentInfo[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [selectedKnowledgeDetail, setSelectedKnowledgeDetail] = useState<DocumentDetail | null>(null);
  const [docActionError, setDocActionError] = useState<string | null>(null);
  const [selectingDocId, setSelectingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // 检查 API 健康状态
  useEffect(() => {
    const checkHealth = async () => {
      setIsCheckingApi(true);
      try {
        const health = await apiService.healthCheck();
        setIsApiHealthy(health.status === 'ok');
        setApiModel(health.model);
      } catch {
        setIsApiHealthy(false);
      } finally {
        setIsCheckingApi(false);
      }
    };
    checkHealth();
  }, []);

  const loadKnowledgeDocs = async () => {
    setIsLoadingDocs(true);
    setDocsError(null);
    try {
      const docs = await apiService.listDocuments();
      setKnowledgeDocs(docs);
    } catch (error) {
      setDocsError(error instanceof Error ? error.message : '加载知识库文档失败');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const buildExtractedItems = (detail: DocumentDetail) => {
    return detail.extractions.map((ext, index) => ({
      id: `kb-${detail.doc_id}-${index}`,
      type: ext.extraction_class,
      value: ext.extraction_text,
      role: ext.attributes?.['类型'] || ext.attributes?.['职位'] || ext.extraction_class,
      highlight: ext.extraction_text,
      pass: index < detail.extractions.length / 2 ? 1 : 2,
      confidence: 90,
      attributes: ext.attributes,
    }));
  };

  const handleSelectKnowledgeDoc = async (doc: DocumentInfo) => {
    setDocActionError(null);
    setSelectingDocId(doc.doc_id);
    try {
      const detail = await apiService.getDocument(doc.doc_id);
      if (!detail.markdown) {
        setDocActionError('该文档未保存 Markdown，请重新保存提取结果');
        return;
      }

      const extractedItems = buildExtractedItems(detail);
      sessionStorage.setItem('pastedText', detail.markdown);
      sessionStorage.setItem('documentTitle', detail.title || doc.title || doc.doc_id);
      sessionStorage.setItem('lastSavedDocId', detail.doc_id);
      sessionStorage.setItem('sourceDocId', detail.doc_id);
      sessionStorage.setItem('extractedItems', JSON.stringify(extractedItems));

      setSelectedKnowledgeDetail(detail);
      setSelectedDocument(`kb:${detail.doc_id}`);
      setShowMetadata(true);
    } catch (error) {
      setDocActionError(error instanceof Error ? error.message : '加载文档详情失败');
    } finally {
      setSelectingDocId(null);
    }
  };

  const handleDeleteKnowledgeDoc = async (docId: string) => {
    setDocActionError(null);
    if (!window.confirm('确认删除该知识库文档吗？')) {
      return;
    }
    setDeletingDocId(docId);
    try {
      await apiService.deleteDocument(docId);
      await loadKnowledgeDocs();
      if (selectedDocument === `kb:${docId}`) {
        setSelectedDocument(null);
        setSelectedKnowledgeDetail(null);
      }
    } catch (error) {
      setDocActionError(error instanceof Error ? error.message : '删除文档失败');
    } finally {
      setDeletingDocId(null);
    }
  };

  useEffect(() => {
    loadKnowledgeDocs();
  }, []);

  const handlePasteSubmit = () => {
    if (pastedText.trim() && isApiHealthy) {
      // 保存粘贴的文本到 sessionStorage，供后续步骤使用
      sessionStorage.setItem('pastedText', pastedText);
      sessionStorage.setItem('selectedScenario', selectedScenario);
      sessionStorage.removeItem('sourceDocId');
      sessionStorage.removeItem('pdfFileName');
      sessionStorage.removeItem('extractedItems');
      sessionStorage.removeItem('lastSavedDocId');
      setSelectedDocument('pasted-text');
      setPastedTextConfirmed(true);
      setShowMetadata(true);
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setParseError('请选择 PDF 文件');
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        setParseError('文件过大，最大支持 200MB');
        return;
      }
      setSelectedFile(file);
      setParseError('');
      setParsedMarkdown('');
    }
  };

  // PDF 文件上传解析
  const handlePdfUpload = async () => {
    if (!selectedFile || !isApiHealthy) return;

    setIsParsing(true);
    setParseError('');
    setParseProgress('正在上传文件到 MinerU...');

    try {
      setParseProgress('正在解析 PDF，请稍候（可能需要 1-5 分钟）...');

      const response = await apiService.uploadPDF(selectedFile, {
        modelVersion: 'vlm',
        extractAfterParse: false,
      });

      if (response.success && response.markdown) {
        setParsedMarkdown(response.markdown);
        setParseProgress('解析完成！');

        // 保存解析结果
        sessionStorage.setItem('pastedText', response.markdown);
        sessionStorage.setItem('selectedScenario', selectedScenario);
        sessionStorage.setItem('documentTitle', selectedFile.name);
        sessionStorage.setItem('pdfFileName', selectedFile.name);
        sessionStorage.removeItem('extractedItems');
        sessionStorage.removeItem('lastSavedDocId');
        if (response.task_id) {
          sessionStorage.setItem('sourceDocId', response.task_id);
        }
        setSelectedDocument('pdf-parsed');
        setShowMetadata(true);
      } else {
        setParseError(response.error || '解析失败');
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : '解析请求失败');
    } finally {
      setIsParsing(false);
    }
  };

  // 粘贴文本的元数据
  const pastedMetadata = pastedTextConfirmed ? {
    pageCount: 1,
    wordCount: pastedText.length,
    documentType: 'research' as const,
    documentTypeLabel: scenarioOptions.find(s => s.id === selectedScenario)?.name || '自定义文本',
  } : null;

  // PDF 解析的元数据
  const pdfMetadata = parsedMarkdown ? {
    pageCount: 1,
    wordCount: parsedMarkdown.length,
    documentType: 'research' as const,
    documentTypeLabel: 'PDF 文档',
  } : null;

  const isKnowledgeDoc = selectedDocument?.startsWith('kb:');
  const knowledgeMetadata = isKnowledgeDoc && selectedKnowledgeDetail ? {
    pageCount: 1,
    wordCount: selectedKnowledgeDetail.markdown?.length || 0,
    documentType: 'research' as const,
    documentTypeLabel: '知识库文档',
  } : null;

  const displayMetadata = selectedDocument === 'pasted-text' ? pastedMetadata :
                          selectedDocument === 'pdf-parsed' ? pdfMetadata :
                          knowledgeMetadata;

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4">
      {/* Step Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            1
          </div>
          <span>第 1 步，共 4 步 – 理解文档</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">选择或上传文档</h2>
        <p className="text-gray-600">
          AI 将首先阅读并理解整个文档，然后再提取信息
        </p>
      </div>

      {/* Tab Selector */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
        {/* Tabs Header */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${
              activeTab === 'upload'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>上传 PDF</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${
              activeTab === 'paste'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Copy className="w-5 h-5" />
            <span>粘贴文本</span>
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${
              activeTab === 'knowledge'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>知识库文档</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {/* Upload Tab - 本地文件上传 */}
            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* API 状态指示器 */}
                <div className={`mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  isCheckingApi ? 'bg-gray-100 text-gray-600' :
                  isApiHealthy ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {isCheckingApi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在连接后端服务...</span>
                    </>
                  ) : isApiHealthy ? (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>已连接 - MinerU PDF 解析服务可用</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>后端服务未连接</span>
                    </>
                  )}
                </div>

                {/* 文件上传区域 */}
                <div className="space-y-4">
                  {/* 隐藏的文件输入 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* 拖拽上传区域 */}
                  <div
                    onClick={() => !isParsing && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      isParsing
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : selectedFile
                        ? 'border-blue-400 bg-blue-50 cursor-pointer hover:bg-blue-100'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setParsedMarkdown('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          移除文件
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">点击选择 PDF 文件</p>
                          <p className="text-xs text-gray-500 mt-1">
                            支持 PDF 格式，最大 200MB，最多 600 页
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 场景选择器 - 卡片网格布局 */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-gray-800">选择提取场景</label>
                      <span className="text-xs text-gray-500">专注 Web3 学习场景</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                      {scenarioOptions.map((scenario) => (
                        <motion.button
                          key={scenario.id}
                          onClick={() => setSelectedScenario(scenario.id)}
                          className={`relative group p-3 lg:p-4 rounded-xl border-2 transition-all text-center overflow-hidden ${
                            selectedScenario === scenario.id
                              ? `${scenario.borderColor} ${scenario.bgColor} shadow-lg ring-2 ring-offset-1 ring-opacity-50`
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                          style={{
                            ringColor: selectedScenario === scenario.id ? scenario.borderColor.replace('border-', '').replace('-300', '') : undefined
                          }}
                          whileHover={{ scale: 1.03, y: -3 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {/* 选中指示器 */}
                          {selectedScenario === scenario.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
                            >
                              <Check className={`w-3 h-3 ${scenario.color}`} />
                            </motion.div>
                          )}

                          {/* 图标 */}
                          <div className={`text-2xl lg:text-3xl mb-1.5 transition-transform group-hover:scale-110 ${
                            selectedScenario === scenario.id ? 'transform scale-110' : ''
                          }`}>
                            {scenario.icon}
                          </div>

                          {/* 名称 */}
                          <h4 className={`font-semibold text-xs lg:text-sm mb-0.5 ${
                            selectedScenario === scenario.id ? scenario.color : 'text-gray-800'
                          }`}>
                            {scenario.name}
                          </h4>

                          {/* 描述 */}
                          <p className={`text-[10px] lg:text-xs leading-tight ${
                            selectedScenario === scenario.id ? scenario.color + ' opacity-80' : 'text-gray-500'
                          }`}>
                            {scenario.description}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* 上传按钮 */}
                  <button
                    onClick={handlePdfUpload}
                    disabled={!selectedFile || !isApiHealthy || isParsing}
                    className={`w-full py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                      selectedFile && isApiHealthy && !isParsing
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>解析中...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>上传并解析 PDF</span>
                      </>
                    )}
                  </button>

                  {/* 解析进度 */}
                  {isParsing && parseProgress && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-blue-800">{parseProgress}</span>
                    </div>
                  )}

                  {/* 错误提示 */}
                  {parseError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm text-red-900 mb-1">解析失败</h4>
                        <p className="text-xs text-red-800">{parseError}</p>
                      </div>
                    </div>
                  )}

                  {/* 成功提示 */}
                  {parsedMarkdown && !isParsing && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm text-green-900 mb-1">PDF 解析成功</h4>
                        <p className="text-xs text-green-800">
                          已提取 {parsedMarkdown.length.toLocaleString()} 个字符
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 注意事项 */}
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm text-amber-900 mb-1">注意事项</h4>
                    <p className="text-xs text-amber-800">
                      PDF 文件将上传至 MinerU 云端进行解析。解析时间取决于 PDF 页数，通常需要 1-5 分钟。
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Paste Tab - 对接后端 API */}
            {activeTab === 'paste' && (
              <motion.div
                key="paste"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* API 状态指示器 */}
                <div className={`mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  isCheckingApi ? 'bg-gray-100 text-gray-600' :
                  isApiHealthy ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {isCheckingApi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在连接后端服务...</span>
                    </>
                  ) : isApiHealthy ? (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>已连接 - 模型: {apiModel}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>后端服务未连接，请启动后端服务</span>
                    </>
                  )}
                </div>

                {/* 场景选择器 - 卡片网格布局 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-gray-800">选择提取场景</label>
                    <span className="text-xs text-gray-500">专注 Web3 学习场景</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                    {scenarioOptions.map((scenario) => (
                      <motion.button
                        key={scenario.id}
                        onClick={() => setSelectedScenario(scenario.id)}
                        className={`relative group p-3 lg:p-4 rounded-xl border-2 transition-all text-center overflow-hidden ${
                          selectedScenario === scenario.id
                            ? `${scenario.borderColor} ${scenario.bgColor} shadow-lg ring-2 ring-offset-1 ring-opacity-50`
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        }`}
                        whileHover={{ scale: 1.03, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {/* 选中指示器 */}
                        {selectedScenario === scenario.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
                          >
                            <Check className={`w-3 h-3 ${scenario.color}`} />
                          </motion.div>
                        )}

                        {/* 图标 */}
                        <div className={`text-2xl lg:text-3xl mb-1.5 transition-transform group-hover:scale-110 ${
                          selectedScenario === scenario.id ? 'transform scale-110' : ''
                        }`}>
                          {scenario.icon}
                        </div>

                        {/* 名称 */}
                        <h4 className={`font-semibold text-xs lg:text-sm mb-0.5 ${
                          selectedScenario === scenario.id ? scenario.color : 'text-gray-800'
                        }`}>
                          {scenario.name}
                        </h4>

                        {/* 描述 */}
                        <p className={`text-[10px] lg:text-xs leading-tight ${
                          selectedScenario === scenario.id ? scenario.color + ' opacity-80' : 'text-gray-500'
                        }`}>
                          {scenario.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      setPastedTextConfirmed(false);
                    }}
                    placeholder="在此粘贴您的文档内容..."
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {pastedText.length} 个字符
                      {pastedTextConfirmed && (
                        <span className="ml-2 text-green-600 flex items-center gap-1 inline-flex">
                          <Check className="w-4 h-4" />
                          已确认
                        </span>
                      )}
                    </span>
                    <button
                      onClick={handlePasteSubmit}
                      disabled={!pastedText.trim() || !isApiHealthy}
                      className={`px-6 py-2 rounded-lg transition-all ${
                        pastedText.trim() && isApiHealthy
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      确认
                    </button>
                  </div>
                </div>

                {!isApiHealthy && (
                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm text-amber-900 mb-1">需要启动后端服务</h4>
                      <p className="text-xs text-amber-800">
                        请先启动后端服务：cd backend && python -m uvicorn app.main:app --reload
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Knowledge Base Tab */}
            {activeTab === 'knowledge' && (
              <motion.div
                key="knowledge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">知识库文档</h3>
                    <p className="text-sm text-gray-600">所有已入库的内容都会参与智能问答与检索</p>
                  </div>
                  <button
                    onClick={loadKnowledgeDocs}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    <Loader2 className={`w-4 h-4 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                    <span>刷新</span>
                  </button>
                </div>

                {docsError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
                    {docsError}
                  </div>
                )}
                {docActionError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4">
                    {docActionError}
                  </div>
                )}

                {isLoadingDocs ? (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>正在加载知识库文档...</span>
                  </div>
                ) : knowledgeDocs.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-600">
                    知识库为空，请先在上方上传或粘贴文档并保存到知识库。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {knowledgeDocs.map((doc) => (
                      <div
                        key={doc.doc_id}
                        onClick={() => handleSelectKnowledgeDoc(doc)}
                        className={`border-2 rounded-xl p-4 bg-white transition-all cursor-pointer ${
                          selectedDocument === `kb:${doc.doc_id}`
                            ? 'border-blue-500 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <h4 className="font-semibold text-gray-900 break-all">{doc.title || doc.doc_id}</h4>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                              {doc.content_preview || '无预览内容'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                              <Hash className="w-3 h-3" />
                              <span>{doc.chunk_count}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteKnowledgeDoc(doc.doc_id);
                              }}
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                              disabled={deletingDocId === doc.doc_id}
                            >
                              {deletingDocId === doc.doc_id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              <span>删除</span>
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          文档 ID: <span className="font-mono break-all">{doc.doc_id}</span>
                        </div>
                        {selectingDocId === doc.doc_id && (
                          <div className="mt-3 text-xs text-blue-600 flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            正在加载...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Document Metadata */}
      <AnimatePresence>
        {showMetadata && displayMetadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl border-2 border-gray-200 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <File className="w-5 h-5 text-blue-600" />
              <h3 className="text-gray-900">文档信息</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">{selectedDocument === 'pasted-text' ? '段落' : '页数'}</div>
                  <div className="text-xl text-gray-900">{displayMetadata.pageCount}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Hash className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">{selectedDocument === 'pasted-text' ? '字符数' : '字数'}</div>
                  <div className="text-xl text-gray-900">{displayMetadata.wordCount.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <Tag className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">{selectedDocument === 'pasted-text' ? '提取场景' : '文档类型'}</div>
                  <div className="text-xl text-gray-900">{displayMetadata.documentTypeLabel}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructional Text */}
      {showMetadata && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-blue-900 mb-2">接下来会发生什么？</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {selectedDocument === 'pasted-text' ? (
                  <>AI 将使用 <strong>{apiModel || 'DeepSeek'}</strong> 模型分析您粘贴的文本，自动提取关键信息。整个过程透明可见，您可以随时查看处理结果。</>
                ) : (
                  <>AI 将首先阅读并理解整个文档内容，然后自动提取关键信息、识别重要实体、构建知识关系图，并准备回答您的问题。整个过程透明可见，您可以随时查看每一步的处理结果。</>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Primary Action Button */}
      <div className="flex justify-center pt-4">
        <motion.button
          onClick={onNext}
          disabled={!selectedDocument}
          className={`flex items-center gap-3 px-10 py-4 rounded-xl text-lg transition-all ${
            selectedDocument
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          whileHover={selectedDocument ? { scale: 1.02 } : {}}
          whileTap={selectedDocument ? { scale: 0.98 } : {}}
        >
          <span>开始分析</span>
          {selectedDocument && (
            <motion.div
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </motion.div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
