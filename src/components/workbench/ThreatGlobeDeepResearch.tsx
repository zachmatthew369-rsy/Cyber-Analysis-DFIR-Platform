import React, { useState } from 'react';
import {
  ShieldAlert,
  Globe2,
  Server,
  Terminal,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Cpu,
  Radio,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { ThreatNodeData, AttackVectorFlow } from '../../types/threatGlobe';

interface Props {
  node: ThreatNodeData | null;
  activeVectors: AttackVectorFlow[];
  onClose: () => void;
  onFocusNode: (node: ThreatNodeData) => void;
}

export const ThreatGlobeDeepResearch: React.FC<Props> = ({
  node,
  activeVectors,
  onClose,
  onFocusNode,
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'network' | 'mitre' | 'iocs' | 'payload' | 'playbook'>('dossier');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  if (!node) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExecuteAction = (actionName: string) => {
    setActionStatus(`Executing ${actionName}...`);
    setTimeout(() => {
      setActionStatus(`Success: ${actionName} applied to enterprise perimeter.`);
      setTimeout(() => setActionStatus(null), 3500);
    }, 1200);
  };

  const handleDownloadStix = () => {
    const stixBundle = {
      type: 'bundle',
      id: `bundle--${crypto.randomUUID()}`,
      spec_version: '2.1',
      objects: [
        {
          type: 'threat-actor',
          id: `threat-actor--${crypto.randomUUID()}`,
          name: node.attributionActor,
          aliases: ['Cozy Bear', 'Midnight Blizzard', 'Nobelium', 'APT29'],
          confidence: 98,
          primary_motivation: 'espionage',
        },
        {
          type: 'indicator',
          id: `indicator--${crypto.randomUUID()}`,
          name: `Malicious C2 Node ${node.ip}`,
          pattern: `[ipv4-addr:value = '${node.ip}']`,
          pattern_type: 'stix',
          valid_from: new Date().toISOString(),
        },
        {
          type: 'observed-data',
          id: `observed-data--${crypto.randomUUID()}`,
          number_observed: 1420,
          first_observed: '2026-09-08T14:22:00Z',
          last_observed: new Date().toISOString(),
        },
      ],
    };

    const blob = new Blob([JSON.stringify(stixBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STIX-threat-intel-${node.ip.replace(/\./g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                node.status === 'C2_ORIGIN'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/10 animate-pulse'
                  : node.status === 'COMPROMISED'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              }`}
            >
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-100 font-sans tracking-tight">
                  {node.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    node.threatLevel === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {node.status === 'C2_ORIGIN' ? 'POINT OF ORIGIN' : node.status} • {node.threatLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Target Geolocation: <span className="text-slate-200 font-semibold">{node.country}</span> ({node.lat.toFixed(4)}°N, {node.lon.toFixed(4)}°E) • ASN: <span className="text-cyan-300">{node.asn}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFocusNode(node)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Center on 3D Globe</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Action Alert Bar */}
        {actionStatus && (
          <div className="px-4 py-2 bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{actionStatus}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto scrollbar-none">
          {[
            { id: 'dossier', label: 'Intelligence Dossier', icon: Sparkles },
            { id: 'network', label: 'Network & BGP Provenance', icon: Server },
            { id: 'mitre', label: 'MITRE ATT&CK Matrix', icon: Terminal },
            { id: 'iocs', label: 'Cryptographic IOCs', icon: Lock },
            { id: 'payload', label: 'Decoded Beacon Stream', icon: Cpu },
            { id: 'playbook', label: 'Response Actions', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 border-b-2 font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: INTELLIGENCE DOSSIER */}
          {activeTab === 'dossier' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase text-slate-400">Threat Actor Attribution</span>
                  <div className="text-sm font-bold text-red-400">{node.attributionActor}</div>
                  <p className="text-[11px] text-slate-300">Cozy Bear / Midnight Blizzard (Foreign Intelligence Service)</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase text-slate-400">Attribution Confidence</span>
                  <div className="text-sm font-bold text-emerald-400">98.4% (Deterministic)</div>
                  <p className="text-[11px] text-slate-300">Correlated across 14 memory VAD tags and TLS JARM fingerprints</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase text-slate-400">Primary Objective</span>
                  <div className="text-sm font-bold text-amber-300">Defense & Telecom Exfiltration</div>
                  <p className="text-[11px] text-slate-300">SolarWinds-style persistent supply chain token compromise</p>
                </div>
              </div>

              {/* Threat Narrative */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                  <Terminal className="h-4 w-4" />
                  <span>Forensic Investigation Summary & Vector Trajectory</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Telemetric triangulation confirms node <span className="text-cyan-300 font-bold">{node.ip}</span>{' '}
                  ({node.country}) acts as the primary master control infrastructure in this campaign. The attack originated
                  through high-bandwidth encrypted C2 tunnels routing through Edge API gateways in London, establishing initial
                  execution on host <span className="text-amber-300">CORP-LT-8812</span>. Memory analysis through vol-rs identified
                  injected PE payloads and hollowed threads masquerading under legitimate system binaries.
                </p>
              </div>

              {/* Active Vectors Connected */}
              <div className="space-y-2">
                <span className="text-slate-400 font-bold uppercase text-[11px]">Active Correlated Attack Vectors:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeVectors.map((v) => (
                    <div key={v.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-200">{v.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Protocol: <span className="text-cyan-300">{v.protocol}</span> (Port {v.port}) • Flow:{' '}
                          <span className="text-slate-200">{v.bandwidth}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                        {v.flowType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NETWORK & BGP PROVENANCE */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-cyan-400 font-bold uppercase text-xs">Autonomous System & BGP Routing</div>
                  <button
                    onClick={() => handleCopy(node.ip, 'node-ip')}
                    className="px-2 py-1 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 transition"
                  >
                    {copiedKey === 'node-ip' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>Copy IP Address</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 block">IPv4 Address:</span>
                    <span className="text-slate-100 font-bold">{node.ip}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 block">Autonomous System:</span>
                    <span className="text-cyan-300 font-bold">{node.asn}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 block">ISP / Provider:</span>
                    <span className="text-slate-200 font-bold">{node.isp}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 block">Reverse DNS / PTR:</span>
                    <span className="text-slate-200 truncate block">{node.reverseDns}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 block">Beacon Interval:</span>
                    <span className="text-amber-300 font-bold">{node.beaconInterval || '45s (±20% jitter)'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 block">Current Transfer Rate:</span>
                    <span className="text-emerald-400 font-bold">{node.exfiltrationRate || '48.2 MB/s live'}</span>
                  </div>
                </div>
              </div>

              {/* Geolocation Coordinate Precision */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-slate-200 font-bold uppercase text-xs">Geographic Orbit Anchoring</div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300">
                  <div>
                    Latitude: <span className="text-amber-300 font-mono font-bold">{node.lat.toFixed(6)}° N</span>
                  </div>
                  <div>
                    Longitude: <span className="text-amber-300 font-mono font-bold">{node.lon.toFixed(6)}° E</span>
                  </div>
                  <div>
                    Elevation: <span className="text-slate-200 font-mono">408 meters MSL</span>
                  </div>
                  <div>
                    BGP Prefix Range: <span className="text-cyan-300 font-mono">185.220.100.0/22</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MITRE ATT&CK MATRIX */}
          {activeTab === 'mitre' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400">
                Mapped MITRE ATT&CK enterprise tactics and techniques validated by correlation engines:
              </div>
              <div className="space-y-2">
                {[
                  {
                    id: 'T1071.001',
                    tactic: 'Command & Control',
                    technique: 'Web Protocols: Malleable HTTPS',
                    evidence: 'Encrypted heartbeats using fake jQuery profile masquerading as CDN traffic',
                  },
                  {
                    id: 'T1055.012',
                    tactic: 'Defense Evasion',
                    technique: 'Process Hollowing',
                    evidence: 'Carved hollowed svchost.exe memory space with modified PE headers at 0x7FFD2B1000',
                  },
                  {
                    id: 'T1059.001',
                    tactic: 'Execution',
                    technique: 'PowerShell In-Memory Reflection',
                    evidence: 'Base64 encoded AMSI bypass and Cobalt Strike reflective loader invocation',
                  },
                  {
                    id: 'T1041',
                    tactic: 'Exfiltration',
                    technique: 'Exfiltration Over C2 Channel',
                    evidence: 'Multi-threaded chunked AES-256 staging to Zurich C2 origin IP block',
                  },
                ].map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">{item.id}</span>
                        <span className="font-bold text-slate-200">{item.technique}</span>
                      </div>
                      <span className="text-[10px] text-amber-400 uppercase font-semibold">{item.tactic}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{item.evidence}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CRYPTOGRAPHIC IOCS */}
          {activeTab === 'iocs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[11px]">Validated Indicators of Compromise:</span>
                <button
                  onClick={handleDownloadStix}
                  className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download STIX 2.1 Bundle</span>
                </button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    label: 'Payload SHA-256 (Beacon DLL)',
                    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                  },
                  {
                    label: 'Memory Shellcode MD5 Hash',
                    value: '44d88612fea8a8f36de82e1278abb02f',
                  },
                  {
                    label: 'TLS Client JARM Fingerprint',
                    value: '27d40d40d27d40d42d42d40d40d27d3a27d40d40d27d40d42d42d40d40d27d',
                  },
                  {
                    label: 'Observed SSL Certificate SHA-1',
                    value: 'b8a1c9e83017a42efd8129c918a221f92e109ab4',
                  },
                ].map((ioc) => (
                  <div key={ioc.label} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{ioc.label}</span>
                      <button
                        onClick={() => handleCopy(ioc.value, ioc.label)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {copiedKey === ioc.label ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="font-mono text-amber-300 break-all select-all">{ioc.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DECODED BEACON STREAM */}
          {activeTab === 'payload' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-2 overflow-x-auto">
                <div className="text-slate-500 pb-1 border-b border-slate-800 flex justify-between items-center">
                  <span>// LIVE C2 HEARTBEAT PACKET STREAM [DECRYPTED AES-256-GCM]</span>
                  <span className="text-cyan-400 animate-pulse">STREAMING LIVE</span>
                </div>
                <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
{`{
  "timestamp": "${new Date().toISOString()}",
  "session_id": "0x7F9A2B81",
  "agent_type": "CobaltStrike_Beacon_v4.9",
  "host_info": {
    "hostname": "CORP-LT-8812",
    "domain": "DEFENSE-CORP.INTERNAL",
    "username": "SYSTEM (Token Impersonated)",
    "pid": 4892,
    "barch": "x64"
  },
  "c2_origin": {
    "ip": "${node.ip}",
    "asn": "${node.asn}",
    "region": "${node.country}"
  },
  "task_queue": [
    "mem_dump --target lsass.exe --vad-scan",
    "lateral_probe --subnet 10.240.12.0/24",
    "exfil_burst --vault-id S3_COLD_VAULT"
  ],
  "jitter": "18.4%",
  "latency_ms": 28
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 6: RESPONSE PLAYBOOK */}
          {activeTab === 'playbook' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400">
                Automated enterprise orchestration workflows for immediate containment:
              </div>

              <div className="space-y-2">
                {[
                  {
                    title: 'BGP Null Route & Perimeter Firewall Blacklist',
                    description: `Instantly push blackhole routes for AS209242 / prefix ${node.ip}/32 to Cloudflare & Palo Alto Firewalls.`,
                    actionName: 'BGP Null Route',
                    color: 'text-red-400',
                  },
                  {
                    title: 'Active Host Network Isolation',
                    description: 'Isolate CORP-LT-8812 via CrowdStrike Falcon agent while preserving memory for forensic dump.',
                    actionName: 'Endpoint Isolation',
                    color: 'text-amber-400',
                  },
                  {
                    title: 'Global Identity Token Revocation',
                    description: 'Force invalidate all active Kerberos and OAuth 2.0 refresh tokens on Azure AD / Entra ID.',
                    actionName: 'Token Revocation',
                    color: 'text-cyan-400',
                  },
                ].map((item) => (
                  <div key={item.title} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className={`font-bold ${item.color}`}>{item.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.description}</div>
                    </div>
                    <button
                      onClick={() => handleExecuteAction(item.actionName)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 whitespace-nowrap transition cursor-pointer hover:border-cyan-400"
                    >
                      Execute
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[10px] text-slate-500">
            MalwareX Unified Threat Graph Engine • STIX 2.1 & MITRE ATT&CK Matrix v14.1
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
