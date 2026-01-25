import React, { useState } from 'react';
import { Sword, Shield, Send } from 'lucide-react';

interface Challenge {
  id: string;
  type: 'red' | 'blue';
  title: string;
  evidence: string;
  timestamp: Date;
  replyToId?: string; // 回复的目标论点ID
  replies?: Challenge[]; // 子回复
}

interface RedBlueChallengeProps {
  marketId: number;
  side: 'red' | 'blue'; // 指定只显示红方或蓝方
  challenges: Challenge[];
  onAddChallenge: (challenge: Challenge) => void;
}

export const RedBlueChallenge: React.FC<RedBlueChallengeProps> = ({ marketId, side, challenges, onAddChallenge }) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [evidence, setEvidence] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!title.trim() || !evidence.trim()) return;

    const newChallenge: Challenge = {
      id: Date.now().toString(),
      type: side,
      title,
      evidence,
      timestamp: new Date(),
      replyToId: replyingTo || undefined
    };

    onAddChallenge(newChallenge);
    setTitle('');
    setEvidence('');
    setShowForm(false);
    setReplyingTo(null);
  };

  const handleReply = (challengeId: string) => {
    setReplyingTo(challengeId);
    setShowForm(true);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 mb-2 font-mono flex justify-between">
        <span>// RED-BLUE CHALLENGE SYSTEM</span>
        <span className="text-cyan-500">{challenges.length} ACTIVE</span>
      </div>

      {/* Submit Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full ${side === 'red' ? 'bg-red-900/20 hover:bg-red-900/30 border-red-500/50 text-red-400' : 'bg-blue-900/20 hover:bg-blue-900/30 border-blue-500/50 text-blue-400'} border px-3 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1`}
        >
          {side === 'red' ? <><Sword size={12} /> SUBMIT CHALLENGE</> : <><Shield size={12} /> SUBMIT DEFENSE</>}
        </button>
      )}

      {/* Submit Form */}
      {showForm && (
        <div className={`border ${side === 'red' ? 'border-red-500/50 bg-red-900/10' : 'border-blue-500/50 bg-blue-900/10'} p-3 space-y-2`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-bold ${side === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
              {replyingTo ? (side === 'red' ? '⚔️ REPLY TO DEFENSE' : '🛡️ REPLY TO CHALLENGE') : (side === 'red' ? '⚔️ RED CHALLENGE' : '🛡️ BLUE DEFENSE')}
            </span>
            <button onClick={() => { setShowForm(false); setReplyingTo(null); }} className="text-gray-500 hover:text-white text-xs">✕</button>
          </div>
          {replyingTo && (
            <div className="text-[10px] text-yellow-400 mb-2">
              ↳ Replying to: {challenges.find(c => c.id === replyingTo)?.title}
            </div>
          )}
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title / 标题"
            className="w-full bg-black border border-gray-700 px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
          />
          
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Evidence / PoC / 证据"
            rows={3}
            className="w-full bg-black border border-gray-700 px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 resize-none font-mono"
          />
          
          <button
            onClick={handleSubmit}
            className={`w-full ${side === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1`}
          >
            <Send size={12} /> SUBMIT
          </button>
        </div>
      )}

      {/* Challenges List */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
        {challenges.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-gray-800">
            <div className="text-gray-600 text-xs">No challenges yet.</div>
            <div className="text-gray-700 text-[10px] mt-1">Be the first to challenge</div>
          </div>
        ) : (
          challenges.filter(c => !c.replyToId).map((c) => {
            const replies = challenges.filter(r => r.replyToId === c.id);
            return (
              <div key={c.id} className="space-y-1">
                {/* Main Challenge */}
                <div className={`border p-2 ${c.type === 'red' ? 'border-red-500/30 bg-red-900/10' : 'border-blue-500/30 bg-blue-900/10'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1">
                      {c.type === 'red' ? <Sword size={10} className="text-red-400" /> : <Shield size={10} className="text-blue-400" />}
                      <span className={`text-xs font-bold ${c.type === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                        {c.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleReply(c.id)}
                      className={`text-[10px] px-2 py-0.5 ${side === 'red' ? 'text-red-400 hover:bg-red-900/20' : 'text-blue-400 hover:bg-blue-900/20'} transition-all`}
                    >
                      REPLY
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mb-1">
                    {c.timestamp.toLocaleTimeString('zh-CN')}
                  </div>
                  <div className="text-[10px] text-gray-400 bg-black/50 p-1 font-mono">
                    {c.evidence.substring(0, 80)}{c.evidence.length > 80 ? '...' : ''}
                  </div>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-4 space-y-1 border-l-2 border-gray-700 pl-2">
                    {replies.map((r) => (
                      <div
                        key={r.id}
                        className={`border p-2 ${r.type === 'red' ? 'border-red-500/30 bg-red-900/5' : 'border-blue-500/30 bg-blue-900/5'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1">
                            {r.type === 'red' ? <Sword size={8} className="text-red-400" /> : <Shield size={8} className="text-blue-400" />}
                            <span className={`text-[10px] font-bold ${r.type === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                              ↳ {r.title}
                            </span>
                          </div>
                        </div>
                        <div className="text-[9px] text-gray-500 font-mono mb-1">
                          {r.timestamp.toLocaleTimeString('zh-CN')}
                        </div>
                        <div className="text-[9px] text-gray-400 bg-black/50 p-1 font-mono">
                          {r.evidence.substring(0, 60)}{r.evidence.length > 60 ? '...' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-2 text-[10px] text-gray-600 pt-2 border-t border-gray-800">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500"></div>
          <span>RED: {challenges.filter(c => c.type === 'red').length}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500"></div>
          <span>BLUE: {challenges.filter(c => c.type === 'blue').length}</span>
        </div>
      </div>
    </div>
  );
};
