import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import {
  Globe,
  Radio,
  Smartphone,
  Flame,
  Atom,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  Lock,
  Code,
  FileCheck2,
  Terminal,
} from 'lucide-react';

export const AppSecModule: React.FC = () => {
  const {
    currentNav,
    mobileFindings,
    webFindings,
    dynamicTelemetry,
    cbomItems,
    simulatedSandboxRunning,
    triggerDynamicSandbox,
    sendCopilotMessage,
    setIsCopilotOpen,
  } = useCyber();

  const [activeTab, setActiveTab] = useState<'web' | 'api' | 'masvs' | 'dynamic' | 'cbom'>('masvs');

  React.useEffect(() => {
    if (currentNav === 'appsec-web') setActiveTab('web');
    if (currentNav === 'appsec-api') setActiveTab('api');
    if (currentNav === 'appsec-mobile-masvs') setActiveTab('masvs');
    if (currentNav === 'appsec-dynamic-lab') setActiveTab('dynamic');
    if (currentNav === 'appsec-sbom-cbom') setActiveTab('cbom');
  }, [currentNav]);

  return (
    <div id="appsec-module" className="space-y-4">
      {/* AppSec Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-lg font-bold font-mono text-white">Application Security Operations (AppSec)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Web OWASP, API Security, Mobile MASVS/MASTG Testing, Dynamic Mobile Lab, and Quantum CBOM
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 overflow-x-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'masvs', label: 'Mobile MASVS/MASTG', icon: Smartphone },
            { id: 'dynamic', label: 'Dynamic Mobile Lab', icon: Flame },
            { id: 'api', label: 'API Security Engine', icon: Radio },
            { id: 'web', label: 'Web Security (OWASP)', icon: Globe },
            { id: 'cbom', label: 'SBOM & Quantum CBOM', icon: Atom },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`appsec-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition font-medium ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 1. MOBILE MASVS / MASTG VIEW ================= */}
      {activeTab === 'masvs' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                  OWASP MASVS & MASTG Audit Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Traceable verification across Storage, Cryptography, Authentication, Network, Platform, and Resilience
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                MASVS v2.0 Compliance: 42% (Failing Controls)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mobileFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{finding.masvsId} ({finding.mastgId})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      finding.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {finding.severity} (CVSS {finding.cvss})
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-200">{finding.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{finding.description}</p>

                  {finding.codeSnippet && (
                    <div className="p-2.5 rounded bg-black/80 border border-slate-800 font-mono text-[10px] text-amber-300 overflow-x-auto">
                      <pre>{finding.codeSnippet}</pre>
                    </div>
                  )}

                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300">
                    <span className="font-bold text-cyan-400">Remediation:</span> {finding.remediation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. DYNAMIC MOBILE LAB VIEW ================= */}
      {activeTab === 'dynamic' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Dynamic Mobile Testing Lab (Frida / Corellium Runtime Telemetry)
              </h3>
              <p className="text-xs text-slate-400">
                Instrumented Sandbox: Android 14 (Pixel 7 Pro Emulator) • SELinux Permissive
              </p>
            </div>

            <button
              id="btn-run-dynamic-sandbox"
              disabled={simulatedSandboxRunning}
              onClick={triggerDynamicSandbox}
              className="flex items-center space-x-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{simulatedSandboxRunning ? 'Capturing Runtime Calls...' : 'Trigger Dynamic Injection Hook'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-black/80 p-4 font-mono text-xs space-y-2">
            <div className="text-[10px] uppercase text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>Real-Time Instrumentation Call Stream ({dynamicTelemetry.length} Events)</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" /> Live Telemetry Tap
              </span>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {dynamicTelemetry.map((item, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950/80 border border-slate-900 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 text-[10px]">{item.timestamp}</span>
                      <span className="font-bold text-slate-200">{item.eventType}:</span>
                      <span className="text-slate-300">{item.summary}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pl-14">{item.details}</div>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    item.status === 'MALICIOUS' ? 'bg-red-500/20 text-red-400' : item.status === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. API SECURITY VIEW ================= */}
      {activeTab === 'api' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                API Security Engine (REST, GraphQL, gRPC & BOLA/BFLA Detection)
              </h3>
              <p className="text-xs text-slate-400">Target Ingress: https://api.telemetry.aerotech.internal</p>
            </div>
            <span className="text-xs font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">
              BOLA / IDOR Critical
            </span>
          </div>

          <div className="space-y-3">
            {webFindings.filter((f) => f.category === 'API Security').map((finding) => (
              <div key={finding.id} className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-400">{finding.vulnerability}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                    CVSS {finding.cvss} ({finding.severity})
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300">{finding.targetUrl}</div>
                <div className="p-2.5 rounded bg-black/80 border border-slate-800 text-[11px] font-mono text-amber-300">
                  <span className="text-slate-400">Exploit Proof:</span> {finding.requestProof}
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-cyan-400 font-semibold font-mono">Remediation:</span> {finding.remediation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 4. WEB SECURITY VIEW ================= */}
      {activeTab === 'web' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Web Application Security (OWASP Top 10 & Business Logic)
              </h3>
              <p className="text-xs text-slate-400">Automated DAST & SAST Fuzzing Results</p>
            </div>
          </div>

          <div className="space-y-3">
            {webFindings.filter((f) => f.category === 'OWASP Top 10').map((finding) => (
              <div key={finding.id} className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-400">{finding.vulnerability}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                    CVSS {finding.cvss}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300">{finding.targetUrl}</div>
                <div className="p-2.5 rounded bg-black/80 border border-slate-800 text-[11px] font-mono text-amber-300">
                  <span className="text-slate-400">Proof:</span> {finding.requestProof}
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-cyan-400 font-semibold font-mono">Fix:</span> {finding.remediation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5. SBOM & QUANTUM CBOM VIEW ================= */}
      {activeTab === 'cbom' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
                <Atom className="h-4 w-4 text-purple-400" />
                Cryptographic Bill of Materials (CBOM) & Quantum Vulnerability Engine
              </h3>
              <p className="text-xs text-slate-400">
                Evaluate post-quantum cryptography (PQC) readiness: Shor's algorithm threat assessment against RSA & ECC
              </p>
            </div>
            <button
              onClick={() => {
                setIsCopilotOpen(true);
                sendCopilotMessage('Generate a Quantum Migration Plan for our RSA and ECC cryptographic inventory to NIST FIPS 203 (ML-KEM).');
              }}
              className="rounded-lg bg-purple-600/20 border border-purple-500/30 px-3 py-1.5 text-xs font-mono text-purple-300 hover:bg-purple-600/30"
            >
              Generate PQC Plan
            </button>
          </div>

          <div className="space-y-2.5">
            {cbomItems.map((item) => (
              <div key={item.id} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{item.asset}</span>
                    <span className="text-slate-400">({item.location})</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Algorithm: <span className="text-cyan-300">{item.algorithm} ({item.keySize} bits)</span> | Protocol: {item.protocol}
                  </div>
                  <div className="text-[11px] text-purple-300">
                    <span className="text-slate-400">PQC Replacement:</span> {item.pqcAlternative}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {item.quantumVulnerability === 'QUANTUM_VULNERABLE' ? (
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      QUANTUM VULNERABLE (Shor's Threat)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      QUANTUM RESISTANT (Symmetric 256-bit)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
