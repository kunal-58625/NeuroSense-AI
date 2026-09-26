"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ModeToggle } from "./Theming/mode-toggle";
import { Badge } from "./ui/badge";
import { useTheme } from "next-themes";

const Navbar = ({ isDisplay }: { isDisplay: boolean }) => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ✅ Keep subjectId internally (DO NOT REMOVE)
  const [subjectId, setSubjectId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const id = localStorage.getItem("subjectId");
    setSubjectId(id);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div>
      <div className="top-0 md:left-0 md:right-0 flex backdrop-blur-sm justify-center py-[10px] border-b border-g items-center font-bold z-50">
        <div className="flex w-full max-w-screen mx-2 md:mx-4 justify-between items-center">

          {/* LEFT SIDE */}
          <div className="flex flex-row gap-2 items-center group">
            <Link href="/">
              <div className="font-rancho font-bold text-2xl duration-300 pl-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
                NeuroSense Ai
              </div>
            </Link>

            <Badge
              variant={"outline"}
              className="font-poppins tracking-wider font-thin h-fit rounded"
            >
              VSGT
            </Badge>

            {/* ❌ REMOVED SUBJECT ID DISPLAY */}
          </div>

          {/* CENTER NAVIGATION LINKS */}
          <div className="hidden md:flex items-center gap-1.5 text-xs">


            <Link
              href="/stream"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800/60 text-slate-300 hover:text-white transition font-semibold"
            >
              <span>📈</span>
              <span>Stream</span>
            </Link>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex gap-2 items-center">

            <ModeToggle disabled={!isDisplay} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Navbar;