import React from 'react';
import { Shield, Network, Activity, FileText, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: { mode: string; connected: boolean };
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemStatus }) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: Activity },
    { id: 'workbench', label: 'Investigation Workbench', icon: Shield },
    { id: 'graph', label: 'Knowledge Graph Explorer', icon: Network },
    { id: 'benchmark', label: '20 Benchmark Suite', icon: Layers },
    { id: 'policies', label: 'Policies & GraphRAG', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-lg shadow-orange-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">TigerGraph</span>
              <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/20">
                Agentic Sentinel
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">HHGOA Fraud Investigation & Next-Best Action</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Status Pill */}
        <div className="flex items-center space-x-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] text-slate-300">
            {systemStatus.mode || 'TigerGraph In-Memory Engine'}
          </span>
        </div>
      </div>
    </header>
  );
};
