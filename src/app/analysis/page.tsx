"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AllBandPowerOverTimeChart from "@/components/AllBandPowerOverTimeChart";
import PersonalNeuroPrintRadar from "@/components/PersonalNeuroPrintRadar";
import EEGJourneyMap from "@/components/EEGJourneyMap";
import { parseAndAnalyzeEEG, EEGAnalysisResult, BAND_METADATA } from "@/lib/eegProcessor";
import { DemoEEGDataSource } from "@/lib/eegDataSource";
import dynamic from "next/dynamic";
import NeuroTwinAnalysis from "@/components/NeuroTwinAnalysis";



function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = searchParams.get("subjectId") || "Subject-01";
  const filename = searchParams.get("filename") || "Demo-EEG-Recording.csv";
  const isDemo = searchParams.get("demo") === "true";

  // Analysis results
  const [analysis, setAnalysis] = useState<EEGAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baselineFilename, setBaselineFilename] = useState<string | null>(null);
  const [isBaselineFile, setIsBaselineFile] = useState<boolean>(true);

  // Baseline Picker Modal state
  const [subjectFiles, setSubjectFiles] = useState<string[]>([]);
  const [showBaselinePicker, setShowBaselinePicker] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(true);
  const [selectedBaseline, setSelectedBaseline] = useState<string>("");
  const [analysisStarted, setAnalysisStarted] = useState(false);

  // Step 1: On load, fetch only this subject's files and show picker
  useEffect(() => {
    if (isDemo) {
      // Demo mode: skip picker, run directly
      setAnalysisStarted(true);
      return;
    }

    setPickerLoading(true);
    fetch(`/api/subject-files?subjectId=${subjectId}`)
      .then((r) => r.json())
      .then((data) => {
        const files: string[] = data.files || [];
        setSubjectFiles(files);
        // If only 1 file, no need to ask — it IS the baseline
        if (files.length <= 1) {
          setSelectedBaseline(filename);
          setAnalysisStarted(true);
        } else {
          // Pre-select: if current file isn't the first, default baseline = first file
          const defaultBaseline = files[0] !== filename ? files[0] : (files[1] || files[0]);
          setSelectedBaseline(defaultBaseline);
          setShowBaselinePicker(true);
        }
        setPickerLoading(false);
      })
      .catch(() => {
        // Fallback: just run analysis without baseline
        setAnalysisStarted(true);
        setPickerLoading(false);
      });
  }, [subjectId, filename, isDemo]);

  // Step 2: When analysis starts (after baseline is chosen), fetch & parse
  useEffect(() => {
    if (!analysisStarted) return;

    setLoading(true);
    setError(null);

    if (isDemo) {
      const demoSource = new DemoEEGDataSource();
      demoSource.getData().then((csv) => {
        try {
          const res = parseAndAnalyzeEEG(csv, "Demo-EEG-Recording.csv", "DemoSubject");
          setAnalysis(res);
          setLoading(false);
        } catch (e: any) {
          setError(e.message);
          setLoading(false);
        }
      });
      return;
    }

    const chosenBaseline = selectedBaseline !== filename ? selectedBaseline : "";
    const url = `/api/analysis-data?subjectId=${subjectId}&filename=${filename}${chosenBaseline ? `&baselineFilename=${encodeURIComponent(chosenBaseline)}` : ""}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analysis data");
        return res.json();
      })
      .then((res) => {
        if (res.error) throw new Error(res.error);
        if (!res.bandpower) throw new Error("No band power data returned");

        const parsed = parseAndAnalyzeEEG(res.bandpower, filename, subjectId, res.baselineBandpower);
        setAnalysis(parsed);
        setBaselineFilename(res.baselineFilename || null);
        setIsBaselineFile(res.isBaselineFile ?? true);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch/Analysis error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [analysisStarted]);

  const handleBaselineConfirm = () => {
    setShowBaselinePicker(false);
    setAnalysisStarted(true);
  };

  const loadDemo = () => {
    router.push("/analysis?demo=true");
  };

  // --- Baseline Picker Modal ---
  if (pickerLoading && !isDemo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-500 border-t-transparent mb-6"></div>
        <p className="text-gray-300 font-semibold text-xl tracking-wide">Loading recordings for {subjectId}…</p>
      </div>
    );
  }

  if (showBaselinePicker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
        <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🧠</span>
            <div>
              <h1 className="text-xl font-extrabold text-white">Select Baseline Recording</h1>
              <p className="text-xs text-gray-400 font-mono mt-0.5">Subject: <span className="text-purple-400 font-bold">{subjectId}</span></p>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-6 mt-3 leading-relaxed">
            You have <span className="text-white font-bold">{subjectFiles.length} recordings</span> for this subject.
            Choose which file is your <span className="text-indigo-300 font-semibold">Baseline</span> (first/resting session).
            The currently selected file <span className="text-cyan-300 font-semibold">({filename})</span> will be your <span className="text-cyan-300 font-semibold">Post Session</span>.
          </p>

          {/* Current file badge */}
          <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-800/50 rounded-xl px-4 py-2.5 mb-5 text-sm">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
            <span className="text-cyan-300 font-semibold">Post Session (selected):</span>
            <span className="font-mono text-white ml-auto">{filename}</span>
          </div>

          {/* Baseline picker */}
          <div className="mb-6">
            <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-3">
              Choose Baseline File
            </label>
            <div className="space-y-2">
              {subjectFiles
                .filter((f) => f !== filename)
                .map((f) => (
                  <label
                    key={f}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      selectedBaseline === f
                        ? "border-indigo-500 bg-indigo-950/40 text-white"
                        : "border-gray-700 bg-gray-950/50 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="baseline"
                      value={f}
                      checked={selectedBaseline === f}
                      onChange={() => setSelectedBaseline(f)}
                      className="accent-indigo-500"
                    />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                    <span className="font-mono text-sm flex-1">{f}</span>
                    {subjectFiles[0] === f && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">
                        First Recording
                      </span>
                    )}
                  </label>
                ))}
            </div>
            {subjectFiles.filter((f) => f !== filename).length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                No other recordings found for {subjectId}.
              </div>
            )}
          </div>

          {/* Comparison preview */}
          {selectedBaseline && selectedBaseline !== filename && (
            <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 mb-6 text-xs font-mono text-gray-400">
              <span className="text-indigo-400 font-bold">Baseline</span>
              <span className="font-mono text-white">{selectedBaseline}</span>
              <span className="mx-1 text-gray-600">→</span>
              <span className="text-cyan-400 font-bold">Post</span>
              <span className="font-mono text-white">{filename}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleBaselineConfirm}
              disabled={!selectedBaseline}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              Confirm &amp; Analyze →
            </button>
            <button
              onClick={() => { setSelectedBaseline(filename); setShowBaselinePicker(false); setAnalysisStarted(true); }}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-semibold rounded-xl transition border border-gray-700 text-sm"
            >
              Skip
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-4">
            Skip = analyze without baseline comparison (single session view)
          </p>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-500 border-t-transparent mb-6"></div>
        <p className="text-gray-300 font-semibold text-xl tracking-wide">
          Processing NeuroSense AI Analysis...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Filtering artifact noise, computing Welch PSD, baseline comparison & NeuroPrint...
        </p>
      </div>
    );

  if (error || !analysis)
    return (
      <div className="min-h-screen bg-gray-950 p-10 flex flex-col items-center justify-center text-center">
        <div className="bg-red-950/40 border border-red-800 rounded-3xl p-8 max-w-lg shadow-2xl">
          <h1 className="text-2xl font-extrabold text-red-500 mb-3">Analysis Error</h1>
          <p className="text-gray-300 mb-6 text-sm">
            {error || "Unable to analyze this EEG file. Please check that the file contains valid EEG data."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={loadDemo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-lg"
            >
              Load Demo EEG Recording
            </button>
            <button
              onClick={() => window.close()}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold px-6 py-2.5 rounded-xl transition border border-gray-700"
            >
              Close Tab & Return
            </button>
          </div>
        </div>
      </div>
    );

  const getQualityBadgeColor = (q: string) => {
    switch (q) {
      case "GOOD":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/40";
      case "FAIR":
        return "bg-amber-500/10 text-amber-400 border-amber-500/40";
      default:
        return "bg-red-500/10 text-red-400 border-red-500/40";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                EEG Analysis Dashboard
              </h1>
              {isDemo && (
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full font-bold border border-indigo-500/40">
                  Demo EEG Data
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm font-mono mt-1">
              Source: <span className="text-gray-200">{analysis.filename}</span> | Subject: <span className="text-gray-200">{analysis.subjectId}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              onClick={loadDemo}
              className="bg-indigo-600/90 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition text-sm font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              ⚡ Try Demo EEG
            </button>
            <button
              onClick={() => window.close()}
              className="inline-flex items-center gap-2 bg-gray-800 text-gray-200 px-5 py-2.5 rounded-xl border border-gray-700 shadow-sm hover:bg-gray-700 transition font-semibold text-sm"
            >
              × Close Analysis Tab
            </button>
          </div>
        </div>

        {/* Low Confidence Warning if Poor Quality */}
        {analysis.signalQuality === "POOR" && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl flex items-center gap-4 text-amber-200 text-sm">
            <span className="text-2xl">⚠️</span>
            <div>
              <span className="font-bold text-amber-400">Low-confidence EEG segment: </span>
              {analysis.qualityExplanation}
            </div>
          </div>
        )}

        {/* Top Overview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Signal Quality & Dominant Band Card */}
          <div className="bg-gray-900/90 rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">
                Signal Quality
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xl font-extrabold px-3.5 py-1 rounded-xl border ${getQualityBadgeColor(analysis.signalQuality)}`}>
                  {analysis.signalQuality}
                </span>
                <span className="text-xs font-mono text-gray-500">
                  {analysis.totalMinutes > 30
                    ? `${analysis.totalMinutes}s (${(analysis.totalMinutes / 60).toFixed(1)} min)`
                    : `${analysis.totalMinutes} min segment`}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                {analysis.qualityExplanation}
              </p>

              <div className="pt-4 border-t border-gray-800">
                <div className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">
                  Dominant Band Pattern
                </div>
                <div className="text-xl font-bold text-white flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: BAND_METADATA[analysis.dominantBandKey].color }}
                  />
                  <span>{analysis.dominantBandLabel.fullLabel}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-gray-800/60 text-[10px] text-gray-500 italic">
              * Non-clinical wellness monitoring research prototype.
            </div>
          </div>

          {/* Personal Baseline Comparison Card */}
          <div className="bg-gray-900/90 rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase font-bold tracking-wider text-gray-400">
                  {subjectId} — Baseline vs Post
                </div>
                <div className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800">
                  {isBaselineFile ? "Session #1 (Baseline)" : "Comparing File 1 vs File 2"}
                </div>
              </div>

              <div className="space-y-2.5">
                {analysis.baselineComparison.map((item) => {
                  const meta = BAND_METADATA[item.bandKey];
                  const isPositive = item.change >= 0;
                  return (
                    <div
                      key={item.bandKey}
                      className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-gray-950/60 border border-gray-800/80"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="font-semibold text-gray-200">{meta.name}</span>
                        <span className="text-gray-500 font-mono text-[10px]">({meta.freq})</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-gray-400">{item.current.toFixed(1)}%</span>
                        <span className="text-gray-600">vs {item.baseline.toFixed(1)}%</span>
                        <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-purple-400"}`}>
                          {item.formattedChange}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500 text-center">
              {isBaselineFile
                ? `${subjectId} — First recording (baseline). Record another session to see changes.`
                : `${subjectId} — File 1 (baseline): ${baselineFilename || "first recording"} vs File 2 (current)`}
            </div>
          </div>

          {/* Explainable Insights & Pattern Change Card */}
          <div className="bg-gray-900/90 rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-3">
                EEG Pattern Change & Insight
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${analysis.patternChangeDetected ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                  <span className="text-sm font-bold text-gray-200">
                    {analysis.patternChangeDetected ? "Significant Pattern Change Detected" : "Pattern Stable vs Baseline"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 my-2">
                  {analysis.contributingBands.map((bandTag, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-300"
                    >
                      {bandTag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl text-xs text-indigo-200 leading-relaxed">
                "{analysis.explainableInsight}"
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500">
              * Feature-based algorithmic pattern comparison
            </div>
          </div>
        </div>



        {/* Middle Row: Personal NeuroPrint Radar Chart */}
        <PersonalNeuroPrintRadar
          currentBands={analysis.overallBands}
          baselineBands={analysis.baseline}
          patternSimilarity={analysis.patternSimilarity}
        />

        {/* All Band Power over Time (%) AreaChart */}
        <AllBandPowerOverTimeChart csvContent={analysis.rawCSV} />

        {/* EEG Journey Map */}
        <EEGJourneyMap journeyMap={analysis.journeyMap} />

        {/* CSV Data Table — Subject-ID-wise Baseline vs Post */}
        <div className="bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-800 shadow-xl">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              All Recorded Data Points: Band Power Table (%)
              <span className="text-sm font-mono font-normal text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800">
                {subjectId}
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
              {!isBaselineFile && analysis.baselineMinutes && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 inline-block" />
                  Baseline: {baselineFilename}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                {isBaselineFile ? "Current (Baseline)" : `Post: ${filename}`}
              </span>
              <span>{analysis.minutes.length} data points</span>
            </div>
          </div>

          {/* If comparing two files: show ONE unified side-by-side table */}
          {!isBaselineFile && analysis.baselineMinutes ? (
            (() => {
              // Only show rows that exist in BOTH files (shared time range)
              const postLen = analysis.minutes.length;
              const baseLen = analysis.baselineMinutes.length;
              const sharedLen = Math.min(postLen, baseLen);
              const baselineRows = analysis.baselineMinutes.slice(0, sharedLen);
              const postRows = analysis.minutes.slice(0, sharedLen);
              return (
                <div>
                  {/* File pair legend */}
                  <div className="flex items-center gap-6 mb-4 p-3 bg-gray-950/60 rounded-xl border border-gray-800 text-xs font-mono flex-wrap">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      <span className="text-indigo-400 font-bold">BASELINE:</span>
                      <span className="text-gray-300">{baselineFilename}</span>
                    </span>
                    <span className="text-gray-700">|</span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-emerald-400 font-bold">POST:</span>
                      <span className="text-gray-300">{filename}</span>
                    </span>
                    <span className="ml-auto text-gray-600">
                      {sharedLen} shared rows
                      {postLen !== baseLen && (
                        <span className="ml-2 text-amber-500/70">
                          (Baseline: {baseLen} pts, Post: {postLen} pts — showing first {sharedLen})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-800">
                    <table className="min-w-full divide-y divide-gray-800 bg-gray-950 text-xs font-mono">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className="py-3 px-4 text-left text-gray-400 uppercase font-bold" rowSpan={2}>Time</th>
                          <th colSpan={5} className="py-2 px-4 text-center text-indigo-400 uppercase font-bold border-b border-indigo-900/50 bg-indigo-950/20">
                            ● Baseline — {baselineFilename}
                          </th>
                          <th colSpan={5} className="py-2 px-4 text-center text-emerald-400 uppercase font-bold border-b border-emerald-900/50 bg-emerald-950/20">
                            ● Post — {filename}
                          </th>
                          <th className="py-3 px-3 text-center text-gray-400 uppercase font-bold" rowSpan={2}>Δ Alpha</th>
                        </tr>
                        <tr>
                          <th className="py-2 px-3 text-left text-red-400 bg-indigo-950/10">Delta</th>
                          <th className="py-2 px-3 text-left text-purple-400 bg-indigo-950/10">Theta</th>
                          <th className="py-2 px-3 text-left text-green-400 bg-indigo-950/10">Alpha</th>
                          <th className="py-2 px-3 text-left text-blue-400 bg-indigo-950/10">Beta</th>
                          <th className="py-2 px-3 text-left text-yellow-400 bg-indigo-950/10">Gamma</th>
                          <th className="py-2 px-3 text-left text-red-400 bg-emerald-950/10">Delta</th>
                          <th className="py-2 px-3 text-left text-purple-400 bg-emerald-950/10">Theta</th>
                          <th className="py-2 px-3 text-left text-green-400 bg-emerald-950/10">Alpha</th>
                          <th className="py-2 px-3 text-left text-blue-400 bg-emerald-950/10">Beta</th>
                          <th className="py-2 px-3 text-left text-yellow-400 bg-emerald-950/10">Gamma</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {baselineRows.map((bm, idx) => {
                          const pm = postRows[idx];
                          if (!pm) return null;
                          const alphaDiff = (pm.bands.alpha - bm.bands.alpha);
                          return (
                            <tr key={bm.minute} className="hover:bg-gray-900/50 transition">
                              <td className="py-2.5 px-4 font-bold text-gray-300">{bm.minute}</td>
                              {/* Baseline columns */}
                              <td className="py-2.5 px-3 text-indigo-200/80 bg-indigo-950/5">{bm.bands.delta.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-indigo-200/80 bg-indigo-950/5">{bm.bands.theta.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-indigo-200/80 bg-indigo-950/5">{bm.bands.alpha.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-indigo-200/80 bg-indigo-950/5">{bm.bands.beta.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-indigo-200/80 bg-indigo-950/5">{bm.bands.gamma.toFixed(1)}%</td>
                              {/* Post columns */}
                              <td className="py-2.5 px-3 text-emerald-200/80 bg-emerald-950/5 border-l border-gray-800">{pm.bands.delta.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-emerald-200/80 bg-emerald-950/5">{pm.bands.theta.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-emerald-200/80 bg-emerald-950/5">{pm.bands.alpha.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-emerald-200/80 bg-emerald-950/5">{pm.bands.beta.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-emerald-200/80 bg-emerald-950/5">{pm.bands.gamma.toFixed(1)}%</td>
                              {/* Alpha diff */}
                              <td className={`py-2.5 px-3 font-bold border-l border-gray-800 ${alphaDiff > 0 ? "text-emerald-400" : alphaDiff < 0 ? "text-red-400" : "text-gray-500"}`}>
                                {alphaDiff >= 0 ? "+" : ""}{alphaDiff.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          ) : (
            /* Single table (first file = baseline session) */
            <div className="overflow-x-auto rounded-2xl border border-gray-800">
              <table className="min-w-full divide-y divide-gray-800 bg-gray-950">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="py-3.5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Time (s/m)</th>
                    <th className="py-3.5 px-6 text-left text-xs font-bold text-red-400 uppercase tracking-wider">Delta (0.5–4Hz)</th>
                    <th className="py-3.5 px-6 text-left text-xs font-bold text-purple-400 uppercase tracking-wider">Theta (4–8Hz)</th>
                    <th className="py-3.5 px-6 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Alpha (8–13Hz)</th>
                    <th className="py-3.5 px-6 text-left text-xs font-bold text-blue-400 uppercase tracking-wider">Beta (13–30Hz)</th>
                    <th className="py-3.5 px-6 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Gamma (30–45Hz)</th>
                    <th className="py-3.5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm font-mono">
                  {analysis.minutes.map((m) => (
                    <tr key={m.minute} className="hover:bg-gray-900/60 transition">
                      <td className="py-3.5 px-6 font-bold text-gray-300">{m.minute}</td>
                      <td className="py-3.5 px-6 text-gray-300">{m.bands.delta.toFixed(2)}%</td>
                      <td className="py-3.5 px-6 text-gray-300">{m.bands.theta.toFixed(2)}%</td>
                      <td className="py-3.5 px-6 text-gray-300">{m.bands.alpha.toFixed(2)}%</td>
                      <td className="py-3.5 px-6 text-gray-300">{m.bands.beta.toFixed(2)}%</td>
                      <td className="py-3.5 px-6 text-gray-300">{m.bands.gamma.toFixed(2)}%</td>
                      <td className="py-3.5 px-6">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getQualityBadgeColor(m.signalQuality)}`}>
                          {m.signalQuality}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NEW FEATURE: NeuroSense AI Brain Twin */}
        <NeuroTwinAnalysis analysis={analysis} subjectId={subjectId} baselineFilename={baselineFilename} isBaselineFile={isBaselineFile} />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  );
}
