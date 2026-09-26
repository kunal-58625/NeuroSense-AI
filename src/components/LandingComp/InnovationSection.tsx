"use client";
import React, { useState } from "react";
import Link from "next/link";

const innovations = [
  {
    icon: "🧠",
    label: "NeuroTwin AI",
    title: "Digital Brain Twin Technology",
    description:
      "Record a baseline EEG, then compare future sessions to track how your brain evolves over time. NeuroSense AI builds your unique cognitive fingerprint and flags drift across sessions — a world-first in consumer neuroscience.",
    badge: "AI Innovation",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    gradient: "from-purple-500/10 to-indigo-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    icon: "📊",
    label: "Brain Drift Timeline",
    title: "Session-by-Session Cognitive Drift",
    description:
      "Every EEG recording is stored, processed, and aligned on a timeline. See exactly how your Alpha, Beta, Theta, Delta and Gamma waves shift across recordings — presented in beautiful charts.",
    badge: "Real-time Analytics",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    gradient: "from-cyan-500/10 to-blue-500/10",
    borderColor: "border-cyan-500/30",
  },
  {
    icon: "⚡",
    label: "Live Bluetooth EEG",
    title: "Ultra-Low Latency Wireless Streaming",
    description:
      "Our EEG cap connects wirelessly via Bluetooth and streams raw brainwave data in real-time directly to your browser — no software installs, no drivers. Just a browser.",
    badge: "Hardware Innovation",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    gradient: "from-amber-500/10 to-orange-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    icon: "🎯",
    label: "AI Signal Analysis",
    title: "Automated EEG Interpretation",
    description:
      "Our AI engine automatically classifies your EEG signal quality (GOOD / FAIR / POOR), computes band-power per minute, and generates a plain-language summary of your dominant brainwave state.",
    badge: "Machine Learning",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    gradient: "from-emerald-500/10 to-teal-500/10",
    borderColor: "border-emerald-500/30",
  },
];

const steps = [
  {
    num: "01",
    title: "Wear the EEG Cap",
    desc: "Put on the NeuroSense EEG cap. Electrodes self-position over the frontal lobe. No gel, no prep.",
    icon: "🎩",
  },
  {
    num: "02",
    title: "Connect via Bluetooth",
    desc: "Click 'Visualize Now'. The browser instantly opens the Bluetooth pairing dialog to connect your cap wirelessly.",
    icon: "📡",
  },
  {
    num: "03",
    title: "Stream & Record",
    desc: "See your brainwaves live on screen. Press Record to capture the session. The timer, signal quality and band-power update in real time.",
    icon: "🔴",
  },
  {
    num: "04",
    title: "Analyze & Compare",
    desc: "Click Analyze on any saved recording. Choose a baseline and see the AI-powered Brain Drift comparison side-by-side.",
    icon: "🧬",
  },
];

const stats = [
  { value: "5", unit: "EEG Bands", label: "Alpha · Beta · Theta · Delta · Gamma" },
  { value: "500", unit: "Hz", label: "Ultra-high sampling rate" },
  { value: "100%", unit: "Browser", label: "No software install required" },
  { value: "1s", unit: "Per Segment", label: "High-resolution analysis" },
];

export default function InnovationSection() {
  const [activeInnovation, setActiveInnovation] = useState(0);

  return (
    <>
      {/* ─── STATS STRIP ─── */}
      <section className="w-full py-10 border-y border-gray-800 bg-gray-950/60 mt-4">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {s.value}
                </span>
                <span className="text-sm font-bold text-gray-400">{s.unit}</span>
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="w-full py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3 block">
            Workflow
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Get Started in{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              4 Simple Steps
            </span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            From hardware to AI-powered brain analysis — in under 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative flex flex-col gap-4 p-6 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-indigo-500/50 transition-all duration-300 group hover:-translate-y-1"
            >
              {/* Connector line for desktop */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 w-6 h-px bg-gradient-to-r from-gray-700 to-transparent translate-x-6 -translate-y-1/2 z-10" />
              )}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{step.icon}</span>
                <span className="text-xs font-black text-indigo-500/60 tracking-widest">{step.num}</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                {step.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── INNOVATIONS ─── */}
      <section className="w-full py-20 px-6 bg-gray-950/40 border-y border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest uppercase text-purple-400 mb-3 block">
              Innovation & Research
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              What Makes NeuroSense AI{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Unique
              </span>
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              We combine custom hardware, real-time signal processing, and machine learning to deliver a consumer-grade clinical EEG experience.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {innovations.map((inn, i) => (
              <button
                key={i}
                onClick={() => setActiveInnovation(i)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${
                  activeInnovation === i
                    ? "bg-indigo-600 border-indigo-500 text-white scale-105 shadow-lg shadow-indigo-500/20"
                    : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                {inn.icon} {inn.label}
              </button>
            ))}
          </div>

          {/* Active card */}
          <div
            className={`rounded-3xl border p-8 md:p-12 bg-gradient-to-br ${innovations[activeInnovation].gradient} ${innovations[activeInnovation].borderColor} transition-all duration-500`}
          >
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${innovations[activeInnovation].badgeColor} mb-6 inline-block`}
            >
              {innovations[activeInnovation].badge}
            </span>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="text-6xl">{innovations[activeInnovation].icon}</div>
              <div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                  {innovations[activeInnovation].title}
                </h3>
                <p className="text-gray-300 text-base leading-relaxed max-w-2xl">
                  {innovations[activeInnovation].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="w-full py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3 block">
            Core Features
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Study Your Brain
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "📈",
              title: "Live EEG Waveform",
              desc: "Multi-channel real-time oscilloscope display with adjustable time-base and zoom controls.",
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
            },
            {
              icon: "🌀",
              title: "FFT Spectrum Analyzer",
              desc: "Frequency-domain analysis of your brainwaves with live power spectrum visualization.",
              color: "text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20",
            },
            {
              icon: "💾",
              title: "Record & Save as CSV",
              desc: "One-click recording with a timer. Data saved locally per subject for later analysis.",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              icon: "🧠",
              title: "NeuroTwin Baseline Comparison",
              desc: "Choose any recorded file as your baseline and compare it side-by-side with a post session.",
              color: "text-pink-400",
              bg: "bg-pink-500/10 border-pink-500/20",
            },
            {
              icon: "🔬",
              title: "AI Band Power Analysis",
              desc: "AI computes per-second Alpha, Beta, Theta, Delta, Gamma band power with quality scoring.",
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
            },
            {
              icon: "🛜",
              title: "Bluetooth + Subject Database",
              desc: "Wireless EEG cap connection. All subject recordings organized by Subject ID in a local database.",
              color: "text-cyan-400",
              bg: "bg-cyan-500/10 border-cyan-500/20",
            },
          ].map((f, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-6 ${f.bg} hover:scale-[1.02] transition-transform duration-300 cursor-default`}
            >
              <div className={`text-3xl mb-4 ${f.color}`}>{f.icon}</div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="w-full py-16 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-indigo-950/80 via-purple-950/80 to-black/80 border border-indigo-800/50 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 relative">
            Ready to Explore{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Your Brain?
            </span>
          </h2>
          <p className="text-gray-400 mb-8 text-sm max-w-lg mx-auto relative">
            Connect your EEG cap in one click, start streaming live brainwaves, and let NeuroSense AI do the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
            <Link
              href="/stream?autoConnect=true"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:scale-105 flex items-center gap-2 justify-center"
            >
              🚀 Start Streaming
            </Link>
            <Link
              href="/analysis?demo=true"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold px-8 py-3 rounded-xl border border-gray-700 transition-all duration-200 hover:scale-105 flex items-center gap-2 justify-center"
            >
              ⚡ Try Demo EEG Analysis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
