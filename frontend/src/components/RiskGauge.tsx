import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface RiskGaugeProps {
  score: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  confidenceLevel: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, confidence, confidenceLevel }) => {
  const percentage = Math.round(score * 100);
  const confPercentage = Math.round(confidence * 100);

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score * circumference * 0.75); // 270 degree arc

  const getRiskColor = (p: number) => {
    if (p >= 75) return '#EF4444'; // Red
    if (p >= 50) return '#F97316'; // Orange
    if (p >= 30) return '#F59E0B'; // Amber
    return '#10B981'; // Green
  };

  const currentColor = getRiskColor(percentage);

  return (
    <div className="glass-panel p-5 flex flex-col items-center justify-between relative overflow-hidden">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Assessment</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          percentage >= 75 ? 'badge-risk-critical' : percentage >= 50 ? 'badge-risk-high' : 'badge-risk-low'
        }`}>
          {percentage >= 75 ? 'Critical Risk' : percentage >= 50 ? 'High Risk' : 'Low Risk'}
        </span>
      </div>

      {/* SVG Arc Meter */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-36 h-36 transform -rotate-135">
          {/* Background Track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="#1E293B"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />
          {/* Animated Value Arc */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={currentColor}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-white">{percentage}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 -mt-1">Fraud Score</span>
        </div>
      </div>

      {/* Confidence & Uncertainty Meter */}
      <div className="w-full mt-2 pt-3 border-t border-slate-800/80">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">Assessment Confidence</span>
          <span className="font-mono font-semibold text-slate-200">{confPercentage}% ({confidenceLevel})</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              confidence >= 0.75 ? 'bg-emerald-500' : confidence >= 0.50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${confPercentage}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          {confidence < 0.75 
            ? '⚠️ High uncertainty: Controlled evidence requested before irreversible blocking.'
            : '✓ High confidence: Defensible topological evidence available to act.'}
        </p>
      </div>
    </div>
  );
};
