import React from 'react';
import { ArrowRight, ShieldCheck, AlertOctagon, UserCheck, Clock, FileWarning } from 'lucide-react';

interface ActionData {
  action?: string;
  rationale?: string;
  required_approval_route?: string;
  requires_approval?: boolean;
}

interface ActionCardsProps {
  preAction?: ActionData;
  postAction?: ActionData;
  additionalRequested?: string[];
  additionalReceived?: {
    summary?: string;
    source?: string;
    is_cleared?: boolean;
    status?: string;
  };
  onOpenApproval: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  preAction,
  postAction,
  additionalRequested,
  additionalReceived,
  onOpenApproval
}) => {
  const getActionBadgeClass = (actionName?: string) => {
    if (!actionName) return 'bg-slate-800 text-slate-300';
    if (actionName.includes('BLOCK')) return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    if (actionName.includes('ALLOW')) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (actionName.includes('HOLD') || actionName.includes('STEP_UP')) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-orange-500" />
          <span>Next-Best Action (NBA) Decision Progression</span>
        </h3>
        <span className="text-xs font-mono text-slate-400">Pre vs Post Evidence Policy Audit</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Before Additional Evidence */}
        <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Phase 1: Prior to Additional Evidence</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadgeClass(preAction?.action)}`}>
                {preAction?.action || 'SOFT_HOLD_2HR'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {preAction?.rationale || 'Elevated risk signals detected with high uncertainty. Autonomous soft hold executed.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Required Approval Route:</span>
            <span className="font-mono font-semibold text-orange-400">
              {preAction?.required_approval_route || 'NONE (Autonomous)'}
            </span>
          </div>
        </div>

        {/* Card 2: After Additional Evidence */}
        <div className="rounded-lg bg-slate-900/80 border border-orange-500/30 p-4 relative flex flex-col justify-between shadow-lg shadow-orange-500/5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center space-x-1">
                <UserCheck className="h-3 w-3 text-orange-400" />
                <span>Phase 2: After Evidence Received</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadgeClass(postAction?.action || preAction?.action)}`}>
                {postAction?.action || preAction?.action || 'BLOCK_ACCOUNT'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {postAction?.rationale || preAction?.rationale || 'Decision finalized following evidence synthesis.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Required Approval Route:</span>
            <span className="font-mono font-semibold text-orange-400">
              {postAction?.required_approval_route || preAction?.required_approval_route || 'ANALYST_TIER_1'}
            </span>
          </div>
        </div>
      </div>

      {/* Controlled Evidence Intermediary Status */}
      {additionalReceived && (
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/90 p-3.5 flex items-start space-x-3">
          <div className="mt-0.5 p-1.5 rounded-md bg-orange-500/10 text-orange-400">
            <AlertOctagon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-200">Controlled Evidence Gathering Result</h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                additionalReceived.is_cleared ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {additionalReceived.status || 'PROCESSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {additionalReceived.summary}
            </p>
          </div>
        </div>
      )}

      {/* Human In The Loop Action Trigger */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400">
          Enforces Bank Authority Matrix & Compliance Governance
        </span>
        <button
          onClick={onOpenApproval}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <UserCheck className="h-4 w-4" />
          <span>Analyst Review & Sign-Off</span>
        </button>
      </div>
    </div>
  );
};
