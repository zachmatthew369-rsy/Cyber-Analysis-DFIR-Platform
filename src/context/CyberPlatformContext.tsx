import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Case,
  EvidenceItem,
  TimelineEvent,
  CorrelationNode,
  CorrelationEdge,
  ProcessMemoryArtifact,
  MobileAppSecFinding,
  DynamicMobileTelemetry,
  WebSecurityFinding,
  CBOMItem,
  DetectionRule,
  ThreatActor,
  UserRole,
  PlatformTheme,
  NavSection,
  CopilotMessage,
  ChainOfCustodyEntry,
} from '../types/cyber';
import {
  INITIAL_CASES,
  INITIAL_EVIDENCE,
  UNIFIED_TIMELINE,
  CORRELATION_GRAPH,
  PROCESS_MEMORY_ARTIFACTS,
  MOBILE_APPSEC_FINDINGS,
  DYNAMIC_TELEMETRY_LOGS,
  WEB_SECURITY_FINDINGS,
  CBOM_INVENTORY,
  DETECTION_RULES,
  THREAT_ACTORS,
} from '../data/mockCyberData';

interface CyberContextType {
  theme: PlatformTheme;
  toggleTheme: () => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  currentNav: NavSection;
  setCurrentNav: (nav: NavSection) => void;
  cases: Case[];
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;
  activeCase: Case;
  evidenceList: EvidenceItem[];
  acquireNewEvidence: (name: string, domain: EvidenceItem['domain'], method: EvidenceItem['acquisitionMethod'], source: string) => void;
  sealEvidence: (evidenceId: string) => void;
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  correlationGraph: { nodes: CorrelationNode[]; edges: CorrelationEdge[] };
  processArtifacts: ProcessMemoryArtifact[];
  mobileFindings: MobileAppSecFinding[];
  dynamicTelemetry: DynamicMobileTelemetry[];
  webFindings: WebSecurityFinding[];
  cbomItems: CBOMItem[];
  detectionRules: DetectionRule[];
  updateRuleStatus: (ruleId: string, status: DetectionRule['status']) => void;
  threatActors: ThreatActor[];
  copilotMessages: CopilotMessage[];
  sendCopilotMessage: (query: string) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  simulatedSandboxRunning: boolean;
  triggerDynamicSandbox: () => void;
}

const CyberContext = createContext<CyberContextType | null>(null);

export const CyberPlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<PlatformTheme>('dark');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Super Admin');
  const [currentNav, setCurrentNav] = useState<NavSection>('command-center');
  const [cases, setCases] = useState<Case[]>(INITIAL_CASES);
  const [activeCaseId, setActiveCaseId] = useState<string>('CASE-2026-0842');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(INITIAL_EVIDENCE);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(UNIFIED_TIMELINE);
  const [correlationGraph, setCorrelationGraph] = useState(CORRELATION_GRAPH);
  const [processArtifacts] = useState<ProcessMemoryArtifact[]>(PROCESS_MEMORY_ARTIFACTS);
  const [mobileFindings] = useState<MobileAppSecFinding[]>(MOBILE_APPSEC_FINDINGS);
  const [dynamicTelemetry, setDynamicTelemetry] = useState<DynamicMobileTelemetry[]>(DYNAMIC_TELEMETRY_LOGS);
  const [webFindings] = useState<WebSecurityFinding[]>(WEB_SECURITY_FINDINGS);
  const [cbomItems] = useState<CBOMItem[]>(CBOM_INVENTORY);
  const [detectionRules, setDetectionRules] = useState<DetectionRule[]>(DETECTION_RULES);
  const [threatActors] = useState<ThreatActor[]>(THREAT_ACTORS);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [simulatedSandboxRunning, setSimulatedSandboxRunning] = useState(false);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  // Acquire new evidence with cryptographic hash & immutable ledger
  const acquireNewEvidence = (
    name: string,
    domain: EvidenceItem['domain'],
    method: EvidenceItem['acquisitionMethod'],
    source: string
  ) => {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const newId = `EVD-${Math.floor(900 + Math.random() * 100)}`;
    const sha256 = `d5a849f193${randomHex}89c2049e492b4${randomHex}99f4`;
    const sha512 = `a81b7e${randomHex}e9491823ab491c4912${randomHex}ef94103194`;

    const initialCoc: ChainOfCustodyEntry = {
      id: `COC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      user: currentUserRole,
      role: currentUserRole,
      action: `Cryptographic Seizure & Acquisition via ${method}`,
      sourceIp: '10.240.12.99',
      device: 'MalwareX-Forensic-Ingest-01',
      evidenceId: newId,
      previousHash: 'GENESIS',
      newHash: sha256,
      reason: 'Digital evidence preservation under ISO/IEC 27037 standard',
      digitalSignature: `ED25519:${randomHex.toUpperCase()}...77AA`,
    };

    const newEvidence: EvidenceItem = {
      id: newId,
      caseId: activeCaseId,
      name,
      source,
      domain,
      acquisitionMethod: method,
      acquisitionDate: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      collector: `${currentUserRole} (MalwareX Ingestion)`,
      sha256,
      sha512,
      fileSize: '184.2 MB',
      originalPath: `/var/forensics/acquired/${name}`,
      mimeType: name.endsWith('.apk') ? 'application/vnd.android.package-archive' : 'application/octet-stream',
      status: 'Acquired',
      tags: ['New Ingest', 'Pending Analysis', domain],
      findingsCount: 0,
      mitreTechniques: ['T1059', 'T1003'],
      metadata: {
        hashAlg: 'SHA-256 / SHA-512',
        writeBlocker: 'Software Logic Level 3',
        acquisitionVerified: true,
      },
      chainOfCustody: [initialCoc],
    };

    setEvidenceList((prev) => [newEvidence, ...prev]);

    // Add to timeline
    addTimelineEvent({
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      caseId: activeCaseId,
      category: domain === 'APPSEC' ? 'MOBILE' : domain === 'NETWORK' ? 'NETWORK' : 'ENDPOINT',
      title: `Evidence Seized: ${name}`,
      description: `Investigator acquired ${name} using ${method}. Initial SHA-256: ${sha256.substring(0, 16)}... sealed.`,
      sourceAsset: source,
      severity: 'INFORMATIONAL',
      relatedIocs: [sha256],
      evidenceId: newId,
    });
  };

  const sealEvidence = (evidenceId: string) => {
    setEvidenceList((prev) =>
      prev.map((e) => {
        if (e.id !== evidenceId) return e;
        const newCoc: ChainOfCustodyEntry = {
          id: `COC-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          user: currentUserRole,
          role: currentUserRole,
          action: 'Cryptographic Sealing & Legal Vault Retention',
          sourceIp: '10.240.12.99',
          device: 'MalwareX-Forensic-Vault-Node',
          evidenceId: e.id,
          previousHash: e.sha256,
          newHash: e.sha256,
          reason: 'Defensible legal hold sealing prior to final case submission',
          digitalSignature: `ED25519:SEALED-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        };
        return {
          ...e,
          status: 'Sealed',
          chainOfCustody: [...e.chainOfCustody, newCoc],
        };
      })
    );
  };

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: `TL-${Math.floor(100 + Math.random() * 900)}`,
    };
    setTimelineEvents((prev) => [newEvent, ...prev]);
  };

  const updateRuleStatus = (ruleId: string, status: DetectionRule['status']) => {
    setDetectionRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, status, lastUpdated: new Date().toISOString().slice(0, 10) } : r))
    );
  };

  const triggerDynamicSandbox = () => {
    setSimulatedSandboxRunning(true);
    setTimeout(() => {
      const newTelemetry: DynamicMobileTelemetry = {
        timestamp: '00:08.410',
        eventType: 'IPC',
        summary: 'Cross-process Intent broadcast to android.intent.action.PACKAGE_ADDED',
        details: 'Attempted to monitor newly installed banking and enterprise authenticator apps',
        status: 'MALICIOUS',
      };
      setDynamicTelemetry((prev) => [newTelemetry, ...prev]);
      setSimulatedSandboxRunning(false);
    }, 2500);
  };

  // AI Copilot grounded Q&A
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-1',
      sender: 'copilot',
      timestamp: '18:00 UTC',
      text:
        'Greetings Investigator. I am the MalwareX Intelligence Copilot. All findings, attack correlations, and responses are grounded in our immutable Evidence Fabric, MITRE ATT&CK techniques, and active case logs. How may I assist your analysis today?',
      citations: [
        {
          evidenceId: 'EVD-901',
          artifactName: 'AeroTech-Diagnostics-v4.2.apk',
          mitreId: 'T1407',
          confidence: 96,
        },
      ],
    },
  ]);

  const sendCopilotMessage = (query: string) => {
    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString().slice(11, 16) + ' UTC',
      text: query,
    };
    setCopilotMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let reply = '';
      let citations = [];

      const q = query.toLowerCase();
      if (q.includes('apk') || q.includes('mobile') || q.includes('token')) {
        reply =
          '**Evidence Analysis (EVD-901 / AeroTech-Diagnostics-v4.2.apk):**\n\n' +
          '• **Root Cause:** Application assets contain hardcoded production JWT bearer tokens (`MASVS-STORAGE-1`, CVSS 9.8).\n' +
          '• **Adversary Pivot:** Attacker used this credential against `/api/v2/telemetry/orbital-coordinates/` at 04:04 UTC, exfiltrating 14,290 records (EVD-905).\n' +
          '• **MITRE ATT&CK:** Mapped to **T1407 (Exploit Hardcoded Credentials)** & **T1552.001 (Credentials in Files)**.\n' +
          '• **Recommended Action:** Invalidate the compromised master token immediately, rotate JWT signing secret in AWS KMS, and re-sign APK with Keystore-backed attestation.';
        citations = [
          { evidenceId: 'EVD-901', artifactName: 'AeroTech-Diagnostics-v4.2.apk', mitreId: 'T1407', confidence: 99 },
          { evidenceId: 'EVD-905', artifactName: 'api_gateway_access_logs.json', mitreId: 'T1552.001', confidence: 95 },
        ];
      } else if (q.includes('memory') || q.includes('svchost') || q.includes('rwx') || q.includes('injection')) {
        reply =
          '**Memory Forensics (EVD-902 / CORP-LT-8812_RAM.raw):**\n\n' +
          '• **Suspicious Process:** `svchost.exe` (PID 3812) has 2 unmapped **RWX memory allocations** at base address `0x00007FF7B0120000`.\n' +
          '• **Technique:** Reflective DLL Injection / Process Hollowing spawned by `powershell.exe` (PID 5910).\n' +
          '• **Network Correlation:** Injected thread maintains an active TLS 1.3 C2 beacon to `185.220.101.44:443` with JA3 hash `942de862ce23d0614f88e40be2171120`.\n' +
          '• **MITRE ATT&CK:** **T1055.012 (Process Hollowing)** and **T1071.001 (Web Protocols)**.';
        citations = [
          { evidenceId: 'EVD-902', artifactName: 'CORP-LT-8812_PhysicalMemory.raw', mitreId: 'T1055.012', confidence: 98 },
          { ruleId: 'YARA-102', artifactName: 'MalwareX_ShadowPulse_Trojanized_APK', confidence: 94 },
        ];
      } else if (q.includes('chain of custody') || q.includes('audit') || q.includes('legal')) {
        reply =
          '**Chain of Custody Health Check:**\n\n' +
          '• **Integrity Status:** 100% Defensible. All 6 active evidence items are hashed via SHA-256 and SHA-512 with zero hash collisions or discrepancies detected.\n' +
          '• **Sealed Artifacts:** EVD-901, EVD-903, and EVD-904 have complete ED25519 digital signature audit logs.\n' +
          '• **Legal Hold:** Meets NIST SP 800-86 & ISO/IEC 27037 standards for forensic evidence preservation.';
        citations = [{ evidenceId: 'EVD-901', artifactName: 'AeroTech-Diagnostics-v4.2.apk', confidence: 100 }];
      } else {
        reply =
          `**Correlated Intelligence for "${query}":**\n\n` +
          '• Adversary Campaign: **Operation ShadowPulse** (attributed to **Volt Typhoon** with 94% confidence).\n' +
          '• Connected Artifacts: 1 Mobile Trojan APK, 1 RAM Dump (RWX Injection), 1 E01 Disk Image, 1 C2 Network Flow, and 1 API Access Log.\n' +
          '• Impacted Criticality: Critical (Classified Aerospace Ground Telemetry exfiltration detected).';
        citations = [{ evidenceId: 'EVD-901', artifactName: 'Correlation Layer', mitreId: 'T1189', confidence: 92 }];
      }

      const copilotReply: CopilotMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'copilot',
        timestamp: new Date().toISOString().slice(11, 16) + ' UTC',
        text: reply,
        citations,
      };
      setCopilotMessages((prev) => [...prev, copilotReply]);
    }, 600);
  };

  return (
    <CyberContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUserRole,
        setCurrentUserRole,
        currentNav,
        setCurrentNav,
        cases,
        activeCaseId,
        setActiveCaseId,
        activeCase,
        evidenceList,
        acquireNewEvidence,
        sealEvidence,
        timelineEvents,
        addTimelineEvent,
        correlationGraph,
        processArtifacts,
        mobileFindings,
        dynamicTelemetry,
        webFindings,
        cbomItems,
        detectionRules,
        updateRuleStatus,
        threatActors,
        copilotMessages,
        sendCopilotMessage,
        isCopilotOpen,
        setIsCopilotOpen,
        globalSearch,
        setGlobalSearch,
        simulatedSandboxRunning,
        triggerDynamicSandbox,
      }}
    >
      {children}
    </CyberContext.Provider>
  );
};

export const useCyber = () => {
  const context = useContext(CyberContext);
  if (!context) {
    throw new Error('useCyber must be used within a CyberPlatformProvider');
  }
  return context;
};
