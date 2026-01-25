import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Info, X, Building2, User, Calendar, DollarSign, MapPin, Sparkles, Package, FileText, Link2Icon, Clock, Pill, Activity, Hash, Filter, Eye, EyeOff, Stethoscope, TrendingUp, Headphones, Newspaper, Layers, LayoutGrid, ZoomIn, ZoomOut, Maximize2, Network } from 'lucide-react';
import { apiService, DocumentChunkInfo, DocumentInfo } from '../../services/api';

// ========== 关系链可视化组件 - 简洁美观的知识图谱 ==========
const RELATION_COLORS = [
  { fill: '#8b5cf6', stroke: '#7c3aed', bg: 'rgba(139, 92, 246, 0.15)' },   // 紫色
  { fill: '#3b82f6', stroke: '#2563eb', bg: 'rgba(59, 130, 246, 0.15)' },   // 蓝色
  { fill: '#10b981', stroke: '#059669', bg: 'rgba(16, 185, 129, 0.15)' },   // 绿色
  { fill: '#f59e0b', stroke: '#d97706', bg: 'rgba(245, 158, 11, 0.15)' },   // 橙色
  { fill: '#ef4444', stroke: '#dc2626', bg: 'rgba(239, 68, 68, 0.15)' },    // 红色
  { fill: '#ec4899', stroke: '#db2777', bg: 'rgba(236, 72, 153, 0.15)' },   // 粉色
  { fill: '#06b6d4', stroke: '#0891b2', bg: 'rgba(6, 182, 212, 0.15)' },    // 青色
];

interface RelationChain {
  nodes: string[];
  mechanismGroup: string;
  extractionClass: string;
}

// 关系链卡片组件
const RelationChainCard: React.FC<{
  chain: RelationChain;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ chain, index, isSelected, onClick }) => {
  const colorIndex = index % RELATION_COLORS.length;
  const colors = RELATION_COLORS[colorIndex];

  const svgWidth = 350;
  const nodeWidth = 70;
  const nodeHeight = 30;
  const horizontalGap = 20;

  // 计算布局
  const maxNodesPerRow = 4;
  const rows = Math.ceil(chain.nodes.length / maxNodesPerRow);
  const svgHeight = rows * 55 + 30;

  const getNodePosition = (idx: number) => {
    const row = Math.floor(idx / maxNodesPerRow);
    const col = idx % maxNodesPerRow;
    const nodesInThisRow = Math.min(maxNodesPerRow, chain.nodes.length - row * maxNodesPerRow);
    const rowWidth = nodesInThisRow * nodeWidth + (nodesInThisRow - 1) * horizontalGap;
    const startX = (svgWidth - rowWidth) / 2;

    return {
      x: startX + col * (nodeWidth + horizontalGap) + nodeWidth / 2,
      y: 25 + row * 55,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`relative bg-gradient-to-br from-slate-50 via-purple-50/50 to-blue-50/50 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'border-purple-400 shadow-lg shadow-purple-200/50' : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
      }`}
    >
      {/* 标题 */}
      <div className="px-4 py-2 bg-gradient-to-r from-purple-100/80 to-blue-100/80 border-b border-purple-200/50">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-800">{chain.extractionClass}</span>
          <span className="text-[10px] text-purple-500 ml-auto">#{index + 1}</span>
        </div>
      </div>

      {/* 背景网格 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ top: '36px' }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id={`chain-grid-${index}`} width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="#8b5cf6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#chain-grid-${index})`} />
        </svg>
      </div>

      {/* 知识图谱 SVG */}
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="relative z-10">
        <defs>
          <linearGradient id={`chain-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.fill} />
            <stop offset="100%" stopColor={colors.stroke} />
          </linearGradient>
          <marker id={`chain-arrow-${index}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={colors.stroke} />
          </marker>
          <filter id={`chain-glow-${index}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 连接线 */}
        {chain.nodes.slice(0, -1).map((_, i) => {
          const from = getNodePosition(i);
          const to = getNodePosition(i + 1);

          // 同一行内的连接
          if (Math.floor(i / maxNodesPerRow) === Math.floor((i + 1) / maxNodesPerRow)) {
            return (
              <g key={`line-${i}`}>
                <motion.line
                  x1={from.x + nodeWidth / 2 - 5}
                  y1={from.y}
                  x2={to.x - nodeWidth / 2 + 5}
                  y2={to.y}
                  stroke={`url(#chain-gradient-${index})`}
                  strokeWidth="2"
                  markerEnd={`url(#chain-arrow-${index})`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                />
              </g>
            );
          } else {
            // 跨行连接 - 使用曲线
            const midY = (from.y + to.y) / 2;
            return (
              <g key={`line-${i}`}>
                <motion.path
                  d={`M ${from.x} ${from.y + nodeHeight / 2} Q ${from.x} ${midY} ${(from.x + to.x) / 2} ${midY} Q ${to.x} ${midY} ${to.x} ${to.y - nodeHeight / 2}`}
                  stroke={`url(#chain-gradient-${index})`}
                  strokeWidth="2"
                  fill="none"
                  markerEnd={`url(#chain-arrow-${index})`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                />
              </g>
            );
          }
        })}

        {/* 节点 */}
        {chain.nodes.map((node, i) => {
          const pos = getNodePosition(i);
          const isFirst = i === 0;
          const isLast = i === chain.nodes.length - 1;

          return (
            <motion.g
              key={`node-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300 }}
            >
              {/* 节点发光效果 */}
              {(isFirst || isLast) && (
                <ellipse
                  cx={pos.x}
                  cy={pos.y}
                  rx={nodeWidth / 2 + 4}
                  ry={nodeHeight / 2 + 4}
                  fill={colors.bg}
                  filter={`url(#chain-glow-${index})`}
                />
              )}

              {/* 节点背景 */}
              <rect
                x={pos.x - nodeWidth / 2}
                y={pos.y - nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                rx="15"
                fill="white"
                stroke={isFirst || isLast ? colors.fill : '#d1d5db'}
                strokeWidth={isFirst || isLast ? 2 : 1.5}
                className="drop-shadow-sm"
              />

              {/* 节点文字 */}
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isFirst || isLast ? '600' : '500'}
                fill={isFirst || isLast ? colors.stroke : '#4b5563'}
              >
                {node.length > 6 ? node.slice(0, 6) + '..' : node}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </motion.div>
  );
};

interface KnowledgeGraphProps {
  onNext: () => void;
  onPrevious: () => void;
  selectedDocument: string | null;
}

interface Node {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  attributes?: Record<string, string>;
  connectionCount: number;
  isCore: boolean;  // 是否是核心节点
}

interface Connection {
  from: string;
  to: string;
  type: string;
  strength: number;
}

// 从 sessionStorage 获取的提取项类型
interface ExtractedItem {
  id: string;
  type: string;
  value: string;
  role: string;
  highlight: string;
  pass: 1 | 2;
  confidence: number;
  attributes?: Record<string, string>;
}

// 类型配置
const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, label: string }> = {
  '人物': { icon: User, color: '#3b82f6', label: '人物' },
  '医生': { icon: User, color: '#3b82f6', label: '医生' },
  '患者': { icon: User, color: '#8b5cf6', label: '患者' },
  '客户': { icon: User, color: '#06b6d4', label: '客户' },
  '组织': { icon: Building2, color: '#8b5cf6', label: '组织' },
  '机构': { icon: Building2, color: '#8b5cf6', label: '机构' },
  '日期': { icon: Calendar, color: '#10b981', label: '日期' },
  '时间': { icon: Clock, color: '#10b981', label: '时间' },
  '金额': { icon: DollarSign, color: '#f59e0b', label: '金额' },
  '数值': { icon: Hash, color: '#f59e0b', label: '数值' },
  '地址': { icon: MapPin, color: '#ec4899', label: '地址' },
  '地点': { icon: MapPin, color: '#ec4899', label: '地点' },
  '产品': { icon: Package, color: '#06b6d4', label: '产品' },
  '药物': { icon: Pill, color: '#14b8a6', label: '药物' },
  '症状': { icon: Activity, color: '#ef4444', label: '症状' },
  '诊断': { icon: Stethoscope, color: '#f97316', label: '诊断' },
  '检查': { icon: FileText, color: '#6366f1', label: '检查' },
  '事件': { icon: Newspaper, color: '#f97316', label: '事件' },
  '指标': { icon: TrendingUp, color: '#10b981', label: '指标' },
  '问题': { icon: Activity, color: '#ef4444', label: '问题' },
  '解决方案': { icon: Sparkles, color: '#10b981', label: '解决方案' },
  '情绪': { icon: Activity, color: '#ec4899', label: '情绪' },
  '订单': { icon: Package, color: '#06b6d4', label: '订单' },
  '需求': { icon: FileText, color: '#8b5cf6', label: '需求' },
  '竞争对手': { icon: Building2, color: '#ef4444', label: '竞争对手' },
  '跟进状态': { icon: Clock, color: '#f59e0b', label: '跟进状态' },
  '满意度': { icon: Sparkles, color: '#10b981', label: '满意度' },
  '责任方': { icon: User, color: '#6366f1', label: '责任方' },
  '数量': { icon: Hash, color: '#8b5cf6', label: '数量' },
  '文档': { icon: FileText, color: '#6366f1', label: '文档' },
};

// ========== 通用的核心/属性节点分类规则 ==========

// 核心实体类型（语义主体：人、组织、事物、事件）
const CORE_TYPES = new Set([
  '人物', '医生', '患者', '客户', '责任方',  // 人
  '组织', '机构', '竞争对手',                 // 组织
  '产品', '药物', '订单',                     // 事物
  '疾病', '诊断', '问题', '解决方案',          // 医疗/问题
  '事件', '需求',                             // 事件
  '地点', '地址',                             // 地点（通常是核心）
]);

// 属性数据类型（度量、描述性数据）
const ATTRIBUTE_TYPES = new Set([
  '数值', '金额', '数量', '指标',              // 数值类
  '日期', '时间',                             // 时间类
  '症状', '检查',                             // 医疗属性
  '情绪', '满意度', '跟进状态',                // 状态类
]);

// 判断实体值是否像属性数据（基于值的模式匹配）
function isAttributeValue(value: string): boolean {
  // 数字+单位模式：32g/L, 158/95mmHg, 42%, 100亿, 580pg/ml
  const numericPatterns = [
    /^\d+[\.,]?\d*\s*[a-zA-Z%\/]+/i,           // 32g/L, 42%
    /^\d+\/\d+\s*[a-zA-Z]*$/i,                 // 158/95mmHg, 120/80
    /^\d+[\.,]?\d*\s*(亿|万|元|%|次|个|天|周|月|年)/,  // 100亿, 30天
    /^[<>≤≥]?\d+[\.,]?\d*\s*[a-zA-Z%\/]*/i,   // <40mm, >55%
    /^\d+[\.,]?\d*\s*-\s*\d+[\.,]?\d*/,        // 范围：120-140
    /^\d{4}年\d{1,2}月\d{1,2}日/,              // 日期格式
    /^\d{1,2}月\d{1,2}日/,                     // 短日期
  ];

  return numericPatterns.some(pattern => pattern.test(value.trim()));
}

// 判断节点是否是核心节点
function isCoreNode(type: string, value: string): boolean {
  // 1. 先按类型判断
  if (CORE_TYPES.has(type)) return true;
  if (ATTRIBUTE_TYPES.has(type)) return false;

  // 2. 类型未知时，根据值的模式判断
  if (isAttributeValue(value)) return false;

  // 3. 默认为核心节点（未知类型的文本实体）
  return true;
}

export function KnowledgeGraph({ onNext, onPrevious, selectedDocument }: KnowledgeGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [fatalError, setFatalError] = useState<string | null>(null); // 捕获渲染时的异常，避免白屏
  const [docList, setDocList] = useState<DocumentInfo[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // 筛选状态
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showAllTypes, setShowAllTypes] = useState(true);

  // 视图模式：关系链视图 vs 完整网络图
  const [graphView, setGraphView] = useState<'chains' | 'network'>('chains');
  // 网络图展示模式：精简（核心实体） vs 完整
  const [networkViewMode, setNetworkViewMode] = useState<'full' | 'simplified'>('full');

  // 选中的关系链
  const [selectedChainIndex, setSelectedChainIndex] = useState<number | null>(null);

  // 拖拽状态
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // 缩放和平移状态
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(50, Math.min(700, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(50, Math.min(550, e.clientY - rect.top - dragOffset.y));

    setNodes(prev => prev.map(n =>
      n.id === draggingNode ? { ...n, x: newX, y: newY } : n
    ));
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  // 画布平移处理
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggingNode && e.target === e.currentTarget) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  // 缩放控制
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // 加载文档列表及选中 docId
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs: DocumentInfo[] = await apiService.listDocuments(50, 0);
        setDocList(docs);
        const storedId = sessionStorage.getItem('lastSavedDocId');
        const fromStored = docs.find(d => d.doc_id === storedId && d.chunk_count >= 0);
        const usable = docs.filter(d => d.chunk_count > 0);
        const fallbackWithData = usable.sort((a, b) => (b.chunk_count || 0) - (a.chunk_count || 0))[0];
        const fallbackAny = docs[0];
        const chosen = fromStored || fallbackWithData || fallbackAny || null;

        if (chosen) {
          setSelectedDocId(chosen.doc_id);
          sessionStorage.setItem('lastSavedDocId', chosen.doc_id);
        } else {
          setSelectedDocId(null);
        }
      } catch (err) {
        console.error('加载文档列表失败', err);
        setLoadError(err instanceof Error ? err.message : '加载文档列表失败');
      }
    };

    fetchDocs();
  }, []);

  useEffect(() => {
    if (selectedDocument?.startsWith('kb:')) {
      const docId = selectedDocument.slice(3);
      setSelectedDocId(docId);
      sessionStorage.setItem('lastSavedDocId', docId);
      setReloadToken(t => t + 1);
    }
  }, [selectedDocument]);

  // 加载提取结果：优先 sessionStorage，其次选中的 docId
  useEffect(() => {
    try {
      const loadFromSession = () => {
        const stored = sessionStorage.getItem('extractedItems');
        if (stored) {
          try {
            const items: ExtractedItem[] = JSON.parse(stored);
            if (items && items.length > 0) {
              setExtractedItems(items);
              return true;
            }
          } catch (e) {
            console.error('Failed to parse extractedItems:', e);
          }
        }
        return false;
      };

      const loadFromDoc = async (docId: string) => {
        setIsLoading(true);
        setLoadError(null);
        try {
          const chunks: DocumentChunkInfo[] = await apiService.getDocumentChunks(docId);
          if (!Array.isArray(chunks) || chunks.length === 0) {
            setLoadError(`知识库文档 ${docId} 未找到片段，请确认已保存提取结果。`);
            setExtractedItems([]);
            return;
          }

          const items: ExtractedItem[] = chunks.map((c, index) => {
            const value =
              typeof c.content === 'string'
                ? c.content
                : JSON.stringify(c.content ?? '');
            const attrs =
              c.attributes && typeof c.attributes === 'object'
                ? c.attributes
                : {};
            return {
              id: c.chunk_id || `chunk-${index}`,
              type: c.chunk_type || (attrs as any)?.extraction_class || '片段',
              value: value || '',
              role: (attrs as any)?.角色 || c.chunk_type || '片段',
              highlight: value || '',
              pass: 1,
              confidence: (attrs as any)?.confidence || 90,
              attributes: attrs,
            };
          });

          setExtractedItems(items);
        } catch (err) {
          const msg = err instanceof Error ? err.message : '加载知识库数据失败';
          setLoadError(msg);
          setExtractedItems([]);
        } finally {
          setIsLoading(false);
        }
      };

      const found = loadFromSession();
      if (!found && selectedDocId) {
        loadFromDoc(selectedDocId);
      }
    } catch (e) {
      console.error('知识图谱加载异常', e);
      setLoadError(e instanceof Error ? e.message : '渲染出错');
      setExtractedItems([]);
    }
  }, [selectedDocument, selectedDocId, reloadToken]);

  // 过滤掉无效的提取结果，避免异常数据导致渲染崩溃
  const validItems = useMemo(() => {
    try {
      return extractedItems.filter(
        (item) =>
          item &&
          typeof item.value === 'string' &&
          item.value.trim().length > 0 &&
          typeof item.type === 'string'
      );
    } catch (e) {
      console.error('过滤提取结果失败', e);
      return [];
    }
  }, [extractedItems]);

  // 提取关系链（从 mechanism_group 属性解析）
  const relationChains = useMemo((): RelationChain[] => {
    try {
      const chains: RelationChain[] = [];
      const seenMechanisms = new Set<string>();

      validItems.forEach(item => {
        const mechanismGroup = item.attributes?.mechanism_group;
        if (mechanismGroup && typeof mechanismGroup === 'string' && !seenMechanisms.has(mechanismGroup)) {
          seenMechanisms.add(mechanismGroup);
          const nodes = mechanismGroup.split('-').filter((n: string) => n && n.trim());
          if (nodes.length >= 2) {
            chains.push({
              nodes,
              mechanismGroup,
              extractionClass: item.type,
            });
          }
        }
      });

      return chains;
    } catch (e) {
      console.error('构建关系链失败', e);
      return [];
    }
  }, [validItems]);

  useEffect(() => {
    setSelectedChainIndex(null);
  }, [relationChains.length, selectedDocument]);

  // 根据提取项生成关系
  const generateRelationshipsFromItems = (items: ExtractedItem[]): Connection[] => {
    const relations: Connection[] = [];

    // 按类型分组
    const people = items.filter(i => ['人物', '医生', '患者', '客户'].includes(i.type));
    const orgs = items.filter(i => ['组织', '机构'].includes(i.type));
    const events = items.filter(i => i.type === '事件');
    const times = items.filter(i => ['时间', '日期'].includes(i.type));
    const diseases = items.filter(i => ['疾病', '诊断'].includes(i.type));
    const drugs = items.filter(i => i.type === '药物');
    const symptoms = items.filter(i => i.type === '症状');
    const values = items.filter(i => ['数值', '金额', '指标'].includes(i.type));

    // ===== 核心节点之间的关系 =====

    // 人物 -> 机构
    people.forEach(person => {
      orgs.forEach(org => {
        relations.push({ from: person.value, to: org.value, type: '属于', strength: 0.8 });
      });
    });

    // 人物 -> 疾病（患者患有疾病）
    people.forEach(person => {
      diseases.forEach(disease => {
        relations.push({ from: person.value, to: disease.value, type: '患有', strength: 0.9 });
      });
    });

    // 人物 -> 药物（服用药物）
    people.forEach(person => {
      drugs.forEach(drug => {
        relations.push({ from: person.value, to: drug.value, type: '服用', strength: 0.85 });
      });
    });

    // 疾病 -> 药物（治疗关系）
    diseases.forEach(disease => {
      drugs.forEach(drug => {
        relations.push({ from: disease.value, to: drug.value, type: '治疗', strength: 0.85 });
      });
    });

    // 机构 -> 事件
    orgs.forEach(org => {
      events.forEach(event => {
        relations.push({ from: org.value, to: event.value, type: '发起', strength: 0.85 });
      });
    });

    // ===== 核心节点到属性节点的关系 =====

    // 疾病 -> 症状
    diseases.forEach(disease => {
      symptoms.forEach(symptom => {
        relations.push({ from: disease.value, to: symptom.value, type: '表现', strength: 0.7 });
      });
    });

    // 事件 -> 时间
    events.forEach(event => {
      times.forEach(time => {
        relations.push({ from: event.value, to: time.value, type: '发生于', strength: 0.9 });
      });
    });

    // 人物 -> 数值（检查指标）
    if (people.length > 0 && values.length > 0) {
      values.forEach(val => {
        relations.push({ from: people[0].value, to: val.value, type: '指标', strength: 0.6 });
      });
    }

    // ===== 确保核心节点之间有足够的连接 =====
    // 获取所有核心实体
    const coreItems = items.filter(item => isCoreNode(item.type, item.value));

    // 如果核心节点之间关系太少，创建一些关联
    const coreRelations = relations.filter(r => {
      const fromItem = items.find(i => i.value === r.from);
      const toItem = items.find(i => i.value === r.to);
      if (!fromItem || !toItem) return false;
      return isCoreNode(fromItem.type, fromItem.value) && isCoreNode(toItem.type, toItem.value);
    });

    if (coreRelations.length < coreItems.length - 1 && coreItems.length > 1) {
      // 按类型分组核心节点
      const coreTypeGroups = new Map<string, ExtractedItem[]>();
      coreItems.forEach(item => {
        if (!coreTypeGroups.has(item.type)) coreTypeGroups.set(item.type, []);
        coreTypeGroups.get(item.type)!.push(item);
      });

      // 在不同类型的核心节点之间创建关联
      const coreTypes = Array.from(coreTypeGroups.keys());
      for (let i = 0; i < coreTypes.length - 1; i++) {
        const group1 = coreTypeGroups.get(coreTypes[i])!;
        const group2 = coreTypeGroups.get(coreTypes[i + 1])!;
        if (group1.length > 0 && group2.length > 0) {
          // 检查是否已存在关系
          const exists = relations.some(r =>
            (r.from === group1[0].value && r.to === group2[0].value) ||
            (r.from === group2[0].value && r.to === group1[0].value)
          );
          if (!exists) {
            relations.push({
              from: group1[0].value,
              to: group2[0].value,
              type: '关联',
              strength: 0.6,
            });
          }
        }
      }
    }

    return relations;
  };

  // 获取所有类型
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    nodes.forEach(node => types.add(node.type));
    return Array.from(types);
  }, [nodes]);

  // 初始化时选中所有类型
  useEffect(() => {
    if (allTypes.length > 0 && selectedTypes.size === 0) {
      setSelectedTypes(new Set(allTypes));
    }
  }, [allTypes]);

  // 核心节点和属性节点统计
  const coreNodes = useMemo(() => nodes.filter(n => n.isCore), [nodes]);
  const attributeNodes = useMemo(() => nodes.filter(n => !n.isCore), [nodes]);

  // 筛选后的节点和连接
  const filteredNodes = useMemo(() => {
    let result = nodes;

    // 1. 根据视图模式筛选
    if (networkViewMode === 'simplified') {
      result = result.filter(node => node.isCore);
    }

    // 2. 根据类型筛选
    if (!showAllTypes) {
      result = result.filter(node => selectedTypes.has(node.type));
    }

    return result;
  }, [nodes, selectedTypes, showAllTypes, networkViewMode]);

  const filteredConnections = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return connections.filter(c => nodeIds.has(c.from) && nodeIds.has(c.to));
  }, [connections, filteredNodes]);

  // 获取选中节点关联的属性节点
  const relatedAttributeNodes = useMemo(() => {
    if (!selectedNode) return [];
    // 找到与选中节点有连接的属性节点
    const relatedIds = new Set<string>();
    connections.forEach(c => {
      if (c.from === selectedNode) relatedIds.add(c.to);
      if (c.to === selectedNode) relatedIds.add(c.from);
    });
    return attributeNodes.filter(n => relatedIds.has(n.id));
  }, [selectedNode, connections, attributeNodes]);

  // 聚焦模式：选中节点时只显示相关节点
  const visibleNodes = useMemo(() => {
    if (!selectedNode) return filteredNodes;

    const relatedIds = new Set<string>([selectedNode]);
    filteredConnections.forEach(c => {
      if (c.from === selectedNode) relatedIds.add(c.to);
      if (c.to === selectedNode) relatedIds.add(c.from);
    });

    return filteredNodes.map(node => ({
      ...node,
      isFaded: !relatedIds.has(node.id),
    }));
  }, [filteredNodes, filteredConnections, selectedNode]);

  const visibleConnections = useMemo(() => {
    if (!selectedNode) return filteredConnections;
    return filteredConnections.filter(c => c.from === selectedNode || c.to === selectedNode);
  }, [filteredConnections, selectedNode]);

  // 初始化节点和连接
  useEffect(() => {
    if (fatalError) return;

    if (validItems.length === 0) {
      setConnections([]);
      setNodes([]);
      return;
    }

    try {
      const relationships = generateRelationshipsFromItems(validItems);
      const entities = validItems.map(item => ({
        value: item.value,
        type: item.type,
        role: item.role,
        highlight: item.highlight,
        attributes: item.attributes,
      }));

      setConnections(relationships);

      // 获取唯一实体
      const uniqueLabels = Array.from(new Set([
        ...entities.map(e => e.value),
        ...relationships.map(r => r.from),
        ...relationships.map(r => r.to)
      ])).filter(label => typeof label === 'string' && label.trim().length > 0);

      // 计算每个节点的连接数
      const connectionCounts = new Map<string, number>();
      uniqueLabels.forEach(label => {
        const count = relationships.filter(r => r.from === label || r.to === label).length;
        connectionCounts.set(label, count);
      });

      // 按连接数排序
      const sortedLabels = uniqueLabels.sort((a, b) =>
        (connectionCounts.get(b) || 0) - (connectionCounts.get(a) || 0)
      );

      // 布局计算 - 使用智能环形分层布局
      const canvasWidth = 750;
      const canvasHeight = 600;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      // 判断每个节点是否是核心节点
      const coreLabels = sortedLabels.filter(label => {
        const entity = entities.find(e => e.value === label);
        const type = entity?.type || '文档';
        return isCoreNode(type, label);
      });

      const attributeLabels = sortedLabels.filter(label => !coreLabels.includes(label));

      // 力导向布局算法 - 更好的视觉效果
      const forceDirectedLayout = (
        labels: string[],
        isCore: boolean
      ): Map<string, { x: number; y: number }> => {
        const positions = new Map<string, { x: number; y: number }>();
        if (labels.length === 0) return positions;

        // 初始化随机位置（在中心区域）
        const padding = 100;
        const centerRadius = isCore ? 150 : 80;
        labels.forEach(label => {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * centerRadius;
          positions.set(label, {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
          });
        });

        // 力导向迭代
        const iterations = isCore ? 80 : 40;
        const repulsionStrength = isCore ? 4000 : 2000;
        const attractionStrength = 0.01;

        for (let iter = 0; iter < iterations; iter++) {
          const forces = new Map<string, { x: number; y: number }>();
          labels.forEach(label => forces.set(label, { x: 0, y: 0 }));

          // 1. 排斥力（所有节点相互排斥）
          labels.forEach((label1, i) => {
            labels.slice(i + 1).forEach(label2 => {
              const pos1 = positions.get(label1)!;
              const pos2 = positions.get(label2)!;
              const dx = pos2.x - pos1.x;
              const dy = pos2.y - pos1.y;
              const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

              const force = repulsionStrength / (distance * distance);
              const fx = (dx / distance) * force;
              const fy = (dy / distance) * force;

              const f1 = forces.get(label1)!;
              const f2 = forces.get(label2)!;
              f1.x -= fx;
              f1.y -= fy;
              f2.x += fx;
              f2.y += fy;
            });
          });

          // 2. 吸引力（有连接的节点相互吸引）
          relationships.forEach(conn => {
            if (labels.includes(conn.from) && labels.includes(conn.to)) {
              const pos1 = positions.get(conn.from)!;
              const pos2 = positions.get(conn.to)!;
              const dx = pos2.x - pos1.x;
              const dy = pos2.y - pos1.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              const force = distance * attractionStrength;
              const fx = dx * force;
              const fy = dy * force;

              const f1 = forces.get(conn.from)!;
              const f2 = forces.get(conn.to)!;
              f1.x += fx;
              f1.y += fy;
              f2.x -= fx;
              f2.y -= fy;
            }
          });

          // 3. 中心引力（防止节点飘散）
          labels.forEach(label => {
            const pos = positions.get(label)!;
            const dx = centerX - pos.x;
            const dy = centerY - pos.y;
            const f = forces.get(label)!;
            f.x += dx * 0.01;
            f.y += dy * 0.01;
          });

          // 4. 应用力并限制边界
          const damping = 0.8;
          labels.forEach(label => {
            const pos = positions.get(label)!;
            const force = forces.get(label)!;

            pos.x += force.x * damping;
            pos.y += force.y * damping;

            // 限制在画布内
            pos.x = Math.max(padding, Math.min(canvasWidth - padding, pos.x));
            pos.y = Math.max(padding, Math.min(canvasHeight - padding, pos.y));
          });
        }

        return positions;
      };

      // 按连接数排序核心节点
      const sortedCoreLabels = [...coreLabels].sort((a, b) =>
        (connectionCounts.get(b) || 0) - (connectionCounts.get(a) || 0)
      );

      // 使用力导向布局
      const corePositions = forceDirectedLayout(sortedCoreLabels, true);
      const attrPositions = forceDirectedLayout(attributeLabels, false);

      // 创建节点数组
      const initialNodes: Node[] = sortedLabels.map((label) => {
        const entity = entities.find(e => e.value === label);
        const type = entity?.type || '文档';
        const config = typeConfig[type] || typeConfig['文档'];
        const count = connectionCounts.get(label) || 0;
        const isCore = coreLabels.includes(label);

        // 获取位置
        const pos = isCore ? corePositions.get(label) : attrPositions.get(label);
        const x = pos && Number.isFinite(pos.x) ? pos.x : centerX;
        const y = pos && Number.isFinite(pos.y) ? pos.y : centerY;

        return {
          id: label,
          label,
          type,
          x,
          y,
          icon: config.icon,
          color: config.color,
          attributes: entity?.attributes,
          connectionCount: count,
          isCore,
        };
      });

      // 网格布局已确保节点不重叠，直接使用
      setNodes(initialNodes);
    } catch (e) {
      console.error('知识图谱渲染异常', e);
      setFatalError(e instanceof Error ? e.message : '知识图谱渲染失败');
      setConnections([]);
      setNodes([]);
    }
  }, [selectedDocument, validItems, fatalError]);

  // 切换类型筛选
  const toggleType = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
    setShowAllTypes(false);
  };

  // 全选/取消全选
  const toggleAllTypes = () => {
    if (showAllTypes) {
      setShowAllTypes(false);
      setSelectedTypes(new Set());
    } else {
      setShowAllTypes(true);
      setSelectedTypes(new Set(allTypes));
    }
  };

  // 获取选中节点的数据
  const getSelectedNodeData = () => {
    if (!selectedNode) return null;
    return extractedItems.find(e => e.value === selectedNode);
  };

  const selectedNodeData = getSelectedNodeData();
  const selectedNodeObj = nodes.find(n => n.id === selectedNode);
  const selectedConnections = selectedNode
    ? connections.filter(c => c.from === selectedNode || c.to === selectedNode)
    : [];

  // 按类型统计
  const typeStats = useMemo(() => {
    const stats = new Map<string, number>();
    nodes.forEach(node => {
      stats.set(node.type, (stats.get(node.type) || 0) + 1);
    });
    return stats;
  }, [nodes]);

  // 早期返回逻辑放在所有 Hook 定义之后，避免 Hook 顺序变化
  if (fatalError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg space-y-2">
        <div className="font-semibold">知识图谱渲染异常</div>
        <div className="text-sm">{fatalError}</div>
        <div className="text-xs text-red-700">
          请尝试返回上一步重新提取，或刷新页面重试。如果仍出现问题，请截图浏览器控制台错误信息。
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
        正在从知识库加载提取结果...
      </div>
    );
  }

  if (validItems.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg space-y-3">
        <div className="font-semibold">暂无可视化数据</div>
        <div className="text-sm text-amber-800">
          {loadError || '请先完成“信息提取”并保存，或从下方选择已有文档加载。'}
        </div>
        {docList.length > 0 ? (
          <div className="space-y-2">
            <label className="text-sm text-amber-900 font-medium">选择知识库文档</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedDocId || ''}
                onChange={(e) => setSelectedDocId(e.target.value || null)}
                className="border border-amber-300 rounded px-2 py-1 text-sm text-amber-900 bg-white"
              >
                <option value="">请选择</option>
                {docList.map(doc => (
                  <option key={doc.doc_id} value={doc.doc_id}>
                    {doc.title || doc.doc_id}（{doc.chunk_count} 片段）
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedDocId) {
                    sessionStorage.setItem('lastSavedDocId', selectedDocId);
                    setReloadToken(t => t + 1);
                  }
                }}
                className="px-3 py-1.5 text-sm rounded bg-amber-600 text-white hover:bg-amber-700"
                disabled={!selectedDocId}
              >
                重新加载
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-amber-700">知识库为空，请先保存提取结果。</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-full shadow-sm mb-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
            <span className="text-sm font-semibold">3</span>
          </div>
          <span className="text-sm font-medium text-indigo-700">
            第 3 步，共 4 步 – 发现信息关联
          </span>
        </div>
        <h2 className="text-gray-900 mb-3">知识关系图谱</h2>
        <p className="text-gray-600">
          共发现 <span className="font-semibold text-purple-600">{relationChains.length}</span> 条知识关系链
          {nodes.length > 0 && (
            <>
              ，<span className="font-semibold text-indigo-600">{coreNodes.length}</span> 个核心实体
            </>
          )}
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setGraphView('chains')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              graphView === 'chains'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Network className="w-4 h-4" />
            关系链视图
          </button>
          <button
            onClick={() => setGraphView('network')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              graphView === 'network'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            网络图视图
          </button>
        </div>
      </div>

      {/* 关系链视图 */}
      {graphView === 'chains' && (
        <div className="space-y-4">
          {relationChains.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relationChains.map((chain, index) => (
                <RelationChainCard
                  key={chain.mechanismGroup}
                  chain={chain}
                  index={index}
                  isSelected={selectedChainIndex === index}
                  onClick={() => setSelectedChainIndex(selectedChainIndex === index ? null : index)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无关系链数据</h3>
              <p className="text-gray-500 text-sm">
                提取的实体中未发现包含关系链信息（mechanism_group）的数据。<br />
                请尝试切换到「网络图视图」查看所有实体关系。
              </p>
            </div>
          )}

          {/* 选中的关系链详情 */}
          {selectedChainIndex !== null && relationChains[selectedChainIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-purple-200 p-6 shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Network className="w-5 h-5 text-purple-600" />
                    关系链详情
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    类型：{relationChains[selectedChainIndex].extractionClass}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedChainIndex(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-xs text-purple-600 font-medium mb-2">完整关系路径</div>
                <div className="flex items-center flex-wrap gap-2">
                  {relationChains[selectedChainIndex].nodes.map((node, i) => (
                    <React.Fragment key={i}>
                      <span className="px-3 py-1.5 bg-white rounded-full border border-purple-200 text-sm font-medium text-purple-800 shadow-sm">
                        {node}
                      </span>
                      {i < relationChains[selectedChainIndex].nodes.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <span className="font-medium">原始数据：</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                  {relationChains[selectedChainIndex].mechanismGroup}
                </code>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 网络图视图 - 保持原有的复杂图形 */}
      {graphView === 'network' && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Graph Canvas */}
          <div
            ref={canvasRef}
            className="relative bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border-2 border-gray-200 overflow-hidden select-none"
            style={{
              height: '550px',
              cursor: draggingNode ? 'grabbing' : isPanning ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={(e) => {
              handleMouseMove(e);
              handleCanvasMouseMove(e);
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* SVG Layer for connections - 曲线连接 */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <defs>
                {/* 渐变定义 */}
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.6" />
                </linearGradient>
                {/* 高亮渐变 */}
              <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
              </linearGradient>
              {/* 发光滤镜 */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {visibleConnections.map((conn, index) => {
              const fromNode = visibleNodes.find(n => n.id === conn.from);
              const toNode = visibleNodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              // 跳过自连接，并避免零距离导致的 NaN
              if (fromNode.id === toNode.id) return null;

              const isHighlighted = selectedNode === conn.from || selectedNode === conn.to;
              const isHoveredConnection = hoveredNode === conn.from || hoveredNode === conn.to;

              // 计算曲线控制点 - 二次贝塞尔曲线
              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              // 根据节点距离计算曲线弯曲程度
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const safeDistance = Math.max(distance, 1); // 避免 0 距离导致除零

              // 垂直于连线方向的偏移，创建曲线效果
              const curvature = Math.min(safeDistance * 0.15, 50);
              const perpX = -dy / safeDistance * curvature;
              const perpY = dx / safeDistance * curvature;

              // 控制点
              const ctrlX = midX + perpX;
              const ctrlY = midY + perpY;

              // 曲线路径
              const path = `M ${fromNode.x} ${fromNode.y} Q ${ctrlX} ${ctrlY} ${toNode.x} ${toNode.y}`;

              return (
                <g key={index}>
                  {/* 背景曲线（用于悬停效果） */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                    className="cursor-pointer"
                  />

                  {/* 主曲线 */}
                  <motion.path
                    d={path}
                    fill="none"
                    stroke={isHighlighted ? 'url(#highlightGradient)' : isHoveredConnection ? '#a5b4fc' : 'url(#connectionGradient)'}
                    strokeWidth={isHighlighted ? 2.5 : isHoveredConnection ? 2 : 1.5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: isHighlighted ? 1 : isHoveredConnection ? 0.8 : 0.5
                    }}
                    transition={{ duration: 0.6, delay: index * 0.02 }}
                    filter={isHighlighted ? 'url(#glow)' : undefined}
                  />

                  {/* 关系标签 - 显示在曲线中点 */}
                  {(isHighlighted || isHoveredConnection) && (
                    <motion.g
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* 标签背景 */}
                      <rect
                        x={ctrlX - conn.type.length * 5 - 6}
                        y={ctrlY - 10}
                        width={conn.type.length * 10 + 12}
                        height={20}
                        rx="10"
                        fill="white"
                        stroke={isHighlighted ? '#6366f1' : '#a5b4fc'}
                        strokeWidth="1"
                        className="shadow-sm"
                      />
                      <text
                        x={ctrlX}
                        y={ctrlY + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="500"
                        fill={isHighlighted ? '#4f46e5' : '#6366f1'}
                        className="pointer-events-none"
                      >
                        {conn.type}
                      </text>
                    </motion.g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes Layer with zoom/pan transform */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <AnimatePresence>
              {visibleNodes.map((node, index) => {
              const isSelected = selectedNode === node.id;
              const isHovered = hoveredNode === node.id;
              const isFaded = 'isFaded' in node && node.isFaded;
              const Icon = node.icon;

              return (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: isFaded ? 0.25 : 1,
                    x: 0,
                    y: 0,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    delay: draggingNode ? 0 : index * 0.02,
                  }}
                  className="absolute"
                  style={{
                    left: node.x,
                    top: node.y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: draggingNode === node.id ? 100 : isSelected ? 30 : isHovered ? 20 : 10,
                    cursor: draggingNode === node.id ? 'grabbing' : 'grab',
                  }}
                  onMouseEnter={() => !draggingNode && setHoveredNode(node.id)}
                  onMouseLeave={() => !draggingNode && setHoveredNode(null)}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onClick={(e) => {
                    if (!draggingNode) {
                      setSelectedNode(isSelected ? null : node.id);
                    }
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-md border-2 transition-all ${
                      isSelected
                        ? 'bg-white shadow-lg'
                        : 'bg-white hover:shadow-lg'
                    }`}
                    style={{
                      borderColor: isSelected || isHovered ? node.color : '#e5e7eb',
                      boxShadow: isSelected ? `0 4px 16px ${node.color}40` : undefined,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${node.color}20` }}
                    >
                      <Icon className="w-3 h-3" style={{ color: node.color }} />
                    </div>

                    {/* Label */}
                    <span
                      className="text-xs font-medium truncate max-w-[100px]"
                      style={{ color: isSelected ? node.color : '#374151' }}
                      title={node.label}
                    >
                      {node.label.length > 10 ? node.label.slice(0, 10) + '...' : node.label}
                    </span>

                    {/* Connection badge */}
                    {node.connectionCount > 0 && (
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: node.color }}
                      >
                        {node.connectionCount}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          </div>

          {/* Empty state hint */}
          {visibleNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>请在右侧选择要显示的实体类型</p>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
              className="w-10 h-10 bg-white/90 backdrop-blur rounded-lg shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
              title="放大 (Zoom In)"
            >
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(0.3, prev / 1.2))}
              className="w-10 h-10 bg-white/90 backdrop-blur rounded-lg shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
              title="缩小 (Zoom Out)"
            >
              <ZoomOut className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={resetView}
              className="w-10 h-10 bg-white/90 backdrop-blur rounded-lg shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
              title="重置视图 (Reset View)"
            >
              <Maximize2 className="w-5 h-5 text-gray-700" />
            </button>
            <div className="w-10 px-2 py-1 bg-indigo-500/90 backdrop-blur rounded-lg shadow-md text-center">
              <span className="text-[10px] font-bold text-white">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {/* Helper text */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600">
              💡 拖拽画布平移 • 滚轮缩放 • 点击节点查看详情 • 当前显示 {visibleNodes.filter(n => !('isFaded' in n && n.isFaded)).length} 个节点
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* View Mode Toggle */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-indigo-700">视图模式</span>
              <span className="text-[10px] text-indigo-500">
                {networkViewMode === 'simplified' ? '只显示核心实体' : '显示全部节点'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setNetworkViewMode('simplified')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  networkViewMode === 'simplified'
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                    : 'bg-transparent text-indigo-500 hover:bg-white/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                精简视图
              </button>
              <button
                onClick={() => setNetworkViewMode('full')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  networkViewMode === 'full'
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                    : 'bg-transparent text-indigo-500 hover:bg-white/50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                完整视图
              </button>
            </div>
            {networkViewMode === 'simplified' && (
              <p className="text-[10px] text-indigo-500 mt-2 leading-relaxed">
                💡 AI 自动过滤噪音，只展示核心关系。点击节点查看关联的详细数据。
              </p>
            )}
          </div>

          {/* Type Filter */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                按类型筛选
              </h4>
              <button
                onClick={toggleAllTypes}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {showAllTypes ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showAllTypes ? '取消全选' : '全选'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {allTypes.map(type => {
                const config = typeConfig[type] || typeConfig['文档'];
                const count = typeStats.get(type) || 0;
                const isActive = showAllTypes || selectedTypes.has(type);
                const Icon = config.icon;

                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: isActive ? config.color : undefined,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                    <span className={`ml-0.5 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNode ? (
            <motion.div
              key={selectedNode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 p-4"
              style={{ borderColor: selectedNodeObj?.color }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {selectedNodeObj && (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${selectedNodeObj.color}20` }}
                    >
                      <selectedNodeObj.icon className="w-5 h-5" style={{ color: selectedNodeObj.color }} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{selectedNode}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">{selectedNodeObj?.type}</span>
                      {selectedNodeObj?.isCore && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">核心</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Attributes */}
              {selectedNodeData?.attributes && Object.keys(selectedNodeData.attributes).length > 0 && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <div className="text-[10px] text-gray-500 mb-1">属性</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(selectedNodeData.attributes).map(([key, value]) => (
                      <span key={key} className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 关联的属性数据 */}
              {relatedAttributeNodes.length > 0 && (
                <div className="mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-[10px] text-amber-700 mb-2 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    关联数据 ({relatedAttributeNodes.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {relatedAttributeNodes.map((attrNode) => {
                      const AttrIcon = attrNode.icon;
                      return (
                        <div
                          key={attrNode.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-amber-200 text-xs"
                          title={`${attrNode.type}: ${attrNode.label}`}
                        >
                          <AttrIcon className="w-3 h-3" style={{ color: attrNode.color }} />
                          <span className="text-gray-700 max-w-[80px] truncate">{attrNode.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Connections - 只显示核心节点间的关系 */}
              <div>
                <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
                  <Link2Icon className="w-3 h-3" />
                  关联实体 ({selectedConnections.filter(c => {
                    const otherNode = c.from === selectedNode ? c.to : c.from;
                    const otherNodeData = nodes.find(n => n.id === otherNode);
                    return networkViewMode === 'full' || otherNodeData?.isCore;
                  }).length})
                </div>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {selectedConnections
                    .filter(c => {
                      const otherNode = c.from === selectedNode ? c.to : c.from;
                      const otherNodeData = nodes.find(n => n.id === otherNode);
                      return otherNodeData?.isCore;
                    })
                    .map((conn, index) => {
                      const otherNode = conn.from === selectedNode ? conn.to : conn.from;
                      const otherNodeData = nodes.find(n => n.id === otherNode);
                      const direction = conn.from === selectedNode ? '→' : '←';

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedNode(otherNode)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
                        >
                          <span className="text-gray-400 text-xs">{direction}</span>
                          {otherNodeData && (
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${otherNodeData.color}20` }}
                            >
                              <otherNodeData.icon className="w-3 h-3" style={{ color: otherNodeData.color }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{otherNode}</div>
                            <div className="text-[10px] text-gray-500">{conn.type}</div>
                          </div>
                        </button>
                      );
                    })}
                  {selectedConnections.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">暂无关联</p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Info className="w-7 h-7 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">选择一个节点</h4>
              <p className="text-xs text-gray-500">
                点击图中任意节点<br />查看详细信息和关联数据
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
            <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              统计概览
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-indigo-600">{coreNodes.length}</div>
                <div className="text-[10px] text-gray-600">核心实体</div>
              </div>
              <div className="bg-white/60 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-amber-600">{attributeNodes.length}</div>
                <div className="text-[10px] text-gray-600">属性数据</div>
              </div>
              <div className="bg-white/60 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-purple-600">{connections.length}</div>
                <div className="text-[10px] text-gray-600">关系总数</div>
              </div>
              <div className="bg-white/60 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-indigo-600">
                  {visibleNodes.filter(n => !('isFaded' in n && n.isFaded)).length}
                </div>
                <div className="text-[10px] text-gray-600">当前显示</div>
              </div>
            </div>
            {attributeNodes.length > 0 && (
              <p className="text-[10px] text-gray-500 mt-2 text-center">
                {attributeNodes.length} 个属性数据已收纳到节点详情中
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <motion.button
          onClick={onPrevious}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:border-indigo-300 hover:shadow-md transition-all"
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>上一步</span>
        </motion.button>

        <motion.button
          onClick={onNext}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          whileHover={{ scale: 1.02, x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>继续到智能问答</span>
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
