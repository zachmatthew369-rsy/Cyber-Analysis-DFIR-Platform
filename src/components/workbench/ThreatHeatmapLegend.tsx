import React from 'react';
import { Flame, Layers, Activity, Crosshair, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import { ThreatHeatmapPoint } from '../../types/threatGlobe';

interface ThreatHeatmapLegendProps {
  heatmapPoints: ThreatHeatmapPoint[];
  heatmapEnabled: boolean;
  onToggleHeatmap: () => void;
  selectedPoint: ThreatHeatmapPoint | null;
  onSelectPoint: (point: ThreatHeatmapPoint) => void;
  onClose?: () => void;
}

export const ThreatHeatmapLegend: React.FC<ThreatHeatmapLegendProps> = ({
  heatmapPoints,
  heatmapEnabled,
  onToggleHeatmap,
  selectedPoint,
  onSelectPoint,
  onClose,
}) => {
  const totalEventsPerSec = heatmapPoints.reduce((acc, p) => acc + p.attackCountPerSec, 0);
  const criticalCount = heatmapPoints.filter((p) => p.status === 'CRITICAL_OUTBREAK').length;

  return (
    <div
      id="threat-heatmap-legend-panel"
      className="rounded-xl border border-amber-500/30 bg-slate-950/95 p-3 sm:p-4 text-xs font-mono shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wide">
                Global Threat Density Heatmap
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  heatmapEnabled
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {heatmapEnabled ? 'LAYER ACTIVE' : 'LAYER DISABLED'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Thermographic Attack Concentration • {totalEventsPerSec.toLocaleString()} events/sec telemetry
            </p>
          </div>
        </div>

        {/* Heatmap Layer Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHeatmap}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              heatmapEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{heatmapEnabled ? 'Hide Heatmap' : 'Show Heatmap'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Thermographic Gradient Scale Indicator */}
      <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span>THERMOGRAPHIC SEVERITY INDEX:</span>
          <span>Critical Outbreaks: <strong className="text-red-400">{criticalCount}</strong></span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-amber-500 via-red-500 to-fuchsia-600 shadow-inner" />
        <div className="flex justify-between text-[9px] text-slate-400">
          <span>Low Risk (&lt;2k evt/s)</span>
          <span>Elevated (5-10k evt/s)</span>
          <span>High Severity (10-15k evt/s)</span>
          <span className="text-red-400 font-bold">Critical Outbreak (&gt;15k evt/s)</span>
        </div>
      </div>

      {/* Active Heatmap Hotspot Clusters Grid */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
          <span>Active Global Attack Epicenters ({heatmapPoints.length}):</span>
          <span className="text-slate-400 text-[10px]">Click hotspot to center 3D globe</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {heatmapPoints.map((point) => {
            const isSelected = selectedPoint?.id === point.id;
            return (
              <button
                key={point.id}
                onClick={() => onSelectPoint(point)}
                className={`p-2 rounded-lg text-left transition cursor-pointer border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="font-bold text-slate-100 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-cyan-400" />
                    {point.city}, {point.country}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      point.status === 'CRITICAL_OUTBREAK'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {Math.round(point.intensity * 100)}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  {point.primaryThreat}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] border-t border-slate-800/60 pt-1">
                  <span className="text-emerald-400 font-bold">
                    {point.attackCountPerSec.toLocaleString()} /s
                  </span>
                  <span className="text-slate-500 font-mono text-[9px] truncate max-w-[100px]">
                    {point.topMalwareFamily.split('/')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
