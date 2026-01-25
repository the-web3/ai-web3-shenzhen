import React, { useState } from 'react';
import { Shield, Sword, Brain, Send, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface Challenge {
  id: string;
  type: 'red' | 'blue';
  author: string;
  title: string;
  evidence: string;
  timestamp: Date;
  aiAnalysis?: string;
  aiScore?: number;
}

interface ChallengePanelProps {
  marketId: number;
  marketTitle: string;
  onClose: () => void;
}

const ChallengePanel: React.FC<ChallengePanelProps> = ({ marketId, marketTitle, onClose }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [challengeType, setChallengeType] = useState<'red' | 'blue'>('red');
  const [title, setTitle] = useState('');
  const [evidence, setEvidence] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmitChallenge = async () => {
    if (!title.trim() || !evidence.trim()) {
      alert('请填写完整的质疑/反驳内容');
      return;
    }

    setIsAnalyzing(true);

    try {
      // 调用AI分析证据
      const response = await fetch('http://localhost:8080/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companies: [],
          persons: [],
          detailed_info: `${challengeType === 'red' ? '质疑' : '反驳'}: ${title}\n\n证据:\n${evidence}`
        })
      });

      if (!response.ok) {
        throw new Error('AI分析失败');
      }

      const result = await response.json();

      const newChallenge: Challenge = {
        id: Date.now().toString(),
        type: challengeType,
        author: 'User',
        title,
        evidence,
        timestamp: new Date(),
        aiAnalysis: result.analysis?.final_analysis || '分析完成',
        aiScore: result.probability || 50
      };

      setChallenges([newChallenge, ...challenges]);
      setTitle('');
      setEvidence('');
      setShowSubmitForm(false);
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-cyan-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">红蓝对抗系统</h2>
              <p className="text-gray-400 text-sm">市场: {marketTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Submit Button */}
          {!showSubmitForm && (
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setChallengeType('red');
                  setShowSubmitForm(true);
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
              >
                <Sword className="w-5 h-5" />
                提交质疑（红方）
              </button>
              <button
                onClick={() => {
                  setChallengeType('blue');
                  setShowSubmitForm(true);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                提交反驳（蓝方）
              </button>
            </div>
          )}

          {/* Submit Form */}
          {showSubmitForm && (
            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${challengeType === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                  {challengeType === 'red' ? '🗡️ 红方质疑' : '🛡️ 蓝方反驳'}
                </h3>
                <button
                  onClick={() => setShowSubmitForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {challengeType === 'red' ? '质疑标题' : '反驳标题'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={challengeType === 'red' ? '例如: 交易对手信用存疑' : '例如: 提供额外验证证据'}
                    className="w-full bg-gray-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    证据/PoC
                  </label>
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder={challengeType === 'red' 
                      ? '提供支持你质疑的证据、数据或概念验证...' 
                      : '提供反驳证据、额外文档或验证信息...'}
                    rows={6}
                    className="w-full bg-gray-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmitChallenge}
                  disabled={isAnalyzing}
                  className={`w-full ${
                    challengeType === 'red' 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  } text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI分析中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      提交并请求AI分析
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Challenges List */}
          <div className="space-y-4">
            {challenges.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>暂无质疑或反驳</p>
                <p className="text-sm mt-2">成为第一个提交论点的人</p>
              </div>
            ) : (
              challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className={`border-2 rounded-lg p-5 ${
                    challenge.type === 'red'
                      ? 'bg-red-900/10 border-red-500/30'
                      : 'bg-blue-900/10 border-blue-500/30'
                  }`}
                >
                  {/* Challenge Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {challenge.type === 'red' ? (
                        <div className="bg-red-500/20 p-2 rounded-lg">
                          <Sword className="w-5 h-5 text-red-400" />
                        </div>
                      ) : (
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                          <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                      <div>
                        <h4 className={`font-bold ${challenge.type === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                          {challenge.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {challenge.author} · {challenge.timestamp.toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    {challenge.aiScore && (
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        challenge.aiScore > 70 ? 'bg-green-500/20 text-green-400' :
                        challenge.aiScore > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        AI评分: {challenge.aiScore}%
                      </div>
                    )}
                  </div>

                  {/* Evidence */}
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-3">
                    <p className="text-sm text-gray-400 mb-2 font-semibold">证据/PoC:</p>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{challenge.evidence}</p>
                  </div>

                  {/* AI Analysis */}
                  {challenge.aiAnalysis && (
                    <div className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <p className="text-sm font-semibold text-purple-400">AI分析结果:</p>
                      </div>
                      <p className="text-gray-300 text-sm">{challenge.aiAnalysis}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-900/50 border-t border-cyan-500/30 p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>红方质疑: {challenges.filter(c => c.type === 'red').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>蓝方反驳: {challenges.filter(c => c.type === 'blue').length}</span>
              </div>
            </div>
            <p className="text-xs">
              💡 提示: 用户基于双方论点自主决策交易方向
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengePanel;
