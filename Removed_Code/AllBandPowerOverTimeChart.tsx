"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface BandConfig {
  key: string;
  name: string;
  nameWithFreq: string;
  freq: string;
  color: string;
  gradientId: string;
}

const BAND_DEFINITIONS: Record<string, Omit<BandConfig, "key">> = {
  delta: {
    name: "Delta",
    nameWithFreq: "Delta (0.5–4 Hz)",
    freq: "0.5–4 Hz",
    color: "#ef4444", // Red
    gradientId: "gradDelta",
  },
  theta: {
    name: "Theta",
    nameWithFreq: "Theta (4–8 Hz)",
    freq: "4–8 Hz",
    color: "#a855f7", // Purple
    gradientId: "gradTheta",
  },
  alpha: {
    name: "Alpha",
    nameWithFreq: "Alpha (8–13 Hz)",
    freq: "8–13 Hz",
    color: "#22c55e", // Green
    gradientId: "gradAlpha",
  },
  beta: {
    name: "Beta",
    nameWithFreq: "Beta (13–30 Hz)",
    freq: "13–30 Hz",
    color: "#3b82f6", // Blue
    gradientId: "gradBeta",
  },
  gamma: {
    name: "Gamma",
    nameWithFreq: "Gamma (30–45 Hz)",
    freq: "30–45 Hz",
    color: "#eab308", // Yellow
    gradientId: "gradGamma",
  },
};

interface AllBandPowerOverTimeChartProps {
  csvContent: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 dark:bg-gray-900/95 border border-gray-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs text-gray-200 min-w-[150px]">
        <p className="font-semibold text-gray-300 border-b border-gray-700/60 pb-1.5 mb-2">
          {Number(label) * 10}s
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-300">{entry.name}:</span>
              </div>
              <span className="font-mono font-bold text-white">
                {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function AllBandPowerOverTimeChart({ csvContent }: AllBandPowerOverTimeChartProps) {
  const { chartData, activeBands } = useMemo(() => {
    if (!csvContent || typeof csvContent !== "string") {
      return { chartData: [], activeBands: [] };
    }

    const lines = csvContent
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return { chartData: [], activeBands: [] };

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Identify minute column index
    let minuteIdx = headers.findIndex((h) => h.includes("minute"));
    if (minuteIdx === -1) {
      minuteIdx = headers.findIndex((h) => h === "min" || h === "t" || h === "time");
    }

    // Identify active bands in headers
    const detectedBands: BandConfig[] = [];
    const bandColumnMap: Record<string, number> = {};

    Object.keys(BAND_DEFINITIONS).forEach((bandKey) => {
      const colIdx = headers.findIndex((h) => h.includes(bandKey));
      if (colIdx !== -1) {
        detectedBands.push({
          key: bandKey,
          ...BAND_DEFINITIONS[bandKey],
        });
        bandColumnMap[bandKey] = colIdx;
      }
    });

    const parsedRows: Array<Record<string, any>> = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.trim());
      if (cells.length < headers.length) continue;

      const minuteVal =
        minuteIdx !== -1 && !isNaN(Number(cells[minuteIdx]))
          ? Number(cells[minuteIdx])
          : i;

      const rowObj: Record<string, any> = { minute: minuteVal };

      detectedBands.forEach((band) => {
        const colIdx = bandColumnMap[band.key];
        const val = parseFloat(cells[colIdx]);
        rowObj[band.key] = isNaN(val) ? 0 : val;
      });

      parsedRows.push(rowObj);
    }

    return { chartData: parsedRows, activeBands: detectedBands };
  }, [csvContent]);

  if (!chartData.length || !activeBands.length) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/50 text-center text-gray-500 mb-8">
        No band power time-series data available to plot.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-500/5 border border-white/10 mb-8">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse"></span>
          All Band Power over Time (%)
        </h2>
        <div className="text-xs text-gray-400 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-900/60 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700/50">
          {chartData.length} data points
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-80 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              {activeBands.map((band) => (
                <linearGradient
                  key={band.gradientId}
                  id={band.gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={band.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={band.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
            <XAxis
              dataKey="minute"
              stroke="#94a3b8"
              tickLine={false}
              interval={0}
              tickFormatter={(val) => `${Number(val) * 10}s`}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(val) => `${val}%`}
              stroke="#94a3b8"
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {activeBands.map((band) => (
              <Area
                key={band.key}
                type="monotone"
                dataKey={band.key}
                name={band.nameWithFreq}
                stroke={band.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${band.gradientId})`}
                stackId="1"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Color Legend Chips Below Chart */}
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
        {activeBands.map((band) => (
          <div
            key={band.key}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/60 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
          >
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: band.color }}
            />
            <span>{band.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
