import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface TestTimerProps {
  deadlineAt?: string | null;
  serverNow?: string | null;
  onTimeUp?: () => void;
}

export const TestTimer: React.FC<TestTimerProps> = ({
  deadlineAt,
  serverNow,
  onTimeUp,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineAt) {
      setRemainingSeconds(null);
      return;
    }

    const deadlineMs = new Date(deadlineAt).getTime();
    const serverTimeMs = serverNow ? new Date(serverNow).getTime() : Date.now();
    const clientOffset = Date.now() - serverTimeMs;

    const updateTimer = () => {
      const currentEstimatedServerNow = Date.now() - clientOffset;
      const diffMs = deadlineMs - currentEstimatedServerNow;
      const secondsLeft = Math.max(0, Math.floor(diffMs / 1000));

      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        onTimeUp?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt, serverNow, onTimeUp]);

  if (remainingSeconds === null) {
    return (
      <div className="flex items-center gap-2 bg-navy-900/90 border border-cyan-500/30 px-3.5 py-1.5 rounded font-mono text-xs text-cyan-400">
        <Timer className="w-4 h-4 animate-pulse" />
        <span>SYNCING...</span>
      </div>
    );
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Color coding:
  // > 5m: Normal (Cyan/White)
  // 5m -> 1m: Warning (Amber)
  // <= 1m: Critical (Red with subtle pulse)
  let styleColor = 'text-cyan-300 border-cyan-500/40 bg-navy-900/90';
  let badgeLabel = 'TIME';

  if (remainingSeconds <= 60) {
    styleColor = 'text-rose-400 border-rose-500/50 bg-rose-950/40 animate-pulse';
    badgeLabel = 'FINAL MINUTE';
  } else if (remainingSeconds <= 300) {
    styleColor = 'text-amber-300 border-amber-500/40 bg-amber-950/30';
    badgeLabel = '5M WARNING';
  }

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded border shadow-inner transition-colors duration-300 ${styleColor}`}
    >
      <Timer className="w-4 h-4 shrink-0" />
      <div className="flex flex-col text-left">
        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 leading-none">
          {badgeLabel}
        </span>
        <span className="text-base sm:text-lg font-mono font-extrabold tracking-widest leading-tight">
          {timeFormatted}
        </span>
      </div>
    </div>
  );
};
