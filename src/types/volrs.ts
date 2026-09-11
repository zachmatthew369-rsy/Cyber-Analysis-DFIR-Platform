export interface VolRsPlugin {
  id: string;
  name: string;
  category: 'Processes' | 'Malware / Code Injection' | 'Networking' | 'DLLs & Modules' | 'Command Line' | 'Registry' | 'VAD & Memory' | 'Linux Forensics' | 'YARA';
  os: 'windows' | 'linux' | 'mac' | 'generic';
  description: string;
  command: string;
  benchmarkSpeedup: {
    rustTimeSec: number;
    pythonTimeSec: number;
    speedupRatio: string;
  };
}

export interface VolRsDumpMetadata {
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  fileExtension: string;
  sha256: string;
  md5: string;
  sha512: string;
  detectedOs: string;
  architecture: 'x86_64' | 'AArch64' | 'i386';
  symbolPack: string;
  layerType: 'Intel64' | 'LimeLayer' | 'Crashdump' | 'VmwareLayer' | 'RawLinear';
  uploadedAt: string;
  isPreset?: boolean;
}

export interface VolRsProcessRow {
  pid: number;
  ppid: number;
  imageFileName: string;
  offset: string;
  threads: number;
  handles: number;
  session: number;
  wow64: boolean;
  createTime: string;
  exitTime?: string;
  isInjected?: boolean;
  riskScore: number;
}

export interface VolRsMalfindRow {
  pid: number;
  process: string;
  startVpn: string;
  endVpn: string;
  protection: string;
  commitCharge: number;
  privateMemory: boolean;
  tag: string;
  hasMzHeader: boolean;
  hexPreview: string[];
  disassembly: string[];
  yaraMatch?: string;
}

export interface VolRsNetscanRow {
  offset: string;
  proto: 'TCPv4' | 'TCPv6' | 'UDPv4' | 'UDPv6';
  localAddr: string;
  localPort: number;
  foreignAddr: string;
  foreignPort: number;
  state: 'ESTABLISHED' | 'LISTENING' | 'CLOSE_WAIT' | 'TIME_WAIT' | 'SYN_SENT';
  pid: number;
  owner: string;
  created: string;
  threatLevel?: 'CRITICAL' | 'SUSPICIOUS' | 'BENIGN';
  geoCountry?: string;
}

export interface VolRsLdrModuleRow {
  pid: number;
  process: string;
  base: string;
  inLoadOrder: boolean;
  inInitOrder: boolean;
  inMemOrder: boolean;
  mappedPath: string;
  suspicious: boolean;
  reason?: string;
}

export interface VolRsCmdlineRow {
  pid: number;
  process: string;
  args: string;
  suspicious: boolean;
  notes?: string;
}

export interface VolRsYaraMatchRow {
  rule: string;
  component: string;
  offset: string;
  value: string;
  tag: string;
  pid?: number;
}

export type ScanProfileId =
  | 'quick_triage'
  | 'deep_investigation'
  | 'malware_investigation'
  | 'network_investigation'
  | 'persistence_execution'
  | 'full_sweep';

export interface VolRsScanProfile {
  id: ScanProfileId;
  name: string;
  description: string;
  pluginCount: {
    windows: number;
    linux: number;
  };
  pluginIds: string[];
  focusDescription: string;
}

export interface VolRsPluginRunRecord {
  pluginId: string;
  pluginName: string;
  category: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'DETECTION_FOUND';
  executionTimeSec: number;
  speedupFactor: number;
  findingsCount: number;
  severity: 'CLEAN' | 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summaryMessage: string;
  targetStructures?: string[];
  purpose?: string;
  memoryOffset?: string;
}

export interface VolRsAnalysisResult {
  dump: VolRsDumpMetadata;
  pluginId: string;
  pluginName: string;
  profileId?: ScanProfileId;
  profileName?: string;
  executionTimeSec: number;
  rustSpeedupFactor: number;
  timestamp: string;
  rawCliOutput: string;
  pluginRunRecords?: VolRsPluginRunRecord[];
  totalPluginsCount?: number;
  processes?: VolRsProcessRow[];
  malfind?: VolRsMalfindRow[];
  netscan?: VolRsNetscanRow[];
  ldrmodules?: VolRsLdrModuleRow[];
  cmdlines?: VolRsCmdlineRow[];
  yaraMatches?: VolRsYaraMatchRow[];
  findingsSummary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    totalArtifacts: number;
    injectedPids: number[];
    c2Sockets: string[];
  };
}

