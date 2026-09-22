import React, { useEffect, useRef } from 'react';

/**
 * BlueFogBackground - Premium 4-layer animated atmospheric blue/cyan fog
 * with smooth damped scroll-reactive parallax and continuous organic drift.
 */
export const BlueFogBackground: React.FC = () => {
  const fogRef1 = useRef<HTMLDivElement>(null);
  const fogRef2 = useRef<HTMLDivElement>(null);
  const fogRef3 = useRef<HTMLDivElement>(null);
  const fogRef4 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }

    let targetScrollY = window.scrollY;
    let currentScrollY = window.scrollY;
    let animationFrameId: number;

    const onScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Smooth lerp / damping render loop (60 FPS target)
    const renderLoop = () => {
      // Smooth interpolation: current + (target - current) * damping
      currentScrollY += (targetScrollY - currentScrollY) * 0.08;

      if (fogRef1.current) {
        // Layer 1: Electric Blue / Cyan primary mist (drifts upward gently)
        const y1 = currentScrollY * 0.12;
        fogRef1.current.style.transform = `translate3d(0, ${-y1}px, 0)`;
      }

      if (fogRef2.current) {
        // Layer 2: Deep blue atmosphere (slower upward drift + horizontal drift)
        const y2 = currentScrollY * 0.07;
        const x2 = currentScrollY * 0.03;
        fogRef2.current.style.transform = `translate3d(${x2}px, ${-y2}px, 0)`;
      }

      if (fogRef3.current) {
        // Layer 3: Cyan luminous accent (gentle reverse counter-drift for depth)
        const y3 = currentScrollY * 0.16;
        const x3 = currentScrollY * -0.04;
        fogRef3.current.style.transform = `translate3d(${x3}px, ${y3 * 0.3}px, 0)`;
      }

      if (fogRef4.current) {
        // Layer 4: Deep ambient floor mist
        const y4 = currentScrollY * 0.05;
        fogRef4.current.style.transform = `translate3d(0, ${-y4}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      {/* ============================================================ */}
      {/* LAYER 1: Large primary electric-cyan/blue mist (Upper Hero & Nav) */}
      {/* ============================================================ */}
      <div
        ref={fogRef1}
        className="absolute -top-[12%] -left-[10%] w-[850px] h-[850px] sm:w-[1100px] sm:h-[1000px] rounded-full blur-[110px] sm:blur-[150px] opacity-[0.22] will-change-transform animate-fog-drift-slow"
        style={{
          background:
            'radial-gradient(ellipse at 45% 45%, #00BFFF 0%, #0078FF 40%, rgba(0, 191, 255, 0.15) 65%, transparent 80%)',
        }}
      />

      {/* ============================================================ */}
      {/* LAYER 2: Right side atmospheric blue mist (Gameplay & Mechanics) */}
      {/* ============================================================ */}
      <div
        ref={fogRef2}
        className="absolute top-[20%] -right-[15%] w-[750px] h-[800px] sm:w-[1050px] sm:h-[1100px] rounded-full blur-[120px] sm:blur-[160px] opacity-[0.18] will-change-transform animate-fog-drift-reverse"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, #00E5FF 0%, #0055FF 45%, rgba(6, 182, 212, 0.12) 70%, transparent 85%)',
        }}
      />

      {/* ============================================================ */}
      {/* LAYER 3: Center-left luminous cyan haze (How-it-Works & Curriculum) */}
      {/* ============================================================ */}
      <div
        ref={fogRef3}
        className="absolute top-[52%] -left-[12%] w-[800px] h-[750px] sm:w-[1000px] sm:h-[950px] rounded-full blur-[100px] sm:blur-[140px] opacity-[0.15] will-change-transform animate-fog-drift-medium"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, #00BFFF 0%, #0066FF 40%, rgba(0, 140, 255, 0.1) 68%, transparent 80%)',
        }}
      />

      {/* ============================================================ */}
      {/* LAYER 4: Bottom deep institutional blue ambient mist (Footer Zone) */}
      {/* ============================================================ */}
      <div
        ref={fogRef4}
        className="absolute bottom-[-5%] left-[20%] w-[900px] h-[650px] sm:w-[1200px] sm:h-[800px] rounded-full blur-[130px] sm:blur-[170px] opacity-[0.14] will-change-transform animate-fog-drift-slow"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, #008CFF 0%, #0033CC 50%, transparent 75%)',
        }}
      />

      {/* Subtle background technical grid texture */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 191, 255, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 191, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
};
