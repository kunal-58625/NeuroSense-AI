"use client";

import React from "react";
import { SignalQualityStatus } from "@/lib/eegProcessor";

interface JourneyStep {
  minute: number;
  state: string;
  dominantBand: string;
  quality: SignalQualityStatus;
}

interface EEGJourneyMapProps {
  journeyMap: JourneyStep[];
}

export default function EEGJourneyMap({ journeyMap }: EEGJourneyMapProps) {
  const getStateBadgeStyle = (state: string) => {
    switch (state) {
      case "Active pattern":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "Low-activity pattern":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "Pattern transition":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  const getQualityBadge = (quality: SignalQualityStatus) => {
    switch (quality) {
      case "GOOD":
        return <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold border border-green-500/30">GOOD</span>;
      case "FAIR":
        return <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">FAIR</span>;
      case "POOR":
        return <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">POOR</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-500/5 border border-white/10 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
          EEG Journey Timeline
        </h2>
        <div className="text-xs text-gray-400 font-mono">
          Session Pattern Transitions
        </div>
      </div>

      <div className="relative">
        {/* Horizontal connecting line */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700/50 -translate-y-1/2 z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
          {journeyMap.slice(0, 5).map((step, idx) => (
            <div
              key={idx}
              className="bg-gray-900/80 border border-gray-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg backdrop-blur-sm hover:border-gray-500 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-gray-400">
                  Min {step.minute}
                </span>
                {getQualityBadge(step.quality)}
              </div>

              <div className="mb-3">
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block mb-2 ${getStateBadgeStyle(step.state)}`}>
                  {step.state}
                </div>
                <div className="text-sm font-bold text-white">
                  {step.dominantBand} Dominant
                </div>
              </div>

              <div className="text-[11px] text-gray-500 font-mono pt-2 border-t border-gray-800 flex justify-between">
                <span>Segment #{idx + 1}</span>
                <span>{step.quality === "POOR" ? "Artifact" : "Clean"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
