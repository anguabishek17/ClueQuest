import React from 'react';
import { Sparkles, AlertCircle, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoreMeterProps {
  currentValue: number; // 100, 75, 50, 25
  totalScore: number;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ currentValue, totalScore }) => {
  const tiers = [
    { level: 1, points: 100, label: 'CLUE 1' },
    { level: 2, points: 75, label: 'CLUE 2' },
    { level: 3, points: 50, label: 'CLUE 3' },
    { level: 4, points: 25, label: 'CLUE 4' },
  ];

  return (
    <div className="tech-card rounded-lg p-4 border border-cyan-500/30 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Current Question Value */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-center">
            <span className="block text-[10px] font-mono text-cyan-400 tracking-wider">CURRENT QUESTION VALUE</span>
            <div className="flex items-center justify-center gap-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentValue}
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl sm:text-3xl font-mono font-extrabold text-cyan-300"
                >
                  {currentValue}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs font-mono font-bold text-slate-400">PTS</span>
            </div>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {tiers.map((t) => {
              const isCurrent = t.points === currentValue;
              const isPast = t.points > currentValue;
              const isFuture = t.points < currentValue;

              return (
                <div
                  key={t.level}
                  className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyan-glow scale-105'
                      : isPast
                      ? 'bg-slate-900/60 border-slate-800 text-slate-500 line-through opacity-60'
                      : 'bg-navy-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-[9px] font-mono uppercase tracking-wider">{t.label}</span>
                  <span className="font-mono font-bold text-xs">{t.points} PTS</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Crucial Clarification Banner */}
        <div className="bg-navy-900/90 border border-slate-800 rounded p-2.5 max-w-sm text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-semibold mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TOTAL SCORE SAFE: {totalScore} PTS</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Revealing a clue only decreases the <strong className="text-cyan-300">potential reward</strong> of this question. Your already-earned total score remains locked.
          </p>
        </div>
      </div>
    </div>
  );
};
