import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import { VolRsMemoryAnalysis } from './VolRsMemoryAnalysis';
import {
  Cpu,
  Binary,
  Smartphone,
  Network,
  Cloud,
  Bug,
  AlertOctagon,
  Search,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  Key,
  Shield,
  FileCode,
  Flame,
} from 'lucide-react';

export const DfirModule: React.FC = () => {
  const { currentNav, processArtifacts, evidenceList, sendCopilotMessage, setIsCopilotOpen, acquireNewEvidence, addTimelineEvent } = useCyber();
  const [activeTab, setActiveTab] = useState<'endpoint' | 'memory' | 'mobile' | 'network' | 'cloud' | 'malware'>('memory');
  const [selectedProcessPid, setSelectedProcessPid] = useState<number>(3812);

  // Sync with currentNav if navigated directly
  React.useEffect(() => {
    if (currentNav === 'dfir-endpoint') setActiveTab('endpoint');
    if (currentNav === 'dfir-memory') setActiveTab('memory');
    if (currentNav === 'dfir-mobile') setActiveTab('mobile');
    if (currentNav === 'dfir-network') setActiveTab('network');
    if (currentNav === 'dfir-cloud') setActiveTab('cloud');
    if (currentNav === 'dfir-malware') setActiveTab('malware');
  }, [currentNav]);

  const selectedProcess = processArtifacts.find((p) => p.pid === selectedProcessPid) || processArtifacts[0];

  return (
    <div id="dfir-operations-module" className="space-y-4">
      {/* DFIR Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-400 animate-ping" />
            <h2 className="text-lg font-bold font-mono text-white">Digital Forensics & Incident Response (DFIR)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Comprehensive low-level forensic reconstruction across Memory, Disk, Mobile artifacts, PCAP, and Cloud
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 overflow-x-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'memory', label: 'Memory Analysis', icon: Binary },
            { id: 'endpoint', label: 'Endpoint (Disk/OS)', icon: Cpu },
            { id: 'mobile', label: 'Mobile Forensics', icon: Smartphone },
            { id: 'network', label: 'Network & PCAP', icon: Network },
            { id: 'cloud', label: 'Cloud & Identity', icon: Cloud },
            { id: 'malware', label: 'Malware Sandbox', icon: Bug },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`dfir-tab-${tab.id}`}
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

      {/* ================= 1. MEMORY ANALYSIS VIEW (POWERED BY VOL-RS) ================= */}
      {activeTab === 'memory' && (
        <VolRsMemoryAnalysis
          onSendToCopilot={(prompt) => {
            setIsCopilotOpen(true);
            sendCopilotMessage(prompt);
          }}
          onAddEvidence={(title, metadata) => {
            acquireNewEvidence(
              title,
              'MEMORY',
              'VOLATILITY_RAM',
              metadata.detectedOs || 'RAM Capture Device'
            );
            addTimelineEvent({
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
              caseId: 'CASE-2026-0842',
              category: 'ENDPOINT',
              title: `Forensic Evidence Ingested: ${title}`,
              description: `vol-rs analyzed dump ${metadata.plugin || ''}. Found ${metadata.criticalCount || 0} critical artifacts and ${metadata.injectedPids?.length || 0} injected PIDs.`,
              sourceAsset: 'Volatile RAM Bit-stream',
              severity: (metadata.criticalCount > 0 ? 'CRITICAL' : 'HIGH') as any,
              relatedIocs: metadata.c2Sockets || [],
            });
          }}
        />
      )}

      {/* ================= 2. ENDPOINT FORENSICS VIEW ================= */}
      {activeTab === 'endpoint' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Endpoint Forensics Engine (Windows NTFS, MFT, Shimcache & Amcache)
              </h3>
              <p className="text-xs text-slate-400">Target Image: CORP-LT-8812_C_Drive.E01 (Bit-stream Image)</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">1,428,901 MFT Records Parsed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Amcache Execution Evidence</div>
              <div className="text-slate-200 font-semibold">POWERSHELL.EXE-F149A02.pf</div>
              <div className="text-slate-400 text-[11px]">Run count: 14 | Last Exec: 2026-09-08 04:22:10 UTC</div>
              <div className="text-red-400 text-[10px]">Loaded: System.Management.Automation.dll</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">USN Journal / MFT Record</div>
              <div className="text-slate-200 font-semibold">C:\Users\j.alvarez\AppData\Local\Temp\stg.bin</div>
              <div className="text-slate-400 text-[11px]">File Created → Closed → Hard Deleted within 4.2s</div>
              <div className="text-amber-400 text-[10px]">Anti-Forensic timestomping detected ($STANDARD_INFO)</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Windows Event Log ID 4688</div>
              <div className="text-slate-200 font-semibold">Process Creation with Full Command Line</div>
              <div className="text-slate-400 text-[11px]">Parent: WINWORD.EXE (PID 6104)</div>
              <div className="text-red-400 text-[10px]">Command: powershell.exe -w hidden -enc SQB...</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. MOBILE FORENSICS VIEW ================= */}
      {activeTab === 'mobile' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Mobile Forensics (Android / iOS Physical & Logical Artifacts)
              </h3>
              <p className="text-xs text-slate-400">Package: com.aerotech.diagnostics.internal (Pixel 7 Pro)</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">NIST SP 800-101 Guidelines</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase">Extracted SharedPreferences & SQLite Datastores</h4>
              <div className="p-2 rounded bg-black/80 text-[11px] text-slate-300">
                <span className="text-slate-400">File: /data/data/com.aerotech.diagnostics.internal/shared_prefs/session_cache.xml</span>
                <pre className="mt-1 text-amber-300 text-[10px]">
{`<map>
  <string name="user_email">dr.j.alvarez@aerotech.com</string>
  <string name="auth_token">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</string>
  <string name="target_c2">185.220.101.44</string>
</map>`}
                </pre>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase">Android Keystore & Signing Key Validation</h4>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <p><span className="text-slate-400">Signer Common Name:</span> CN=Internal Debug Key (Not Production CA)</p>
                <p><span className="text-slate-400">Key Validity:</span> Expired 2024-01-01 (V1/V2 signature compromised)</p>
                <p><span className="text-slate-400">Hardware Keystore Backing:</span> <span className="text-red-400 font-bold">DISABLED</span></p>
                <p className="text-[10px] text-slate-400">Adversary injected dynamic dex payload into secondary class loader.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. NETWORK & PCAP VIEW ================= */}
      {activeTab === 'network' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Network Forensics & PCAP Stream Analyzer
              </h3>
              <p className="text-xs text-slate-400">Capture: perimeter_firewall_pcap_20260908.pcapng (2.89M Packets)</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Zeek / Suricata Correlated</span>
          </div>

          <div className="p-3 rounded-lg bg-black/80 border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-slate-400 text-[10px]">C2 BEACON CONVERSATION STREAM (185.220.101.44:443)</div>
            <div className="text-cyan-300">04:28:01.291 [SYN] 10.240.12.91:49214 → 185.220.101.44:443 (Window 64240)</div>
            <div className="text-slate-300">04:28:01.320 [SYN-ACK] 185.220.101.44:443 → 10.240.12.91:49214</div>
            <div className="text-amber-300">04:28:01.350 [TLS 1.3 Client Hello] JA3: 942de862ce23d0614f88e40be2171120</div>
            <div className="text-red-400 font-bold">04:28:01.412 [TLS 1.3 Application Data] 4096 bytes encrypted beacon egress</div>
            <div className="text-slate-400 text-[10px] mt-2">Beacon cadence: 60 seconds with ±15% randomized jitter (Cobalt Strike Profile).</div>
          </div>
        </div>
      )}

      {/* ================= 5. CLOUD & IDENTITY VIEW ================= */}
      {activeTab === 'cloud' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Cloud & Identity Forensics (AWS CloudTrail & Entra ID Audit)
              </h3>
              <p className="text-xs text-slate-400">Target Role: arn:aws:iam::931106459343:role/DataPipelineTelemetryAccess</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Impossible Travel Detected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-red-400 uppercase font-bold">Suspicious STS AssumeRole</div>
              <div className="text-slate-200">sts:AssumeRole called from 185.220.101.44 (Switzerland)</div>
              <div className="text-slate-400 text-[11px]">User Agent: aws-cli/2.15.15 Python/3.11.8 Linux/6.5.0-x86_64</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-amber-400 uppercase font-bold">S3 Object Sync Exfiltration</div>
              <div className="text-slate-200">s3:GetObject on bucket aerotech-ground-telemetry-archive</div>
              <div className="text-slate-400 text-[11px]">142 orbital telemetry packages downloaded (12.4 GB)</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. MALWARE SANDBOX VIEW ================= */}
      {activeTab === 'malware' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Malware Analysis Sandbox & Static Disassembly
              </h3>
              <p className="text-xs text-slate-400">Sample: AeroTech-Diagnostics-v4.2.apk (SHA-256: 9f86d081...)</p>
            </div>
            <span className="text-xs font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">
              High Entropy: 7.92 (Packed/Encrypted)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Static Imports Analysis</div>
              <div className="text-slate-200">dalvik.system.DexClassLoader</div>
              <div className="text-slate-200">java.lang.reflect.Method.invoke</div>
              <div className="text-red-400 text-[10px]">Dynamic code loading capability verified</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Embedded Strings</div>
              <div className="text-amber-300">telemetry-update-node.cloud</div>
              <div className="text-amber-300">185.220.101.44</div>
              <div className="text-slate-400 text-[10px]">C2 domain embedded in obfuscated array</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Sandbox Verdict</div>
              <div className="text-red-400 font-bold text-sm">TROJAN / EXFILTRATOR</div>
              <div className="text-slate-400 text-[10px]">Matches Operation ShadowPulse APT profile</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
