import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, RefreshCw, AlertCircle, FileText, Network, CheckCircle, Clock } from 'lucide-react';
import { RiskGauge } from '../components/RiskGauge';
import { ActionCards } from '../components/ActionCards';
import { EvidenceTimeline } from '../components/EvidenceTimeline';
import { SARViewer } from '../components/SARViewer';
import { GraphCanvas } from '../components/GraphCanvas';
import { ApprovalModal } from '../components/ApprovalModal';

interface CaseWorkbenchProps {
  selectedCaseId: string;
  onBack: () => void;
}

export const CaseWorkbench: React.FC<CaseWorkbenchProps> = ({ selectedCaseId, onBack }) => {
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'OVERVIEW' | 'GRAPH' | 'SAR' | 'AUDIT'>('OVERVIEW');
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [allCases, setAllCases] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/cases')
      .then((res) => res.json())
      .then((data) => setAllCases(data))
      .catch((e) => console.error(e));
  }, []);

  const loadCase = (cId: string) => {
    setLoading(true);
    fetch(`/api/cases/${cId}`)
      .then((res) => res.json())
      .then((data) => {
        setCaseData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load case:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadCase(selectedCaseId);
    }
  }, [selectedCaseId]);

  if (loading) {
    return (
      <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Retrieving TigerGraph Subgraph & Case Memory...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="glass-panel p-8 text-center space-y-3">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-white">Case Not Found</h3>
        <button onClick={onBack} className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const txDetails = caseData.transaction_details || {};
  const findings = caseData.findings || {};
  const nba = caseData.next_best_action || {};
  const preAction = nba.before_additional_evidence || caseData.pre_evidence_action;
  const postAction = nba.after_additional_evidence || caseData.post_evidence_action;
  const evidenceTrail = caseData.evidence?.evidence_trail || caseData.evidence_trail || [];
  const sarReport = caseData.suspicious_activity_report || caseData.sar_report;

  // Graph nodes & edges from subgraph
  const subgraphNodes = caseData.subgraph?.nodes || [];
  const subgraphEdges = caseData.subgraph?.edges || [];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Case Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-orange-400">{caseData.case_id}</span>
              <span className="text-slate-600">•</span>
              <h2 className="text-base font-bold text-white">{caseData.case_title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Transaction: <span className="font-mono text-slate-200">{caseData.transaction_id}</span> • 
              Trigger: <span className="capitalize text-slate-300">{caseData.trigger?.type || caseData.trigger_type}</span>
            </p>
          </div>
        </div>

        {/* Quick Case Switcher */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-400">Switch Case:</span>
          <select
            value={caseData.case_id}
            onChange={(e) => loadCase(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
          >
            {allCases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id}: {c.title.slice(0, 32)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-1">
        <button
          onClick={() => setActiveView('OVERVIEW')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
            activeView === 'OVERVIEW'
              ? 'bg-slate-900 text-orange-400 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Investigation Overview & NBA
        </button>
        <button
          onClick={() => setActiveView('GRAPH')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg flex items-center space-x-1.5 transition-all ${
            activeView === 'GRAPH'
              ? 'bg-slate-900 text-orange-400 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="h-3.5 w-3.5" />
          <span>Knowledge Graph Subgraph</span>
        </button>
        <button
          onClick={() => setActiveView('SAR')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg flex items-center space-x-1.5 transition-all ${
            activeView === 'SAR'
              ? 'bg-slate-900 text-orange-400 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>FinCEN SAR (Form 111)</span>
          {sarReport && <span className="h-2 w-2 rounded-full bg-rose-500 inline-block ml-1"></span>}
        </button>
        <button
          onClick={() => setActiveView('AUDIT')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
            activeView === 'AUDIT'
              ? 'bg-slate-900 text-orange-400 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Narrative & Records
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeView === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Risk Gauge & Entity Highlights */}
          <div className="space-y-6">
            <RiskGauge
              score={findings.fraud_probability ?? caseData.fraud_probability ?? 0.5}
              confidence={findings.confidence_score ?? caseData.confidence_score ?? 0.5}
              confidenceLevel={findings.confidence_level ?? caseData.confidence_level ?? 'LOW'}
            />

            {/* Entity Summary Card */}
            <div className="glass-panel p-5 space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-300">Transaction & Entity Signals</h4>
              <div className="space-y-2 font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Monetary Amount:</span>
                  <span className="font-bold text-slate-100">${txDetails.amount?.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Originating Account:</span>
                  <span className="text-blue-400">{txDetails.account_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Card Identifier:</span>
                  <span className="text-purple-400">{txDetails.card_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Device Fingerprint:</span>
                  <span className="text-cyan-400 truncate max-w-[150px]">{txDetails.device_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Network IP Address:</span>
                  <span className="text-emerald-400">{txDetails.ip_address || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Channel / Merchant:</span>
                  <span className="text-slate-200">{txDetails.channel || 'Online'} • {txDetails.merchant || 'Web'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Evidence Trail */}
          <div className="lg:col-span-2 space-y-6">
            <ActionCards
              preAction={preAction}
              postAction={postAction}
              additionalRequested={nba.additional_evidence_requested || caseData.additional_evidence_requested}
              additionalReceived={nba.additional_evidence_received || caseData.additional_evidence_received}
              onOpenApproval={() => setIsApprovalOpen(true)}
            />

            <EvidenceTimeline evidenceTrail={evidenceTrail} />
          </div>
        </div>
      )}

      {/* Tab 2: Graph Explorer */}
      {activeView === 'GRAPH' && (
        <GraphCanvas nodes={subgraphNodes} edges={subgraphEdges} />
      )}

      {/* Tab 3: FinCEN SAR Report */}
      {activeView === 'SAR' && (
        <SARViewer sarReport={sarReport} caseId={caseData.case_id} />
      )}

      {/* Tab 4: Audit Trail */}
      {activeView === 'AUDIT' && (
        <div className="glass-panel p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Internal Agentic Investigation Record & Audit Trail
          </h3>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
            {caseData.explainability_narrative || caseData.final_explanation}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step-by-Step Node Execution Log:</span>
            <div className="divide-y divide-slate-800/80 rounded-lg bg-slate-900/60 border border-slate-800 p-2">
              {(caseData.investigation_record || []).map((step: any, idx: number) => (
                <div key={idx} className="py-2.5 px-3 flex items-start space-x-3 text-xs">
                  <span className="font-mono text-orange-400 font-semibold min-w-[140px]">
                    {step.step}
                  </span>
                  <span className="text-slate-300 flex-1">{step.details}</span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        caseId={caseData.case_id}
        recommendedAction={postAction?.action || preAction?.action || 'BLOCK_ACCOUNT'}
        authorityRoute={postAction?.required_approval_route || preAction?.required_approval_route || 'ANALYST_TIER_1'}
        onApproveSuccess={(decision) => {
          loadCase(caseData.case_id);
        }}
      />
    </div>
  );
};
