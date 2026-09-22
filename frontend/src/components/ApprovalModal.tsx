import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  recommendedAction: string;
  authorityRoute: string;
  onApproveSuccess: (decision: string) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  caseId,
  recommendedAction,
  authorityRoute,
  onApproveSuccess
}) => {
  const [analystName, setAnalystName] = useState('Senior Fraud Analyst #402');
  const [notes, setNotes] = useState('Authorized action following multi-hop TigerGraph topological correlation.');
  const [selectedDecision, setSelectedDecision] = useState<'APPROVE' | 'REJECT' | 'OVERRIDE'>('APPROVE');
  const [overrideAction, setOverrideAction] = useState('REQUEST_STEP_UP_AUTH');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch(`/api/cases/${caseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: selectedDecision,
          override_action: selectedDecision === 'OVERRIDE' ? overrideAction : null,
          analyst_name: analystName,
          notes: notes
        })
      });
      onApproveSuccess(selectedDecision);
      onClose();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel-glow max-w-lg w-full p-6 space-y-5 bg-slate-900 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Human-In-The-Loop Governance Gate</h3>
            <p className="text-xs text-slate-400 font-mono">Case {caseId} • Required Role: {authorityRoute}</p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Agent Recommended Action:</span>
            <span className="font-mono font-bold text-orange-400">{recommendedAction}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Compliance Authority Tier:</span>
            <span className="font-mono text-slate-300">{authorityRoute}</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Analyst Decision</label>
          <div className="grid grid-cols-3 gap-2">
            {(['APPROVE', 'REJECT', 'OVERRIDE'] as const).map((dec) => (
              <button
                key={dec}
                onClick={() => setSelectedDecision(dec)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  selectedDecision === dec
                    ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {dec === 'APPROVE' ? 'Approve' : dec === 'REJECT' ? 'Decline' : 'Override'}
              </button>
            ))}
          </div>

          {selectedDecision === 'OVERRIDE' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Override Action Choice</label>
              <select
                value={overrideAction}
                onChange={(e) => setOverrideAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="REQUEST_STEP_UP_AUTH">REQUEST_STEP_UP_AUTH (Push/SMS challenge)</option>
                <option value="SOFT_HOLD_2HR">SOFT_HOLD_2HR (Temporary 2hr authorization hold)</option>
                <option value="ALLOW_TRANSACTION">ALLOW_TRANSACTION (Clear as False Positive)</option>
                <option value="BLOCK_ACCOUNT">BLOCK_ACCOUNT (Permanent Freeze)</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Analyst Identity</label>
            <input
              type="text"
              value={analystName}
              onChange={(e) => setAnalystName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Audit Rationale & Justification</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-1.5"
          >
            <UserCheck className="h-4 w-4" />
            <span>{loading ? 'Submitting...' : 'Confirm Audit Decision'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
