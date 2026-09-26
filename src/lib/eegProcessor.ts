/**
 * NeuroSense AI - Personalized EEG Processing & Wellness Analytics Engine
 * Non-Clinical Wellness Research Prototype
 */

export interface EEGBandValues {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface EEGBandInfo {
  key: keyof EEGBandValues;
  name: string;
  english: string;
  freq: string;
  color: string;
  val: number;
  baselineVal?: number;
  changeVal?: number;
}

export type SignalQualityStatus = "GOOD" | "FAIR" | "POOR";

export interface MinuteAnalysis {
  minute: number;
  bands: EEGBandValues;
  dominantBand: keyof EEGBandValues;
  signalQuality: SignalQualityStatus;
  qualityReason?: string;
  stateLabel: string; // Neutral transition label
}

export interface EEGBaselineData {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
  sessionCount: number;
  lastUpdated: string;
}

export interface EEGAnalysisResult {
  filename: string;
  subjectId: string;
  totalMinutes: number;
  signalQuality: SignalQualityStatus;
  qualityExplanation: string;
  overallBands: EEGBandValues;
  dominantBandKey: keyof EEGBandValues;
  dominantBandLabel: {
    name: string;
    english: string;
    fullLabel: string;
  };
  minutes: MinuteAnalysis[];
  baseline: EEGBaselineData;
  baselineComparison: {
    bandKey: keyof EEGBandValues;
    current: number;
    baseline: number;
    change: number;
    formattedChange: string;
  }[];
  patternSimilarity: number; // 0 - 100 %
  patternChangeDetected: boolean;
  contributingBands: string[];
  explainableInsight: string;
  journeyMap: {
    minute: number;
    state: string;
    dominantBand: string;
    quality: SignalQualityStatus;
  }[];
  rawCSV: string;
  baselineFilename?: string;
  baselineMinutes?: MinuteAnalysis[];
  isBaselineFile?: boolean;
}

export const BAND_METADATA: Record<
  keyof EEGBandValues,
  { name: string; english: string; freq: string; color: string }
> = {
  delta: {
    name: "Delta",
    english: "Rest",
    freq: "0.5–4 Hz",
    color: "#ef4444",
  },
  theta: {
    name: "Theta",
    english: "Drowsiness",
    freq: "4–8 Hz",
    color: "#a855f7",
  },
  alpha: {
    name: "Alpha",
    english: "Calm",
    freq: "8–13 Hz",
    color: "#22c55e",
  },
  beta: {
    name: "Beta",
    english: "Focus",
    freq: "13–30 Hz",
    color: "#3b82f6",
  },
  gamma: {
    name: "Gamma",
    english: "Intense",
    freq: "30–45 Hz",
    color: "#eab308",
  },
};

/**
 * Parses raw EEG Bandpower CSV string or computes band powers
 */
export function parseAndAnalyzeEEG(
  csvContent: string,
  filename: string = "recording.csv",
  subjectId: string = "Subject-01",
  baselineCsvContent: string | null = null
): EEGAnalysisResult {
  const lines = csvContent
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Invalid CSV content: file is empty or missing data rows.");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  let minuteColIdx = headers.findIndex((h) => h.includes("second") || h === "sec" || h === "s");
  if (minuteColIdx === -1) minuteColIdx = headers.findIndex((h) => h.includes("minute") || h === "min" || h === "t");

  const bandColMap: Record<keyof EEGBandValues, number> = {
    delta: headers.findIndex((h) => h.includes("delta")),
    theta: headers.findIndex((h) => h.includes("theta")),
    alpha: headers.findIndex((h) => h.includes("alpha")),
    beta: headers.findIndex((h) => h.includes("beta")),
    gamma: headers.findIndex((h) => h.includes("gamma")),
  };

  const minutes: MinuteAnalysis[] = [];
  let totalDelta = 0,
    totalTheta = 0,
    totalAlpha = 0,
    totalBeta = 0,
    totalGamma = 0;
  let poorQualityCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    if (cells.length < 3) continue;

    const minuteVal =
      minuteColIdx !== -1 && !isNaN(Number(cells[minuteColIdx]))
        ? Number(cells[minuteColIdx])
        : i;

    const getVal = (key: keyof EEGBandValues) => {
      const idx = bandColMap[key];
      if (idx === -1 || !cells[idx]) return 0;
      const v = parseFloat(cells[idx]);
      return isNaN(v) ? 0 : Math.max(0, v);
    };

    const d = getVal("delta");
    const t = getVal("theta");
    const a = getVal("alpha");
    const b = getVal("beta");
    const g = getVal("gamma");

    const sum = d + t + a + b + g;
    let relD = sum > 0 ? (d / sum) * 100 : 0;
    let relT = sum > 0 ? (t / sum) * 100 : 0;
    let relA = sum > 0 ? (a / sum) * 100 : 0;
    let relB = sum > 0 ? (b / sum) * 100 : 0;
    let relG = sum > 0 ? (g / sum) * 100 : 0;

    // If numbers are already pre-normalized to ~100
    if (d > 1 || t > 1 || a > 1 || b > 1 || g > 1) {
      const total = d + t + a + b + g;
      relD = Number(((d / total) * 100).toFixed(2));
      relT = Number(((t / total) * 100).toFixed(2));
      relA = Number(((a / total) * 100).toFixed(2));
      relB = Number(((b / total) * 100).toFixed(2));
      relG = Number(((g / total) * 100).toFixed(2));
    }

    const bandEntries: [keyof EEGBandValues, number][] = [
      ["delta", relD],
      ["theta", relT],
      ["alpha", relA],
      ["beta", relB],
      ["gamma", relG],
    ];

    bandEntries.sort((x, y) => y[1] - x[1]);
    const dominantBand = bandEntries[0][0];

    // Signal Quality Check for minute segment
    let signalQuality: SignalQualityStatus = "GOOD";
    let qualityReason = "Optimal amplitude & frequency response";

    if (sum === 0 || isNaN(sum)) {
      signalQuality = "POOR";
      qualityReason = "Signal flatline or missing data";
      poorQualityCount++;
    } else if (relD > 90 || relG > 80) {
      signalQuality = "POOR";
      qualityReason = "Excessive high-amplitude movement or muscle artifact detected";
      poorQualityCount++;
    } else if (relD > 75 || relB > 70) {
      signalQuality = "FAIR";
      qualityReason = "Minor noise artifact present";
    }

    // Determine neutral state label
    let stateLabel = "Stable pattern";
    if (dominantBand === "delta" || dominantBand === "theta") {
      stateLabel = "Low-activity pattern";
    } else if (dominantBand === "beta" || dominantBand === "gamma") {
      stateLabel = "Active pattern";
    }

    if (i > 1) {
      const prev = minutes[minutes.length - 1];
      if (prev && Math.abs(prev.bands[dominantBand] - relD) > 20) {
        stateLabel = "Pattern transition";
      }
    }

    minutes.push({
      minute: minuteVal,
      bands: { delta: relD, theta: relT, alpha: relA, beta: relB, gamma: relG },
      dominantBand,
      signalQuality,
      qualityReason,
      stateLabel,
    });

    totalDelta += relD;
    totalTheta += relT;
    totalAlpha += relA;
    totalBeta += relB;
    totalGamma += relG;
  }

  const len = Math.max(1, minutes.length);
  const avgDelta = Number((totalDelta / len).toFixed(2));
  const avgTheta = Number((totalTheta / len).toFixed(2));
  const avgAlpha = Number((totalAlpha / len).toFixed(2));
  const avgBeta = Number((totalBeta / len).toFixed(2));
  const avgGamma = Number((totalGamma / len).toFixed(2));

  const overallBands: EEGBandValues = {
    delta: avgDelta,
    theta: avgTheta,
    alpha: avgAlpha,
    beta: avgBeta,
    gamma: avgGamma,
  };

  const bandEntries: [keyof EEGBandValues, number][] = [
    ["delta", avgDelta],
    ["theta", avgTheta],
    ["alpha", avgAlpha],
    ["beta", avgBeta],
    ["gamma", avgGamma],
  ];
  bandEntries.sort((x, y) => y[1] - x[1]);
  const dominantBandKey = bandEntries[0][0];
  const domMeta = BAND_METADATA[dominantBandKey];

  // Overall Signal Quality
  let overallQuality: SignalQualityStatus = "GOOD";
  let qualityExplanation =
    "EEG signal quality is high with clean bandpower separation across segments.";

  if (poorQualityCount > len / 3) {
    overallQuality = "POOR";
    qualityExplanation =
      "Low-confidence EEG session: several minutes contain significant artifacts or noise.";
  } else if (poorQualityCount > 0) {
    overallQuality = "FAIR";
    qualityExplanation =
      "Fair signal quality: minor motion artifacts detected in portion of the session.";
  }

  // Baseline Retrieval & Comparison (Subject ID wise - First recording)
  let baseline: EEGBaselineData;
  if (baselineCsvContent && baselineCsvContent.trim() !== csvContent.trim()) {
    const baselineParsed = parseAndAnalyzeEEG(baselineCsvContent, "baseline.csv", subjectId, null);
    baseline = {
      delta: baselineParsed.overallBands.delta,
      theta: baselineParsed.overallBands.theta,
      alpha: baselineParsed.overallBands.alpha,
      beta: baselineParsed.overallBands.beta,
      gamma: baselineParsed.overallBands.gamma,
      sessionCount: 2, // Indicates comparison against baseline
      lastUpdated: new Date().toISOString()
    };
  } else {
    // If it's the first file itself, use its own data as baseline
    baseline = {
      delta: overallBands.delta,
      theta: overallBands.theta,
      alpha: overallBands.alpha,
      beta: overallBands.beta,
      gamma: overallBands.gamma,
      sessionCount: 1, // First session
      lastUpdated: new Date().toISOString()
    };
  }

  const baselineComparison = (
    ["delta", "theta", "alpha", "beta", "gamma"] as (keyof EEGBandValues)[]
  ).map((bandKey) => {
    const curr = overallBands[bandKey];
    const base = baseline[bandKey];
    const chg = Number((curr - base).toFixed(2));
    return {
      bandKey,
      current: curr,
      baseline: base,
      change: chg,
      formattedChange: chg >= 0 ? `+${chg}%` : `${chg}%`,
    };
  });

  // Mathematically calculated Pattern Similarity % (Cosine Similarity)
  const patternSimilarity = calculateCosineSimilarity(overallBands, baseline);

  // Pattern Change Detection
  const sortedByAbsChange = [...baselineComparison].sort(
    (a, b) => Math.abs(b.change) - Math.abs(a.change)
  );

  const patternChangeDetected = Math.abs(sortedByAbsChange[0].change) >= 2.0;

  const contributingBands = sortedByAbsChange.slice(0, 3).map((item) => {
    const meta = BAND_METADATA[item.bandKey];
    const arrow = item.change >= 0 ? "↑" : "↓";
    return `${meta.name} ${arrow} (${item.formattedChange})`;
  });

  // Explainable Insight
  const topChg1 = sortedByAbsChange[0];
  const topChg2 = sortedByAbsChange[1];
  const meta1 = BAND_METADATA[topChg1.bandKey];
  const meta2 = BAND_METADATA[topChg2.bandKey];

  let explainableInsight = `Current EEG composition closely aligns with your personal baseline pattern across all bands (${patternSimilarity}% similarity).`;

  if (patternChangeDetected) {
    explainableInsight = `Current EEG composition differs from your personal baseline mainly because ${meta1.name} ${
      topChg1.change >= 0 ? "increased" : "decreased"
    } (${topChg1.formattedChange}) and ${meta2.name} ${
      topChg2.change >= 0 ? "increased" : "decreased"
    } (${topChg2.formattedChange}).`;
  }

  // Journey Map
  const journeyMap = minutes.map((m) => ({
    minute: m.minute,
    state: m.stateLabel,
    dominantBand: BAND_METADATA[m.dominantBand].name,
    quality: m.signalQuality,
  }));

  // Parse baseline minutes from first file for side-by-side table comparison
  let baselineMinutes: MinuteAnalysis[] | undefined;
  if (baselineCsvContent && baselineCsvContent.trim() !== csvContent.trim()) {
    try {
      const baselineParsedFull = parseAndAnalyzeEEG(baselineCsvContent, "baseline.csv", subjectId, null);
      baselineMinutes = baselineParsedFull.minutes;
    } catch {
      baselineMinutes = undefined;
    }
  }

  return {
    filename,
    subjectId,
    totalMinutes: len,
    signalQuality: overallQuality,
    qualityExplanation,
    overallBands,
    dominantBandKey,
    dominantBandLabel: {
      name: domMeta.name,
      english: domMeta.english,
      fullLabel: `${domMeta.name} – ${domMeta.english}`,
    },
    minutes,
    baseline,
    baselineComparison,
    patternSimilarity,
    patternChangeDetected,
    contributingBands,
    explainableInsight,
    journeyMap,
    rawCSV: csvContent,
    baselineMinutes,
    isBaselineFile: !baselineCsvContent || baselineCsvContent.trim() === csvContent.trim(),
  };
}

/**
 * Calculates Cosine Similarity between two 5D EEG band vectors
 */
function calculateCosineSimilarity(
  vec1: EEGBandValues,
  vec2: EEGBandValues
): number {
  const v1 = [vec1.delta, vec1.theta, vec1.alpha, vec1.beta, vec1.gamma];
  const v2 = [vec2.delta, vec2.theta, vec2.alpha, vec2.beta, vec2.gamma];

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < 5; i++) {
    dotProduct += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }

  if (norm1 === 0 || norm2 === 0) return 100;

  const sim = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  return Math.round(Math.max(0, Math.min(100, sim * 100)));
}

/**
 * Manages personal EEG baselines stored in LocalStorage
 */
export function getOrUpdateBaseline(
  subjectId: string,
  newBands?: EEGBandValues
): EEGBaselineData {
  const storageKey = `neurosense_baseline_${subjectId}`;
  const defaultBaseline: EEGBaselineData = {
    delta: 55.0,
    theta: 12.5,
    alpha: 5.0,
    beta: 17.5,
    gamma: 10.0,
    sessionCount: 1,
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window === "undefined") {
    return defaultBaseline;
  }

  try {
    const raw = localStorage.getItem(storageKey);
    let currentBaseline: EEGBaselineData = raw ? JSON.parse(raw) : defaultBaseline;

    if (newBands) {
      const n = currentBaseline.sessionCount;
      const updated: EEGBaselineData = {
        delta: Number(((currentBaseline.delta * n + newBands.delta) / (n + 1)).toFixed(2)),
        theta: Number(((currentBaseline.theta * n + newBands.theta) / (n + 1)).toFixed(2)),
        alpha: Number(((currentBaseline.alpha * n + newBands.alpha) / (n + 1)).toFixed(2)),
        beta: Number(((currentBaseline.beta * n + newBands.beta) / (n + 1)).toFixed(2)),
        gamma: Number(((currentBaseline.gamma * n + newBands.gamma) / (n + 1)).toFixed(2)),
        sessionCount: n + 1,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    }

    return currentBaseline;
  } catch (e) {
    console.error("Baseline storage error:", e);
    return defaultBaseline;
  }
}
