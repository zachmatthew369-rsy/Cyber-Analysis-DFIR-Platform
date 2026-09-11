import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Terminal,
  Copy,
  Check,
  ShieldAlert,
  Flame,
  Binary,
  Layers,
} from 'lucide-react';

export const CopilotDrawer: React.FC = () => {
  const { isCopilotOpen, setIsCopilotOpen, copilotMessages, sendCopilotMessage } = useCyber();
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isCopilotOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendCopilotMessage(inputText);
    setInputText('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptShortcuts = [
    { label: 'Explain RWX Region', prompt: 'Explain the RWX memory injection detected in svchost.exe (PID 3812).' },
    { label: 'Deobfuscate PowerShell', prompt: 'Deobfuscate the Base64 download cradle executed from WINWORD.' },
    { label: 'Generate Sigma Rule', prompt: 'Generate a Sigma detection rule for the Cobalt Strike TLS beacon pattern.' },
    { label: 'Audit MASVS-STORAGE-1', prompt: 'Audit com.aerotech.diagnostics.internal against OWASP MASVS-STORAGE-1.' },
    { label: 'Summarize Incident', prompt: 'Summarize Operation ShadowPulse for an executive CISO briefing.' },
  ];

  return (
    <div
      id="copilot-drawer"
      className="fixed inset-y-0 right-0 z-40 flex w-full sm:w-[480px] flex-col border-l border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-all duration-300"
    >
      {/* Copilot Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 sm:px-6">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-white">MalwareX Copilot</span>
              <span className="inline-flex items-center rounded-full bg-cyan-950 px-2 py-0.2 text-[9px] font-mono text-cyan-400 border border-cyan-800/40">
                CYBER AGENT
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Context-Aware DFIR & AppSec Specialist</p>
          </div>
        </div>

        <button
          id="btn-close-copilot"
          onClick={() => setIsCopilotOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Suggested Accelerator Shortcuts */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center space-x-1 text-[10px] font-mono uppercase text-slate-400 mb-1.5">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          <span>Analyst Accelerators</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {promptShortcuts.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => sendCopilotMessage(sc.prompt)}
              className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {copilotMessages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-1">
                <span>{isAssistant ? 'MalwareX AI' : 'Investigator'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`relative rounded-xl p-3 max-w-[90%] ${
                  isAssistant
                    ? 'border border-slate-800 bg-slate-900/90 text-slate-200'
                    : 'bg-cyan-600 text-white shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-[11px]">
                  {msg.text}
                </div>

                {isAssistant && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-cyan-400">Verified Evidence Bound</span>
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="flex items-center space-x-1 hover:text-white transition"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Copilot Input Footer */}
      <form onSubmit={handleSend} className="border-t border-slate-800 p-3 bg-slate-950">
        <div className="relative flex items-center">
          <input
            id="copilot-query-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI: correlate, deobfuscate, generate rules..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          />
          <button
            type="submit"
            className="absolute right-2 p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 transition hover:bg-slate-800"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
