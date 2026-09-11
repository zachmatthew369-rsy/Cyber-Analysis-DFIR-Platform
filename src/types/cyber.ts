/**
 * MalwareX Cyber Analysis & DFIR Platform Types
 */

export type UserRole =
  | 'Super Admin'
  | 'SOC Manager'
  | 'DFIR Analyst'
  | 'Malware Analyst'
  | 'AppSec Engineer'
  | 'Threat Hunter'
  | 'Auditor / Executive';

export type PlatformTheme = 'dark' | 'light';

export type NavSection =
  | 'command-center'
  | 'workbench'
  | 'dfir-endpoint'
  | 'dfir-memory'
  | 'dfir-mobile'
  | 'dfir-network'
  | 'dfir-cloud'
  | 'dfir-malware'
  | 'appsec-web'
  | 'appsec-api'
  | 'appsec-mobile-masvs'
  | 'appsec-dynamic-lab'
  | 'appsec-sbom-cbom'
  | 'threat-actors'
  | 'threat-iocs'
  | 'threat-mitre'
  | 'detection-engineering'
  | 'governance-chain-of-custody'
  | 'governance-cases'
  | 'governance-compliance'
  | 'governance-reports';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface ChainOfCustodyEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  sourceIp: string;
  device: string;
  evidenceId: string;
  previousHash: string;
  newHash: string;
  reason: string;
  digitalSignature: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  name: string;
  source: string;
  domain: 'DFIR' | 'APPSEC' | 'THREAT_INTEL' | 'NETWORK' | 'IDENTITY';
  acquisitionMethod: 'Live Agent Acquisition' | 'Disk Image (E01/RAW)' | 'Memory Dump (LiME/Crashdump)' | 'PCAP Ingestion' | 'Mobile APK/IPA Dump' | 'API Telemetry';
  acquisitionDate: string;
  collector: string;
  sha256: string;
  sha512: string;
  fileSize: string;
  originalPath: string;
  mimeType: string;
  status: 'Acquired' | 'Verified' | 'Analyzing' | 'Sealed' | 'Archived';
  chainOfCustody: ChainOfCustodyEntry[];
  metadata: Record<string, any>;
  tags: string[];
  findingsCount: number;
  mitreTechniques: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  caseId: string;
  category: 'ENDPOINT' | 'MOBILE' | 'WEB' | 'API' | 'NETWORK' | 'CLOUD' | 'IDENTITY';
  title: string;
  description: string;
  sourceAsset: string;
  userAccount?: string;
  severity: SeverityLevel;
  relatedIocs: string[];
  mitreId?: string;
  evidenceId?: string;
  correlatedEvents?: string[];
}

export interface CorrelationNode {
  id: string;
  label: string;
  type: 'actor' | 'campaign' | 'malware' | 'domain' | 'ip' | 'hash' | 'certificate' | 'process' | 'host' | 'mobile_app' | 'api_endpoint' | 'user';
  severity?: SeverityLevel;
  details: string;
  confidence: number;
  tags?: string[];
}

export interface CorrelationEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  confidence: number;
}

export interface Case {
  id: string;
  incidentId: string;
  title: string;
  classification: 'Confidential' | 'Restricted' | 'TLP:AMBER' | 'TLP:RED';
  status: 'Active' | 'Triage' | 'Contained' | 'Eradicating' | 'Recovered' | 'Closed';
  severity: SeverityLevel;
  customer: string;
  businessUnit: string;
  assignedAnalysts: string[];
  leadAnalyst: string;
  createdAt: string;
  updatedAt: string;
  slaRemainingHours: number;
  evidenceIds: string[];
  iocCount: number;
  affectedAssets: string[];
  affectedUsers: string[];
  riskScore: number; // 0-100
  mitreTactics: string[];
  summary: string;
}

export interface ProcessMemoryArtifact {
  pid: number;
  processName: string;
  commandLine: string;
  parentPid: number;
  parentName: string;
  threads: number;
  handles: number;
  rwxRegions: number;
  injectedCodeDetected: boolean;
  injectionTechnique?: string;
  riskScore: number;
  matchedYaraRules: string[];
  networkConnections: string[];
}

export interface MobileAppSecFinding {
  id: string;
  appIdentifier: string;
  platform: 'Android' | 'iOS';
  category: 'Storage' | 'Cryptography' | 'Authentication' | 'Network' | 'Platform' | 'Code' | 'Resilience' | 'Privacy';
  masvsId: string; // e.g. MASVS-CRYPTO-1, MASVS-STORAGE-2
  mastgId: string; // e.g. MASTG-TEST-0012
  title: string;
  description: string;
  severity: SeverityLevel;
  codeSnippet?: string;
  remediation: string;
  cwe: string;
  cvss: number;
}

export interface DynamicMobileTelemetry {
  timestamp: string;
  eventType: 'PROCESS' | 'FILE_IO' | 'DNS' | 'HTTP_REQUEST' | 'TLS_HANDSHAKE' | 'IPC' | 'PERMISSION' | 'CLIPBOARD' | 'LOCATION';
  summary: string;
  details: string;
  status: 'BENIGN' | 'SUSPICIOUS' | 'MALICIOUS';
}

export interface WebSecurityFinding {
  id: string;
  targetUrl: string;
  vulnerability: string;
  category: 'OWASP Top 10' | 'API Security' | 'Business Logic' | 'Cryptographic';
  cwe: string;
  severity: SeverityLevel;
  cvss: number;
  evidenceParameter: string;
  requestProof: string;
  remediation: string;
}

export interface CBOMItem {
  id: string;
  asset: string;
  algorithm: string;
  keySize: number | string;
  protocol: string;
  certificateExpiry?: string;
  location: string;
  quantumVulnerability: 'QUANTUM_VULNERABLE' | 'QUANTUM_RESISTANT' | 'HYBRID' | 'UNKNOWN';
  pqcAlternative: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  format: 'Sigma' | 'YARA' | 'Suricata' | 'KQL' | 'EQL';
  category: string;
  mitreAttackId: string;
  severity: SeverityLevel;
  status: 'Draft' | 'Testing' | 'Validated' | 'Deployed' | 'Retired';
  author: string;
  lastUpdated: string;
  ruleContent: string;
  falsePositiveRate: string;
  performanceScore: number; // 0-100
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  origin: string;
  targetSectors: string[];
  motivation: string;
  activeCampaigns: string[];
  associatedMalware: string[];
  primaryMitreTechniques: string[];
  confidence: number;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot';
  timestamp: string;
  text: string;
  citations?: {
    evidenceId?: string;
    artifactName?: string;
    mitreId?: string;
    confidence?: number;
    ruleId?: string;
  }[];
}
