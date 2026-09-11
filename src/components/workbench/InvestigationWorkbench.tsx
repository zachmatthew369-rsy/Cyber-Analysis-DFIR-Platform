import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import { EvidenceItem, TimelineEvent, CorrelationNode } from '../../types/cyber';
import {
  Layers,
  Activity,
  FileCode,
  Lock,
  Hash,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Cpu,
  Smartphone,
  Network,
  Cloud,
  CheckCircle2,
  Terminal,
  Filter,
  Eye,
  Copy,
  Binary,
  Maximize2,
} from 'lucide-react';

export const InvestigationWorkbench: React.FC = () => {
  const {
    activeCase,
    evidenceList,
    timelineEvents,
    correlationGraph,
    sealEvidence,
    setIsCopilotOpen,
    sendCopilotMessage,
  } = useCyber();

  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(evidenceList[0]?.id || 'EVD-901');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('mal-apk');
  const [timelineCategoryFilter, setTimelineCategoryFilter] = useState<string>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const selectedEvidence = evidenceList.find((e) => e.id === selectedEvidenceId) || evidenceList[0];
  const selectedNode = correlationGraph.nodes.find((n) => n.id === selectedNodeId) || correlationGraph.nodes[0];

  const filteredTimeline = timelineCategoryFilter === 'ALL'
    ? timelineEvents
    : timelineEvents.filter((t) => t.category === timelineCategoryFilter);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div id="investigation-workbench" className="space-y-4">
      {/* Workbench Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-lg font-bold font-mono text-white">Unified Multi-Panel Investigation Workbench</h2>
          </div>
          <p className="text-xs text-slate-400">
            Simultaneous multi-vector examination: Correlated Graph + Unified Timeline + Cryptographic Evidence Viewer
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="workbench-ask-ai"
            onClick={() => {
              setIsCopilotOpen(true);
              sendCopilotMessage(`Analyze current workbench evidence ${selectedEvidence.name} and correlate with timeline.`);
            }}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition flex items-center gap-1.5"
          >
            <span>Correlate via AI Copilot</span>
          </button>
        </div>
      </div>

      {/* The Multi-Panel Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ================= LEFT SIDEBAR (Case Context & Evidence Tree) ================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Case Context Mini-Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400">Investigation Target</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                {activeCase.severity}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-200 mt-1">{activeCase.title}</h3>
            <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-1 border-t border-slate-800/80 pt-2">
              <p><span className="text-slate-400">Case ID:</span> {activeCase.id}</p>
              <p><span className="text-slate-400">Lead Analyst:</span> {activeCase.leadAnalyst}</p>
              <p><span className="text-slate-400">Affected Assets:</span> {activeCase.affectedAssets.length} nodes</p>
            </div>
          </div>

          {/* Evidence Tree Navigator */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-cyan-400" />
                Evidence Fabric ({evidenceList.length})
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Immutable</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {evidenceList.map((ev) => {
                const isSelected = ev.id === selectedEvidenceId;
                return (
                  <button
                    key={ev.id}
                    id={`evidence-tree-item-${ev.id}`}
                    onClick={() => setSelectedEvidenceId(ev.id)}
                    className={`w-full text-left rounded-lg p-2.5 transition border ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-md'
                        : 'border-slate-800/80 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold truncate max-w-[170px] text-slate-200">{ev.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        ev.status === 'Sealed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{ev.domain} • {ev.fileSize}</span>
                      <span className="font-mono text-slate-400 truncate max-w-[90px]">{ev.sha256.substring(0, 10)}...</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick IOC List */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-amber-400" />
              Primary Indicators (IOCs)
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-red-400 uppercase">C2 IPv4 Node</div>
                  <div className="text-slate-200">185.220.101.44:443</div>
                </div>
                <button
                  onClick={() => handleCopy('185.220.101.44', 'ioc-ip')}
                  className="text-slate-400 hover:text-cyan-400 p-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-amber-400 uppercase">Malicious Package</div>
                  <div className="text-slate-200">com.aerotech.diagnostics.internal</div>
                </div>
                <button
                  onClick={() => handleCopy('com.aerotech.diagnostics.internal', 'ioc-pkg')}
                  className="text-slate-400 hover:text-cyan-400 p-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-purple-400 uppercase">JA3 TLS Fingerprint</div>
                  <div className="text-slate-200 truncate max-w-[180px]">942de862ce23d0614f88e40be2171120</div>
                </div>
                <button
                  onClick={() => handleCopy('942de862ce23d0614f88e40be2171120', 'ioc-ja3')}
                  className="text-slate-400 hover:text-cyan-400 p-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT WORKSPACE PANELS ================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* PANEL 1: Interactive Correlation Graph */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Unified Correlation Graph (Interactive Graph Engine)
                </h3>
                <p className="text-[11px] text-slate-400">Cross-domain link analysis connecting Identity, Mobile APK, Web API, and Endpoint RWX</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                12 Nodes • 13 Edges
              </span>
            </div>

            {/* Interactive Graph Canvas representation */}
            <div className="h-64 w-full rounded-lg border border-slate-800 bg-slate-950/90 p-4 relative overflow-hidden flex flex-wrap items-center justify-center gap-2.5">
              {/* Graph Nodes */}
              {correlationGraph.nodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const nodeColors = {
                  actor: 'border-red-500 bg-red-950/60 text-red-300',
                  campaign: 'border-orange-500 bg-orange-950/60 text-orange-300',
                  malware: 'border-red-400 bg-red-900/40 text-red-200',
                  mobile_app: 'border-cyan-500 bg-cyan-950/60 text-cyan-300',
                  api_endpoint: 'border-amber-500 bg-amber-950/60 text-amber-300',
                  host: 'border-blue-500 bg-blue-950/60 text-blue-300',
                  process: 'border-purple-500 bg-purple-950/60 text-purple-300',
                  ip: 'border-rose-500 bg-rose-950/60 text-rose-300',
                  domain: 'border-pink-500 bg-pink-950/60 text-pink-300',
                  hash: 'border-slate-500 bg-slate-900 text-slate-300',
                  user: 'border-emerald-500 bg-emerald-950/60 text-emerald-300',
                  certificate: 'border-indigo-500 bg-indigo-950/60 text-indigo-300',
                };

                return (
                  <button
                    key={node.id}
                    id={`graph-node-${node.id}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[11px] font-mono font-medium transition shadow-md ${
                      nodeColors[node.type] || 'border-slate-700 bg-slate-900 text-slate-300'
                    } ${isSelected ? 'ring-2 ring-cyan-400 scale-105 shadow-cyan-500/30' : 'hover:scale-102 opacity-90'}`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span>{node.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Node Inspector Drawer */}
            <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Selected Graph Entity:</span>
                <div className="font-bold text-cyan-300">{selectedNode.label}</div>
                <div className="text-[11px] text-slate-400">{selectedNode.details}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Confidence</div>
                <div className="text-sm font-bold text-cyan-400">{selectedNode.confidence}%</div>
              </div>
            </div>
          </div>

          {/* PANEL 2: Synchronized Unified Timeline */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-400" />
                  Unified Chronological Timeline (6-Vector Synchronization)
                </h3>
                <p className="text-[11px] text-slate-400">Reconstruct sequence across Mobile, API, Endpoint, Identity, and Cloud</p>
              </div>

              {/* Timeline Category Filters */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'MOBILE', 'API', 'ENDPOINT', 'IDENTITY', 'NETWORK', 'CLOUD'] as const).map((cat) => (
                  <button
                    key={cat}
                    id={`timeline-filter-${cat}`}
                    onClick={() => setTimelineCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition font-medium ${
                      timelineCategoryFilter === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredTimeline.map((item) => {
                const categoryBadges = {
                  MOBILE: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                  API: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  ENDPOINT: 'bg-red-500/20 text-red-300 border-red-500/30',
                  IDENTITY: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                  NETWORK: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                  CLOUD: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                };

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/70 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${categoryBadges[item.category]}`}>
                          {item.category}
                        </span>
                        <span className="font-bold text-slate-200">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-900 pt-1">
                      <span>Asset: {item.sourceAsset}</span>
                      {item.mitreId && <span className="text-cyan-400 font-semibold">ATT&CK: {item.mitreId}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL 3: Evidence & Artifact Inspector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-cyan-400" />
                  Forensic Artifact Inspector & Chain of Custody Seal
                </h3>
                <p className="text-[11px] text-slate-400">Active Evidence: <span className="text-slate-200 font-mono font-semibold">{selectedEvidence.name}</span> ({selectedEvidence.id})</p>
              </div>

              {selectedEvidence.status !== 'Sealed' ? (
                <button
                  id="btn-seal-evidence"
                  onClick={() => sealEvidence(selectedEvidence.id)}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
                >
                  Seal Evidence in Vault
                </button>
              ) : (
                <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Defensibly Sealed
                </span>
              )}
            </div>

            {/* Deep Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Acquisition Provenance</div>
                <div><span className="text-slate-400">Source:</span> <span className="text-slate-200">{selectedEvidence.source}</span></div>
                <div><span className="text-slate-400">Method:</span> <span className="text-cyan-400">{selectedEvidence.acquisitionMethod}</span></div>
                <div><span className="text-slate-400">Acquired:</span> <span className="text-slate-200">{selectedEvidence.acquisitionDate}</span></div>
                <div><span className="text-slate-400">Collector:</span> <span className="text-slate-200">{selectedEvidence.collector}</span></div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Cryptographic Integrity</div>
                <div>
                  <span className="text-slate-400">SHA-256:</span>
                  <div className="text-[10px] text-cyan-300 break-all">{selectedEvidence.sha256}</div>
                </div>
                <div>
                  <span className="text-slate-400">MIME / Size:</span>
                  <div className="text-slate-200">{selectedEvidence.mimeType} ({selectedEvidence.fileSize})</div>
                </div>
              </div>
            </div>

            {/* Chain of Custody Entries for this specific evidence item */}
            <div className="mt-3">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                Chain of Custody Signature Ledger ({selectedEvidence.chainOfCustody.length} Entries)
              </div>
              <div className="space-y-1 text-[11px] font-mono max-h-36 overflow-y-auto pr-1">
                {selectedEvidence.chainOfCustody.map((entry) => (
                  <div key={entry.id} className="p-2 rounded bg-slate-950/60 border border-slate-900 flex items-center justify-between text-slate-300">
                    <div>
                      <span className="text-cyan-400 font-bold">{entry.action}</span>
                      <span className="text-slate-400 text-[10px] ml-2">by {entry.user} ({entry.role})</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{entry.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
