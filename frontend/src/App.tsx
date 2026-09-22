import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { CaseWorkbench } from './pages/CaseWorkbench';
import { GraphExplorer } from './pages/GraphExplorer';
import { BenchmarkSuite } from './pages/BenchmarkSuite';
import { PolicyBrowser } from './pages/PolicyBrowser';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workbench' | 'graph' | 'benchmark' | 'policies'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE_01');
  const [systemStatus, setSystemStatus] = useState<{ mode: string; connected: boolean }>({
    mode: 'Embedded Graph Engine',
    connected: true
  });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setSystemStatus({
          mode: data.mode,
          connected: data.tigergraph_connected
        });
      })
      .catch((e) => console.error('Health check error:', e));
  }, []);

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveTab('workbench');
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab: any) => setActiveTab(tab)}
        systemStatus={systemStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && <Dashboard onSelectCase={handleSelectCase} />}
        {activeTab === 'workbench' && (
          <CaseWorkbench selectedCaseId={selectedCaseId} onBack={() => setActiveTab('dashboard')} />
        )}
        {activeTab === 'graph' && <GraphExplorer />}
        {activeTab === 'benchmark' && <BenchmarkSuite onSelectCase={handleSelectCase} />}
        {activeTab === 'policies' && <PolicyBrowser />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>TigerGraph Agentic Fraud Investigation System (HHGOA Hackathon 2026) • IEEE-CIS Fraud Detection Model</p>
      </footer>
    </div>
  );
};

export default App;
