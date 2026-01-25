import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface Relationship {
  from: string;
  to: string;
  type: string;
  strength: number;
}

interface GraphVisualizationProps {
  relationships: Relationship[];
  onRelationshipSelect: (index: number | null) => void;
  selectedRelationship: number | null;
  onNodeClick?: (nodeName: string) => void;
  selectedNode?: string | null;
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number;
}

export function GraphVisualization({ 
  relationships, 
  onRelationshipSelect, 
  selectedRelationship,
  onNodeClick,
  selectedNode
}: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const animationFrameRef = useRef<number>();

  // Extract unique nodes from relationships
  useEffect(() => {
    const nodeMap = new Map<string, number>();
    relationships.forEach(rel => {
      nodeMap.set(rel.from, (nodeMap.get(rel.from) || 0) + 1);
      nodeMap.set(rel.to, (nodeMap.get(rel.to) || 0) + 1);
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    const newNodes: Node[] = Array.from(nodeMap.entries()).map(([id, connections], index) => {
      const angle = (index / nodeMap.size) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;
      return {
        id,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        connections,
      };
    });

    setNodes(newNodes);
  }, [relationships]);

  // Physics simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const simulate = () => {
      setNodes(prevNodes => {
        const canvas = canvasRef.current;
        if (!canvas) return prevNodes;

        const newNodes = prevNodes.map(node => {
          if (draggedNode === node.id) return node;

          let fx = 0, fy = 0;

          // Repulsion between nodes
          prevNodes.forEach(other => {
            if (other.id === node.id) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 3000 / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          });

          // Attraction for connected nodes
          relationships.forEach(rel => {
            let other: Node | undefined;
            if (rel.from === node.id) {
              other = prevNodes.find(n => n.id === rel.to);
            } else if (rel.to === node.id) {
              other = prevNodes.find(n => n.id === rel.from);
            }
            if (other) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = distance * 0.01;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          });

          // Center gravity
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          fx += (centerX - node.x) * 0.01;
          fy += (centerY - node.y) * 0.01;

          // Update velocity with damping
          const vx = (node.vx + fx) * 0.85;
          const vy = (node.vy + fy) * 0.85;

          return {
            ...node,
            x: node.x + vx,
            y: node.y + vy,
            vx,
            vy,
          };
        });

        return newNodes;
      });

      animationFrameRef.current = requestAnimationFrame(simulate);
    };

    animationFrameRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [nodes.length, draggedNode, relationships]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    relationships.forEach((rel, index) => {
      const fromNode = nodes.find(n => n.id === rel.from);
      const toNode = nodes.find(n => n.id === rel.to);
      if (!fromNode || !toNode) return;

      const isSelected = selectedRelationship === index;
      const isHovered = hoveredEdge === index;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = isSelected || isHovered ? '#6366f1' : '#cbd5e1';
      ctx.lineWidth = isSelected || isHovered ? 3 : 2;
      ctx.stroke();

      // Draw arrow
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const arrowSize = 8;
      const nodeRadius = 8 + toNode.connections * 3;
      const arrowX = toNode.x - Math.cos(angle) * (nodeRadius + 5);
      const arrowY = toNode.y - Math.sin(angle) * (nodeRadius + 5);

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = isSelected || isHovered ? '#6366f1' : '#cbd5e1';
      ctx.fill();

      // Draw label
      if (isHovered || isSelected) {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.font = '12px system-ui';
        ctx.fillStyle = '#4f46e5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = rel.type;
        const metrics = ctx.measureText(text);
        ctx.fillStyle = 'white';
        ctx.fillRect(midX - metrics.width / 2 - 4, midY - 8, metrics.width + 8, 16);
        ctx.fillStyle = '#4f46e5';
        ctx.fillText(text, midX, midY);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const radius = 8 + node.connections * 3;
      const isSelected = selectedNode === node.id;
      
      // Node shadow
      ctx.beginPath();
      ctx.arc(node.x + 2, node.y + 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fill();

      // Selected node outer ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      const gradient = ctx.createLinearGradient(node.x - radius, node.y - radius, node.x + radius, node.y + radius);
      if (isSelected) {
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
      } else {
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
      }
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.font = isSelected ? 'bold 12px system-ui' : '11px system-ui';
      ctx.fillStyle = isSelected ? '#1f2937' : '#1f2937';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const maxWidth = 100;
      const text = node.id.length > 20 ? node.id.substring(0, 20) + '...' : node.id;
      ctx.fillText(text, node.x, node.y + radius + 4, maxWidth);
    });
  }, [nodes, selectedRelationship, hoveredEdge, relationships, selectedNode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const radius = 8 + node.connections * 3;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < radius;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNode) {
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === draggedNode
            ? { ...node, x, y, vx: 0, vy: 0 }
            : node
        )
      );
    } else {
      // Check for edge hover
      let foundEdge: number | null = null;
      relationships.forEach((rel, index) => {
        const fromNode = nodes.find(n => n.id === rel.from);
        const toNode = nodes.find(n => n.id === rel.to);
        if (!fromNode || !toNode) return;

        const distance = distanceToLineSegment(x, y, fromNode.x, fromNode.y, toNode.x, toNode.y);
        if (distance < 10) {
          foundEdge = index;
        }
      });
      setHoveredEdge(foundEdge);
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for edge click
    relationships.forEach((rel, index) => {
      const fromNode = nodes.find(n => n.id === rel.from);
      const toNode = nodes.find(n => n.id === rel.to);
      if (!fromNode || !toNode) return;

      const distance = distanceToLineSegment(x, y, fromNode.x, fromNode.y, toNode.x, toNode.y);
      if (distance < 10) {
        onRelationshipSelect(index);
      }
    });

    // Check for node click
    nodes.forEach(node => {
      const radius = 8 + node.connections * 3;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (distance < radius) {
        onNodeClick?.(node.id);
      }
    });
  };

  const distanceToLineSegment = (
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-200">
        💡 点击并拖动节点来重新组织图谱
      </div>
    </div>
  );
}