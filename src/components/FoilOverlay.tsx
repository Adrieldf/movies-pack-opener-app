"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface FoilOverlayProps {
  compact?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const FoilOverlay: React.FC<FoilOverlayProps> = ({
  compact = false,
  showBadge = true,
  className = "",
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-20 ${className}`}
      aria-hidden="true"
    >
      {/* ── 1. Prismatic Rainbow Holographic Base Sheen ── */}
      <div
        className="absolute -inset-[50%] opacity-55 mix-blend-color-dodge animate-foil-rainbow"
        style={{
          background: `linear-gradient(
            115deg,
            transparent 10%,
            rgba(255, 0, 128, 0.4) 22%,
            rgba(0, 240, 255, 0.45) 36%,
            rgba(255, 235, 59, 0.5) 48%,
            rgba(168, 85, 247, 0.45) 60%,
            rgba(52, 211, 153, 0.4) 74%,
            transparent 90%
          )`,
          backgroundSize: "200% 200%",
        }}
      />

      {/* ── 2. Secondary Iridescent Specular Glaze (Cross-Angle) ── */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay animate-foil-rainbow"
        style={{
          background: `radial-gradient(
            circle at 50% 50%,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(236, 72, 153, 0.25) 30%,
            rgba(59, 130, 246, 0.25) 55%,
            rgba(250, 204, 21, 0.3) 80%,
            transparent 100%
          )`,
          backgroundSize: "180% 180%",
          animationDirection: "reverse",
          animationDuration: "8s",
        }}
      />

      {/* ── 3. Ultra-Crisp Diagonal Metallic Glare Beam ── */}
      <div
        className="absolute inset-y-0 -inset-x-[60%] animate-foil-glare mix-blend-overlay"
        style={{
          background: `linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 42%,
            rgba(255, 255, 255, 0.75) 49%,
            rgba(255, 245, 180, 0.95) 51%,
            rgba(255, 255, 255, 0.75) 53%,
            rgba(255, 255, 255, 0.1) 58%,
            transparent 70%
          )`,
        }}
      />

      {/* ── 4. Twinkling Starlight Glitter Particles ── */}
      <div className="absolute inset-0 select-none">
        {/* Top-left star */}
        <span
          className="absolute top-3 left-4 text-yellow-200 text-xs sm:text-sm drop-shadow-[0_0_6px_rgba(250,204,21,0.9)] animate-foil-sparkle"
          style={{ animationDelay: "0s" }}
        >
          ✦
        </span>
        {/* Top-right star */}
        <span
          className="absolute top-8 right-6 text-cyan-200 text-sm sm:text-base drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-foil-sparkle"
          style={{ animationDelay: "0.8s" }}
        >
          ✧
        </span>
        {/* Center-left sparkle */}
        <span
          className="absolute top-1/2 left-6 text-fuchsia-200 text-xs sm:text-sm drop-shadow-[0_0_6px_rgba(232,121,249,0.9)] animate-foil-sparkle"
          style={{ animationDelay: "1.4s" }}
        >
          ✦
        </span>
        {/* Bottom-right sparkle */}
        <span
          className="absolute bottom-16 right-5 text-amber-100 text-sm sm:text-base drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-foil-sparkle"
          style={{ animationDelay: "0.4s" }}
        >
          ✧
        </span>
        {/* Bottom-left star */}
        <span
          className="absolute bottom-6 left-8 text-emerald-200 text-xs drop-shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-foil-sparkle"
          style={{ animationDelay: "1.8s" }}
        >
          ✦
        </span>
      </div>

      {/* ── 5. Iridescent Outer Rim Frame ── */}
      <div
        className="absolute inset-0 rounded-xl border-2 pointer-events-none animate-foil-border"
        style={{
          borderColor: "rgba(255, 215, 0, 0.75)",
          boxShadow: `
            inset 0 0 14px rgba(236, 72, 153, 0.4),
            inset 0 0 28px rgba(59, 130, 246, 0.3),
            0 0 16px rgba(250, 204, 21, 0.6)
          `,
        }}
      />

      {/* ── 6. Holographic FOIL Badge ── */}
      {showBadge && (
        <div
          className={`absolute ${
            compact ? "bottom-1 left-1" : "bottom-3 left-3"
          } z-30 flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-300/80 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-foil-border`}
          style={{
            background: `linear-gradient(
              135deg,
              rgba(236, 72, 153, 0.85) 0%,
              rgba(147, 51, 234, 0.85) 50%,
              rgba(59, 130, 246, 0.85) 100%
            )`,
          }}
        >
          <Sparkles
            className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"} text-amber-200 animate-spin`}
            style={{ animationDuration: "6s" }}
          />
          <span
            className={`${
              compact ? "text-[8px]" : "text-[10px]"
            } font-black tracking-widest text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
          >
            FOIL
          </span>
        </div>
      )}
    </div>
  );
};
