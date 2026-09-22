import React from 'react';
import { Maximize2, ShieldAlert } from 'lucide-react';

interface FullscreenGuardProps {
  isOpen: boolean;
  isExitWarning?: boolean;
  violationCount?: number;
  onEnterFullscreen: () => void;
}

export const FullscreenGuard: React.FC<FullscreenGuardProps> = ({
  isOpen,
  isExitWarning = false,
  violationCount = 0,
  onEnterFullscreen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-navy-950">
      <div className="tech-card w-full max-w-md rounded-2xl p-6 sm:p-8 border border-cyan-500/50 shadow-2xl text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="mx-auto w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 shadow-cyan-glow">
            {isExitWarning ? (
              <ShieldAlert className="w-7 h-7 text-amber-400 animate-pulse" />
            ) : (
              <Maximize2 className="w-7 h-7 text-cyan-400" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight mb-2">
            {isExitWarning ? '⚠ FULLSCREEN EXITED' : 'FULLSCREEN REQUIRED'}
          </h2>

          <p className="text-xs sm:text-sm font-sans text-slate-300 leading-relaxed mb-6">
            {isExitWarning ? (
              <>
                Fullscreen mode is required during the competition. Your test timer continues running in the background.
                <span className="block mt-2 text-amber-300 font-mono text-xs">
                  Your activity has been logged for coordinator review.
                </span>
              </>
            ) : (
              <>
                CLUE QUEST must run in dedicated fullscreen mode during the live competition for test security and integrity.
              </>
            )}
          </p>

          {violationCount > 0 && (
            <div className="mb-6 py-1.5 px-3 rounded bg-navy-900 border border-amber-500/30 inline-block font-mono text-xs text-amber-400">
              Integrity Events: {violationCount}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={onEnterFullscreen}
              className="w-full py-3.5 px-6 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-navy-950 font-sans font-bold text-sm tracking-wide shadow-cyan-glow hover:shadow-cyan-glow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Maximize2 className="w-4 h-4" />
              <span>{isExitWarning ? 'RETURN TO FULLSCREEN' : 'ENTER FULLSCREEN'}</span>
            </button>
          </div>

          <p className="mt-4 text-[11px] font-mono text-slate-500">
            ECE CLUB • VSB ENGINEERING COLLEGE
          </p>
        </div>
      </div>
    </div>
  );
};
