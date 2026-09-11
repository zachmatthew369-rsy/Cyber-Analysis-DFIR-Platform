import React, { useState, useEffect } from 'react';
import {
  Skull,
  ShieldAlert,
  Play,
  Pause,
  ChevronRight,
  Crosshair,
  ExternalLink,
  Target,
  Clock,
  Radio,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ThreatActorIntel } from '../../types/threatGlobe';

interface ThreatActorOverlayHUDProps {
  actors: ThreatActorIntel[];
  selectedActor: ThreatActorIntel | null;
  onSelectActor: (actor: ThreatActorIntel) => void;
  onFocusNode: (nodeId: string) => void;
  onOpenDeepResearch: () => void;
  onClose?: () => void;
  isAutoTracking: boolean;
  onToggleAutoTrack: () => void;
}

export const ThreatActorOverlayHUD: React.FC<ThreatActorOverlayHUDProps> = ({
  actors,
  selectedActor,
  onSelectActor,
  onFocusNode,
  onOpenDeepResearch,
  onClose,
  isAutoTracking,
  onToggleAutoTrack,
}) => {
  const currentActor = selectedActor || actors[0];

  return (
    <div
      id="threat-actor-overlay-hud"
      className="rounded-xl border border-red-500/30 bg-slate-950/95 p-3 sm:p-4 text-xs font-mono shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3 duration-200"
    >
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
            <Skull className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wide">
                Automated Threat Actor Tracking Overlay
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                LIVE APT CORRELATION
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Active Nation-State & Syndicate Cybercrime Footprints on Global 3D Grid
            </p>
          </div>
        </div>

        {/* Auto-Track Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutoTrack}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              isAutoTracking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="Automatically cycles between worldwide threat actors and centers the globe on their infrastructure"
          >
            {isAutoTracking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>Auto-Track: {isAutoTracking ? 'ACTIVE (Cycling 8s)' : 'PAUSED'}</span>
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

      {/* Threat Actor Chip Selector Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {actors.map((actor) => {
          const isSelected = currentActor?.id === actor.id;
          return (
            <button
              key={actor.id}
              onClick={() => onSelectActor(actor)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-md shadow-red-500/10 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  actor.threatLevel === 'CRITICAL' ? 'bg-red-500 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span>{actor.name}</span>
              <span className="text-[10px] text-slate-500 font-normal">[{actor.aliases[0]}]</span>
            </button>
          );
        })}
      </div>

      {/* Selected Actor Deep Intelligence Dossier Card */}
      {currentActor && (
        <div className="space-y-3">
          {/* Main Info Banner */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100">{currentActor.name}</h4>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {currentActor.threatLevel}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Aliases: {currentActor.aliases.join(', ')}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-300 mt-0.5">
                  Origin & Attribution: <strong className="text-slate-200">{currentActor.originCountry}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (currentActor.operationalNodes.length > 0) {
                      onFocusNode(currentActor.operationalNodes[0]);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Crosshair className="h-3 w-3" />
                  <span>Track Operations</span>
                </button>
                <button
                  onClick={onOpenDeepResearch}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <FileText className="h-3 w-3" />
                  <span>Dossier</span>
                </button>
              </div>
            </div>

            {/* Live Campaign Status */}
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase mb-1">
                <AlertCircle className="h-3 w-3" /> Active Campaign: {currentActor.activeCampaign}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {currentActor.liveIncidentSummary}
              </p>
            </div>

            {/* Targeted Sectors & MITRE TTPs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">
                  Targeted Industry Sectors:
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentActor.targetedSectors.map((sector, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">
                  Actively Exploited CVEs & TTPs:
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentActor.cvesExploited.map((cve, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 border border-red-500/20 text-red-300 font-mono"
                    >
                      {cve.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
