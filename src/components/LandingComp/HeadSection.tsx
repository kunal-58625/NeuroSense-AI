"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useTheme } from "next-themes";
import Navbar from "../Navbar";
import '../../app/globals.css'


const HeadSection: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        setCurrentTheme(resolvedTheme);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mounted, resolvedTheme]);

  if (!mounted) return null;

  return (
    <>
      <Navbar isDisplay={true} />
      <section className="w-full flex items-center justify-center px-4 sm:px-10 md:px-8 lg:px-6 mt-12 sm:mt-10">
        <div className="sm:px-6 md:px-8 space-y-4 sm:space-y-8 md:space-y-10 lg:space-y-12 max-w-6xl mx-auto flex flex-col items-center justify-center">
          <div className="flex flex-col lg:flex-row justify-center items-center sm:gap-8 md:gap-10 lg:gap-12 w-full">

            {/* Text Section */}
            <div className="w-full md:px-8 lg:px-0 lg:w-1/2 lg:text-left">
              <div className="text-base sm:text-lg lg:text-[1rem] md:text-3xl xl:text-[2.5rem] font-bold tracking-tighter font-lobster">
                <span className="block text-base sm:text-lg text-gray-500 transition tracking-wider">
                  Hi, Welcome to NeuroSense Ai
                </span>
 
                <span className="inline-block bg-clip-text font-lobster cursor-default tracking-wide mr-1 duration-300 transition-all text-xl sm:text-xl lg:text-[2rem] leading-tight sm:leading-none mt-1">
                  Tune Into Your EXG Data
                </span>

                <div className="block">
      <span className="inline-block text-lg sm:text-xl lg:text-[2rem] mr-2 tracking-wide duration-300 transition-all leading-tight sm:leading-none">
        With
      </span>
      <span className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent text-xl sm:text-xl lg:text-[2rem] bg-clip-text font-lobster cursor-default tracking-wide duration-300 transition-all leading-tight sm:leading-none">
        NeuroSense Ai
      </span></div>

                <div className="w-full text-sm text-gray-500 dark:text-gray-500 font-medium transition-all mt-3 sm:mt-3 tracking-wide">
                  <span className="inline">Transform biopotential signals into clear, insightful visuals, enabling deeper </span>
                  <span className="inline">understanding of physiological patterns and processes.</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center items-center sm:justify-start md:justify-start gap-3 sm:gap-5 space-y-0 my-5">
                <Link href="/stream?autoConnect=true">
                  <Button className="sm:flex items-center justify-center py-2 px-4 sm:py-2 sm:px-6 rounded-xl font-semibold">
                    <Image
                      src={currentTheme === "dark" ? "./assets/dark/favicon.ico" : "./assets/light/favicon.ico"}
                      width={16}
                      height={16}
                      alt="logo"
                      className="mr-2"
                    />
                    <span>Visualize Now</span>
                  </Button>
                </Link>
                <Link href="/analysis?demo=true">
                  <Button variant="outline" className="py-2 px-4 sm:py-2 sm:px-6 rounded-xl font-semibold border-indigo-500/50 text-indigo-400 hover:bg-indigo-950/50">
                    <span className="mr-2">⚡</span>
                    <span>Try Demo EEG</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Device Showcase Section */}
            <div className="w-full md:px-8 lg:px-0 lg:w-1/2 flex flex-col justify-center items-center relative min-h-[350px]">
              {/* Glowing Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl rounded-full" />
              
              {/* Device Image */}
              <div className="relative z-10 w-full max-w-[320px] aspect-square rounded-full border border-indigo-500/30 bg-gradient-to-b from-gray-900/80 to-black/80 shadow-2xl flex items-center justify-center p-8 backdrop-blur-sm animate-pulse">
                <Image 
                  src="/EEG_CAP.png" 
                  alt="NeuroSense AI EEG Cap" 
                  width={400} 
                  height={400} 
                  className="w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(99,102,241,0.5)] transform hover:scale-105 transition duration-500"
                />
              </div>

              {/* Floating Innovation Badges */}
              <div className="absolute top-4 right-0 lg:-right-4 bg-gray-950/80 border border-gray-800 text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 transform translate-y-2 animate-bounce delay-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-gray-200">Live AI Analysis</span>
              </div>
              
              <div className="absolute bottom-10 left-0 lg:-left-6 bg-gray-950/80 border border-indigo-900/50 text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 transform translate-y-2 animate-bounce delay-300">
                <span className="text-indigo-400">🧠</span>
                <span className="font-semibold text-indigo-300">NeuroTwin Brain Drift</span>
              </div>

              <div className="absolute bottom-4 right-4 lg:-right-2 bg-gray-950/80 border border-gray-800 text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 transform translate-y-2 animate-bounce delay-500">
                <span className="text-blue-400">⚡</span>
                <span className="font-semibold text-blue-300">Ultra-Low Latency</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default HeadSection;
