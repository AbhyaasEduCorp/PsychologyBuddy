"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Wind, Play, X } from "lucide-react";

/* --------------------------------------------------
   PHASE LABELS
-------------------------------------------------- */
const phaseLabels = {
  inhale: "Inhale...",
  hold: "Hold...",
  exhale: "Exhale...",
  idle: "Take a Breath",
} as const;

type Phase = keyof typeof phaseLabels;

const MAX_CYCLES = 3;

export default function ExerciseCard() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [scale, setScale] = useState(1);
  const [cycleCount, setCycleCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* --------------------------------------------------
     RUN ONE FULL 4–7–8 BREATHING CYCLE
  -------------------------------------------------- */
  const runCycle = (currentCycle: number) => {
    setPhase("inhale");
    setScale(1.18);

    timerRef.current = setTimeout(() => {
      setPhase("hold");
      timerRef.current = setTimeout(() => {
        setPhase("exhale");
        setScale(1);

        timerRef.current = setTimeout(() => {
          if (currentCycle + 1 < MAX_CYCLES) {
            setCycleCount(currentCycle + 1);
            runCycle(currentCycle + 1);
          } else {
            setCycleCount(MAX_CYCLES);
            setIsBreathing(false);
            setPhase("idle");
            setScale(1);
            timerRef.current = setTimeout(() => {
              setShowModal(false);
            }, 2000);
          }
        }, 8000);
      }, 7000);
    }, 4000);
  };

  /* --------------------------------------------------
     START / STOP
  -------------------------------------------------- */
  const stop = () => {
    setIsBreathing(false);
    setPhase("idle");
    setScale(1);
    setShowModal(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleStart = () => {
    if (isBreathing) return stop();

    setCycleCount(0);
    setShowModal(true);
  };

  /* --------------------------------------------------
     START CYCLE AFTER MODAL MOUNTS
     The modal needs to render at idle (scale 1) first,
     then transition to inhale (scale 1.18) for the animation to work.
  -------------------------------------------------- */
  useEffect(() => {
    if (showModal && !isBreathing) {
      setIsBreathing(true);
      const t = setTimeout(() => runCycle(0), 100);
      return () => clearTimeout(t);
    }
  }, [showModal]);

  /* --------------------------------------------------
     CLEANUP
  -------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <div
      className="
        w-full 
        rounded-[12px] sm:rounded-[14px] md:rounded-[16px] p-6 sm:p-8 md:p-10
        bg-gradient-to-br from-[#e1caff]/50 to-[#f6efff]/50
        shadow-[0_4px_24px_rgba(120,80,220,0.10)]
        flex flex-col items-center 
        select-none
        backdrop-blur-xl
        border-2 border-white/40
      "
    >
      {/* Header */}
      <div className="w-full flex items-center gap-2 mb-4 sm:mb-6">
        <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-[#8038B1]" />
        <span className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#8038B1]">
          Today's Exercise: Deep Breathing
        </span>
      </div>

      {/* Title */}
      <h2 className="text-[16px] sm:text-[18px] md:text-[20px] font-semibold text-[#8038B1] tracking-wide mb-1">
        4-7-8 Breathing
      </h2>

      {/* Subtitle */}
      <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#7C7C7C] text-center mb-4 sm:mb-6">
        {cycleCount >= MAX_CYCLES
          ? "Great job! You've completed 3 breathing cycles."
          : "Follow the circle's rhythm."}
      </p>

      {/* CTA Button */}
      <button
        onClick={handleStart}
        className="
          flex items-center gap-2
          bg-gradient-to-r from-[#BC6EFF] to-[#6A8FFC]
          text-white font-medium 
          rounded-[12px] sm:rounded-[14px] md:rounded-[16px] px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 text-[13px] sm:text-[14px] md:text-[15px]
          drop-shadow-[0_4px_16px_rgba(124,58,237,0.35)]
          transition active:scale-95 hover:opacity-90
        "
      >
        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        {cycleCount >= MAX_CYCLES ? "Start Again" : "Start Breathing"}
      </button>

      {/* Breathing Modal — Full Screen (portal to body to escape backdrop-blur container) */}
      {showModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#e1caff]/70 to-[#f6efff]/70 select-none"
        >
          {/* Close Button */}
          <button
            onClick={stop}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[#8038B1] hover:opacity-70 transition"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Cycle Progress */}
          <div className="flex gap-2 mb-8 sm:mb-10">
            {Array.from({ length: MAX_CYCLES }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < cycleCount + 1 ? "bg-[#8038B1]" : "bg-[#8038B1]/20"
                }`}
              />
            ))}
          </div>

          {/* Breathing Visual */}
          <div className="relative w-[239px] h-[239px] flex items-center justify-center mb-8 sm:mb-10">
            {/* Outer Glow Ring */}
            <div
              className="absolute rounded-full bg-[#e2d6ffb8] transition-transform"
              style={{
                width: 219,
                height: 219,
                transform: `scale(${isBreathing ? scale * 1.08 : 1})`,
                transitionDuration:
                  phase === "inhale" ? "4000ms" : phase === "exhale" ? "8000ms" : "400ms",
              }}
            />

            {/* Mid Ring */}
            <div
              className="absolute rounded-full bg-[#DACDFF] transition-transform"
              style={{
                width: 191,
                height: 191,
                transform: `scale(${isBreathing ? scale * 1.05 : 1})`,
                transitionDuration:
                  phase === "inhale" ? "4000ms" : phase === "exhale" ? "8000ms" : "400ms",
              }}
            />
            <div
              className="absolute rounded-full bg-gradient-to-br from-[#B475EB] to-[#7994F2] transition-transform"
              style={{
                width: 156,
                height: 156,
                transform: `scale(${isBreathing ? scale * 1.05 : 1})`,
                transitionDuration:
                  phase === "inhale" ? "4000ms" : phase === "exhale" ? "8000ms" : "400ms",
              }}
            />

            {/* Main Circle */}
            <div
              className="absolute rounded-full flex items-center justify-center text-white font-semibold text-[18px] shadow-[0_8px_32px_rgba(139,92,246,0.45)] bg-gradient-to-br from-[#C97AFF] to-[#85B2FF] z-10 transition-transform"
              style={{
                width: 135,
                height: 135,
                transform: `scale(${isBreathing ? scale : 1})`,
                transitionDuration:
                  phase === "inhale" ? "4000ms" : phase === "exhale" ? "8000ms" : "400ms",
              }}
            >
              {phaseLabels[phase]}
            </div>
          </div>

          
          <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#8038B1] text-center font-medium mb-6">
            Follow the circle's rhythm. You're doing great.
          </p>

          {/* Stop Button */}
          <button
            onClick={stop}
            className="flex items-center gap-2 bg-gradient-to-r from-[#BC6EFF] to-[#6A8FFC] text-white font-medium rounded-[12px] sm:rounded-[14px] md:rounded-[16px] px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 text-[13px] sm:text-[14px] md:text-[15px] drop-shadow-[0_4px_16px_rgba(124,58,237,0.35)] transition active:scale-95 hover:opacity-90"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Stop Breathing
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

