import React, { useState, useEffect } from 'react';
import { Network, Search, Filter, ShieldAlert, Cpu, Database, CreditCard } from 'lucide-react';
import { GraphCanvas } from '../components/GraphCanvas';

export const GraphExplorer: React.FC = () => {
  const [selectedTx, setSelectedTx] = useState('TX_3031048');
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const presetTxs = [
    { id: 'TX_3031048', label: 'Case 02: Synthetic Identity Ring (4 Accounts)', tag: 'Ring' },
    { id: 'TX_3038810', label: 'Case 04: Emulator Farm Burst', tag: 'Emulator' },
    { id: 'TX_3042190', label: 'Case 05: Dormant Platinum Bust-Out ($14,200)', tag: 'Bust-Out' },
    { id: 'TX_3048991', label: 'Case 07: VIP International Traveler', tag: 'Benign' },
    { id: 'TX_3088999', label: 'Case 20: Multi-Hop Auto Dealership Fraud', tag: 'Critical' }
  ];

  const fetchGraph = (txId: string) => {
    setLoading(true);
    fetch(`/api/graph/${txId}`)
      .then((res) => res.json())
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load graph:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGraph(selectedTx);
  }, [selectedTx]);

  const filteredNodes = graphData.nodes?.filter((n) => {
    if (activeFilter === 'ALL') return true;
    return n.type.toUpperCase() === activeFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Network className="h-5 w-5 text-orange-500" />
            <span>TigerGraph Multi-Hop Topological Explorer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing multi-hop entity relationships, shared hardware fingerprints, residential proxy clusters, and synchronized fraud rings.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Load Topology:</span>
          <select
            value={selectedTx}
            onChange={(e) => setSelectedTx(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
          >
            {presetTxs.map((ptx) => (
              <option key={ptx.id} value={ptx.id}>
                {ptx.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-3 text-xs">
        <div className="flex items-center space-x-4">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Entity Types:</span>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B00]"></span>
            <span className="text-slate-300">Transaction</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]"></span>
            <span className="text-slate-300">Account</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#A855F7]"></span>
            <span className="text-slate-300">Card</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#06B6D4]"></span>
            <span className="text-slate-300">Device</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]"></span>
            <span className="text-slate-300">IP Address</span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-medium">
          {['ALL', 'ACCOUNT', 'DEVICE', 'IP_ADDRESS'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-1 rounded ${
                activeFilter === f ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <GraphCanvas
        nodes={filteredNodes.length > 0 ? filteredNodes : graphData.nodes}
        edges={graphData.edges}
      />
    </div>
  );
};
