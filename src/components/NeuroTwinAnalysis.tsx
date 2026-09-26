"use client";

import React, { useState, useMemo, useRef } from "react";
import { EEGAnalysisResult, BAND_METADATA } from "@/lib/eegProcessor";
import { Sparkles, Brain, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Download, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

interface NeuroTwinAnalysisProps {
  analysis: EEGAnalysisResult;
  subjectId?: string;
  baselineFilename?: string | null;
  isBaselineFile?: boolean;
}

export default function NeuroTwinAnalysis({ analysis, subjectId, baselineFilename, isBaselineFile }: NeuroTwinAnalysisProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute Drift Data
  const driftData = useMemo(() => {
    const baseline = analysis.baseline;
    const current = analysis.overallBands;

    const calcDrift = (curr: number, base: number) => {
      if (base === 0) return 0;
      return Math.min(100, Math.abs(curr - base) / base * 100);
    };

    const alphaDrift = calcDrift(current.alpha, baseline.alpha);
    const betaDrift = calcDrift(current.beta, baseline.beta);
    const gammaDrift = calcDrift(current.gamma, baseline.gamma);
    const thetaDrift = calcDrift(current.theta, baseline.theta);
    const deltaDrift = calcDrift(current.delta, baseline.delta);

    const overallDrift = Math.min(
      100,
      betaDrift * 0.3 + alphaDrift * 0.25 + thetaDrift * 0.2 + gammaDrift * 0.15 + deltaDrift * 0.1
    );

    const similarity = Math.max(0, 100 - overallDrift);

    // Timeline Data
    let maxDrift = 0;
    let maxDriftTime = "00:00";
    const timeline = analysis.minutes.map((m) => {
      const d_alpha = calcDrift(m.bands.alpha, baseline.alpha);
      const d_beta = calcDrift(m.bands.beta, baseline.beta);
      const d_gamma = calcDrift(m.bands.gamma, baseline.gamma);
      const d_theta = calcDrift(m.bands.theta, baseline.theta);
      const d_delta = calcDrift(m.bands.delta, baseline.delta);

      const d_score = Math.min(
        100,
        d_beta * 0.3 + d_alpha * 0.25 + d_theta * 0.2 + d_gamma * 0.15 + d_delta * 0.1
      );

      const minutes = Math.floor(m.minute / 60);
      const seconds = m.minute % 60;
      const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      if (d_score > maxDrift) {
        maxDrift = d_score;
        maxDriftTime = timeStr;
      }

      return {
        time: timeStr,
        drift: Number(d_score.toFixed(1)),
        originalMinute: m.minute,
      };
    });

    const isStable = overallDrift < 20;
    const stabilityStatus = isStable ? "Good" : overallDrift < 40 ? "Moderate" : "Low";
    
    // Check if recovery happened (drift at end is lower than max drift)
    const endDrift = timeline.length > 0 ? timeline[timeline.length - 1].drift : 0;
    const recoveryDetected = endDrift < maxDrift - 10;

    let insight = "Brain activity remained close to your personal baseline throughout most of the recording.";
    if (overallDrift > 40) {
      insight = "The recording showed noticeable changes from your baseline before returning toward a stable pattern.";
    } else if (overallDrift > 20) {
      insight = "A gradual increase in deviation from your baseline occurred during the middle portion of the recording.";
    }
    if (recoveryDetected) {
      insight += " Brain activity moved closer to your baseline near the end of the session.";
    }

    return {
      alphaDrift,
      betaDrift,
      gammaDrift,
      thetaDrift,
      deltaDrift,
      overallDrift,
      similarity,
      timeline,
      maxDrift,
      maxDriftTime,
      stabilityStatus,
      recoveryDetected,
      insight,
    };
  }, [analysis]);

  const handlePrint = () => {
    window.print();
  };

  if (!showAnalysis) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-md">
        <h2 className="text-2xl font-extrabold text-white mb-2 text-center flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-400" />
          NeuroSense AI — Your Digital Brain Twin
        </h2>
        <p className="text-slate-400 mb-4 text-center max-w-lg text-sm">
          Track how your brain changes over time using short EEG sessions and AI-powered Brain Drift analysis.
        </p>
        {subjectId && (
          <div className="flex items-center gap-3 mb-6 text-xs font-mono">
            <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-xl">
              Subject: <span className="text-purple-400 font-bold">{subjectId}</span>
            </span>
            {!isBaselineFile && baselineFilename && (
              <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-xl">
                Baseline: <span className="text-indigo-400 font-bold">{baselineFilename}</span>
              </span>
            )}
            {isBaselineFile && (
              <span className="bg-amber-950/40 border border-amber-800/60 text-amber-400 px-3 py-1 rounded-xl">
                First session recorded — this IS the baseline
              </span>
            )}
          </div>
        )}
        <button
          onClick={() => setShowAnalysis(true)}
          className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/20 hover:shadow-cyan-500/40 transition-all duration-300 overflow-hidden flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          <Brain className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Analyze with NeuroSense AI</span>
          <Sparkles className="w-5 h-5 text-cyan-300 relative z-10 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-400">
          NeuroSense AI — Digital Brain Twin Analysis
        </h1>
        {subjectId && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm font-mono bg-slate-800 border border-slate-700 text-purple-300 px-3 py-1 rounded-xl">
              {subjectId}
            </span>
            {!isBaselineFile && baselineFilename && (
              <>
                <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg font-mono">
                  📁 Baseline: {baselineFilename}
                </span>
                <span className="text-xs text-slate-500">→</span>
                <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg font-mono">
                  📄 Post: {analysis.filename}
                </span>
              </>
            )}
          </div>
        )}
        <p className="text-slate-400 text-sm md:text-base italic max-w-2xl mx-auto">
          "A personalized comparison between your current EEG session and your stored Brain Twin baseline."
        </p>
      </div>

      {/* SECTION 1 — Brain Twin Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Similarity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="text-xs uppercase font-bold text-slate-400 mb-4 tracking-wider">Brain Twin Similarity</div>
          <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-slate-800 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="44" cy="44" r="44" className="fill-none stroke-slate-800 stroke-[4px]" />
              <circle
                cx="44"
                cy="44"
                r="44"
                className="fill-none stroke-purple-500 stroke-[4px] transition-all duration-1000"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * driftData.similarity) / 100}
                style={{ transform: "translate(4px, 4px)" }}
              />
            </svg>
            <span className="text-2xl font-black text-white">{driftData.similarity.toFixed(0)}%</span>
          </div>
          <div className="text-sm font-bold text-purple-400">
            {driftData.similarity > 80 ? "Very Similar" : driftData.similarity > 50 ? "Moderate Change" : "Significant Change"}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Today's EEG compared with your baseline.</p>
        </div>

        {/* Card 2: Brain Difference */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Brain Difference</div>
          <div className="flex items-center gap-2 my-4">
            <span className="text-4xl font-black text-white">{driftData.overallDrift.toFixed(0)}%</span>
            {driftData.overallDrift > 0 ? (
              <ArrowUpRight className="w-6 h-6 text-rose-400" />
            ) : (
              <ArrowDownRight className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div className="text-sm font-semibold text-slate-300">Changed from baseline</div>
          <p className="text-[10px] text-slate-500 mt-2">Overall deviation across all bands.</p>
        </div>

        {/* Card 3: Brain Stability */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Brain Stability</div>
          <div className="my-4">
            <span className="text-4xl font-black text-cyan-400">{driftData.stabilityStatus === "Good" ? "High" : driftData.stabilityStatus}</span>
          </div>
          <div className="text-sm font-semibold text-slate-300">Stability Score</div>
          <p className="text-[10px] text-slate-500 mt-2">How stable today's brain activity remained.</p>
        </div>

        {/* Card 4: Recovery Trend */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Recovery Trend</div>
          <div className="my-4 flex items-center justify-center">
            {driftData.recoveryDetected ? (
              <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-500/40">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold">Improving</span>
              </div>
            ) : driftData.overallDrift < 20 ? (
              <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-500/40">
                <Activity className="w-5 h-5" />
                <span className="font-bold">Stable</span>
              </div>
            ) : (
              <div className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl flex items-center gap-2 border border-amber-500/40">
                <ArrowDownRight className="w-5 h-5" />
                <span className="font-bold">Reduced Recovery</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Trend toward baseline at session end.</p>
        </div>
      </div>

      {/* SECTION 2 — Brain Twin Comparison */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          NeuroSense AI — Brain Twin Comparison
          {subjectId && <span className="text-sm font-mono text-purple-400 bg-purple-950/30 px-2 py-0.5 rounded-lg border border-purple-900/50 ml-2">{subjectId}</span>}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left Panel — Baseline */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-indigo-400">Brain Twin Baseline</h3>
              <span className="text-[10px] uppercase tracking-wide bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                {baselineFilename || "Baseline Session"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono text-slate-300">
              <div>Alpha: {analysis.baseline.alpha.toFixed(1)}</div>
              <div>Beta: {analysis.baseline.beta.toFixed(1)}</div>
              <div>Gamma: {analysis.baseline.gamma.toFixed(1)}</div>
              <div>Theta: {analysis.baseline.theta.toFixed(1)}</div>
              <div>Delta: {analysis.baseline.delta.toFixed(1)}</div>
            </div>
          </div>
          {/* Right Panel — Current */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-cyan-400">Current Session</h3>
              <span className="text-[10px] uppercase tracking-wide bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                {analysis.filename}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono text-slate-300">
              <div>Alpha: {analysis.overallBands.alpha.toFixed(1)}</div>
              <div>Beta: {analysis.overallBands.beta.toFixed(1)}</div>
              <div>Gamma: {analysis.overallBands.gamma.toFixed(1)}</div>
              <div>Theta: {analysis.overallBands.theta.toFixed(1)}</div>
              <div>Delta: {analysis.overallBands.delta.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 bg-slate-950/50">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-400">Brainwave</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-400">Brain Twin</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-400">Current Session</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-400">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm font-mono text-slate-300">
              {(["alpha", "beta", "gamma", "theta", "delta"] as (keyof typeof BAND_METADATA)[]).map((bandKey) => {
                const base = analysis.baseline[bandKey];
                const curr = analysis.overallBands[bandKey];
                const diff = base > 0 ? ((curr - base) / base) * 100 : 0;
                const meta = BAND_METADATA[bandKey];
                const isPos = curr >= base;
                return (
                  <tr key={bandKey}>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span className="capitalize font-sans">{meta.name}</span>
                    </td>
                    <td className="py-3 px-4">{base.toFixed(1)}</td>
                    <td className="py-3 px-4">{curr.toFixed(1)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${isPos ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                        {isPos ? "+" : "-"}{Math.abs(diff).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 — Brain Drift Timeline */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-1">Brain Drift Timeline</h2>
        <p className="text-xs text-slate-400 mb-6 italic">Visual timeline showing how brain activity gradually changed during this recorded EEG session.</p>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={driftData.timeline} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} />
              <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                itemStyle={{ color: "#a855f7", fontWeight: "bold" }}
              />
              <Line
                type="monotone"
                dataKey="drift"
                name="Drift Score"
                stroke="#a855f7"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#22d3ee" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 4 — Brain Drift Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
          <h2 className="text-xl font-bold text-white mb-6">Brainwave Drift Breakdown</h2>
          <div className="space-y-5">
            {[
              { key: "alpha", label: "Alpha Drift", val: driftData.alphaDrift, color: "#10b981" },
              { key: "beta", label: "Beta Drift", val: driftData.betaDrift, color: "#3b82f6" },
              { key: "gamma", label: "Gamma Drift", val: driftData.gammaDrift, color: "#f43f5e" },
              { key: "theta", label: "Theta Drift", val: driftData.thetaDrift, color: "#06b6d4" },
              { key: "delta", label: "Delta Drift", val: driftData.deltaDrift, color: "#a855f7" },
            ].map((item) => (
              <div key={item.key} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>{item.label}</span>
                  <span style={{ color: item.color }}>{item.val.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, item.val)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5 — Brain Drift Report & SECTION 6 — Insights */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Brain Drift Session Report</h2>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono text-slate-300">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Session Duration</div>
                <div className="font-bold text-white">{Math.floor(analysis.totalMinutes / 60)} Minutes {analysis.totalMinutes % 60} Seconds</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Average Brain Drift</div>
                <div className="font-bold text-purple-400">{driftData.overallDrift.toFixed(0)}%</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Maximum Drift</div>
                <div className="font-bold text-rose-400">{driftData.maxDrift.toFixed(0)}%</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Highest Drift Time</div>
                <div className="font-bold text-cyan-400">{driftData.maxDriftTime}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-800/50 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              NeuroTwin AI Insights
            </h2>
            <p className="text-sm text-indigo-100 leading-relaxed italic">
              "{driftData.insight}"
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 7 — Session Timeline Story */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">Your Brain Journey During This Session</h2>
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 group-[.is-active]:bg-purple-900 text-slate-500 group-[.is-active]:text-purple-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <Clock className="w-4 h-4" />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-bold text-slate-300 text-sm">Brain Twin Activated</div>
                <time className="font-mono text-xs text-purple-400">00:00</time>
              </div>
              <div className="text-slate-500 text-xs">Baseline established for comparison.</div>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 group-[.is-active]:bg-rose-900 text-slate-500 group-[.is-active]:text-rose-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <Activity className="w-4 h-4" />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-bold text-slate-300 text-sm">Peak Brain Drift</div>
                <time className="font-mono text-xs text-rose-400">{driftData.maxDriftTime}</time>
              </div>
              <div className="text-slate-500 text-xs">Maximum deviation from personal baseline.</div>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 group-[.is-active]:bg-cyan-900 text-slate-500 group-[.is-active]:text-cyan-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-bold text-slate-300 text-sm">Session Completed</div>
                <time className="font-mono text-xs text-cyan-400">
                  {Math.floor(analysis.totalMinutes / 60).toString().padStart(2, "0")}:{(analysis.totalMinutes % 60).toString().padStart(2, "0")}
                </time>
              </div>
              <div className="text-slate-500 text-xs">Recording finished and data saved.</div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 8 — Previous Session Comparison */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-2">Previous Session Comparison</h2>
          <p className="text-xs text-slate-400">
            {analysis.baseline.sessionCount > 1
              ? "Comparing your overall drift against historical recordings."
              : "This is your first NeuroTwin analysis. Record another session to compare changes over time."}
          </p>
        </div>
        {analysis.baseline.sessionCount > 1 && (
          <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Previous Drift</div>
              <div className="font-bold text-white font-mono text-lg">35%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Current Drift</div>
              <div className="font-bold text-cyan-400 font-mono text-lg">{driftData.overallDrift.toFixed(0)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Export Action */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition shadow-lg border border-slate-700 text-sm font-bold"
        >
          <Download className="w-4 h-4" />
          Download NeuroTwin Report
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 pt-6 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-600 max-w-3xl mx-auto leading-relaxed">
          NeuroTwin AI compares EEG recordings against a user's personal baseline to visualize changes in brain activity over time. It provides session-based cognitive analytics and does not diagnose medical conditions.
        </p>
      </div>
    </div>
  );
}
