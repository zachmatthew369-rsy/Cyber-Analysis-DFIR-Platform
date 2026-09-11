import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import {
  Link2,
  Briefcase,
  FileCheck2,
  FileSpreadsheet,
  Lock,
  Download,
  CheckCircle2,
  ShieldAlert,
  Clock,
  UserCheck,
  ArrowDownToLine,
  FileText,
} from 'lucide-react';

export const GovernanceModule: React.FC = () => {
  const { currentNav, activeCase, evidenceList, cases } = useCyber();
  const [activeTab, setActiveTab] = useState<'coc' | 'cases' | 'compliance' | 'reports'>('coc');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentNav === 'governance-chain-of-custody') setActiveTab('coc');
    if (currentNav === 'governance-cases') setActiveTab('cases');
    if (currentNav === 'governance-compliance') setActiveTab('compliance');
    if (currentNav === 'governance-reports') setActiveTab('reports');
  }, [currentNav]);

  const allCocEntries = evidenceList.flatMap((e) =>
    e.chainOfCustody.map((c) => ({ ...c, evidenceName: e.name }))
  );

  const handleExport = (type: 'PDF' | 'STIX' | 'SARIF' | 'JSON') => {
    setDownloadSuccess(type);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div id="governance-module" className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-lg font-bold font-mono text-white">Governance, Chain of Custody & Compliance</h2>
          </div>
          <p className="text-xs text-slate-400">
            Cryptographic evidence immutability, defensible chain of custody, NIST/ISO compliance, and formal DFIR reports
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 overflow-x-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'coc', label: 'Chain of Custody Ledger', icon: Link2 },
            { id: 'cases', label: 'Case Management', icon: Briefcase },
            { id: 'compliance', label: 'Compliance & MASVS', icon: FileCheck2 },
            { id: 'reports', label: 'Defensible Reports', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`gov-tab-${tab.id}`}
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

      {/* ================= 1. CHAIN OF CUSTODY LEDGER VIEW ================= */}
      {activeTab === 'coc' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                Cryptographic Chain of Custody Ledger (ISO/IEC 27037 Standard)
              </h3>
              <p className="text-xs text-slate-400">
                Immutable hash-chained audit trail: Every custody transfer, analysis pass, and legal vault seal
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Defensible Hash Chain (100% Verified)
            </span>
          </div>

          <div className="space-y-3">
            {allCocEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2 text-xs font-mono"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-900">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                      {entry.id}
                    </span>
                    <span className="font-bold text-slate-200">{entry.action}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{entry.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div><span className="text-slate-400">Target Artifact:</span> {entry.evidenceName} ({entry.evidenceId})</div>
                  <div><span className="text-slate-400">Custodian / Role:</span> {entry.user} ({entry.role})</div>
                  <div><span className="text-slate-400">Seizure Node:</span> {entry.device} ({entry.sourceIp})</div>
                </div>

                <div className="p-2.5 rounded bg-black/80 border border-slate-900 text-[10px] space-y-1">
                  <div className="text-slate-400">
                    <span className="text-slate-400">Previous Hash:</span>{' '}
                    <span className="text-slate-400">{entry.previousHash}</span>
                  </div>
                  <div className="text-cyan-300">
                    <span className="text-slate-400">Verified New Hash:</span> {entry.newHash}
                  </div>
                  <div className="text-emerald-400">
                    <span className="text-slate-400">Digital Signature:</span> {entry.digitalSignature}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-400">Legal Purpose:</span> {entry.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 2. CASE MANAGEMENT VIEW ================= */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">{c.incidentId} • {c.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    c.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {c.severity}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-200">{c.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{c.summary}</p>
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                  <p><span className="text-slate-400">Customer:</span> {c.customer} ({c.businessUnit})</p>
                  <p><span className="text-slate-400">Analysts:</span> {c.assignedAnalysts.join(', ')}</p>
                  <p><span className="text-slate-400">SLA Remaining:</span> {c.slaRemainingHours} hours</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 3. COMPLIANCE & FRAMEWORKS VIEW ================= */}
      {activeTab === 'compliance' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Security Compliance & Assurance Posture
              </h3>
              <p className="text-xs text-slate-400">Mapping investigation evidence directly to industry security frameworks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'OWASP MASVS v2.0', status: 'Attention Required', score: '42%', desc: 'Mobile Storage & Key Pinning Gaps' },
              { name: 'NIST CSF 2.0', status: 'In Containment', score: '88%', desc: 'Detect & Respond Pillars Active' },
              { name: 'ISO/IEC 27001:2022', status: 'Audit Ready', score: '94%', desc: 'A.12.7 Information Systems Audit' },
              { name: 'SOC 2 Type II', status: 'Monitored', score: '91%', desc: 'Trust Services Security & Confidentiality' },
            ].map((f) => (
              <div key={f.name} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                <div className="text-xs font-bold font-mono text-slate-200">{f.name}</div>
                <div className="text-2xl font-black font-mono text-cyan-400">{f.score}</div>
                <div className="text-[10px] font-mono text-amber-400">{f.status}</div>
                <div className="text-[11px] text-slate-400">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 4. DEFENSIBLE REPORTS VIEW ================= */}
      {activeTab === 'reports' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Defensible Forensic & AppSec Report Generator
              </h3>
              <p className="text-xs text-slate-400">Generate executive summaries, technical DFIR dossiers, STIX 2.1 bundles, and SARIF exports</p>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{downloadSuccess} Report exported successfully! Cryptographic signature appended.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-cyan-400">
                  <FileText className="h-4 w-4" />
                  <span className="font-bold font-mono text-xs text-slate-200">Executive Incident Briefing</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  High-level business impact, compromised ground telemetry scope, containment actions, and strategic mitigation.
                </p>
              </div>
              <button
                onClick={() => handleExport('PDF')}
                className="w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition flex items-center justify-center gap-1.5"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                <span>Export PDF Dossier</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-amber-400">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="font-bold font-mono text-xs text-slate-200">Court-Defensible DFIR Dossier</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Complete hash manifests (SHA-256/512), ED25519 chain of custody audit trail, RWX memory dumps, and MFT entries.
                </p>
              </div>
              <button
                onClick={() => handleExport('PDF')}
                className="w-full rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition flex items-center justify-center gap-1.5"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                <span>Export Legal Dossier</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-purple-400">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="font-bold font-mono text-xs text-slate-200">STIX 2.1 Threat Intel Bundle</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  OASIS STIX 2.1 standard JSON representation of Volt Typhoon threat actor, C2 indicators, and MITRE ATT&CK techniques.
                </p>
              </div>
              <button
                onClick={() => handleExport('STIX')}
                className="w-full rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition flex items-center justify-center gap-1.5"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                <span>Export STIX 2.1 Bundle</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-emerald-400">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="font-bold font-mono text-xs text-slate-200">SARIF & MASVS Static Export</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  OASIS SARIF format for CI/CD integration and GitHub Security tab ingestion of all MASVS findings.
                </p>
              </div>
              <button
                onClick={() => handleExport('SARIF')}
                className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition flex items-center justify-center gap-1.5"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                <span>Export SARIF JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
