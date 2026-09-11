import React, { useState } from 'react';
import { CyberPlatformProvider, useCyber } from './context/CyberPlatformContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { CommandCenter } from './components/command/CommandCenter';
import { InvestigationWorkbench } from './components/workbench/InvestigationWorkbench';
import { DfirModule } from './components/dfir/DfirModule';
import { AppSecModule } from './components/appsec/AppSecModule';
import { ThreatIntelModule } from './components/threat/ThreatIntelModule';
import { GovernanceModule } from './components/governance/GovernanceModule';
import { CopilotDrawer } from './components/copilot/CopilotDrawer';
import { EvidenceIngestModal } from './components/common/EvidenceIngestModal';
import { Shield, Radio, Cpu, Lock, CheckCircle2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentNav } = useCyber();
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);

  const renderActiveView = () => {
    switch (currentNav) {
      case 'command-center':
        return <CommandCenter />;
      case 'workbench':
        return <InvestigationWorkbench />;
      case 'dfir-endpoint':
      case 'dfir-memory':
      case 'dfir-mobile':
      case 'dfir-network':
      case 'dfir-cloud':
      case 'dfir-malware':
        return <DfirModule />;
      case 'appsec-web':
      case 'appsec-api':
      case 'appsec-mobile-masvs':
      case 'appsec-dynamic-lab':
      case 'appsec-sbom-cbom':
        return <AppSecModule />;
      case 'threat-actors':
      case 'threat-iocs':
      case 'threat-mitre':
      case 'detection-engineering':
        return <ThreatIntelModule />;
      case 'governance-chain-of-custody':
      case 'governance-cases':
      case 'governance-compliance':
      case 'governance-reports':
        return <GovernanceModule />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header onOpenIngestModal={() => setIsIngestModalOpen(true)} />

      {/* Main Body Area: Sidebar + Active View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Enterprise Status Bar */}
      <footer id="enterprise-status-bar" className="h-7 border-t border-slate-800 bg-slate-950/95 px-4 flex items-center justify-between text-[10px] font-mono text-slate-400 select-none z-20">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CLUSTER: US-EAST-DFIR-NODE-01</span>
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-400">POSTGRESQL ORM: AT REST (SYNCHRONIZED)</span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-cyan-400">FIPS 140-3 HSM: ONLINE</span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-400">LATENCY: 14ms</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">MALWAREX v4.8.0-ENTERPRISE</span>
        </div>
      </footer>

      {/* Slide-Over AI Copilot Drawer */}
      <CopilotDrawer />

      {/* Evidence Ingest Modal */}
      <EvidenceIngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CyberPlatformProvider>
      <MainContent />
    </CyberPlatformProvider>
  );
}
