import * as THREE from 'three';

export interface ThreatLatencyStats {
  rttMs: number;
  jitterMs: number;
  packetLossPercent: number;
  bgpHopCount: number;
  tlsHandshakeMs: number;
  mtuBytes: number;
  status: 'OPTIMAL' | 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
  pingHistory: number[]; // Last 10 RTT samples
}

export interface ThreatHeatmapPoint {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  intensity: number; // 0.1 to 1.0
  radiusKm: number;
  attackCountPerSec: number;
  primaryThreat: string;
  topMalwareFamily: string;
  targetedSector: string;
  status: 'CRITICAL_OUTBREAK' | 'ELEVATED' | 'MONITORED';
}

export interface ThreatActorIntel {
  id: string;
  name: string;
  aliases: string[];
  originCountry: string;
  sponsor: string;
  motivation: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  activeCampaign: string;
  targetedSectors: string[];
  operationalNodes: string[]; // ThreatNodeData ids
  vectorIds: string[];
  firstObserved: string;
  lastBeaconIso: string;
  mitreTTPs: string[];
  cvesExploited: string[];
  liveIncidentSummary: string;
}

export interface ThreatNodeData {
  id: string;
  name: string;
  type: string;
  ip: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  status: 'C2_ORIGIN' | 'COMPROMISED' | 'VICTIM' | 'GATEWAY' | 'STORAGE';
  threatScore: number; // 0-100
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  asn: string;
  isp: string;
  reverseDns: string;
  beaconInterval?: string;
  exfiltrationRate?: string;
  detectedTTPs: string[];
  observedIocs: string[];
  attributionActor: string;
  latencyStats?: ThreatLatencyStats;
  position?: THREE.Vector3;
}

export interface AttackVectorFlow {
  id: string;
  name: string;
  protocol: string;
  port: number;
  sourceNodeId: string;
  targetNodeId: string;
  flowType: 'INFILTRATION' | 'LATERAL' | 'EXFILTRATION' | 'SATELLITE_DOWNLINK';
  bandwidth: string;
  packetsPerSec: number;
  payloadSignature: string;
  color: number;
  active: boolean;
  latencyStats: ThreatLatencyStats;
}

export interface DeepResearchIntel {
  threatActor: {
    name: string;
    alias: string;
    origin: string;
    motivation: string;
    targetSectors: string[];
    confidence: number;
    description: string;
  };
  campaign: {
    name: string;
    firstSeen: string;
    lastActive: string;
    killChainStage: string;
    status: string;
  };
  mitreTTPs: {
    id: string;
    tactic: string;
    technique: string;
    evidence: string;
  }[];
  cryptoIocs: {
    type: 'SHA256' | 'MD5' | 'JARM' | 'SSL_FINGERPRINT' | 'IP_BLOCK';
    value: string;
    label: string;
  }[];
  mitigationActions: {
    action: string;
    urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
    targetSystem: string;
  }[];
}
