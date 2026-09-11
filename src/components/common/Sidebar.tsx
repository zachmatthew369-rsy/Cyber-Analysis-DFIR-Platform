import React, { useState } from 'react';
import { useCyber } from '../../context/CyberPlatformContext';
import { NavSection } from '../../types/cyber';
import {
  LayoutDashboard,
  Cpu,
  Smartphone,
  Network,
  Cloud,
  Bug,
  Globe,
  Radio,
  FileCode,
  ShieldAlert,
  Hash,
  Grid3X3,
  Terminal,
  Link2,
  Briefcase,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Flame,
  Binary,
  Atom,
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: {
    id: NavSection;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export const Sidebar: React.FC = () => {
  const { currentNav, setCurrentNav, activeCase } = useCyber();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups: NavGroup[] = [
    {
      label: 'COMMAND CENTER',
      items: [
        { id: 'command-center', label: 'SOC Command Center', icon: LayoutDashboard },
        { id: 'workbench', label: 'Investigation Workbench', icon: Layers, badge: 'Unified' },
      ],
    },
    {
      label: 'DFIR OPERATIONS',
      items: [
        { id: 'dfir-endpoint', label: 'Endpoint Forensics', icon: Cpu },
        { id: 'dfir-memory', label: 'Memory Analysis', icon: Binary, badge: 'RWX' },
        { id: 'dfir-mobile', label: 'Mobile Forensics', icon: Smartphone },
        { id: 'dfir-network', label: 'Network & PCAP', icon: Network },
        { id: 'dfir-cloud', label: 'Cloud & Identity', icon: Cloud },
        { id: 'dfir-malware', label: 'Malware Sandbox', icon: Bug },
      ],
    },
    {
      label: 'APPLICATION SECURITY',
      items: [
        { id: 'appsec-web', label: 'Web Security (OWASP)', icon: Globe },
        { id: 'appsec-api', label: 'API Security Engine', icon: Radio },
        { id: 'appsec-mobile-masvs', label: 'Mobile AppSec (MASVS)', icon: Smartphone, badge: 'MASTG' },
        { id: 'appsec-dynamic-lab', label: 'Dynamic Mobile Lab', icon: Flame, badge: 'Live' },
        { id: 'appsec-sbom-cbom', label: 'SBOM & Quantum CBOM', icon: Atom },
      ],
    },
    {
      label: 'THREAT INTEL & DETECTION',
      items: [
        { id: 'threat-actors', label: 'Threat Actors & Campaigns', icon: ShieldAlert },
        { id: 'threat-iocs', label: 'IOC Intelligence Graph', icon: Hash },
        { id: 'threat-mitre', label: 'MITRE ATT&CK Matrix', icon: Grid3X3 },
        { id: 'detection-engineering', label: 'Sigma / YARA Engine', icon: Terminal, badge: 'Rules' },
      ],
    },
    {
      label: 'GOVERNANCE & AUDIT',
      items: [
        { id: 'governance-chain-of-custody', label: 'Chain of Custody', icon: Link2, badge: 'Immutable' },
        { id: 'governance-cases', label: 'Case Management', icon: Briefcase },
        { id: 'governance-compliance', label: 'Compliance & ASVS', icon: FileCheck2 },
        { id: 'governance-reports', label: 'Defensible Reports', icon: FileSpreadsheet },
      ],
    },
  ];

  return (
    <aside
      id="malwarex-sidebar"
      className={`relative flex flex-col border-r border-slate-800 bg-slate-950/95 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } flex-shrink-0 select-none`}
    >
      {/* Active Case Mini Banner */}
      {!collapsed && (
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Incident Target</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/20 text-red-400">
              {activeCase.severity}
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-200 truncate">{activeCase.customer}</div>
          <div className="text-[11px] font-mono text-cyan-400 truncate">{activeCase.incidentId}</div>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <div className="px-2 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentNav === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setCurrentNav(item.id)}
                  title={item.label}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold shadow-sm border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-slate-800/80 flex items-center justify-between">
        <button
          id="toggle-sidebar-collapse"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition text-xs font-mono"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <span className="text-[11px]">◂ Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
};
