import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import { UserRole } from '../../types/cyber';
import {
  ShieldAlert,
  Search,
  Moon,
  Sun,
  Bot,
  PlusCircle,
  ChevronDown,
  UserCheck,
  FolderGit2,
  Lock,
  Radio,
  FileCheck2,
} from 'lucide-react';

export const Header: React.FC<{ onOpenIngestModal: () => void }> = ({ onOpenIngestModal }) => {
  const {
    theme,
    toggleTheme,
    currentUserRole,
    setCurrentUserRole,
    cases,
    activeCaseId,
    setActiveCaseId,
    activeCase,
    isCopilotOpen,
    setIsCopilotOpen,
    globalSearch,
    setGlobalSearch,
  } = useCyber();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);

  const roles: UserRole[] = [
    'Super Admin',
    'SOC Manager',
    'DFIR Analyst',
    'Malware Analyst',
    'AppSec Engineer',
    'Threat Hunter',
    'Auditor / Executive',
  ];

  return (
    <header id="malwarex-header" className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 sm:px-6 backdrop-blur-xl">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-extrabold tracking-tight text-white font-mono">
              MALWARE<span className="text-cyan-400">X</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 ring-1 ring-inset ring-cyan-800/40">
              ENTERPRISE DFIR + APPSEC
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400">Unified Cyber Investigation & Security Operations</p>
        </div>
      </div>

      {/* Center: Active Case Quick Switcher & Global Search */}
      <div className="hidden md:flex items-center space-x-3 flex-1 max-w-xl mx-6">
        {/* Case Switcher */}
        <div className="relative">
          <button
            id="active-case-switcher"
            onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
            className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-700 transition"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono font-medium max-w-[160px] truncate">{activeCase.incidentId}: {activeCase.title}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isCaseDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400">Active Investigation Cases</div>
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCaseId(c.id);
                    setIsCaseDropdownOpen(false);
                  }}
                  className={`w-full text-left rounded-lg px-2.5 py-2 text-xs transition ${
                    c.id === activeCaseId ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono">{c.incidentId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      c.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            id="global-cyber-search"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search Hashes, IOCs, ATT&CK, Processes, Evidence..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
          />
        </div>
      </div>

      {/* Right Controls: Ingestion, Role Switcher, Theme, AI Copilot */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Evidence Seizure / Acquisition button */}
        <button
          id="btn-acquire-evidence-modal"
          onClick={onOpenIngestModal}
          className="flex items-center space-x-1.5 rounded-lg bg-cyan-600 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition active:scale-95"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Acquire Evidence</span>
        </button>

        {/* RBAC Role Switcher */}
        <div className="relative">
          <button
            id="rbac-role-switcher"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-700 transition"
          >
            <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] hidden md:inline">{currentUserRole}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400">Switch RBAC Persona</div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setCurrentUserRole(r);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition ${
                    r === currentUserRole ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle (Dark / Light) */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-cyan-400" />}
        </button>

        {/* AI Copilot Drawer Toggle */}
        <button
          id="ai-copilot-toggle"
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className={`relative flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
            isCopilotOpen
              ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/30'
              : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
        >
          <Bot className="h-4 w-4 text-cyan-400" />
          <span className="hidden sm:inline">Copilot</span>
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        </button>
      </div>
    </header>
  );
};
