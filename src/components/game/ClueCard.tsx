import React from 'react';
import { Lock, Eye, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClueCardProps {
  level: number;
  points: number;
  clueText?: string;
  isUnlocked: boolean;
  canUnlock: boolean;
  onUnlock?: () => void;
  isLoading?: boolean;
}

export const ClueCard: React.FC<ClueCardProps> = ({
  level,
  points,
  clueText,
  isUnlocked,
  canUnlock,
  onUnlock,
  isLoading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border transition-all ${
        isUnlocked
          ? 'bg-navy-900/90 border-cyan-500/40 shadow-sm'
          : canUnlock
          ? 'bg-navy-950/70 border-cyan-500/30 hover:border-cyan-400'
          : 'bg-navy-950/40 border-slate-800/60 opacity-60'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              CLUE 0{level}
            </span>
            <span className="font-mono text-xs font-bold text-slate-200">
              {points} POINTS
            </span>
          </div>

          <div>
            {isUnlocked ? (
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {level === 1 ? 'AVAILABLE' : 'REVEALED'}
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3" />
                LOCKED
              </span>
            )}
          </div>
        </div>

        {/* Content or Locked Action */}
        {isUnlocked ? (
          <div className="text-slate-200 text-sm sm:text-base leading-relaxed font-sans">
            {clueText}
          </div>
        ) : (
          <div className="py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-mono">
              {canUnlock
                ? `Need more technical hints? Unlocking reduces this question's reward to ${points} pts.`
                : `Unlock Clue 0${level - 1} first to access this hint.`}
            </p>
            {canUnlock && (
              <button
                onClick={onUnlock}
                disabled={isLoading}
                className="shrink-0 px-4 py-2 text-xs font-mono font-bold tracking-wider rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 hover:border-cyan-300 transition shadow-cyan-glow flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                {isLoading ? 'REVEALING...' : `REVEAL CLUE (${points} PTS)`}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
