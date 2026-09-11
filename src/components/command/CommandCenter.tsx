import React from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import { ThreeThreatGlobe } from '../workbench/ThreeThreatGlobe';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Layers,
  Activity,
  Flame,
  Binary,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  Lock,
  ChevronRight,
} from 'lucide-react';

export const CommandCenter: React.FC = () => {
  const {
    activeCase,
    evidenceList,
    timelineEvents,
    mobileFindings,
    webFindings,
    processArtifacts,
    setCurrentNav,
    setIsCopilotOpen,
  } = useCyber();

  // Calculate dynamic risk metrics
  const criticalFindings = mobileFindings.filter((f) => f.severity === 'CRITICAL').length + webFindings.filter((f) => f.severity === 'CRITICAL').length;
  const memoryInjections = processArtifacts.filter((p) => p.injectedCodeDetected).length;

  return (
    <div id="command-center-view" className="space-y-6">
      {/* Top Banner: Incident Triage & High-Level Posture */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center rounded-md bg-red-500/20 px-2 py-0.5 text-[11px] font-bold font-mono text-red-400 border border-red-500/30">
                CRITICAL INCIDENT ACTIVE
              </span>
              <span className="font-mono text-xs text-slate-400">ID: {activeCase.incidentId}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{activeCase.classification}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl font-mono">
              {activeCase.title}
            </h1>
            <p className="mt-2 text-xs text-slate-300 max-w-3xl leading-relaxed">
              {activeCase.summary}
            </p>
          </div>

          {/* SLA and Risk Score Gauge */}
          <div className="flex items-center gap-4 flex-shrink-0 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">Containment SLA</div>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-xl font-extrabold font-mono text-amber-400">{activeCase.slaRemainingHours}h</span>
              </div>
              <div className="text-[10px] text-slate-400">Strict DFIR window</div>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div className="text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">Composite Risk</div>
              <div className="text-2xl font-black font-mono text-red-500 mt-0.5">
                {activeCase.riskScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <div className="text-[10px] text-red-400 font-medium">Critical Threat Tier</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: The 4 Pillars */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Evidence Fabric Card */}
        <div
          onClick={() => setCurrentNav('governance-chain-of-custody')}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-cyan-500/50 hover:bg-slate-900/90 transition shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Evidence Fabric</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{evidenceList.length} Items</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>100% SHA-256 Hashed</span>
            <span className="text-cyan-400 flex items-center group-hover:translate-x-1 transition">
              Inspect <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Memory Injections Card */}
        <div
          onClick={() => setCurrentNav('dfir-memory')}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-red-500/50 hover:bg-slate-900/90 transition shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Memory Injections</span>
            <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
              <Binary className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-red-400">{memoryInjections} Detected</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>svchost.exe (PID 3812)</span>
            <span className="text-red-400 flex items-center group-hover:translate-x-1 transition">
              Examine <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Mobile MASVS Findings Card */}
        <div
          onClick={() => setCurrentNav('appsec-mobile-masvs')}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-amber-500/50 hover:bg-slate-900/90 transition shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Mobile & Web AppSec</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-300">{criticalFindings} Critical Flaws</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>MASVS Hardcoded Secret</span>
            <span className="text-amber-400 flex items-center group-hover:translate-x-1 transition">
              Review <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Unified Timeline Events Card */}
        <div
          onClick={() => setCurrentNav('workbench')}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-indigo-500/50 hover:bg-slate-900/90 transition shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Timeline Events</span>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-300">{timelineEvents.length} Correlated</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>Mobile ➔ Web ➔ Endpoint</span>
            <span className="text-indigo-400 flex items-center group-hover:translate-x-1 transition">
              Workbench <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Prominent 3D WebGL Threat Globe & Multi-Vector Attack Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ThreeThreatGlobe interactiveHeight="h-[450px]" />
        </div>

        {/* Enterprise Risk Scoring Equation Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Enterprise Risk Scoring Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                NIST SP 800-30
              </span>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-slate-300">
              <span className="text-cyan-400">Risk Score (89/100)</span> = <br />
              <span className="text-red-400 font-semibold">Severity (0.95)</span> ×{' '}
              <span className="text-amber-400">Exploitability (0.90)</span> ×{' '}
              <span className="text-purple-400">Asset Criticality (0.98)</span> ×{' '}
              <span className="text-blue-400">Exposure (0.85)</span> ×{' '}
              <span className="text-emerald-400">Confidence (0.94)</span>
            </div>

            <div className="mt-4 space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Adversary C2 Proximity</span>
                  <span className="text-red-400">Active (185.220.101.44)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[95%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Data Exfiltration Surface</span>
                  <span className="text-amber-400">S3 Ground Telemetry (Critical)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[88%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>MITRE ATT&CK Coverage</span>
                  <span className="text-cyan-400">5 Techniques Correlated</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[82%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              id="btn-open-copilot-from-command"
              onClick={() => setIsCopilotOpen(true)}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition"
            >
              <span>Ask AI Copilot for Remediation Plan</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized Investigation Correlation Flow Overview */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
              Correlated Attack Chain (The 7-Step Lifecycle)
            </h3>
            <p className="text-xs text-slate-400">How Trojanized Mobile APK pivoted into Cloud & Endpoint compromise</p>
          </div>
          <button
            id="open-workbench-btn"
            onClick={() => setCurrentNav('workbench')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Open Multi-Panel Workbench</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { step: '1', title: 'Mobile APK Ingest', desc: 'Trojanized diagnostics APK side-loaded on Android device', tag: 'EVD-901', color: 'border-cyan-500/40 text-cyan-400' },
            { step: '2', title: 'Hardcoded Token', desc: 'Plaintext master JWT harvested from APK assets', tag: 'MASVS-STORAGE', color: 'border-amber-500/40 text-amber-400' },
            { step: '3', title: 'API Infiltration', desc: '14,290 requests to telemetry endpoints with stolen token', tag: 'BOLA / IDOR', color: 'border-red-500/40 text-red-400' },
            { step: '4', title: 'VPN Lateral Move', desc: 'Impossible travel login via stolen employee credentials', tag: 'Identity Abuse', color: 'border-purple-500/40 text-purple-400' },
            { step: '5', title: 'PowerShell Cradle', desc: 'Base64 encoded download cradle spawned via WINWORD', tag: 'T1059.001', color: 'border-red-500/40 text-red-400' },
            { step: '6', title: 'Memory Injection', desc: 'RWX process hollowing into legitimate svchost.exe', tag: 'T1055.012', color: 'border-red-500/40 text-red-400' },
            { step: '7', title: 'C2 Beaconing', desc: 'TLS 1.3 C2 beaconing to 185.220.101.44 (JA3 match)', tag: 'T1071.001', color: 'border-red-500/40 text-red-400' },
          ].map((item) => (
            <div key={item.step} className={`rounded-lg border ${item.color} bg-slate-950/70 p-3 space-y-1.5`}>
              <div className="flex items-center justify-between">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                  {item.step}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{item.tag}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
              <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
