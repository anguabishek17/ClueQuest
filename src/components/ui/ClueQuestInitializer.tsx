import React, { useState, useEffect, useRef } from 'react';

/**
 * ClueQuestInitializer
 * 
 * Full-screen ECE technical boot sequence / initialization animation.
 * Features:
 * - Technical radial perspective grid & scanning telemetry
 * - Deep Obsidian (#020711) & Electric Cyan (#00E5FF) visual identity
 * - Central ELC chip logo materialization with dual counter-rotating dashed rings & glowing scanning arc
 * - ECE Department & VSB Engineering College authentic system status progression
 * - JetBrains Mono technical status typing effect with blinking cursor
 * - Glowing progress bar & percentage counter (0% -> 100%)
 * - Final SYSTEM READY state + subtle expanding cyan energy pulse
 * - Smooth fade transition directly into landing page (~3.2s total duration)
 * - ESC key instant-skip for accessibility
 * - Respects prefers-reduced-motion
 * - Body scroll lock during boot, restored automatically on complete
 */

interface ClueQuestInitializerProps {
  onComplete: () => void;
}

const STATUS_MESSAGES = [
  { text: 'INITIALIZING CLUE QUEST', progress: 14 },
  { text: 'ESTABLISHING ECE NODE', progress: 32 },
  { text: 'SYNCING QUESTION MATRIX', progress: 50 },
  { text: 'SECURING PARTICIPANT SESSION', progress: 68 },
  { text: 'CALIBRATING SCORING ENGINE', progress: 84 },
  { text: 'INITIALIZING ELECTRONICS CLUB', progress: 95 },
  { text: 'SYSTEM READY', progress: 100 },
];

export const ClueQuestInitializer: React.FC<ClueQuestInitializerProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [logoEntered, setLogoEntered] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Accessibility: Prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  // 2. Body Scroll Lock during boot sequence
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 3. Optional ESC key skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFadingOut(true);
        setTimeout(onComplete, 350);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  // 4. Logo Entry Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoEntered(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // 5. Status message & progress animation cycle (~3.2s total)
  useEffect(() => {
    const stepDurations = [420, 420, 420, 420, 400, 380, 500];
    let timeoutId: number;

    const runStep = (index: number) => {
      if (index >= STATUS_MESSAGES.length) {
        setIsSystemReady(true);
        setShowPulse(true);

        // Transition out after ready pulse
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 650);
        }, 550);
        return;
      }

      setCurrentStepIndex(index);
      const targetProg = STATUS_MESSAGES[index].progress;
      setProgress(targetProg);

      // Simple character reveal for status text
      const msg = STATUS_MESSAGES[index].text;
      setDisplayedText(msg);

      timeoutId = window.setTimeout(() => {
        runStep(index + 1);
      }, stepDurations[index]);
    };

    const initialDelay = setTimeout(() => {
      runStep(0);
    }, 500);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timeoutId);
    };
  }, [onComplete]);

  // 6. Technical Canvas Background: Radial Grid, Concentric Tunnel, Circuit Traces
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animId: number;
    let time = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Procedural Circuit Nodes
    const nodes = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      life: Math.random(),
      maxLife: 0.4 + Math.random() * 0.6,
      size: 2 + Math.random() * 2,
    }));

    const render = () => {
      time += 0.018;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.max(width, height) * 0.8;

      // 1. Radial Perspective Lines (Originating from center)
      ctx.save();
      ctx.lineWidth = 1;
      const lineCount = width < 640 ? 12 : 24;
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const x2 = cx + Math.cos(angle) * maxR;
        const y2 = cy + Math.sin(angle) * maxR;

        const grad = ctx.createLinearGradient(cx, cy, x2, y2);
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.03)');
        grad.addColorStop(0.3, 'rgba(0, 168, 255, 0.08)');
        grad.addColorStop(0.8, 'rgba(0, 119, 255, 0.04)');
        grad.addColorStop(1, 'rgba(0, 119, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Concentric Tunnel Rings expanding outward
      ctx.save();
      const ringCount = 6;
      for (let i = 0; i < ringCount; i++) {
        const ringProgress = (time * 0.15 + i / ringCount) % 1;
        const currentRadius = Math.pow(ringProgress, 1.6) * (maxR * 0.7) + 40;
        const ringOpacity = Math.sin(ringProgress * Math.PI) * 0.12;

        ctx.beginPath();
        ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 255, ${ringOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // 3. Subtle ECE Circuit Traces / Nodes
      ctx.save();
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.life += 0.01;
        if (n.life > n.maxLife) {
          n.life = 0;
          n.x = Math.random() * width;
          n.y = Math.random() * height;
        }

        const alpha = Math.sin((n.life / n.maxLife) * Math.PI) * 0.35;
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fill();

        // Right-angle trace segment
        ctx.strokeStyle = `rgba(0, 168, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n.x + 25, n.y);
        ctx.lineTo(n.x + 25, n.y + 20);
        ctx.stroke();
      });
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 w-full h-screen z-[9999] flex flex-col justify-between items-center bg-[#020711] text-[#F5F7FA] select-none transition-opacity duration-700 ease-out overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Dynamic Canvas: Perspective Tunnel & Circuit Telemetry */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 block w-full h-full"
      />

      {/* 2. Top System Information Banner */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between font-mono text-[10px] sm:text-xs tracking-[0.2em] text-[#7C91A8]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
          <span className="text-[#00E5FF] font-semibold">CLUE QUEST // ECE</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-500">
          <span>SYS.NODE://CQ-2026</span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400">SIGNAL: 100% STABLE</span>
        </div>
        <div>
          <span className="text-slate-400">BOOT SEQUENCE</span>
        </div>
      </header>

      {/* 3. Central Core: ELC Chip Logo + Rotating Scanning Rings */}
      <main className="relative z-10 flex flex-col items-center justify-center my-auto px-4 text-center">
        {/* Central Orbital System */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center mb-8">
          {/* Subtle Core Background Glow */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[#0077FF]/20 via-[#00E5FF]/20 to-transparent blur-2xl transition-all duration-700 ${
              showPulse ? 'scale-150 opacity-100' : 'scale-100 opacity-60'
            }`}
          />

          {/* Outer Ring 1: Clockwise dashed cyan ring */}
          <div
            className="absolute inset-0 rounded-full border border-dashed border-[#00E5FF]/40 animate-spin"
            style={{ animationDuration: '14s' }}
          />

          {/* Middle Ring 2: Counter-clockwise segmented blue ring */}
          <div
            className="absolute inset-3 rounded-full border-2 border-dashed border-[#0077FF]/50 animate-spin"
            style={{ animationDuration: '9s', animationDirection: 'reverse' }}
          />

          {/* Inner Ring 3: Scanning Arc Ring */}
          <div
            className="absolute inset-6 rounded-full border border-t-[#00E5FF] border-r-transparent border-b-[#00A8FF]/40 border-l-transparent animate-spin shadow-[0_0_15px_rgba(0,229,255,0.4)]"
            style={{ animationDuration: '3.5s' }}
          />

          {/* Central Official Electronics Club / ELC Chip Logo */}
          <div
            className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#050B18]/90 border border-[#00E5FF]/40 p-3 shadow-[0_0_30px_rgba(0,229,255,0.25)] backdrop-blur-md flex items-center justify-center transition-all duration-700 ease-out ${
              logoEntered ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-75 blur-sm'
            }`}
          >
            <img
              src="/assets/elc-logo.png"
              alt="Electronics Club Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]"
            />
          </div>

          {/* Expanding Energy Pulse Wave upon 100% Ready */}
          {showPulse && (
            <div className="absolute inset-0 rounded-full border-2 border-[#00E5FF] animate-ping opacity-75" />
          )}
        </div>

        {/* Brand Name beneath Logo */}
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>CLUE QUEST</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
              ECE 2026
            </span>
          </h2>
        </div>

        {/* Technical Status Text with Typewriter Underscore */}
        <div className="h-7 flex items-center justify-center mb-6">
          <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[#00E5FF] font-semibold flex items-center">
            {displayedText}
            <span className="inline-block w-2 h-3.5 ml-1 bg-[#00E5FF] animate-pulse" />
          </p>
        </div>

        {/* Technical Thin Progress Bar & Percentage */}
        <div className="flex items-center gap-3 w-64 sm:w-72 max-w-xs mx-auto">
          <div className="flex-1 h-1.5 bg-[#050B18] rounded-full border border-slate-800 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#0077FF] via-[#00A8FF] to-[#00E5FF] rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,229,255,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono text-xs text-[#00E5FF] font-bold w-9 text-right tabular-nums">
            {String(progress).padStart(2, '0')}%
          </span>
        </div>

        {/* Micro ECE Node status pill */}
        <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-slate-500 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>PORTAL: ONLINE</span>
          <span>•</span>
          <span>PROTOCOL: SECURE_V2</span>
        </div>
      </main>

      {/* 4. Bottom Institutional Identity & College Branding */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-6 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7C91A8]">
        <div>
          <span className="text-slate-400 font-semibold">VSB ENGINEERING COLLEGE</span>
          <span className="hidden sm:inline text-slate-600 mx-2">•</span>
          <span className="block sm:inline text-slate-500">DEPARTMENT OF ECE</span>
        </div>
        <div className="text-slate-500">
          <span>ELECTRONICS & COMMUNICATION ENGINEERING CLUB</span>
        </div>
      </footer>
    </div>
  );
};
