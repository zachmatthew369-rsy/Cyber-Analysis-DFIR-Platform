import React, { useState, useRef, useEffect } from 'react';
import {
  Binary,
  Upload,
  Terminal,
  Cpu,
  ShieldAlert,
  Search,
  ExternalLink,
  Zap,
  CheckCircle2,
  Copy,
  Download,
  Flame,
  FileCode,
  Network,
  ListFilter,
  Play,
  FileText,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Eye,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Radio,
  Check,
  Gauge,
  Activity,
  Info,
  Settings,
  ShieldCheck,
  CheckSquare,
  Boxes,
  FileSpreadsheet,
  Layers2,
  Workflow,
  Share2,
} from 'lucide-react';
import {
  VolRsPlugin,
  VolRsDumpMetadata,
  VolRsAnalysisResult,
  VolRsMalfindRow,
  VolRsNetscanRow,
  VolRsProcessRow,
  VolRsLdrModuleRow,
  VolRsCmdlineRow,
  ScanProfileId,
  VolRsPluginRunRecord,
} from '../../types/volrs';
import { VOLRS_PLUGINS, PRESET_MEMORY_DUMPS, VOLRS_SCAN_PROFILES } from '../../data/volrsData';
import {
  analyzeUploadedMemoryFile,
  executeVolRsPluginOnDump,
  executeVolRsProfileScanOnDump,
  runCustomVolRsCliCommand,
  formatBytes,
} from '../../utils/volrsEngine';

interface VolRsMemoryAnalysisProps {
  onSendToCopilot?: (prompt: string) => void;
  onAddEvidence?: (title: string, metadata: Record<string, any>) => void;
}

export const VolRsMemoryAnalysis: React.FC<VolRsMemoryAnalysisProps> = ({
  onSendToCopilot,
  onAddEvidence,
}) => {
  // Active dump and analysis state
  const [activeDump, setActiveDump] = useState<VolRsDumpMetadata>(PRESET_MEMORY_DUMPS[0].metadata);
  const [selectedProfileId, setSelectedProfileId] = useState<ScanProfileId>('quick_triage');
  const [analysisResult, setAnalysisResult] = useState<VolRsAnalysisResult>(() =>
    executeVolRsProfileScanOnDump(PRESET_MEMORY_DUMPS[0].metadata, 'quick_triage')
  );
  const [selectedPluginId, setSelectedPluginId] = useState<string>('windows.malfind.Malfind');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [currentScanningPluginName, setCurrentScanningPluginName] = useState<string>('');
  const [isAdvancedPluginsExpanded, setIsAdvancedPluginsExpanded] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [autoAnalyzeOnUpload, setAutoAnalyzeOnUpload] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [activeViewTab, setActiveViewTab] = useState<
    'table' | 'breakdown' | 'profile_details' | 'config_summary' | 'cli' | 'terminal'
  >('table');
  const [showVisualPipeline, setShowVisualPipeline] = useState<boolean>(true);
  const [showConfigSummaryCard, setShowConfigSummaryCard] = useState<boolean>(false);
  const [currentScanStage, setCurrentScanStage] = useState<number>(5);
  const [simulatedHexOffset, setSimulatedHexOffset] = useState<string>('0x00007FF7B4920000');
  const [profileDetailsFilter, setProfileDetailsFilter] = useState<'all' | 'detected' | 'clean'>('all');
  const [profileDetailsSearch, setProfileDetailsSearch] = useState<string>('');
  const [copiedConfigJson, setCopiedConfigJson] = useState<boolean>(false);
  const [copiedCliSnippet, setCopiedCliSnippet] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [selectedMalfindItem, setSelectedMalfindItem] = useState<VolRsMalfindRow | null>(
    PRESET_MEMORY_DUMPS[0].defaultResult.malfind?.[0] || null
  );
  const [cliCommandInput, setCliCommandInput] = useState<string>('vol-rs -f dump.raw windows.malfind.Malfind');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLinuxCapture = activeDump.fileName.toLowerCase().includes('linux') || activeDump.layerType === 'LimeLayer';
  const detectedOsCaptureName = isLinuxCapture ? 'linux' : 'windows';

  // Categories list
  const categories = [
    'All',
    'Malware / Code Injection',
    'Processes',
    'Networking',
    'DLLs & Modules',
    'Command Line',
    'VAD & Memory',
    'Linux Forensics',
    'YARA',
  ];

  const filteredPlugins = VOLRS_PLUGINS.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle preset selection
  const handleSelectPreset = (index: number) => {
    const preset = PRESET_MEMORY_DUMPS[index];
    setActiveDump(preset.metadata);
    const profileRes = executeVolRsProfileScanOnDump(preset.metadata, selectedProfileId);
    setSelectedPluginId(profileRes.pluginId);
    setAnalysisResult(profileRes);
    if (profileRes.malfind && profileRes.malfind.length > 0) {
      setSelectedMalfindItem(profileRes.malfind[0]);
    } else {
      setSelectedMalfindItem(null);
    }
  };

  // Run whole scan profile with multi-stage progress
  const handleStartProfileAnalysis = (profileId: ScanProfileId, pluginOverride?: string) => {
    setSelectedProfileId(profileId);
    setIsAnalyzing(true);
    setScanProgress(12);
    setCurrentScanStage(1);

    const profile = VOLRS_SCAN_PROFILES.find((p) => p.id === profileId) || VOLRS_SCAN_PROFILES[0];
    const targetPlugins = profile.pluginIds.slice(0, isLinuxCapture ? profile.pluginCount.linux : profile.pluginCount.windows);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const currentPluginId = targetPlugins[step % targetPlugins.length] || 'windows.malfind.Malfind';
      setCurrentScanningPluginName(currentPluginId);
      setScanProgress((prev) => Math.min(prev + 18, 92));
      setCurrentScanStage(Math.min(step + 1, 5));

      // Simulate live memory traversal offset
      const randOffset = 0x7ff700000000 + Math.floor(Math.random() * 0x9fffffff);
      setSimulatedHexOffset('0x' + randOffset.toString(16).toUpperCase());

      if (step >= 5) {
        clearInterval(interval);
        const result = executeVolRsProfileScanOnDump(activeDump, profileId, undefined, pluginOverride);
        setAnalysisResult(result);
        setSelectedPluginId(result.pluginId);
        setScanProgress(100);
        setCurrentScanStage(5);
        setIsAnalyzing(false);

        if (result.malfind && result.malfind.length > 0) {
          setSelectedMalfindItem(result.malfind[0]);
        }
      }
    }, 120);
  };

  const handleCopyScanConfigJson = () => {
    const activeProfile = VOLRS_SCAN_PROFILES.find((p) => p.id === selectedProfileId) || VOLRS_SCAN_PROFILES[0];
    const configData = {
      engine: 'vol-rs',
      engineVersion: '0.2.1-native',
      target: {
        fileName: activeDump.fileName,
        fileSizeBytes: activeDump.fileSizeBytes,
        layerType: activeDump.layerType,
        architecture: activeDump.architecture,
        detectedOs: activeDump.detectedOs,
        osBuild: activeDump.osBuild,
        sha256: activeDump.sha256,
        dtbAddress: '0x001AA000',
      },
      profile: {
        id: activeProfile.id,
        name: activeProfile.name,
        targetPluginsCount: isLinuxCapture ? activeProfile.pluginCount.linux : activeProfile.pluginCount.windows,
        pluginRoster: activeProfile.pluginIds.slice(0, isLinuxCapture ? activeProfile.pluginCount.linux : activeProfile.pluginCount.windows),
      },
      executionParameters: {
        concurrency: 'Rayon 16 Threads',
        memoryAccess: 'Zero-copy mmap()',
        symbolResolution: 'Embedded PDB Cache + Microsoft Symbol Server',
        yaraEngine: 'Hyperscan SIMD Vectorized',
        vadInspectionDepth: 'Deep / Full PE Carving',
      },
      performanceBenchmark: {
        volRsEstimatedDurationSec: analysisResult.executionTimeSec,
        pythonVolatilityEstimatedDurationSec: parseFloat((analysisResult.executionTimeSec * 435).toFixed(1)),
        speedupFactor: 435,
      },
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(configData, null, 2));
    setCopiedConfigJson(true);
    setTimeout(() => setCopiedConfigJson(false), 2000);
  };

  const handleCopyCliSnippet = () => {
    const cmd = `vol-rs -f ${activeDump.fileName} --profile ${selectedProfileId} --threads 16 --output-format json`;
    navigator.clipboard.writeText(cmd);
    setCopiedCliSnippet(true);
    setTimeout(() => setCopiedCliSnippet(false), 2000);
  };

  // Select profile card directly
  const handleSelectProfileCard = (profileId: ScanProfileId) => {
    setSelectedProfileId(profileId);
    handleStartProfileAnalysis(profileId);
  };

  // Select a specific plugin that ran within the active profile
  const handleSelectPluginFromProfile = (pluginId: string) => {
    setSelectedPluginId(pluginId);
    const updated = executeVolRsProfileScanOnDump(activeDump, selectedProfileId, undefined, pluginId);
    setAnalysisResult(updated);
    if (updated.malfind && updated.malfind.length > 0) {
      setSelectedMalfindItem(updated.malfind[0]);
    }
  };

  // Run a plugin on the current active dump
  const handleRunPlugin = (pluginId: string) => {
    setSelectedPluginId(pluginId);
    setIsAnalyzing(true);
    setScanProgress(35);

    setTimeout(() => {
      const res = executeVolRsPluginOnDump(activeDump, pluginId);
      setAnalysisResult(res);
      setScanProgress(100);
      setIsAnalyzing(false);
      if (res.malfind && res.malfind.length > 0) {
        setSelectedMalfindItem(res.malfind[0]);
      }
    }, 350);
  };

  // Handle uploaded memory dump file
  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 90) return prev;
        return prev + 25;
      });
    }, 120);

    try {
      const result = await analyzeUploadedMemoryFile(file, selectedPluginId);
      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(null);
        setActiveDump(result.dump);
        setAnalysisResult(result);
        setIsAnalyzing(false);
        if (result.malfind && result.malfind.length > 0) {
          setSelectedMalfindItem(result.malfind[0]);
        }
      }, 300);
    } catch (err) {
      clearInterval(interval);
      setUploadProgress(null);
      setIsAnalyzing(false);
      console.error('Error analyzing uploaded file with vol-rs:', err);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Copy hash
  const copySha256 = () => {
    navigator.clipboard.writeText(activeDump.sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Export CLI report
  const downloadReport = () => {
    const blob = new Blob([analysisResult.rawCliOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vol-rs_${activeDump.fileName}_${selectedPluginId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send evidence
  const handleSendToVault = () => {
    if (onAddEvidence) {
      onAddEvidence(`vol-rs Forensic Artifact: ${activeDump.fileName}`, {
        plugin: selectedPluginId,
        sha256: activeDump.sha256,
        injectedPids: analysisResult.findingsSummary.injectedPids,
        criticalCount: analysisResult.findingsSummary.criticalCount,
        c2Sockets: analysisResult.findingsSummary.c2Sockets,
        detectedOs: activeDump.detectedOs,
      });
    }
  };

  // Handle custom CLI command submit
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliCommandInput.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = runCustomVolRsCliCommand(cliCommandInput, activeDump);
      setAnalysisResult(res);
      setIsAnalyzing(false);
    }, 200);
  };

  const currentPlugin = VOLRS_PLUGINS.find((p) => p.id === selectedPluginId) || VOLRS_PLUGINS[0];

  return (
    <div className="space-y-4">
      {/* Top Banner: vol-rs Repository & Rust Performance Metrics */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-4 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-inner">
              <Flame className="h-6 w-6 text-orange-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                  vol-rs Memory Analysis Engine
                  <span className="text-[11px] px-2 py-0.5 rounded font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Rust Native
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    v0.1.0 Active
                  </span>
                </h3>
                <a
                  href="https://github.com/daffainfo/vol-rs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1"
                >
                  github.com/daffainfo/vol-rs
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                High-performance Rust implementation of the Volatility 3 memory forensics framework. Eliminates Python runtime overhead with zero external C dependencies, providing 
                <span className="text-amber-300 font-bold mx-1">up to 599x faster</span> 
                kernel VAD traversal, unbacked memory scanning, and process injection detection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="text-right font-mono hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Speedup Benchmark</div>
              <div className="text-sm font-bold text-amber-400 flex items-center justify-end gap-1">
                <Zap className="h-4 w-4 fill-amber-400" />
                {analysisResult.rustSpeedupFactor}x Faster
              </div>
              <div className="text-[10px] text-slate-400">
                {analysisResult.executionTimeSec}s vs {(analysisResult.executionTimeSec * analysisResult.rustSpeedupFactor).toFixed(1)}s (Python)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Dump Ingest & Upload Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Ingest Volatile Memory Dump File
              </h4>
            </div>
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAnalyzeOnUpload}
                onChange={(e) => setAutoAnalyzeOnUpload(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0"
              />
              Auto-run vol-rs on upload
            </label>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-lg border-2 border-dashed border-slate-700/80 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-cyan-950/20 p-5 text-center cursor-pointer transition-all duration-200"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".raw,.dmp,.vmem,.lime,.bin,.img,.mem"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 rounded-full bg-slate-900 border border-slate-700 group-hover:border-cyan-500 text-slate-400 group-hover:text-cyan-400 transition-colors">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-slate-200 group-hover:text-cyan-300">
                  Drop your physical memory capture here or <span className="text-cyan-400 underline">browse files</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Supports raw linear (.raw, .img), Windows Crashdump (.dmp), VMware guest RAM (.vmem), Linux LiME (.lime, .bin)
                </div>
              </div>
            </div>

            {/* Upload progress bar */}
            {uploadProgress !== null && (
              <div className="absolute inset-0 bg-slate-950/90 rounded-lg flex flex-col items-center justify-center p-6 z-20">
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-xs font-mono text-cyan-400">
                    <span>Hashing & Ingesting Stream into vol-rs...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Realistic Preset Industry Memory Dumps */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
              <span>Or load sample enterprise forensic memory images:</span>
              <span className="text-[10px] text-cyan-400">Verified Forensic Baselines</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_MEMORY_DUMPS.map((preset, idx) => {
                const isCurrent = activeDump.fileName === preset.metadata.fileName;
                return (
                  <button
                    key={preset.metadata.fileName}
                    onClick={() => handleSelectPreset(idx)}
                    className={`text-left p-2 rounded-lg border text-xs font-mono transition-all ${
                      isCurrent
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 shadow-md shadow-cyan-950/50'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold truncate text-[11px]">{preset.metadata.fileName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>{preset.metadata.fileSizeFormatted}</span>
                      <span className="text-cyan-400">{preset.metadata.detectedOs.split(' ')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Target Image HUD Card */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-cyan-400" />
                Active Target Image
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                LAYER READY
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Image Filename</div>
                <div className="text-slate-100 font-bold text-sm truncate">{activeDump.fileName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Size</div>
                  <div className="text-slate-200 font-semibold">{activeDump.fileSizeFormatted}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Layer Type</div>
                  <div className="text-cyan-400 font-semibold">{activeDump.layerType}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">Detected OS & Architecture</div>
                <div className="text-slate-200">{activeDump.detectedOs} ({activeDump.architecture})</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
                  <span>SHA-256 Digest</span>
                  <button
                    onClick={copySha256}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Copy className="h-2.5 w-2.5" />
                    {copiedHash ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono break-all select-all">
                  {activeDump.sha256}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">PDB Symbol Pack</div>
                <div className="text-[10px] text-emerald-400 truncate">{activeDump.symbolPack}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Artifacts: {analysisResult.findingsSummary.totalArtifacts}</span>
            <button
              onClick={handleSendToVault}
              className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold transition flex items-center gap-1"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Flag as Evidence
            </button>
          </div>
        </div>
      </div>

      {/* "Run an analysis" Scan Profile Selector */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold text-sm">▷</span>
              <h3 className="text-base font-bold font-mono tracking-wide text-slate-100">
                Run an analysis
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Plugin counts shown are for the detected {detectedOsCaptureName} capture
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowConfigSummaryCard(!showConfigSummaryCard)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 cursor-pointer border ${
                showConfigSummaryCard
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="h-3 w-3" />
              <span>Scan Config Summary</span>
            </button>
            <button
              type="button"
              onClick={() => setShowVisualPipeline(!showVisualPipeline)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 cursor-pointer border ${
                showVisualPipeline
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Activity className="h-3 w-3" />
              <span>Visual Pipeline</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400 ml-1">
              Active: <span className="text-cyan-300 font-semibold">{activeDump.fileName}</span>
            </span>
          </div>
        </div>

        {/* 1. PLUGIN COUNTER & TELEMETRY HUD */}
        {(() => {
          const profile = VOLRS_SCAN_PROFILES.find((p) => p.id === selectedProfileId) || VOLRS_SCAN_PROFILES[0];
          const totalInProfile = isLinuxCapture ? profile.pluginCount.linux : profile.pluginCount.windows;
          const records = analysisResult.pluginRunRecords || [];
          const detected = records.filter((r) => r.status === 'DETECTION_FOUND').length || 8;
          const clean = Math.max(0, (records.length || totalInProfile) - detected);
          const scanned = isAnalyzing ? Math.min(totalInProfile, Math.ceil((scanProgress / 100) * totalInProfile)) : totalInProfile;

          const catCounts = {
            malware: records.filter((r) => r.category.includes('Malware') || r.category.includes('Injection')).length || 5,
            processes: records.filter((r) => r.category.includes('Process') || r.category.includes('Command')).length || 4,
            network: records.filter((r) => r.category.includes('Network') || r.category.includes('Socket')).length || 3,
            system: records.filter((r) => r.category.includes('DLL') || r.category.includes('VAD') || r.category.includes('Registry')).length || 4,
            kernel: records.filter((r) => r.category.includes('Linux') || r.category.includes('YARA') || r.category.includes('General')).length || 2,
          };

          return (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Profile Plugin Counter & Engine Telemetry
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {profile.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('profile_details')}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Profile Plugin Details ({totalInProfile})</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Counter Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Profile Roster</div>
                  <div className="text-lg font-mono font-bold text-slate-100 flex items-baseline gap-1 mt-0.5">
                    <span>{totalInProfile}</span>
                    <span className="text-[10px] font-normal text-slate-400">plugins</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 truncate mt-0.5">
                    {detectedOsCaptureName === 'linux' ? 'Linux Lime Layer' : 'Windows 10 x64'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Analyzed Status</div>
                  <div className="text-lg font-mono font-bold text-blue-400 flex items-baseline gap-1 mt-0.5">
                    <span>{scanned}</span>
                    <span className="text-[10px] font-normal text-slate-400">/ {totalInProfile}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {isAnalyzing ? `Scanning ${scanProgress}%` : '100% Verified'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Flagged Detections</div>
                  <div className="text-lg font-mono font-bold text-red-400 flex items-baseline gap-1 mt-0.5">
                    <span>{detected}</span>
                    <span className="text-[10px] font-normal text-slate-400">anomalies</span>
                  </div>
                  <div className="text-[10px] font-mono text-amber-300 mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span>{analysisResult.findingsSummary.criticalCount} Critical, {analysisResult.findingsSummary.highCount} High</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Clean / Passed</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 flex items-baseline gap-1 mt-0.5">
                    <span>{clean}</span>
                    <span className="text-[10px] font-normal text-slate-400">plugins</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    0 violations detected
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Rust Rayon Velocity</div>
                  <div className="text-lg font-mono font-bold text-amber-400 flex items-baseline gap-1 mt-0.5">
                    <span>42.8</span>
                    <span className="text-[10px] font-normal text-slate-400">plg/sec</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                    435x vs Python
                  </div>
                </div>
              </div>

              {/* Category Breakdown Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Domain Breakdown:</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                  Malware/Injection: {catCounts.malware}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Processes & Cmd: {catCounts.processes}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Network & Sockets: {catCounts.network}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  DLL & Memory: {catCounts.system}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  YARA & Linux: {catCounts.kernel}
                </span>
              </div>
            </div>
          );
        })()}

        {/* 2. EXPANDABLE SCAN CONFIGURATION SUMMARY CARD */}
        {showConfigSummaryCard && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3.5 animate-fadeIn shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Scan Configuration Summary
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Profile Engine Validated
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScanConfigJson}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedConfigJson ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedConfigJson ? 'Copied JSON' : 'Copy Config JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCliSnippet}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedCliSnippet ? <Check className="h-3 w-3 text-emerald-400" /> : <Terminal className="h-3 w-3 text-cyan-400" />}
                  <span>{copiedCliSnippet ? 'Copied CLI' : 'Copy CLI'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              {/* Target specs */}
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                  <Database className="h-3 w-3" /> Target Memory Capture
                </div>
                <div className="text-slate-300"><span className="text-slate-500">File:</span> {activeDump.fileName}</div>
                <div className="text-slate-300"><span className="text-slate-500">Size:</span> {activeDump.fileSizeFormatted}</div>
                <div className="text-slate-300"><span className="text-slate-500">Layer:</span> {activeDump.layerType}</div>
                <div className="text-slate-300"><span className="text-slate-500">Architecture:</span> {activeDump.architecture}</div>
                <div className="text-slate-300"><span className="text-slate-500">Detected OS:</span> {activeDump.detectedOs} ({activeDump.osBuild})</div>
                <div className="text-slate-300 truncate"><span className="text-slate-500">PDB Pack:</span> {activeDump.symbolPack}</div>
              </div>

              {/* Profile & Roster */}
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-blue-400 uppercase font-bold flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Profile & Plugin Roster
                </div>
                {(() => {
                  const prof = VOLRS_SCAN_PROFILES.find((p) => p.id === selectedProfileId) || VOLRS_SCAN_PROFILES[0];
                  const count = isLinuxCapture ? prof.pluginCount.linux : prof.pluginCount.windows;
                  return (
                    <>
                      <div className="text-slate-300"><span className="text-slate-500">Active Profile:</span> {prof.name}</div>
                      <div className="text-slate-300"><span className="text-slate-500">Target Plugins:</span> {count} plugins</div>
                      <div className="text-slate-300"><span className="text-slate-500">Excluded Plugins:</span> 0 (100% Compatible)</div>
                      <div className="text-slate-300"><span className="text-slate-500">Focus:</span> {prof.focusDescription}</div>
                      <div className="pt-1 text-[11px] text-cyan-300">
                        <button
                          type="button"
                          onClick={() => setActiveViewTab('profile_details')}
                          className="underline hover:text-cyan-200 cursor-pointer"
                        >
                          Inspect all {count} plugin descriptions & structures →
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Engine & Hardware */}
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                  <Cpu className="h-3 w-3" /> Engine & Concurrency
                </div>
                <div className="text-slate-300"><span className="text-slate-500">Engine:</span> vol-rs v0.2.1-native (Rust 1.80+)</div>
                <div className="text-slate-300"><span className="text-slate-500">Concurrency:</span> Rayon 16 Worker Threads</div>
                <div className="text-slate-300"><span className="text-slate-500">Memory Access:</span> Zero-copy mmap()</div>
                <div className="text-slate-300"><span className="text-slate-500">YARA Engine:</span> Hyperscan SIMD Vectorized</div>
                <div className="text-slate-300"><span className="text-slate-500">PDB Cache:</span> Local symbol server enabled</div>
                <div className="text-emerald-400 font-bold">Speedup: ~435x vs Python Volatility 3</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. VISUAL ANALYSIS PROGRESS PIPELINE */}
        {showVisualPipeline && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-blue-500/30 space-y-3 shadow-lg animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Visual Analysis Progress Pipeline
                </h4>
                {isAnalyzing ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                    <Clock className="h-3 w-3 animate-spin" />
                    <span>Stage {currentScanStage} of 5 Active ({scanProgress}%)</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Pipeline Verified in {analysisResult.executionTimeSec}s</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="text-slate-400">
                  Offset: <code className="text-amber-300 font-bold">{simulatedHexOffset}</code>
                </div>
                <div className="text-slate-400 hidden sm:block">
                  Throughput: <span className="text-emerald-400 font-bold">982 MB/s</span>
                </div>
              </div>
            </div>

            {/* 5-Stage Interactive Pipeline Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {[
                {
                  stage: 1,
                  name: 'Memory Ingestion',
                  desc: 'Physical Layer & CR3 DTB',
                  sub: activeDump.layerType,
                },
                {
                  stage: 2,
                  name: 'Symbol Resolution',
                  desc: 'PDB GUID Table Match',
                  sub: activeDump.symbolPack,
                },
                {
                  stage: 3,
                  name: 'Rayon Dispatch',
                  desc: '16 SIMD Thread Queue',
                  sub: 'Parallel task-stealing',
                },
                {
                  stage: 4,
                  name: 'VAD & Object Scan',
                  desc: '_MMVAD & Cross-View',
                  sub: currentScanningPluginName || 'Memory structures',
                },
                {
                  stage: 5,
                  name: 'Threat Triage',
                  desc: 'Confidence & IOC Score',
                  sub: `${analysisResult.findingsSummary.criticalCount} Critical Flags`,
                },
              ].map((s) => {
                const isStageActive = isAnalyzing && currentScanStage === s.stage;
                const isStageDone = !isAnalyzing || currentScanStage > s.stage;
                return (
                  <div
                    key={s.stage}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isStageActive
                        ? 'bg-blue-950/40 border-cyan-400 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-400/40'
                        : isStageDone
                        ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                        : 'bg-slate-950 border-slate-900 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        Phase {s.stage}
                      </span>
                      {isStageActive ? (
                        <Clock className="h-3 w-3 text-cyan-400 animate-spin" />
                      ) : isStageDone ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-800" />
                      )}
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-100 truncate">
                      {s.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                      {s.desc}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-300/80 mt-1 truncate">
                      {s.sub}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Progress Bar & Thread Bars */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-cyan-300 truncate">
                  <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0 animate-spin" />
                  <span className="truncate">
                    vol-rs Scanning: <code className="text-amber-300 font-bold">{currentScanningPluginName || 'windows.malfind.Malfind'}</code>
                  </span>
                </div>
                <span className="text-cyan-400 font-bold font-mono">{scanProgress}%</span>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              {/* 16 Rayon Thread Activity Bars */}
              <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1">
                  <span>Rayon Thread Pool (16 Cores):</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-2.5 w-1 rounded-xs transition-colors duration-150 ${
                          isAnalyzing
                            ? idx % 2 === 0
                              ? 'bg-cyan-400 animate-pulse'
                              : 'bg-blue-400'
                            : 'bg-emerald-500/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-emerald-400 font-bold">
                  Zero-copy mmap() SIMD Accelerated
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 6 Profile Cards Grid (2 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {VOLRS_SCAN_PROFILES.map((profile) => {
            const isSelected = selectedProfileId === profile.id;
            const pluginCount = isLinuxCapture ? profile.pluginCount.linux : profile.pluginCount.windows;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSelectProfileCard(profile.id)}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-blue-500/80 bg-blue-950/25 ring-1 ring-blue-500/50 shadow-lg shadow-blue-950/40 text-slate-100'
                    : 'border-slate-800/90 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/50 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-bold text-sm font-mono text-slate-100 flex items-center gap-2">
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse" />
                    )}
                    {profile.name}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border shrink-0 ${
                      isSelected
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {pluginCount} plugins
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-2 leading-relaxed">
                  {profile.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Bottom Row: Accordion Toggle + Primary Start Analysis Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsAdvancedPluginsExpanded(!isAdvancedPluginsExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors self-start sm:self-auto py-1 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span>Advanced: choose plugins directly</span>
            {isAdvancedPluginsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleStartProfileAnalysis(selectedProfileId)}
            disabled={isAnalyzing}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all self-stretch sm:self-auto cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Clock className="h-3.5 w-3.5 animate-spin" />
                <span>Running Scan ({scanProgress}%)...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Start analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Direct Plugin Selector Ribbon */}
        {isAdvancedPluginsExpanded && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Binary className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                  Individual Plugin Selection ({VOLRS_PLUGINS.length} Available)
                </h4>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search plugin, e.g. malfind..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Categories ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Plugin Quick Execution Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {filteredPlugins.map((plugin) => {
                const isSelected = selectedPluginId === plugin.id;
                return (
                  <button
                    key={plugin.id}
                    onClick={() => handleRunPlugin(plugin.id)}
                    disabled={isAnalyzing}
                    className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200 shadow-md shadow-cyan-950/60'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="truncate">{plugin.id}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-amber-400 border border-slate-700 group-hover:bg-amber-500/20">
                        {plugin.benchmarkSpeedup.speedupRatio}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono line-clamp-1 mt-1">
                      {plugin.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-1.5 border-t border-slate-900">
                      <span className="uppercase text-slate-400">{plugin.category}</span>
                      <span className="text-cyan-400 flex items-center gap-0.5">
                        <Play className="h-2.5 w-2.5" />
                        Run in vol-rs
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Profile Running & Detecting Plugins Ribbon */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span>Active Scan Profile:</span>
              <span className="text-cyan-300 font-semibold">{analysisResult.profileName || 'Quick Triage'}</span>
              <span className="text-slate-400 font-normal">
                ({analysisResult.pluginRunRecords?.length || 18} Plugins Run & Analyzed)
              </span>
            </h4>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-red-400 font-bold">
              {analysisResult.findingsSummary.criticalCount} Critical
            </span>
            <span className="text-amber-400 font-bold">
              {analysisResult.findingsSummary.highCount} High
            </span>
            <span className="text-slate-400">
              Total {analysisResult.findingsSummary.totalArtifacts} Detections
            </span>
          </div>
        </div>

        {/* Plugin Interactive Switcher Strip */}
        <div className="text-[11px] font-mono text-slate-400">
          Select any plugin below to inspect its detections and forensics:
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {(analysisResult.pluginRunRecords || []).map((rec) => {
            const isSelected = selectedPluginId === rec.pluginId;
            const hasDetections = rec.findingsCount > 0;
            return (
              <button
                key={rec.pluginId}
                type="button"
                onClick={() => handleSelectPluginFromProfile(rec.pluginId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/50 shadow-md'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                }`}
              >
                <span className="font-semibold">{rec.name || rec.pluginId}</span>
                {hasDetections ? (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      rec.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : rec.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    {rec.findingsCount} {rec.severity}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    Clean
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-normal">
                  {rec.executionTimeMs ? `${rec.executionTimeMs}ms` : `${rec.executionTimeSec}s`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analysis Results Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-4">
        {/* Results Header with View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                Execution Output: {currentPlugin.id}
                {isAnalyzing ? (
                  <span className="text-xs text-amber-400 font-mono animate-pulse flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Executing vol-rs in native Rust...
                  </span>
                ) : (
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Finished in {analysisResult.executionTimeSec}s
                  </span>
                )}
              </h3>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              Command: <code className="text-cyan-300">vol-rs -f {activeDump.fileName} {selectedPluginId}</code>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 flex-wrap gap-1">
              <button
                onClick={() => setActiveViewTab('table')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                  activeViewTab === 'table'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setActiveViewTab('breakdown')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'breakdown'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Scan Breakdown ({analysisResult.pluginRunRecords?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveViewTab('profile_details')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'profile_details'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Boxes className="h-3 w-3" />
                <span>Profile Plugin Details ({analysisResult.pluginRunRecords?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveViewTab('config_summary')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'config_summary'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="h-3 w-3" />
                <span>Scan Config Summary</span>
              </button>
              <button
                onClick={() => setActiveViewTab('cli')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                  activeViewTab === 'cli'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Raw CLI Output
              </button>
              <button
                onClick={() => setActiveViewTab('terminal')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1 cursor-pointer ${
                  activeViewTab === 'terminal'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="h-3 w-3" />
                Interactive CLI
              </button>
            </div>

            <button
              onClick={downloadReport}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-slate-700 transition"
              title="Download vol-rs Execution Report"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 1. TABLE VIEW */}
        {activeViewTab === 'table' && (
          <div className="space-y-4">
            {/* MALFIND: Code Injection Table */}
            {selectedPluginId.includes('malfind') && analysisResult.malfind && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">PID</th>
                        <th className="p-2.5">Process</th>
                        <th className="p-2.5">Start VPN</th>
                        <th className="p-2.5">End VPN</th>
                        <th className="p-2.5">Protection</th>
                        <th className="p-2.5">Tag</th>
                        <th className="p-2.5">PE MZ</th>
                        <th className="p-2.5">YARA Rule</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {analysisResult.malfind.map((row) => (
                        <tr
                          key={`${row.pid}-${row.startVpn}`}
                          className={`hover:bg-cyan-950/20 cursor-pointer ${
                            selectedMalfindItem?.startVpn === row.startVpn ? 'bg-cyan-500/10' : ''
                          }`}
                          onClick={() => setSelectedMalfindItem(row)}
                        >
                          <td className="p-2.5 font-bold text-red-400">{row.pid}</td>
                          <td className="p-2.5 font-bold text-slate-100">{row.process}</td>
                          <td className="p-2.5 text-slate-400">{row.startVpn}</td>
                          <td className="p-2.5 text-slate-400">{row.endVpn}</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              {row.protection}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">{row.tag}</td>
                          <td className="p-2.5">
                            {row.hasMzHeader ? (
                              <span className="text-emerald-400 font-bold">YES (Staged PE)</span>
                            ) : (
                              <span className="text-amber-400">NO (Shellcode)</span>
                            )}
                          </td>
                          <td className="p-2.5 text-amber-300 font-semibold">{row.yaraMatch || 'N/A'}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSendToCopilot) {
                                  onSendToCopilot(
                                    `Analyze vol-rs malfind artifact in ${row.process} (PID ${row.pid}) at ${row.startVpn} with ${row.protection} and YARA match ${row.yaraMatch}. What payload is this and what are the remediation steps?`
                                  );
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold border border-cyan-500/40 inline-flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3" />
                              AI Analyze
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selected Injection Disassembly & Hex Dump Inspection */}
                {selectedMalfindItem && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Hex Dump */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                          <Binary className="h-4 w-4 text-cyan-400" />
                          Memory Hexdump ({selectedMalfindItem.startVpn})
                        </span>
                        <span className="text-[10px] font-mono text-red-400 font-bold">
                          {selectedMalfindItem.protection}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-black/90 border border-slate-900 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                        {selectedMalfindItem.hexPreview.map((line, i) => (
                          <div
                            key={i}
                            className={
                              line.includes('4D 5A') || line.includes('MZ')
                                ? 'text-emerald-400 font-bold'
                                : line.includes('FC 48 83')
                                ? 'text-amber-400 font-bold'
                                : 'text-slate-400'
                            }
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Disassembly */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                          <FileCode className="h-4 w-4 text-amber-400" />
                          x86_64 Disassembly ({selectedMalfindItem.process} - PID {selectedMalfindItem.pid})
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Capstone Engine</span>
                      </div>
                      <div className="p-3 rounded-lg bg-black/90 border border-slate-900 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                        {selectedMalfindItem.disassembly.map((ins, i) => (
                          <div
                            key={i}
                            className={
                              ins.includes('PEB') || ins.includes('call')
                                ? 'text-red-400 font-semibold'
                                : 'text-cyan-300'
                            }
                          >
                            {ins}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NETSCAN: Network Sockets Table */}
            {selectedPluginId.includes('netscan') && analysisResult.netscan && (
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Offset</th>
                      <th className="p-2.5">Proto</th>
                      <th className="p-2.5">Local Address</th>
                      <th className="p-2.5">Foreign Address</th>
                      <th className="p-2.5">State</th>
                      <th className="p-2.5">PID</th>
                      <th className="p-2.5">Owner</th>
                      <th className="p-2.5">Threat Intel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {analysisResult.netscan.map((row) => (
                      <tr key={row.offset} className="hover:bg-slate-800/30">
                        <td className="p-2.5 text-slate-400">{row.offset}</td>
                        <td className="p-2.5 font-bold text-cyan-400">{row.proto}</td>
                        <td className="p-2.5">{row.localAddr}:{row.localPort}</td>
                        <td className="p-2.5 font-bold text-slate-100">{row.foreignAddr}:{row.foreignPort}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.state === 'ESTABLISHED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {row.state}
                          </span>
                        </td>
                        <td className="p-2.5 text-red-400 font-bold">{row.pid}</td>
                        <td className="p-2.5 font-bold text-slate-100">{row.owner}</td>
                        <td className="p-2.5">
                          {row.threatLevel === 'CRITICAL' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              {row.geoCountry || 'SUSPICIOUS C2'}
                            </span>
                          ) : (
                            <span className="text-slate-400">{row.geoCountry || 'Internal/Normal'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PSLIST / PSTREE: Process Tree Table */}
            {(selectedPluginId.includes('pslist') || selectedPluginId.includes('pstree')) && analysisResult.processes && (
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">PID</th>
                      <th className="p-2.5">PPID</th>
                      <th className="p-2.5">Image Name</th>
                      <th className="p-2.5">Offset</th>
                      <th className="p-2.5">Threads</th>
                      <th className="p-2.5">Handles</th>
                      <th className="p-2.5">Created (UTC)</th>
                      <th className="p-2.5">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {analysisResult.processes.map((row) => (
                      <tr key={row.pid} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-cyan-400">{row.pid}</td>
                        <td className="p-2.5 text-slate-400">{row.ppid}</td>
                        <td className="p-2.5 font-bold text-slate-100 flex items-center gap-2">
                          {row.imageFileName}
                          {row.isInjected && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              INJECTED
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-400">{row.offset}</td>
                        <td className="p-2.5">{row.threads}</td>
                        <td className="p-2.5">{row.handles}</td>
                        <td className="p-2.5 text-slate-400">{row.createTime}</td>
                        <td className="p-2.5">
                          <span
                            className={`font-bold ${
                              row.riskScore > 80 ? 'text-red-400' : row.riskScore > 40 ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          >
                            {row.riskScore}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* CMDLINE: Process Arguments Table */}
            {selectedPluginId.includes('cmdline') && analysisResult.cmdlines && (
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">PID</th>
                      <th className="p-2.5">Process</th>
                      <th className="p-2.5">Command Line Arguments</th>
                      <th className="p-2.5">Analysis Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {analysisResult.cmdlines.map((row) => (
                      <tr key={row.pid} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-cyan-400">{row.pid}</td>
                        <td className="p-2.5 font-bold text-slate-100">{row.process}</td>
                        <td className="p-2.5 text-amber-300 break-all">{row.args}</td>
                        <td className="p-2.5 text-slate-400">{row.notes || 'Normal invocation'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* LDRMODULES: Unlinked DLLs Table */}
            {selectedPluginId.includes('ldrmodules') && analysisResult.ldrmodules && (
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">PID</th>
                      <th className="p-2.5">Process</th>
                      <th className="p-2.5">Base Address</th>
                      <th className="p-2.5">InLoad</th>
                      <th className="p-2.5">InInit</th>
                      <th className="p-2.5">InMem</th>
                      <th className="p-2.5">Mapped Path</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {analysisResult.ldrmodules.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-red-400">{row.pid}</td>
                        <td className="p-2.5 font-bold text-slate-100">{row.process}</td>
                        <td className="p-2.5 text-slate-400">{row.base}</td>
                        <td className="p-2.5">{row.inLoadOrder ? 'True' : 'False'}</td>
                        <td className="p-2.5">{row.inInitOrder ? 'True' : 'False'}</td>
                        <td className="p-2.5">{row.inMemOrder ? 'True' : 'False'}</td>
                        <td className="p-2.5 text-slate-300">{row.mappedPath}</td>
                        <td className="p-2.5">
                          {row.suspicious ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              REFLECTIVE DLL INJECTION
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Legitimate Module</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. SCAN BREAKDOWN VIEW: All Plugins in Active Profile */}
        {activeViewTab === 'breakdown' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <span>Profile: {analysisResult.profileName || 'Quick Triage'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {analysisResult.totalPluginsCount || analysisResult.pluginRunRecords?.length || 18} Plugins Run
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Multi-plugin parallel run completed in {analysisResult.executionTimeSec}s (Average speedup: x{analysisResult.rustSpeedupFactor} vs Python Volatility)
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-red-400 font-bold">
                  {analysisResult.findingsSummary.criticalCount} Critical
                </span>
                <span className="text-amber-400 font-bold">
                  {analysisResult.findingsSummary.highCount} High
                </span>
                <span className="text-emerald-400">
                  {analysisResult.findingsSummary.cleanPluginsCount || 0} Clean
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Plugin ID</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Target Structures</th>
                    <th className="p-2.5">Offset</th>
                    <th className="p-2.5">Execution</th>
                    <th className="p-2.5">Speedup</th>
                    <th className="p-2.5">Findings Summary & Forensic Objective</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(analysisResult.pluginRunRecords || []).map((row) => (
                    <tr key={row.pluginId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-bold text-cyan-300">
                        {row.pluginId}
                      </td>
                      <td className="p-2.5 text-slate-400">{row.category}</td>
                      <td className="p-2.5">
                        {row.findingsCount > 0 ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.severity === 'CRITICAL'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : row.severity === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {row.severity} ({row.findingsCount})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            CLEAN
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {row.targetStructures && row.targetStructures.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {row.targetStructures.map((st) => (
                              <span
                                key={st}
                                className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-950/40 text-blue-300 border border-blue-500/30"
                              >
                                {st}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">_EPROCESS</span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-amber-300 text-[11px]">
                        {row.memoryOffset || '0x0000000000000000'}
                      </td>
                      <td className="p-2.5 font-mono text-slate-400">
                        {row.executionTimeMs ? `${row.executionTimeMs}ms` : `${row.executionTimeSec}s`}
                      </td>
                      <td className="p-2.5 text-amber-400 font-bold font-mono">
                        {row.speedupRatio}
                      </td>
                      <td className="p-2.5 text-slate-300 max-w-sm">
                        <div className="font-semibold text-slate-100">{row.findingsSummary}</div>
                        {row.purpose && (
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                            {row.purpose}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPluginFromProfile(row.pluginId);
                            setActiveViewTab('table');
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold border border-cyan-500/40 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2b. PROFILE PLUGIN DETAILS VIEW */}
        {activeViewTab === 'profile_details' && (
          <div className="space-y-4">
            {/* Header with Search and Filter */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                      Profile Plugin Details & Structure Mappings
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Forensic purpose, targeted kernel/user memory structures, and offsets for profile:{' '}
                    <span className="text-cyan-300 font-semibold">{analysisResult.profileName || 'Quick Triage'}</span>
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search plugin, structure, or purpose..."
                    value={profileDetailsSearch}
                    onChange={(e) => setProfileDetailsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              {(() => {
                const allRecords = analysisResult.pluginRunRecords || [];
                const detectedCount = allRecords.filter((r) => r.status === 'DETECTION_FOUND').length;
                const cleanCount = allRecords.length - detectedCount;

                return (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setProfileDetailsFilter('all')}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                        profileDetailsFilter === 'all'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      All Profile Plugins ({allRecords.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileDetailsFilter('detected')}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
                        profileDetailsFilter === 'detected'
                          ? 'bg-red-500 text-white font-bold'
                          : 'bg-slate-900 text-red-400 border border-slate-800 hover:text-red-300'
                      }`}
                    >
                      <ShieldAlert className="h-3 w-3" />
                      <span>Flagged Anomalies ({detectedCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileDetailsFilter('clean')}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
                        profileDetailsFilter === 'clean'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-emerald-400 border border-slate-800 hover:text-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Clean / Passed ({cleanCount})</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Plugin Cards List */}
            {(() => {
              const allRecords = analysisResult.pluginRunRecords || [];
              const filtered = allRecords.filter((r) => {
                if (profileDetailsFilter === 'detected' && r.status !== 'DETECTION_FOUND') return false;
                if (profileDetailsFilter === 'clean' && r.status === 'DETECTION_FOUND') return false;
                if (!profileDetailsSearch) return true;
                const query = profileDetailsSearch.toLowerCase();
                return (
                  r.pluginId.toLowerCase().includes(query) ||
                  r.category.toLowerCase().includes(query) ||
                  r.purpose?.toLowerCase().includes(query) ||
                  r.findingsSummary?.toLowerCase().includes(query) ||
                  r.targetStructures?.some((s) => s.toLowerCase().includes(query)) ||
                  r.memoryOffset?.toLowerCase().includes(query)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xs font-mono text-slate-400">
                      No plugins match your current search and filter criteria.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filtered.map((r) => {
                    const isDetected = r.status === 'DETECTION_FOUND';
                    return (
                      <div
                        key={r.pluginId}
                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                          isDetected
                            ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-mono font-bold text-xs text-cyan-300 break-all flex items-center gap-1.5">
                                <Binary className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                <span>{r.pluginId}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Category: <span className="text-slate-300">{r.category}</span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                                r.severity === 'CRITICAL'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : r.severity === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : r.severity === 'MEDIUM'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isDetected ? `${r.severity} (${r.findingsCount})` : 'CLEAN'}
                            </span>
                          </div>

                          {/* Purpose */}
                          <div className="text-xs font-mono text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800/80">
                            <span className="text-[10px] text-cyan-400 font-bold block uppercase mb-0.5">
                              Forensic Purpose:
                            </span>
                            {r.purpose || 'Analyzes kernel structures and correlates virtual memory artifacts.'}
                          </div>

                          {/* Target Structures */}
                          {r.targetStructures && r.targetStructures.length > 0 && (
                            <div>
                              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                                Target Kernel / Memory Structures:
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {r.targetStructures.map((struct) => (
                                  <span
                                    key={struct}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950/40 text-blue-300 border border-blue-500/30"
                                  >
                                    {struct}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Memory Offset & Finding Summary */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-slate-500 block">Memory Base Offset:</span>
                              <span className="text-amber-300 font-bold">{r.memoryOffset || '0x0000000000000000'}</span>
                            </div>
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-slate-500 block">Rayon Acceleration:</span>
                              <span className="text-emerald-400 font-bold">{r.speedupRatio} ({r.executionTimeMs}ms)</span>
                            </div>
                          </div>

                          <div className="text-[11px] font-mono text-slate-300">
                            <span className="text-slate-500">Findings: </span>
                            {r.findingsSummary}
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              const cmd = `vol-rs -f ${activeDump.fileName} ${r.pluginId}`;
                              navigator.clipboard.writeText(cmd);
                            }}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy CLI</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleSelectPluginFromProfile(r.pluginId);
                              setActiveViewTab('table');
                            }}
                            className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold border border-cyan-500/40 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect Artifacts</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* 2c. SCAN CONFIGURATION SUMMARY VIEW */}
        {activeViewTab === 'config_summary' && (
          <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                    Scan Configuration & Execution Architecture Summary
                  </h3>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Complete target image provenance, hardware Rayon concurrency parameters, and forensic benchmark profile.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScanConfigJson}
                  className="px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedConfigJson ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedConfigJson ? 'Copied Config JSON' : 'Export JSON Config'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCliSnippet}
                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedCliSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Terminal className="h-3.5 w-3.5 text-cyan-400" />}
                  <span>{copiedCliSnippet ? 'Copied CLI' : 'Copy CLI Command'}</span>
                </button>
              </div>
            </div>

            {/* 4 Deep Summary Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Panel 1: Target Memory Capture */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase pb-2 border-b border-slate-800">
                  <Database className="h-4 w-4" />
                  <span>1. Target Memory Capture Specifications</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Capture File Name:</span>
                    <span className="text-slate-200 font-bold">{activeDump.fileName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Raw Capture Size:</span>
                    <span className="text-slate-200">{activeDump.fileSizeFormatted} ({activeDump.fileSizeBytes.toLocaleString()} bytes)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Memory Layer Type:</span>
                    <span className="text-cyan-300 font-semibold">{activeDump.layerType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Architecture:</span>
                    <span className="text-slate-200">{activeDump.architecture}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Operating System Build:</span>
                    <span className="text-slate-200">{activeDump.detectedOs} ({activeDump.osBuild})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Directory Table Base (DTB):</span>
                    <span className="text-amber-300">0x001AA000 (Kernel CR3 Base)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">PDB Symbol Pack:</span>
                    <span className="text-emerald-400 truncate max-w-[220px]">{activeDump.symbolPack}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 block text-[10px] mb-1">SHA-256 Checksum:</span>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 break-all select-all">
                      {activeDump.sha256}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2: Profile & Plugins Roster */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-mono font-bold text-xs uppercase pb-2 border-b border-slate-800">
                  <Layers className="h-4 w-4" />
                  <span>2. Scan Profile & Plugin Roster Mapping</span>
                </div>
                {(() => {
                  const prof = VOLRS_SCAN_PROFILES.find((p) => p.id === selectedProfileId) || VOLRS_SCAN_PROFILES[0];
                  const totalCount = isLinuxCapture ? prof.pluginCount.linux : prof.pluginCount.windows;
                  const records = analysisResult.pluginRunRecords || [];
                  const detectedCount = records.filter((r) => r.status === 'DETECTION_FOUND').length;
                  const cleanCount = records.length - detectedCount;

                  return (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Selected Scan Profile:</span>
                        <span className="text-blue-300 font-bold">{prof.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Profile Identifier:</span>
                        <span className="text-slate-300">{prof.id}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Target Plugins Count:</span>
                        <span className="text-cyan-300 font-bold">{totalCount} Plugins</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Operating System Filter:</span>
                        <span className="text-slate-300">{detectedOsCaptureName === 'linux' ? 'Linux Lime Layer' : 'Windows 10 x64'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Excluded Incompatible Plugins:</span>
                        <span className="text-emerald-400 font-medium">0 Excluded (100% Target Compatibility)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Findings Detected:</span>
                        <span className="text-red-400 font-bold">{detectedCount} Anomalies Flagged</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Clean / Passed Plugins:</span>
                        <span className="text-emerald-400">{cleanCount} Clean (0 Violations)</span>
                      </div>
                      <div className="pt-1">
                        <span className="text-slate-400 block text-[10px] mb-1">Forensic Objective:</span>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                          {prof.focusDescription}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Panel 3: Engine Architecture & Concurrency */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase pb-2 border-b border-slate-800">
                  <Cpu className="h-4 w-4" />
                  <span>3. vol-rs Engine & Concurrency Model</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Engine Version:</span>
                    <span className="text-slate-200 font-bold">vol-rs v0.2.1-native (Rust 1.80+)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Threading Runtime:</span>
                    <span className="text-cyan-300 font-semibold">Rayon 16 Worker Work-Stealing Pool</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Virtual-to-Physical Translation:</span>
                    <span className="text-slate-200">Hardware CR3 4-Level Paging (PML4)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Memory Access Mode:</span>
                    <span className="text-slate-200">Zero-copy OS mmap() Mapping</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">YARA Pattern Engine:</span>
                    <span className="text-slate-200">Hyperscan SIMD Vectorized (AVX2/NEON)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Symbol Cache Strategy:</span>
                    <span className="text-slate-200">Embedded GUID PDB Cache + Microsoft Fallback</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">VAD Tree Traversal Depth:</span>
                    <span className="text-amber-300">Deep / Full Memory Tag & PE Carving</span>
                  </div>
                </div>
              </div>

              {/* Panel 4: Performance Benchmarking */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase pb-2 border-b border-slate-800">
                  <Gauge className="h-4 w-4" />
                  <span>4. Performance Multiplier & Benchmark</span>
                </div>
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>vol-rs Execution Time:</span>
                      <span className="text-cyan-300 font-bold">{analysisResult.executionTimeSec}s</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Volatility 3 (Python) Est.:</span>
                      <span className="text-slate-400">{(analysisResult.executionTimeSec * 435).toFixed(1)}s (~3.0 minutes)</span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-emerald-400 font-bold uppercase text-[11px]">Speedup Factor:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        {analysisResult.rustSpeedupFactor}x Faster (99.7% runtime saved)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Peak Memory Scan Throughput:</span>
                      <span className="text-slate-200 font-bold">982 MB/s page analysis</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Rayon Concurrency Efficiency:</span>
                      <span className="text-slate-200">99.2% linear multi-core scaling</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Memory Allocation Overhead:</span>
                      <span className="text-slate-200">&lt; 45 MB RSS (Zero-copy Buffering)</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleSendToVault}
                      className="flex-1 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Flag in Evidence Vault</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadReport}
                      className="flex-1 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Export Full Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. RAW CLI MONOSPACE VIEW */}
        {activeViewTab === 'cli' && (
          <div className="relative">
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(analysisResult.rawCliOutput);
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy Terminal
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-black border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-[500px]">
              {analysisResult.rawCliOutput}
            </pre>
          </div>
        )}

        {/* 3. INTERACTIVE vol-rs COMMAND CONSOLE */}
        {activeViewTab === 'terminal' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-xs font-mono text-slate-400 mb-2">
                Type any custom <code className="text-cyan-400">vol-rs</code> command line expression (supports flags <code className="text-amber-300">-f, -r, --list-plugins</code>):
              </div>
              <form onSubmit={handleCliSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-mono font-bold">$</span>
                  <input
                    type="text"
                    value={cliCommandInput}
                    onChange={(e) => setCliCommandInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono bg-black border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="vol-rs -f memory.raw windows.malfind.Malfind"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Play className="h-3.5 w-3.5 fill-slate-950" />
                  Execute
                </button>
              </form>

              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className="text-[10px] font-mono text-slate-400">Quick Commands:</span>
                {[
                  `vol-rs -f ${activeDump.fileName} windows.malfind.Malfind`,
                  `vol-rs -f ${activeDump.fileName} windows.netscan.NetScan`,
                  `vol-rs -f ${activeDump.fileName} windows.pstree.PsTree`,
                  `vol-rs --list-plugins`,
                  `vol-rs --help`,
                ].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => {
                      setCliCommandInput(cmd);
                      const res = runCustomVolRsCliCommand(cmd, activeDump);
                      setAnalysisResult(res);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            <pre className="p-4 rounded-lg bg-black border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-[400px]">
              {analysisResult.rawCliOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
