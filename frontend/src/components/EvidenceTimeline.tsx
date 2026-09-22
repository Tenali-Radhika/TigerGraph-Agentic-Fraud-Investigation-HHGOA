import React, { useState } from 'react';
import { Network, Activity, Cpu, Database, UserCheck, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';

interface EvidenceItem {
  evidence_id: string;
  source: string;
  timestamp: string;
  title: string;
  description: string;
  risk_contribution: number;
  data?: any;
}

interface EvidenceTimelineProps {
  evidenceTrail: EvidenceItem[];
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ evidenceTrail }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSourceIcon = (source: string) => {
    if (source.includes('TigerGraph') || source.includes('MultiHop')) return <Network className="h-4 w-4 text-orange-400" />;
    if (source.includes('Velocity')) return <Activity className="h-4 w-4 text-amber-400" />;
    if (source.includes('Device')) return <Cpu className="h-4 w-4 text-cyan-400" />;
    if (source.includes('Memory')) return <Database className="h-4 w-4 text-purple-400" />;
    return <UserCheck className="h-4 w-4 text-emerald-400" />;
  };

  const getContributionPill = (val: number) => {
    if (val >= 0.5) return <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/25">High Fraud Signal</span>;
    if (val > 0) return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/25">Moderate Signal</span>;
    return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/25">Benign Indicator</span>;
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 text-orange-500" />
          <span>Synthesized Evidence Trail ({evidenceTrail.length} Signals)</span>
        </h3>
        <span className="text-xs text-slate-400">TigerGraph Grounded Knowledge</span>
      </div>

      <div className="space-y-3">
        {evidenceTrail.map((item, idx) => {
          const isExpanded = expandedId === item.evidence_id;
          return (
            <div
              key={item.evidence_id || idx}
              className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-3.5 hover:border-slate-700 transition-all"
            >
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.evidence_id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 mt-0.5">
                    {getSourceIcon(item.source)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200">{item.title}</span>
                      {getContributionPill(item.risk_contribution)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1.5">
                      Source: {item.source} • {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                </div>

                <button className="text-slate-400 hover:text-white p-1">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {isExpanded && item.data && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                    Raw Telemetry & Subgraph Attributes:
                  </span>
                  <pre className="p-2.5 rounded bg-slate-950 text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
