import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import {
  ShieldAlert,
  Hash,
  Grid3X3,
  Terminal,
  Activity,
  Play,
  CheckCircle2,
  Copy,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';

export const ThreatIntelModule: React.FC = () => {
  const { currentNav, threatActors, detectionRules, updateRuleStatus, sendCopilotMessage, setIsCopilotOpen } = useCyber();
  const [activeTab, setActiveTab] = useState<'actors' | 'iocs' | 'mitre' | 'detection'>('detection');
  const [selectedRuleId, setSelectedRuleId] = useState<string>(detectionRules[0]?.id || 'SIGMA-081');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentNav === 'threat-actors') setActiveTab('actors');
    if (currentNav === 'threat-iocs') setActiveTab('iocs');
    if (currentNav === 'threat-mitre') setActiveTab('mitre');
    if (currentNav === 'detection-engineering') setActiveTab('detection');
  }, [currentNav]);

  const selectedRule = detectionRules.find((r) => r.id === selectedRuleId) || detectionRules[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div id="threat-intel-module" className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-lg font-bold font-mono text-white">Threat Intelligence & Detection Engineering</h2>
          </div>
          <p className="text-xs text-slate-400">
            Adversary attribution, IOC enrichment, MITRE ATT&CK alignment, and Sigma / YARA rule lifecycle management
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 overflow-x-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'detection', label: 'Detection Rules (Sigma/YARA)', icon: Terminal },
            { id: 'mitre', label: 'MITRE ATT&CK Matrix', icon: Grid3X3 },
            { id: 'actors', label: 'Threat Actors & Campaigns', icon: ShieldAlert },
            { id: 'iocs', label: 'IOC Intelligence', icon: Hash },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`threat-tab-${tab.id}`}
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

      {/* ================= 1. DETECTION ENGINEERING VIEW ================= */}
      {activeTab === 'detection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Rule List */}
          <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Rule Repository ({detectionRules.length})
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">CI/CD Sync Active</span>
            </div>

            <div className="space-y-2">
              {detectionRules.map((rule) => {
                const isSelected = rule.id === selectedRuleId;
                return (
                  <button
                    key={rule.id}
                    id={`rule-item-${rule.id}`}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`w-full text-left rounded-lg p-3 transition border ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-md'
                        : 'border-slate-800/80 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-200 truncate max-w-[150px]">{rule.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-300">
                        {rule.format}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-400">
                      <span>ATT&CK: {rule.mitreAttackId}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold ${
                        rule.status === 'Deployed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {rule.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Rule Editor & Lifecycle Control */}
          <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold font-mono text-slate-200">{selectedRule.name}</h4>
                <p className="text-xs text-slate-400">Author: {selectedRule.author} • Updated: {selectedRule.lastUpdated}</p>
              </div>

              {/* Lifecycle Stage Switcher */}
              <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
                {(['Draft', 'Testing', 'Validated', 'Deployed', 'Retired'] as const).map((st) => (
                  <button
                    key={st}
                    id={`rule-status-${st}`}
                    onClick={() => updateRuleStatus(selectedRule.id, st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                      selectedRule.status === st
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Performance and FP metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">FORMAT</div>
                <div className="font-bold text-cyan-300">{selectedRule.format}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">FALSE POSITIVE RATE</div>
                <div className="font-bold text-emerald-400">{selectedRule.falsePositiveRate}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">PERFORMANCE SCORE</div>
                <div className="font-bold text-cyan-400">{selectedRule.performanceScore}/100</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">SEVERITY</div>
                <div className="font-bold text-red-400">{selectedRule.severity}</div>
              </div>
            </div>

            {/* Syntax Code Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span>Rule Definition ({selectedRule.format} Spec)</span>
                <button
                  onClick={() => handleCopy(selectedRule.ruleContent, 'rule-def')}
                  className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedText === 'rule-def' ? 'Copied!' : 'Copy Rule'}</span>
                </button>
              </div>
              <div className="p-3.5 rounded-lg bg-black/90 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                <pre>{selectedRule.ruleContent}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. MITRE ATT&CK MATRIX VIEW ================= */}
      {activeTab === 'mitre' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                MITRE ATT&CK Matrix Alignment (Enterprise v15)
              </h3>
              <p className="text-xs text-slate-400">Correlated techniques across active Operation ShadowPulse investigation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { tactic: 'Initial Access', technique: 'T1189: Drive-by Target', active: true, tag: 'Mobile APK Ingest' },
              { tactic: 'Execution', technique: 'T1059.001: PowerShell', active: true, tag: 'Encoded Cradle' },
              { tactic: 'Defense Evasion', technique: 'T1055.012: Process Hollowing', active: true, tag: 'svchost.exe RWX' },
              { tactic: 'Credential Access', technique: 'T1407: Hardcoded Keys', active: true, tag: 'APK Assets Token' },
              { tactic: 'Command & Control', technique: 'T1071.001: Web Protocols', active: true, tag: '185.220.101.44' },
              { tactic: 'Exfiltration', technique: 'T1530: Cloud Storage', active: true, tag: 'S3 Sync' },
            ].map((col) => (
              <div key={col.tactic} className="rounded-lg border border-red-500/40 bg-red-950/20 p-3 space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase text-red-400">{col.tactic}</div>
                <div className="text-xs font-bold text-slate-200 font-mono">{col.technique}</div>
                <div className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 inline-block">
                  {col.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 3. THREAT ACTORS VIEW ================= */}
      {activeTab === 'actors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threatActors.map((actor) => (
              <div key={actor.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-mono text-cyan-300">{actor.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                    Confidence: {actor.confidence}%
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  <span className="text-slate-400">Aliases:</span> {actor.aliases.join(', ')} • {actor.origin}
                </div>
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                  <span className="font-bold text-amber-400">Motivation:</span> {actor.motivation}
                </div>
                <div className="space-y-1 text-xs font-mono text-slate-400">
                  <p><span className="text-slate-400">Active Campaigns:</span> {actor.activeCampaigns.join(', ')}</p>
                  <p><span className="text-slate-400">Target Sectors:</span> {actor.targetSectors.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 4. IOC INTELLIGENCE VIEW ================= */}
      {activeTab === 'iocs' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Threat Intelligence Indicators of Compromise (IOCs)
              </h3>
              <p className="text-xs text-slate-400">Global reputation feeds correlated with internal telemetry</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {[
              { type: 'IPv4 Node', val: '185.220.101.44', reputation: 'Tor Exit / Known Cobalt Strike C2', score: 98 },
              { type: 'Domain', val: 'telemetry-update-node.cloud', reputation: 'Dynamic DNS C2 Staging', score: 92 },
              { type: 'APK Hash', val: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', reputation: 'Trojanized AeroTech Diagnostics', score: 100 },
              { type: 'JA3 Fingerprint', val: '942de862ce23d0614f88e40be2171120', reputation: 'Cobalt Strike Malleable TLS Beacon', score: 94 },
            ].map((ioc, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">{ioc.type}</div>
                  <div className="text-slate-200 font-bold">{ioc.val}</div>
                  <div className="text-[11px] text-slate-400">{ioc.reputation}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Threat Score</div>
                  <div className="text-sm font-bold text-red-400">{ioc.score}/100</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
