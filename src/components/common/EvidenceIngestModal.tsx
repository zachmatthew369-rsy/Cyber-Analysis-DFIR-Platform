import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import { EvidenceItem } from '../../types/cyber';
import {
  X,
  Upload,
  Lock,
  FileCheck2,
  Cpu,
  Smartphone,
  Network,
  Cloud,
  Binary,
} from 'lucide-react';

export const EvidenceIngestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { addEvidence, currentUserRole } = useCyber();

  const [name, setName] = useState('android_ram_dump_0910.raw');
  const [domain, setDomain] = useState<'DFIR' | 'APPSEC' | 'THREAT_INTEL' | 'NETWORK' | 'IDENTITY'>('DFIR');
  const [source, setSource] = useState('Pixel 7 Pro (Device ID: 9918237)');
  const [acquisitionMethod, setAcquisitionMethod] = useState<'Live Agent Acquisition' | 'Disk Image (E01/RAW)' | 'Memory Dump (LiME/Crashdump)' | 'PCAP Ingestion' | 'Mobile APK/IPA Dump' | 'API Telemetry'>('Memory Dump (LiME/Crashdump)');
  const [fileSize, setFileSize] = useState('11.4 GB');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const randomSha256 = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const randomSha512 = Array.from({ length: 128 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const evidenceId = `EVD-${Math.floor(100 + Math.random() * 900)}`;

    const newEvidence: EvidenceItem = {
      id: evidenceId,
      caseId: 'CASE-2026-0819',
      name,
      domain,
      source,
      acquisitionDate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      acquisitionMethod,
      fileSize,
      sha256: randomSha256,
      sha512: randomSha512,
      originalPath: `/evidence/vault/${name}`,
      mimeType: 'application/octet-stream',
      collector: 'Lead DFIR Specialist',
      chainOfCustody: [
        {
          id: `COC-${Date.now().toString().slice(-4)}`,
          evidenceId: evidenceId,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          action: 'Forensic Ingestion & Genesis Seal',
          user: 'DFIR Specialist',
          role: currentUserRole,
          device: 'FORENSIC-WORKSTATION-01',
          sourceIp: '10.240.1.15',
          previousHash: 'GENESIS_BLOCK_ROOT_ZERO',
          newHash: randomSha256,
          digitalSignature: `SIG_ED25519_${Math.random().toString(36).substring(2, 12)}`,
          reason: 'Initial physical seizure and bit-stream verification',
        },
      ],
      status: 'Analyzing',
      findingsCount: 0,
      tags: ['Acquired Live', domain.toLowerCase(), 'Memory-Forensics'],
      metadata: { tool: 'LiME v1.9', os: 'Android 14', kernel: '6.1.75' },
      mitreTechniques: ['T1005: Data from Local System'],
    };

    addEvidence(newEvidence);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold font-mono text-white">Acquire & Ingest Forensic Artifact</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">Artifact Filename / Label</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Forensic Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="DFIR">DFIR Operations</option>
                <option value="APPSEC">Application Security</option>
                <option value="THREAT_INTEL">Threat Intelligence</option>
                <option value="NETWORK">Network / PCAP</option>
                <option value="IDENTITY">Cloud & Identity</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Estimated Size</label>
              <input
                type="text"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">Source Node / Asset Identifier</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">Acquisition Method</label>
            <select
              value={acquisitionMethod}
              onChange={(e) => setAcquisitionMethod(e.target.value as any)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Memory Dump (LiME/Crashdump)">Memory Dump (LiME/Crashdump)</option>
              <option value="Disk Image (E01/RAW)">Disk Image (E01/RAW)</option>
              <option value="Live Agent Acquisition">Live Agent Acquisition</option>
              <option value="PCAP Ingestion">PCAP Ingestion</option>
              <option value="Mobile APK/IPA Dump">Mobile APK/IPA Dump</option>
              <option value="API Telemetry">API Telemetry</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
            <span className="text-cyan-400 font-bold">Cryptographic Assurance:</span> A genesis SHA-256 and SHA-512
            hash will be computed automatically and signed using ED25519 in accordance with ISO/IEC 27037 standards.
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-4 py-2 font-bold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/20"
            >
              Verify & Seal Evidence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
