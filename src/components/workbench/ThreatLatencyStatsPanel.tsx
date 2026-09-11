import React, { useState, useEffect } from 'react';
import { Activity, Zap, Wifi, ArrowUpRight, Clock, ShieldCheck, AlertTriangle, Radio } from 'lucide-react';
import { AttackVectorFlow, ThreatNodeData } from '../../types/threatGlobe';

interface ThreatLatencyStatsPanelProps {
  vectors: AttackVectorFlow[];
  nodes: ThreatNodeData[];
  selectedVector: AttackVectorFlow | null;
  onSelectVector: (vector: AttackVectorFlow) => void;
  onFocusNode: (nodeId: string) => void;
  onClose?: () => void;
}

export const ThreatLatencyStatsPanel: React.FC<ThreatLatencyStatsPanelProps> = ({
  vectors,
  nodes,
  selectedVector,
  onSelectVector,
  onFocusNode,
  onClose,
}) => {
  const activeVec = selectedVector || vectors[0];
  const [livePingHistory, setLivePingHistory] = useState<number[]>(activeVec?.latencyStats?.pingHistory || [20, 21, 20, 22, 19]);
  const [liveJitter, setLiveJitter] = useState(activeVec?.latencyStats?.jitterMs || 2.1);
  const [liveRtt, setLiveRtt] = useState(activeVec?.latencyStats?.rttMs || 20);

  // Live telemetry pulse simulation (realistic enterprise RTT variance)
  useEffect(() => {
    if (!activeVec) return;
    setLivePingHistory(activeVec.latencyStats.pingHistory);
    setLiveJitter(activeVec.latencyStats.jitterMs);
    setLiveRtt(activeVec.latencyStats.rttMs);

    const interval = setInterval(() => {
      setLiveRtt((prev) => {
        const delta = (Math.random() - 0.5) * (activeVec.latencyStats.jitterMs * 0.8);
        const newRtt = Math.max(2, Number((activeVec.latencyStats.rttMs + delta).toFixed(1)));
        setLivePingHistory((history) => [...history.slice(1), newRtt]);
        return newRtt;
      });
      setLiveJitter(Number((activeVec.latencyStats.jitterMs + (Math.random() - 0.5) * 0.4).toFixed(1)));
    }, 2000);

    return () => clearInterval(interval);
  }, [activeVec]);

  const sourceNode = nodes.find((n) => n.id === activeVec?.sourceNodeId);
  const targetNode = nodes.find((n) => n.id === activeVec?.targetNodeId);

  return (
    <div
      id="threat-latency-stats-panel"
      className="rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 sm:p-4 text-xs font-mono shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
            <Wifi className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wide">
                Real-Time Telemetry & Latency Diagnostics
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  activeVec?.latencyStats.status === 'OPTIMAL'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : activeVec?.latencyStats.status === 'NOMINAL'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {activeVec?.latencyStats.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Per-Hop Telemetry, BGP Convergence & Round-Trip Timing across Active Vector Connections
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Vector Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {vectors.map((vec) => {
          const isSelected = activeVec?.id === vec.id;
          return (
            <button
              key={vec.id}
              onClick={() => onSelectVector(vec)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    vec.color === 0xef4444 ? '#ef4444' : vec.color === 0xf59e0b ? '#f59e0b' : '#06b6d4',
                }}
              />
              <span>{vec.name.split(':')[0]}</span>
              <span className="text-[10px] opacity-75 font-normal">({vec.latencyStats.rttMs}ms)</span>
            </button>
          );
        })}
      </div>

      {/* Active Vector Diagnostics Grid */}
      {activeVec && (
        <div className="space-y-3">
          {/* Node Route Banner */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => sourceNode && onFocusNode(sourceNode.id)}
                className="text-cyan-300 hover:underline font-bold text-left cursor-pointer"
                title="Click to focus on source node"
              >
                {sourceNode ? `${sourceNode.name.split('(')[0]} (${sourceNode.country})` : activeVec.sourceNodeId}
              </button>
              <span className="text-slate-500">➔</span>
              <button
                onClick={() => targetNode && onFocusNode(targetNode.id)}
                className="text-amber-300 hover:underline font-bold text-left cursor-pointer"
                title="Click to focus on target node"
              >
                {targetNode ? `${targetNode.name.split('(')[0]} (${targetNode.country})` : activeVec.targetNodeId}
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Proto: <strong className="text-slate-200">{activeVec.protocol}</strong></span>
              <span>•</span>
              <span>Port: <strong className="text-slate-200">{activeVec.port}</strong></span>
            </div>
          </div>

          {/* Real-Time Latency Metrics Quad */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* RTT Metric */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Round-Trip Time (RTT)</span>
                <Clock className="h-3 w-3 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-cyan-300 mt-1 flex items-baseline gap-1">
                <span>{liveRtt}</span>
                <span className="text-xs text-slate-500 font-normal">ms</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Baseline: {activeVec.latencyStats.rttMs}ms
              </div>
            </div>

            {/* Jitter */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Packet Jitter</span>
                <Activity className="h-3 w-3 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-amber-300 mt-1 flex items-baseline gap-1">
                <span>±{liveJitter}</span>
                <span className="text-xs text-slate-500 font-normal">ms</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Delay Variance Index
              </div>
            </div>

            {/* Packet Loss */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Packet Loss Rate</span>
                <AlertTriangle className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-emerald-400 mt-1 flex items-baseline gap-1">
                <span>{activeVec.latencyStats.packetLossPercent}%</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {activeVec.latencyStats.packetLossPercent < 1.0 ? 'Under SLA Threshold' : 'Congestion Detected'}
              </div>
            </div>

            {/* BGP & TLS Handshake */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>BGP Hops / TLS Time</span>
                <ShieldCheck className="h-3 w-3 text-purple-400" />
              </div>
              <div className="text-sm font-bold text-purple-300 mt-1 flex items-baseline gap-1">
                <span>{activeVec.latencyStats.bgpHopCount} Hops</span>
                <span className="text-[10px] text-slate-500">• {activeVec.latencyStats.tlsHandshakeMs}ms</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                MTU: {activeVec.latencyStats.mtuBytes} Bytes
              </div>
            </div>
          </div>

          {/* Real-Time Ping History Sparkline Canvas */}
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
            <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
                Live RTT Rolling Telemetry Buffer (Last 10 Probes)
              </span>
              <span className="text-cyan-400 font-bold">{liveRtt} ms current</span>
            </div>

            {/* Visual Bar Graph */}
            <div className="h-10 flex items-end gap-1 px-1 bg-slate-950/80 rounded border border-slate-800/80">
              {livePingHistory.map((val, idx) => {
                const maxVal = Math.max(...livePingHistory, 100);
                const heightPercent = Math.max(15, Math.min(100, (val / maxVal) * 100));
                const isLatest = idx === livePingHistory.length - 1;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isLatest
                          ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                          : val > 200
                          ? 'bg-amber-500/70'
                          : 'bg-cyan-600/50'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:block px-1 py-0.5 rounded bg-slate-900 text-[9px] text-white whitespace-nowrap border border-slate-700 z-20">
                      {val}ms
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
              <span>T-20s</span>
              <span>T-10s</span>
              <span>LIVE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
