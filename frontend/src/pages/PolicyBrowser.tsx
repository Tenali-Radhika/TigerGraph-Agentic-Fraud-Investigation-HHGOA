import React, { useState, useEffect } from 'react';
import { BookOpen, Shield, Send, MessageSquare, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';

export const PolicyBrowser: React.FC = () => {
  const [policiesData, setPoliciesData] = useState<any>({ known_fraud_patterns: [], policies: [] });
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'agent'; text: string; citations?: string[] }>>([
    {
      role: 'agent',
      text: 'Hello, I am the TigerGraph GraphRAG Compliance Assistant. You can ask me about bank fraud policies, FinCEN SAR mandatory thresholds, the 5 known fraud typologies, or authorization requirements.'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetch('/api/policies')
      .then((res) => res.json())
      .then((data) => setPoliciesData(data))
      .catch((e) => console.error(e));
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/graphrag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'agent',
          text: data.answer,
          citations: data.citations
        }
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'agent',
          text: 'Apologies, could not connect to GraphRAG service.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <span>Bank Fraud Policies, Typologies & GraphRAG Assistant</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Grounded intelligence engine combining IEEE-CIS fraud typologies, FinCEN BSA regulations, and autonomous authority boundaries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: 5 Known Fraud Typologies */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Shield className="h-4 w-4 text-orange-400" />
            <span>Documented Fraud Patterns & Typologies</span>
          </h3>

          <div className="space-y-3">
            {policiesData.known_fraud_patterns?.map((pat: any) => (
              <div key={pat.pattern_id} className="glass-panel p-4 space-y-2 border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-orange-400">{pat.pattern_id}</span>
                    <h4 className="text-xs font-bold text-white">{pat.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    pat.severity === 'CRITICAL' ? 'badge-risk-critical' : 'badge-risk-high'
                  }`}>
                    {pat.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-400 italic">Typology: {pat.typology}</p>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Key Indicators:</span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                    {pat.indicators?.map((ind: string, idx: number) => (
                      <li key={idx}>{ind}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-semibold">Standard Mitigation: </span>
                  <span className="text-slate-200">{pat.mitigation_action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive GraphRAG Q&A Assistant */}
        <div className="space-y-4 flex flex-col h-full">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-orange-400" />
            <span>Interactive GraphRAG Q&A Assistant</span>
          </h3>

          <div className="glass-panel p-4 flex-1 flex flex-col justify-between h-[540px]">
            {/* Message Stream */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 mb-3">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-orange-500/10 border border-orange-500/30 text-slate-100 ml-8'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4'
                  }`}
                >
                  <div className="font-bold text-[10px] uppercase tracking-wider mb-1 text-slate-400">
                    {msg.role === 'user' ? 'Fraud Analyst' : 'GraphRAG Grounded Intelligence'}
                  </div>
                  <p>{msg.text}</p>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono font-bold text-orange-400 block mb-0.5">Grounded Citations:</span>
                      <div className="flex flex-wrap gap-1">
                        {msg.citations.map((c, cIdx) => (
                          <span key={cIdx} className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-400 animate-pulse">
                  Reasoning over TigerGraph topology and policies...
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                onClick={() => setChatInput('What is the mandatory threshold for filing a FinCEN SAR?')}
                className="text-[10px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
              >
                FinCEN SAR Threshold?
              </button>
              <button
                onClick={() => setChatInput('How does TigerGraph detect synthetic identity rings?')}
                className="text-[10px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
              >
                Synthetic Identity Rings?
              </button>
              <button
                onClick={() => setChatInput('What actions are permitted autonomously without approval?')}
                className="text-[10px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
              >
                Autonomous Actions?
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask about policies, SAR thresholds, or graph typologies..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="p-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
