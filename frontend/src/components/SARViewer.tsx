import React from 'react';
import { FileText, Download, CheckCircle2, AlertCircle, Building2, User, Shield } from 'lucide-react';

interface SARViewerProps {
  sarReport: any;
  caseId: string;
}

export const SARViewer: React.FC<SARViewerProps> = ({ sarReport, caseId }) => {
  if (!sarReport) {
    return (
      <div className="glass-panel p-8 text-center flex flex-col items-center justify-center space-y-3">
        <div className="p-3 rounded-full bg-slate-800/80 text-slate-400">
          <FileText className="h-8 w-8" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">No FinCEN SAR Filing Required</h4>
        <p className="text-xs text-slate-400 max-w-md">
          Under Bank Policy POL-SAR-001 and 31 U.S.C. 5318(g), this transaction is below statutory mandatory filing thresholds ($5,000) or cleared as benign.
        </p>
      </div>
    );
  }

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sarReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${sarReport.sar_id || 'SAR_REPORT'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="glass-panel p-6 space-y-5 border-rose-500/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">FinCEN Suspicious Activity Report (Form 111)</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                REGULATORY FILING
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{sarReport.sar_id} • 31 CFR 1020.320 Compliance</p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Form 111 JSON</span>
        </button>
      </div>

      {/* Grid Meta Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
            <Building2 className="h-3 w-3" />
            <span>Filing Institution</span>
          </span>
          <p className="font-semibold text-slate-200">{sarReport.filing_institution?.institution_name}</p>
          <p className="text-slate-400 text-[11px]">FinCEN ID: {sarReport.filing_institution?.fincen_identifier}</p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>Suspected Subject(s)</span>
          </span>
          <p className="font-semibold text-slate-200">Account: {sarReport.subject_information?.account_id}</p>
          <p className="text-slate-400 text-[11px]">Card: {sarReport.subject_information?.card_id} • IP: {sarReport.subject_information?.ip_address}</p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Financial Exposure</span>
          </span>
          <p className="font-bold text-rose-400 text-sm">
            ${sarReport.suspicious_activity?.total_suspicious_amount?.toLocaleString()} USD
          </p>
          <p className="text-slate-400 text-[11px]">Typology: {sarReport.suspicious_activity?.primary_type}</p>
        </div>
      </div>

      {/* Full Regulatory Narrative */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
          FinCEN Formal Narrative (Form 111 Part V):
        </span>
        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line overflow-y-auto max-h-72">
          {sarReport.narrative}
        </div>
      </div>

      {/* Signoff */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Status: {sarReport.compliance_signoff?.status || 'APPROVED_FOR_FILING'}</span>
        </div>
        <span className="text-slate-400 text-[11px]">
          Authorized by: {sarReport.compliance_signoff?.officer_name} ({sarReport.compliance_signoff?.title})
        </span>
      </div>
    </div>
  );
};
