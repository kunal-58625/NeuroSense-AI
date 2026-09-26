"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { EEGBandValues, BAND_METADATA } from "@/lib/eegProcessor";

interface NeuroPrintProps {
  currentBands: EEGBandValues;
  baselineBands: EEGBandValues;
  patternSimilarity: number;
}

export default function PersonalNeuroPrintRadar({
  currentBands,
  baselineBands,
  patternSimilarity,
}: NeuroPrintProps) {
  const pieData = [
    {
      name: "Delta",
      freq: "0.5–4 Hz",
      value: currentBands.delta,
      baseline: baselineBands.delta,
      color: BAND_METADATA.delta.color,
    },
    {
      name: "Theta",
      freq: "4–8 Hz",
      value: currentBands.theta,
      baseline: baselineBands.theta,
      color: BAND_METADATA.theta.color,
    },
    {
      name: "Alpha",
      freq: "8–13 Hz",
      value: currentBands.alpha,
      baseline: baselineBands.alpha,
      color: BAND_METADATA.alpha.color,
    },
    {
      name: "Beta",
      freq: "13–30 Hz",
      value: currentBands.beta,
      baseline: baselineBands.beta,
      color: BAND_METADATA.beta.color,
    },
    {
      name: "Gamma",
      freq: "30–45 Hz",
      value: currentBands.gamma,
      baseline: baselineBands.gamma,
      color: BAND_METADATA.gamma.color,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/5 border border-white/10 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Personal EEG NeuroPrint (Pie Chart)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current Session Spectral Distribution vs. Stored Personal Baseline
          </p>
        </div>

        {/* Pattern Similarity Badge */}
        <div className="flex items-center gap-3 bg-indigo-950/40 dark:bg-indigo-950/60 border border-indigo-700/50 px-4 py-2 rounded-2xl shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
              Pattern Similarity
            </div>
            <div className="text-xl font-black font-mono text-indigo-400">
              {patternSimilarity}%
            </div>
          </div>
          <div className="relative h-10 w-10 flex items-center justify-center">
            <svg className="h-10 w-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3"
                className="text-indigo-900/60"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={100}
                strokeDashoffset={100 - patternSimilarity}
                className="text-indigo-400 transition-all duration-1000 ease-out"
                fill="transparent"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="w-full h-80 min-h-[300px] relative my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={105}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#1e293b" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs text-white">
                      <p className="font-bold border-b border-gray-700 pb-1 mb-2 flex items-center gap-2" style={{ color: data.color }}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                        {data.name} Band ({data.freq})
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-400">Current Session:</span>
                          <span className="font-mono font-bold text-white">{data.value.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-400">Personal Baseline:</span>
                          <span className="font-mono font-bold text-indigo-300">{data.baseline.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-xs font-semibold text-gray-300 ml-1">
                  {value} ({entry.payload.freq})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Note */}
      <div className="text-[11px] text-gray-400 dark:text-gray-500 italic text-center pt-2 border-t border-gray-100 dark:border-gray-700/50">
        * Pie Chart displays relative power breakdown across Delta, Theta, Alpha, Beta, and Gamma frequency bands.
      </div>
    </div>
  );
}
