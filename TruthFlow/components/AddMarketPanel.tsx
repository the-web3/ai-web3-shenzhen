import React, { useState } from 'react';
import { Plus, X, Target, AlertTriangle, Sparkles, Loader2, Upload, FileText } from 'lucide-react';
import { Market } from '../types';
import { aiAnalysisService } from '../services/aiAnalysisService';

interface AddMarketPanelProps {
  onAddMarket: (market: Omit<Market, 'id' | 'history'>) => Promise<void>;
  onClose: () => void;
  onStartCreating: () => void;
  userAddress: string | null;
}

const AddMarketPanel: React.FC<AddMarketPanelProps> = ({ onAddMarket, onClose, onStartCreating, userAddress }) => {
  const [formData, setFormData] = useState({
    title: '',
    titleCN: '',
    description: '',
    rwaType: 'Energy' as 'Energy' | 'Infra' | 'SupplyChain',
    totalLiquidity: 0.001,
    yesPool: 5000,
    noPool: 5000,
    depositAmount: 0.001,
    yieldEnabled: true,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600&h=400',
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // 默认7天后
  });

  const [companies, setCompanies] = useState<string[]>([]);
  const [persons, setPersons] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [personInput, setPersonInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [mdFile, setMdFile] = useState<File | null>(null);
  const [mdContent, setMdContent] = useState<string>('');
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [uploadedEventTitle, setUploadedEventTitle] = useState('');

  const addCompany = () => {
    if (companyInput.trim() && !companies.includes(companyInput.trim())) {
      setCompanies([...companies, companyInput.trim()]);
      setCompanyInput('');
    }
  };

  const removeCompany = (index: number) => {
    setCompanies(companies.filter((_, i) => i !== index));
  };

  const addPerson = () => {
    if (personInput.trim() && !persons.includes(personInput.trim())) {
      setPersons([...persons, personInput.trim()]);
      setPersonInput('');
    }
  };

  const removePerson = (index: number) => {
    setPersons(persons.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      alert('请上传 .md 格式的文件');
      return;
    }

    try {
      // 只读取文件内容，不调用AI
      const text = await file.text();
      setMdFile(file);
      setMdContent(text);
      setIsUploadMode(true);
      
      alert('MD文件已上传！点击"确认创建"将调用AI分析并创建市场。');
    } catch (error: any) {
      alert('文件读取失败: ' + error.message);
    }
  };

  const clearUpload = () => {
    setMdFile(null);
    setMdContent('');
    setIsUploadMode(false);
    setUploadedEventTitle('');
    setAiResult(null);
    setCompanies([]);
    setPersons([]);
    setFormData({
      title: '',
      titleCN: '',
      description: '',
      rwaType: 'Energy' as 'Energy' | 'Infra' | 'SupplyChain',
      totalLiquidity: 0.001,
      yesPool: 5000,
      noPool: 5000,
      depositAmount: 0.001,
      yieldEnabled: true,
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600&h=400',
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    });
  };

  const handleAIAnalysis = async () => {
    if (!formData.description) {
      alert('请先填写情报简报');
      return;
    }

    if (!formData.title) {
      alert('请先填写目标名称');
      return;
    }

    if (!userAddress) {
      alert('请先连接钱包！');
      return;
    }

    // 关闭面板，触发"正在新建"状态
    onStartCreating();

    // 后台执行 AI 分析
    try {
      let result;
      
      // 如果是上传模式，直接使用已有的AI分析结果
      if (isUploadMode && aiResult) {
        result = {
          success: true,
          data: aiResult
        };
      } else {
        // 手动填写模式，调用原有的AI分析
        result = await aiAnalysisService.analyzeEvent({
          question: formData.description,
          companies,
          persons
        });
      }

      if (result.success && result.data) {
        // 使用 AI 生成的概率计算初始池子
        const pools = aiAnalysisService.calculateInitialPools(
          result.data.adjusted_probability,
          formData.totalLiquidity
        );
        
        const depositAmount = formData.depositAmount || 0.001;
        const yieldEnabled = depositAmount > 0;
        
        const newMarket: Omit<Market, 'id' | 'history'> = {
          ...formData,
          yesPool: pools.yesPool,
          noPool: pools.noPool,
          resolved: false,
          outcome: null,
          activeSyndicates: [],
          hasZeroDayOffer: false,
          depositAmount: depositAmount,
          yieldEnabled: yieldEnabled,
          accumulatedYield: 0,
          createdAt: Date.now()
        };
        
        await onAddMarket(newMarket);
        onClose();
      } else {
        alert('AI 分析失败: ' + result.error);
        onClose();
      }
    } catch (error: any) {
      alert('创建市场失败: ' + error.message);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAddress) {
      alert('请先连接钱包！');
      return;
    }

    // 关闭面板，触发"正在新建"状态
    onStartCreating();

    try {
      let pools = { yesPool: formData.yesPool, noPool: formData.noPool };
      let finalFormData = { ...formData };
      
      // 如果是上传模式且还没有AI分析结果，现在调用AI
      if (isUploadMode && mdContent && !aiResult) {
        // 调用AI API分析MD文件
        const response = await fetch('https://ai-production-f4f1.up.railway.app/api/analyze-from-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filename: mdFile?.name || 'document.md',
            use_ai: true,
            md_content: mdContent
          })
        });

        if (!response.ok) {
          throw new Error('AI分析失败');
        }

        const result = await response.json();
        setAiResult(result);
        
        // 使用AI分析结果
        if (result.adjusted_probability) {
          pools = aiAnalysisService.calculateInitialPools(
            result.adjusted_probability,
            formData.totalLiquidity
          );
        }
        
        // 更新表单数据
        finalFormData = {
          ...formData,
          title: result.event_title || formData.title,
          description: result.input?.detailed_info || formData.description
        };
      } else if (aiResult && aiResult.adjusted_probability) {
        // 如果已有AI分析结果，直接使用
        pools = aiAnalysisService.calculateInitialPools(
          aiResult.adjusted_probability,
          formData.totalLiquidity
        );
      }

      const depositAmount = formData.depositAmount || 0.001;
      const yieldEnabled = depositAmount > 0;
      
      const newMarket: Omit<Market, 'id' | 'history'> = {
        ...finalFormData,
        yesPool: pools.yesPool,
        noPool: pools.noPool,
        resolved: false,
        outcome: null,
        activeSyndicates: [],
        hasZeroDayOffer: false,
        depositAmount: depositAmount,
        yieldEnabled: yieldEnabled,
        accumulatedYield: 0,
        createdAt: Math.floor(Date.now() / 1000),
        duration: 7 * 24 * 60 * 60
      };

      await onAddMarket(newMarket);
      onClose();
    } catch (error: any) {
      alert('创建市场失败: ' + error.message);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-900 border-2 border-red-500/50 shadow-[0_0_30px_rgba(255,0,0,0.3)] p-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-3">
            <Target className="text-red-500" size={24} />
            <h2 className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              CREATE NEW TARGET
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* MD File Upload Section */}
        {!isUploadMode && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="text-purple-400" size={20} />
              <h3 className="text-sm font-mono font-bold text-purple-400">UPLOAD MD FILE (OPTIONAL)</h3>
            </div>
            <p className="text-xs text-gray-400 font-mono mb-3">
              Upload a Markdown file for automatic AI analysis. The system will extract companies, persons, and event details.
            </p>
            <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500 text-purple-300 font-mono cursor-pointer transition-colors">
              <FileText size={18} />
              <span>SELECT .MD FILE</span>
              <input
                type="file"
                accept=".md"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isAnalyzing}
              />
            </label>
          </div>
        )}

        {/* Upload Mode Indicator */}
        {isUploadMode && mdFile && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-green-400" size={20} />
                <div>
                  <div className="text-sm font-mono font-bold text-green-400">MD FILE UPLOADED</div>
                  <div className="text-xs text-gray-400 font-mono">{mdFile.name}</div>
                  <div className="text-xs text-yellow-400 font-mono mt-1">📄 AI will analyze when you click CONFIRM CREATE</div>
                </div>
              </div>
              <button
                type="button"
                onClick={clearUpload}
                className="px-3 py-1 bg-red-600/50 hover:bg-red-600 border border-red-500 text-white font-mono text-xs transition-colors"
              >
                CLEAR
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title (English) */}
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2">
              TARGET NAME (EN) * {isUploadMode && <span className="text-green-400">(Editable)</span>}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Target: Lithium Reserve #L-992"
              className="w-full bg-black/50 border border-gray-700 px-4 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
              required
            />
          </div>

          {/* Title (Chinese) */}
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2">
              TARGET NAME (CN) {isUploadMode && <span className="text-green-400">(Editable)</span>}
            </label>
            <input
              type="text"
              value={formData.titleCN}
              onChange={(e) => setFormData({ ...formData, titleCN: e.target.value })}
              placeholder="目标：阿根廷 #L-992 锂矿储备"
              className="w-full bg-black/50 border border-gray-700 px-4 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
              disabled={isUploadMode}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2">
              DETAIL BRIEF * {isUploadMode && <span className="text-yellow-400">(Auto-filled from MD)</span>}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Audit the satellite spectral analysis..."
              rows={4}
              className="w-full bg-black/50 border border-gray-700 px-4 py-2 text-white font-mono focus:border-red-500 focus:outline-none resize-none"
              required
              disabled={isUploadMode}
            />
          </div>

          {/* Asset Category */}
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2">
              ASSET CATEGORY {isUploadMode && <span className="text-yellow-400">(Locked)</span>}
            </label>
            <input
              type="text"
              value={formData.rwaType}
              onChange={(e) => setFormData({ ...formData, rwaType: e.target.value as any })}
              placeholder="e.g., Energy, Infrastructure, Supply Chain..."
              className="w-full bg-black/50 border border-gray-700 px-4 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
              disabled={isUploadMode}
            />
          </div>

          {/* Companies */}
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2">
              RELATED COMPANIES {isUploadMode && <span className="text-yellow-400">(Auto-extracted from MD)</span>}
            </label>
            {!isUploadMode && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompany())}
                  placeholder="Enter company name..."
                  className="flex-1 bg-black/50 border border-gray-700 px-4 py-2 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCompany}
                  className="px-4 py-2 bg-cyan-600/50 hover:bg-cyan-600 border border-cyan-500 text-white font-mono text-sm transition-colors"
                >
                  ADD
                </button>
              </div>
            )}
            {companies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {companies.map((company, index) => (
                  <div key={index} className="flex items-center gap-2 bg-cyan-900/30 border border-cyan-500/50 px-3 py-1 text-cyan-400 font-mono text-sm">
                    <span>{company}</span>
                    {!isUploadMode && (
                      <button
                        type="button"
                        onClick={() => removeCompany(index)}
                        className="text-cyan-400 hover:text-white"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Persons */}
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2">
              RELATED PERSONS {isUploadMode && <span className="text-yellow-400">(Auto-extracted from MD)</span>}
            </label>
            {!isUploadMode && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={personInput}
                  onChange={(e) => setPersonInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())}
                  placeholder="Enter person name..."
                  className="flex-1 bg-black/50 border border-gray-700 px-4 py-2 text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addPerson}
                  className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 border border-purple-500 text-white font-mono text-sm transition-colors"
                >
                  ADD
                </button>
              </div>
            )}
            {persons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {persons.map((person, index) => (
                  <div key={index} className="flex items-center gap-2 bg-purple-900/30 border border-purple-500/50 px-3 py-1 text-purple-400 font-mono text-sm">
                    <span>{person}</span>
                    {!isUploadMode && (
                      <button
                        type="button"
                        onClick={() => removePerson(index)}
                        className="text-purple-400 hover:text-white"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis Button */}

          {/* AI Result Display */}
          {aiResult && (
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-mono text-sm font-bold">
                <Sparkles size={16} />
                AI ANALYSIS COMPLETE
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-gray-400 font-mono">PROBABILITY</div>
                  <div className="text-lg font-bold text-blue-400">{aiResult.adjusted_probability}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-mono">CONFIDENCE</div>
                  <div className="text-lg font-bold text-blue-400">{aiResult.confidence}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-mono">YES ODDS</div>
                  <div className="text-lg font-bold text-green-400">{aiResult.success_odds.toFixed(2)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                Pools auto-calculated based on AI probability
              </div>
            </div>
          )}

          {/* End Time */}
          <div>
            <label className="block text-xs font-mono text-blue-400 mb-2">
              MARKET END TIME
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full bg-black/50 border border-blue-700 px-4 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
            />
            <small className="text-xs text-gray-500 font-mono mt-1 block">
              Market will close for trading at this time
            </small>
          </div>

          {/* Total Liquidity */}
          <div>
            <label className="block text-xs font-mono text-blue-400 mb-2">
              CREATOR DEPOSIT (ETH - YOU PROVIDE)
            </label>
            <input
              type="number"
              value={formData.depositAmount}
              onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
              min="0.001"
              step="0.001"
              className="w-full bg-black/50 border border-blue-700 px-4 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
            />
            <small className="text-xs text-yellow-500 font-mono mt-1 block">
              ⚠️ You will send {formData.depositAmount.toFixed(4)} ETH as creator deposit (Ethereum Sepolia)
            </small>
            <small className="text-xs text-cyan-400 font-mono mt-1 block">
              💡 System will auto-switch to Ethereum Sepolia network for deposit payment
            </small>
            {formData.depositAmount > 0 ? (
              <small className="text-xs text-green-400 font-mono mt-1 block">
                ✅ Yield Enabled: 5% APR (~{(formData.depositAmount * 0.05).toFixed(6)} ETH/year)
              </small>
            ) : (
              <small className="text-xs text-gray-500 font-mono mt-1 block">
                ⚠️ Set deposit amount to enable yield generation (5% APR)
              </small>
            )}
            <small className="text-xs text-gray-500 font-mono mt-1 block">
              💰 Deposit will be stored in DepositManager contract and can be withdrawn after market resolves
            </small>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 bg-blue-900/20 border border-blue-500/30 p-4">
            <Sparkles className="text-blue-400 flex-shrink-0 mt-1" size={20} />
            <div className="text-xs font-mono text-gray-300">
              <p className="text-blue-400 font-bold mb-1">AI-POWERED DEPLOYMENT</p>
              <p>Click "AI ANALYZE & DEPLOY" to analyze your target using advanced AI risk assessment. The system will automatically calculate optimal initial pools and deploy the market.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 p-4">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={20} />
            <div className="text-xs font-mono text-gray-300">
              <p className="text-red-400 font-bold mb-1">SECURITY NOTICE</p>
              <p>New targets will be immediately visible to all AI Gladiators and Human Hunters. Ensure intel accuracy before deployment.</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isAnalyzing || (isUploadMode ? !mdFile : (!formData.description || !formData.title))}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-600 text-white font-mono font-bold py-3 px-6 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] disabled:shadow-none"
            >
              <span className="flex items-center justify-center gap-2">
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    CREATING...
                  </>
                ) : (
                  <>
                    <Target size={20} />
                    CONFIRM CREATE
                  </>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono border border-gray-600 transition-colors"
            >
              ABORT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMarketPanel;
