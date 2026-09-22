import React, { useState } from 'react';
import { Network, ZoomIn, ZoomOut, RefreshCw, Info } from 'lucide-react';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  attributes?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (node: GraphNode) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ nodes, edges, onSelectNode }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);

  // Fallback if empty nodes
  const displayNodes = nodes && nodes.length > 0 ? nodes : [
    { id: 'Transaction:TX_3031048', type: 'Transaction', label: 'Transaction ($8,900)' },
    { id: 'Account:ACC_99014', type: 'Account', label: 'Account: ACC_99014' },
    { id: 'Card:CARD_773102', type: 'Card', label: 'Card: Visa' },
    { id: 'Device:DEV_RING_02', type: 'Device', label: 'Device: Emulator' },
    { id: 'IP_Address:203.0.113.88', type: 'IP_Address', label: 'IP: Proxy 203.0.113.88' },
    { id: 'Account:ACC_SYN_02', type: 'Account', label: 'Ring Account 2' },
    { id: 'Account:ACC_SYN_03', type: 'Account', label: 'Ring Account 3' }
  ];

  const displayEdges = edges && edges.length > 0 ? edges : [
    { source: 'Account:ACC_99014', target: 'Transaction:TX_3031048', type: 'MADE_TRANSACTION' },
    { source: 'Transaction:TX_3031048', target: 'Card:CARD_773102', type: 'USED_CARD' },
    { source: 'Transaction:TX_3031048', target: 'Device:DEV_RING_02', type: 'ON_DEVICE' },
    { source: 'Transaction:TX_3031048', target: 'IP_Address:203.0.113.88', type: 'FROM_IP' },
    { source: 'Account:ACC_99014', target: 'Account:ACC_SYN_02', type: 'SHARES_DEVICE' },
    { source: 'Account:ACC_99014', target: 'Account:ACC_SYN_03', type: 'SHARES_IP' }
  ];

  // Simple radial node positioning
  const width = 640;
  const height = 380;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 130;

  const nodePositions: Record<string, { x: number; y: number }> = {};
  displayNodes.forEach((node, idx) => {
    if (idx === 0) {
      nodePositions[node.id] = { x: centerX, y: centerY };
    } else {
      const angle = ((idx - 1) / (displayNodes.length - 1)) * 2 * Math.PI;
      nodePositions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    }
  });

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Transaction': return '#FF6B00'; // TigerGraph Orange
      case 'Account': return '#3B82F6';     // Blue
      case 'Device': return '#06B6D4';      // Cyan
      case 'IP_Address': return '#10B981';  // Emerald
      case 'Card': return '#A855F7';        // Purple
      default: return '#F59E0B';            // Amber
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden flex flex-col h-[460px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
        <div className="flex items-center space-x-2">
          <Network className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            TigerGraph Topological Subgraph ({displayNodes.length} Nodes, {displayEdges.length} Edges)
          </h3>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
          <button onClick={() => setZoom(Math.min(1.4, zoom + 0.1))} className="p-1 hover:text-orange-400">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[10px] text-slate-400">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.max(0.7, zoom - 0.1))} className="p-1 hover:text-orange-400">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1 hover:text-orange-400 ml-1">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950/60 rounded-lg border border-slate-800/80 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
        >
          {/* Edges */}
          <g>
            {displayEdges.map((edge, idx) => {
              const u = nodePositions[edge.source];
              const v = nodePositions[edge.target];
              if (!u || !v) return null;

              const isRingEdge = edge.type.includes('SHARES');
              return (
                <g key={idx}>
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={isRingEdge ? '#EF4444' : '#334155'}
                    strokeWidth={isRingEdge ? 2.5 : 1.5}
                    strokeDasharray={isRingEdge ? '5,5' : undefined}
                    opacity={0.7}
                  />
                  {/* Midpoint Edge Label */}
                  <text
                    x={(u.x + v.x) / 2}
                    y={(u.y + v.y) / 2 - 4}
                    fill={isRingEdge ? '#F87171' : '#64748B'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {edge.type}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {displayNodes.map((node) => {
              const pos = nodePositions[node.id] || { x: centerX, y: centerY };
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer group"
                >
                  {/* Glow circle on selected */}
                  {isSelected && (
                    <circle r="22" fill="none" stroke={color} strokeWidth="3" opacity="0.6" className="animate-ping" />
                  )}
                  {/* Main Node Circle */}
                  <circle
                    r="15"
                    fill="#0F172A"
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    className="group-hover:scale-110 transition-transform"
                  />
                  {/* Inner Accent Dot */}
                  <circle r="5" fill={color} />
                  {/* Label */}
                  <text
                    y="27"
                    fill="#E2E8F0"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-md"
                  >
                    {node.label || node.id.split(':')[1]}
                  </text>
                  <text
                    y="37"
                    fill="#94A3B8"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {node.type}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute bottom-2 right-2 max-w-xs bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl text-xs backdrop-blur-md">
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800">
              <span className="font-bold text-orange-400">{selectedNode.type}</span>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="font-mono text-slate-200 text-[11px] truncate mb-1">{selectedNode.id}</p>
            {selectedNode.attributes && (
              <pre className="p-1.5 rounded bg-slate-950 text-[10px] font-mono text-slate-400 max-h-24 overflow-y-auto">
                {JSON.stringify(selectedNode.attributes, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
