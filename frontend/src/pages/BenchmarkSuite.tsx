import React, { useState, useEffect } from 'react';
import { Layers, Download, CheckCircle2, FileText, ArrowRight, ShieldCheck, RefreshCw, Eye } from 'lucide-react';

interface BenchmarkItem {
  case_id: string;
  title: string;
  fraud_type: string;
  pre_action: string;
  post_action: string;
  sar_filed: boolean;
  file: string;
}

interface BenchmarkSuiteProps {
  onSelectCase: (caseId: string) => void;
}

export const BenchmarkSuite: React.FC<BenchmarkSuiteProps> = ({ onSelectCase }) => {
  const [summary, setSummary] = useState<BenchmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJson, setSelectedJson] = useState<any>(null);
  const [jsonLoading, setJsonLoading] = useState(false);

  useEffect(() => {
    fetch('/api/benchmark/summary')
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load benchmark summary:', err);
        setLoading(false);
      });
  }, []);

  const handleDownloadAll = () => {
    window.location.href = '/api/benchmark/download-all';
  };

  const handleInspectJson = (caseId: string) => {
    setJsonLoading(true);
    fetch(`/api/cases/${caseId}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedJson(data);
        setJsonLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setJsonLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel-glow p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-bold text-white">20 Benchmark Cases Evaluation Suite</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Official HHGOA Hackathon benchmark cases evaluated end-to-end. Each answer file records full investigation history, pre/post evidence Next Best Actions, TigerGraph memory ingestion, and FinCEN SARs.
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          <span>Download All 20 Cases (.ZIP)</span>
        </button>
      </div>

      {/* Verification Matrix Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="glass-panel p-4 flex items-center space-x-3 border-emerald-500/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <div>
            <div className="text-lg font-bold text-white">{summary.length} / 20 Cases</div>
            <div className="text-[11px] text-slate-400">100% Submission Ready</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center space-x-3 border-purple-500/30">
          <FileText className="h-8 w-8 text-purple-400" />
          <div>
            <div className="text-lg font-bold text-white">{summary.filter(s => s.sar_filed).length} FinCEN SARs</div>
            <div className="text-[11px] text-slate-400">Form 111 Regulatory Reports</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center space-x-3 border-orange-500/30">
          <ShieldCheck className="h-8 w-8 text-orange-400" />
          <div>
            <div className="text-lg font-bold text-white">Dual NBA State</div>
            <div className="text-[11px] text-slate-400">Recorded Pre & Post Evidence</div>
          </div>
        </div>
      </div>

      {/* Benchmark Table */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Evaluated Benchmark Answer Files (case_01.json ... case_20.json)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">File Name</th>
                <th className="py-3 px-3">Case ID & Scenario</th>
                <th className="py-3 px-3">Detected Fraud Typology</th>
                <th className="py-3 px-3">Pre-Evidence NBA</th>
                <th className="py-3 px-3">Post-Evidence NBA</th>
                <th className="py-3 px-3">FinCEN SAR</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {summary.map((item) => (
                <tr key={item.case_id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 text-orange-400 font-bold whitespace-nowrap">
                    {item.file}
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className="font-mono font-bold text-slate-200">{item.case_id}:</span> {item.title}
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-sans">
                    {item.fraud_type}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{item.pre_action}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      item.post_action.includes('BLOCK') ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.post_action}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {item.sar_filed ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        SAR Filed
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">None</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap font-sans">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleInspectJson(item.case_id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View JSON Submission"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectCase(item.case_id)}
                        className="px-2.5 py-1 rounded bg-orange-500/20 hover:bg-orange-500 hover:text-white text-orange-400 text-xs font-semibold transition-all"
                      >
                        Open Workbench
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspection Drawer */}
      {selectedJson && (
        <div className="glass-panel p-5 space-y-3 relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-orange-400 font-mono">
              Submission JSON Payload: {selectedJson.case_id}
            </span>
            <button
              onClick={() => setSelectedJson(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
            >
              Close
            </button>
          </div>
          <pre className="p-4 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 border border-slate-800">
            {JSON.stringify(selectedJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
