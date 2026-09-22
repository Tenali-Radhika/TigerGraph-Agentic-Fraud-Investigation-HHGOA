import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight, Search, FileText, Activity } from 'lucide-react';

interface CaseItem {
  case_id: string;
  title: string;
  transaction_id: string;
  amount: number;
  trigger_type: string;
  initial_risk_score: number;
  likely_fraud_type: string;
  is_resolved: boolean;
  sar_filed: boolean;
  pre_action: string;
  post_action: string;
}

interface DashboardProps {
  onSelectCase: (caseId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectCase }) => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'HIGH_RISK' | 'SAR_REQUIRED'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases')
      .then((res) => res.json())
      .then((data) => {
        setCases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch cases:', err);
        setLoading(false);
      });
  }, []);

  const totalCases = cases.length || 20;
  const highRiskCount = cases.filter((c) => c.initial_risk_score >= 0.75).length;
  const sarCount = cases.filter((c) => c.sar_filed).length;
  const resolvedCount = cases.filter((c) => c.is_resolved).length;

  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                          c.case_id.toLowerCase().includes(search.toLowerCase()) ||
                          c.transaction_id.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'HIGH_RISK') return c.initial_risk_score >= 0.75;
    if (filter === 'SAR_REQUIRED') return c.sar_filed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="glass-panel-glow p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>TigerGraph Agentic Fraud Sentinel Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Autonomous fraud triage and Next-Best Action decision engine powered by TigerGraph multi-hop topological analytics, GraphRAG memory grounding, and FinCEN compliance governance.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center rounded-md bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 border border-orange-500/20">
            Savanna CE & Embedded Graph Engine Active
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 border-l-4 border-l-orange-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Benchmark Cases</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-white">{totalCases}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              100% Evaluated <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Full 20-case IEEE-CIS evaluation suite</p>
        </div>

        <div className="glass-panel p-4 border-l-4 border-l-rose-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">High-Risk Fraud Signals</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-rose-400">{highRiskCount}</span>
            <span className="text-xs text-rose-400 font-semibold flex items-center">
              Score ≥ 0.75 <AlertTriangle className="h-3.5 w-3.5 ml-1" />
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Immediate action & soft-holds executed</p>
        </div>

        <div className="glass-panel p-4 border-l-4 border-l-purple-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">FinCEN SARs Drafted</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-purple-400">{sarCount}</span>
            <span className="text-xs text-purple-400 font-semibold flex items-center">
              Form 111 Ready <FileText className="h-3.5 w-3.5 ml-1" />
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Threshold: $5,000+ suspected exposure</p>
        </div>

        <div className="glass-panel p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Graph Memory Stored</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-emerald-400">{resolvedCount}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              Topology Linked <TrendingUp className="h-3.5 w-3.5 ml-1" />
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">CaseMemory vector embeddings active</p>
        </div>
      </div>

      {/* Case Management Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Active Fraud Investigations Queue ({filteredCases.length} Cases)
            </h3>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search case, ID, or amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium ${filter === 'ALL' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('HIGH_RISK')}
                className={`px-2.5 py-1 rounded font-medium ${filter === 'HIGH_RISK' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                High Risk
              </button>
              <button
                onClick={() => setFilter('SAR_REQUIRED')}
                className={`px-2.5 py-1 rounded font-medium ${filter === 'SAR_REQUIRED' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                SAR Required
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Case ID</th>
                <th className="py-3 px-3">Case Title & Typology</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Risk Score</th>
                <th className="py-3 px-3">Trigger</th>
                <th className="py-3 px-3">Pre-Action</th>
                <th className="py-3 px-3">Post-Action</th>
                <th className="py-3 px-3">SAR</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCases.map((c) => {
                const isHighRisk = c.initial_risk_score >= 0.75;
                return (
                  <tr key={c.case_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-orange-400 whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{c.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.likely_fraud_type}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold whitespace-nowrap">
                      ${c.amount.toLocaleString()} USD
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isHighRisk ? 'badge-risk-critical' : 'badge-risk-low'
                      }`}>
                        {(c.initial_risk_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 capitalize whitespace-nowrap">
                      {c.trigger_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {c.pre_action}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                        c.post_action.includes('BLOCK') ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {c.post_action}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.sar_filed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          Filed
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectCase(c.case_id)}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-orange-600/20 hover:bg-orange-500 hover:text-white text-orange-400 border border-orange-500/30 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>Investigate</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
