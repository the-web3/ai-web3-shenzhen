import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, ExternalLink, CheckCircle2 } from 'lucide-react';

// Context for managing highlight state across components
interface EvidenceHighlightContextType {
  activeHighlight: string | null;
  setActiveHighlight: (id: string | null) => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
}

const EvidenceHighlightContext = createContext<EvidenceHighlightContextType>({
  activeHighlight: null,
  setActiveHighlight: () => {},
  highlightColor: 'blue',
  setHighlightColor: () => {},
});

export const useEvidenceHighlight = () => useContext(EvidenceHighlightContext);

// Provider component
interface EvidenceHighlightProviderProps {
  children: React.ReactNode;
}

export function EvidenceHighlightProvider({ children }: EvidenceHighlightProviderProps) {
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState('blue');

  return (
    <EvidenceHighlightContext.Provider
      value={{ activeHighlight, setActiveHighlight, highlightColor, setHighlightColor }}
    >
      {children}
    </EvidenceHighlightContext.Provider>
  );
}

// Color palette for different data types
export const evidenceColors = {
  person: { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-900', glow: 'shadow-blue-400/50', ring: 'ring-blue-400', gradient: 'from-blue-50 to-blue-100' },
  organization: { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-900', glow: 'shadow-purple-400/50', ring: 'ring-purple-400', gradient: 'from-purple-50 to-purple-100' },
  date: { bg: 'bg-green-200', border: 'border-green-400', text: 'text-green-900', glow: 'shadow-green-400/50', ring: 'ring-green-400', gradient: 'from-green-50 to-green-100' },
  money: { bg: 'bg-amber-200', border: 'border-amber-400', text: 'text-amber-900', glow: 'shadow-amber-400/50', ring: 'ring-amber-400', gradient: 'from-amber-50 to-amber-100' },
  location: { bg: 'bg-pink-200', border: 'border-pink-400', text: 'text-pink-900', glow: 'shadow-pink-400/50', ring: 'ring-pink-400', gradient: 'from-pink-50 to-pink-100' },
  percentage: { bg: 'bg-indigo-200', border: 'border-indigo-400', text: 'text-indigo-900', glow: 'shadow-indigo-400/50', ring: 'ring-indigo-400', gradient: 'from-indigo-50 to-indigo-100' },
  default: { bg: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-900', glow: 'shadow-gray-400/50', ring: 'ring-gray-400', gradient: 'from-gray-50 to-gray-100' },
};

// Get color based on data type
export const getColorForType = (type: string): typeof evidenceColors.default => {
  const typeMap: Record<string, keyof typeof evidenceColors> = {
    '人物': 'person',
    '组织': 'organization',
    '日期': 'date',
    '金额': 'money',
    '地点': 'location',
    '百分比': 'percentage',
    '药物': 'person',
    '病症': 'organization',
    '数量': 'money',
    '条款': 'default',
  };
  
  return evidenceColors[typeMap[type] || 'default'];
};

// Data card component with evidence highlighting
interface EvidenceDataCardProps {
  id: string;
  type: string;
  value: string;
  context?: string;
  confidence?: number;
  sourceText: string;
  className?: string;
  showConfidence?: boolean;
}

export function EvidenceDataCard({
  id,
  type,
  value,
  context,
  confidence,
  sourceText,
  className = '',
  showConfidence = true,
}: EvidenceDataCardProps) {
  const { activeHighlight, setActiveHighlight, setHighlightColor } = useEvidenceHighlight();
  const isActive = activeHighlight === id;
  const colors = getColorForType(type);

  const handleMouseEnter = () => {
    setActiveHighlight(id);
    setHighlightColor(type);
  };

  const handleMouseLeave = () => {
    setActiveHighlight(null);
  };

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative p-4 border-2 rounded-xl transition-all cursor-pointer ${
        isActive
          ? `bg-gradient-to-br ${colors.gradient} ${colors.border} shadow-lg ${colors.glow} scale-105`
          : `bg-white border-gray-200 hover:border-gray-300 hover:shadow-md`
      } ${className}`}
      whileHover={{ y: -2 }}
      layout
    >
      {/* Evidence Link Indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className={`absolute -top-2 -right-2 w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center border-2 ${colors.border} shadow-lg`}
          >
            <MapPin className={`w-4 h-4 ${colors.text}`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type Badge */}
      <div className="flex items-start justify-between mb-2">
        <span
          className={`px-2 py-1 rounded text-xs transition-all ${
            isActive ? `${colors.bg} ${colors.text} ${colors.border} border` : 'bg-gray-100 text-gray-700'
          }`}
        >
          {type}
        </span>
        {showConfidence && confidence !== undefined && (
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${isActive ? colors.bg : 'bg-gray-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${confidence * 100}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
            <span className="text-xs text-gray-600">{Math.round(confidence * 100)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`mb-2 transition-colors ${isActive ? colors.text : 'text-gray-900'}`}>
        {value}
      </div>

      {/* Context */}
      {context && (
        <p className={`text-xs transition-colors ${isActive ? colors.text : 'text-gray-600'}`}>
          {context}
        </p>
      )}

      {/* Source Preview */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isActive ? 'auto' : 0,
          opacity: isActive ? 1 : 0,
        }}
        className="overflow-hidden"
      >
        <div className={`mt-3 pt-3 border-t ${isActive ? colors.border : 'border-gray-200'}`}>
          <div className="flex items-start gap-2">
            <ExternalLink className={`w-3 h-3 ${colors.text} flex-shrink-0 mt-0.5`} />
            <p className={`text-xs italic ${colors.text} line-clamp-2`}>
              原文："{sourceText}"
            </p>
          </div>
        </div>
      </motion.div>

      {/* Trust Badge */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 flex items-center gap-1 text-xs ${colors.text}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>已在原文验证</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Source document component with evidence highlighting
interface EvidenceSourceDocumentProps {
  content: string;
  highlights: Array<{
    id: string;
    text: string;
    type: string;
  }>;
  className?: string;
  title?: string;
}

export function EvidenceSourceDocument({
  content,
  highlights,
  className = '',
  title = '原始文档',
}: EvidenceSourceDocumentProps) {
  const { activeHighlight } = useEvidenceHighlight();

  // Function to highlight text in document
  const renderHighlightedContent = () => {
    let result: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all highlight positions
    const positions: Array<{
      start: number;
      end: number;
      id: string;
      text: string;
      type: string;
      isActive: boolean;
    }> = [];

    highlights.forEach((highlight) => {
      let index = content.indexOf(highlight.text);
      while (index !== -1) {
        positions.push({
          start: index,
          end: index + highlight.text.length,
          id: highlight.id,
          text: highlight.text,
          type: highlight.type,
          isActive: activeHighlight === highlight.id,
        });
        index = content.indexOf(highlight.text, index + 1);
      }
    });

    // Sort by start position
    positions.sort((a, b) => a.start - b.start);

    // Remove overlaps (keep first occurrence)
    const nonOverlapping = positions.filter((pos, i) => {
      if (i === 0) return true;
      return pos.start >= positions[i - 1].end;
    });

    // Build the highlighted content
    nonOverlapping.forEach((pos, i) => {
      // Add text before highlight
      if (pos.start > lastIndex) {
        result.push(
          <span key={`text-${i}`}>{content.substring(lastIndex, pos.start)}</span>
        );
      }

      // Add highlighted text
      const colors = getColorForType(pos.type);
      result.push(
        <motion.span
          key={`highlight-${i}`}
          className={`px-1 py-0.5 rounded transition-all cursor-pointer ${
            pos.isActive
              ? `${colors.bg} ring-2 ${colors.ring} shadow-lg scale-110 inline-block`
              : `${colors.bg} hover:${colors.border} hover:border`
          }`}
          animate={{
            scale: pos.isActive ? 1.05 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {pos.text}
        </motion.span>
      );

      lastIndex = pos.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(
        <span key="text-end">{content.substring(lastIndex)}</span>
      );
    }

    return result;
  };

  return (
    <div className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600" />
          <h4 className="text-gray-900">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {highlights.length} 处高亮
          </span>
          {activeHighlight && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
            >
              正在查看证据
            </motion.span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">
          {renderHighlightedContent()}
        </pre>
      </div>

      {/* Footer Hint */}
      {!activeHighlight && (
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            💡 将鼠标悬停在数据卡片上，查看原文中对应的证据位置
          </p>
        </div>
      )}
    </div>
  );
}

// Compact evidence link component (for smaller spaces)
interface EvidenceLinkProps {
  id: string;
  text: string;
  type: string;
  children?: React.ReactNode;
}

export function EvidenceLink({ id, text, type, children }: EvidenceLinkProps) {
  const { activeHighlight, setActiveHighlight } = useEvidenceHighlight();
  const isActive = activeHighlight === id;
  const colors = getColorForType(type);

  return (
    <motion.span
      onMouseEnter={() => setActiveHighlight(id)}
      onMouseLeave={() => setActiveHighlight(null)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-all ${
        isActive
          ? `${colors.bg} ${colors.border} border ${colors.text}`
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      whileHover={{ scale: 1.05 }}
    >
      {children || text}
      <ExternalLink className="w-3 h-3 opacity-60" />
    </motion.span>
  );
}

// Evidence grid container (for organizing multiple data cards)
interface EvidenceGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function EvidenceGrid({ children, columns = 2, className = '' }: EvidenceGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

// Trust indicator component
interface TrustIndicatorProps {
  totalEvidence: number;
  verifiedEvidence: number;
  className?: string;
}

export function TrustIndicator({ totalEvidence, verifiedEvidence, className = '' }: TrustIndicatorProps) {
  const percentage = Math.round((verifiedEvidence / totalEvidence) * 100);
  
  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h4 className="text-green-900">可追溯性</h4>
        </div>
        <span className="text-2xl text-green-700">{percentage}%</span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      
      <p className="text-xs text-green-800">
        <strong>{verifiedEvidence}</strong> / {totalEvidence} 条数据已验证到原文
      </p>
    </div>
  );
}
