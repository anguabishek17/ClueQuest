import React, { useEffect, useRef } from 'react';

/**
 * InteractiveBlueFog - Highly visible, fluid, interactive blue/cyan atmospheric fog.
 * Responds with smooth damping and inertia to BOTH:
 * 1. Mouse movement (fluid follow + trailing delay)
 * 2. Scroll movement (parallax layer shifts)
 * Plus subtle continuous organic drift.
 */
export const InteractiveBlueFog: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const blob4Ref = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      return;
    }

    // Target positions (mouse in normalized -1..1 or pixel coords, scroll in px)
    let mouseTargetX = window.innerWidth / 2;
    let mouseTargetY = window.innerHeight / 2;
    let scrollTargetY = window.scrollY;

    // Smoothed/interpolated positions with inertia
    let mouseCurX1 = window.innerWidth / 2;
    let mouseCurY1 = window.innerHeight / 2;

    let mouseCurX2 = window.innerWidth / 2;
    let mouseCurY2 = window.innerHeight / 2;

    let mouseCurX3 = window.innerWidth / 2;
    let mouseCurY3 = window.innerHeight / 2;

    let mouseCurTrailX = window.innerWidth / 2;
    let mouseCurTrailY = window.innerHeight / 2;

    let scrollCurY = window.scrollY;

    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseTargetX = e.clientX;
      mouseTargetY = e.clientY;
    };

    const onScroll = () => {
      scrollTargetY = window.scrollY;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    // Smooth render loop (60 FPS)
    const updateMotion = () => {
      // Damped mouse interpolation
      // Layer 1 (primary follow): Responsive damping 0.08
      mouseCurX1 += (mouseTargetX - mouseCurX1) * 0.08;
      mouseCurY1 += (mouseTargetY - mouseCurY1) * 0.08;

      // Layer 2 (secondary follow): Slower damping 0.05
      mouseCurX2 += (mouseTargetX - mouseCurX2) * 0.05;
      mouseCurY2 += (mouseTargetY - mouseCurY2) * 0.05;

      // Layer 3 (counter/divergent flow): Damping 0.04
      mouseCurX3 += (mouseTargetX - mouseCurX3) * 0.04;
      mouseCurY3 += (mouseTargetY - mouseCurY3) * 0.04;

      // Layer 5 (residual cursor trail): Delayed damping 0.035
      mouseCurTrailX += (mouseTargetX - mouseCurTrailX) * 0.035;
      mouseCurTrailY += (mouseTargetY - mouseCurTrailY) * 0.035;

      // Damped scroll interpolation
      scrollCurY += (scrollTargetY - scrollCurY) * 0.08;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Relative mouse delta from center (-0.5 to 0.5 ratio)
      const normDeltaX1 = (mouseCurX1 - centerX) * 0.28;
      const normDeltaY1 = (mouseCurY1 - centerY) * 0.24;

      const normDeltaX2 = (mouseCurX2 - centerX) * -0.22;
      const normDeltaY2 = (mouseCurY2 - centerY) * 0.18;

      const normDeltaX3 = (mouseCurX3 - centerX) * 0.35;
      const normDeltaY3 = (mouseCurY3 - centerY) * -0.20;

      // Blob 1: Strong primary electric-cyan fog following cursor & drifting on scroll
      if (blob1Ref.current) {
        const scrollOffset1 = scrollCurY * -0.12;
        blob1Ref.current.style.transform = `translate3d(${normDeltaX1}px, ${normDeltaY1 + scrollOffset1}px, 0)`;
      }

      // Blob 2: Deep blue atmosphere cloud with counter-lateral drift
      if (blob2Ref.current) {
        const scrollOffset2 = scrollCurY * -0.06;
        blob2Ref.current.style.transform = `translate3d(${normDeltaX2}px, ${normDeltaY2 + scrollOffset2}px, 0)`;
      }

      // Blob 3: Mid-page luminous cyan fog mass
      if (blob3Ref.current) {
        const scrollOffset3 = scrollCurY * 0.08;
        blob3Ref.current.style.transform = `translate3d(${normDeltaX3}px, ${normDeltaY3 + scrollOffset3}px, 0)`;
      }

      // Blob 4: Deep ambient lower mist
      if (blob4Ref.current) {
        const scrollOffset4 = scrollCurY * -0.04;
        const subtleX = (mouseCurX2 - centerX) * 0.1;
        blob4Ref.current.style.transform = `translate3d(${subtleX}px, ${scrollOffset4}px, 0)`;
      }

      // Cursor Trail Mist: Floats dynamically with delayed follow directly near cursor
      if (trailRef.current) {
        const trailX = mouseCurTrailX - centerX;
        const trailY = mouseCurTrailY - centerY;
        const scrollTrail = scrollCurY * -0.08;
        trailRef.current.style.transform = `translate3d(${trailX * 0.45}px, ${trailY * 0.45 + scrollTrail}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(updateMotion);
    };

    animationFrameId = requestAnimationFrame(updateMotion);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      {/* ============================================================ */}
      {/* 1. PRIMARY CURSOR-INTERACTIVE ELECTRIC BLUE CLOUD (Upper Hero) */}
      {/* ============================================================ */}
      <div
        ref={blob1Ref}
        className="absolute -top-[10%] left-[5%] w-[55vw] h-[55vw] min-w-[550px] min-h-[550px] max-w-[1000px] max-h-[1000px] rounded-full blur-[95px] sm:blur-[135px] opacity-[0.22] will-change-transform animate-fog-drift-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 191, 255, 0.45) 0%, rgba(0, 120, 255, 0.28) 35%, rgba(0, 70, 220, 0.12) 60%, transparent 80%)',
        }}
      />

      {/* ============================================================ */}
      {/* 2. DYNAMIC CURSOR TRAIL / RESIDUAL ATMOSPHERIC MIST           */}
      {/* ============================================================ */}
      <div
        ref={trailRef}
        className="absolute top-[20%] left-[25%] w-[42vw] h-[42vw] min-w-[420px] min-h-[420px] max-w-[800px] max-h-[800px] rounded-full blur-[80px] sm:blur-[115px] opacity-[0.18] will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, rgba(6, 182, 212, 0.22) 40%, rgba(29, 78, 216, 0.08) 65%, transparent 80%)',
        }}
      />

      {/* ============================================================ */}
      {/* 3. DEEP BLUE COUNTER-LATERAL CLOUD (Right-Center Hero & Mechanics) */}
      {/* ============================================================ */}
      <div
        ref={blob2Ref}
        className="absolute top-[18%] -right-[10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] max-w-[950px] max-h-[950px] rounded-full blur-[100px] sm:blur-[140px] opacity-[0.20] will-change-transform animate-fog-drift-reverse"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 229, 255, 0.38) 0%, rgba(0, 85, 255, 0.25) 42%, rgba(15, 23, 42, 0.1) 70%, transparent 85%)',
        }}
      />

      {/* ============================================================ */}
      {/* 4. MID-PAGE LUMINOUS CYAN FOG MASS (How It Works & Rules)    */}
      {/* ============================================================ */}
      <div
        ref={blob3Ref}
        className="absolute top-[50%] -left-[8%] w-[52vw] h-[52vw] min-w-[520px] min-h-[520px] max-w-[900px] max-h-[900px] rounded-full blur-[90px] sm:blur-[130px] opacity-[0.18] will-change-transform animate-fog-drift-medium"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 191, 255, 0.35) 0%, rgba(0, 102, 255, 0.22) 38%, rgba(0, 60, 180, 0.08) 65%, transparent 82%)',
        }}
      />

      {/* ============================================================ */}
      {/* 5. DEEP AMBIENT LOWER MIST (Curriculum & Institutional Desk)  */}
      {/* ============================================================ */}
      <div
        ref={blob4Ref}
        className="absolute bottom-[-5%] right-[10%] w-[55vw] h-[45vw] min-w-[500px] min-h-[400px] max-w-[980px] max-h-[750px] rounded-full blur-[110px] sm:blur-[150px] opacity-[0.16] will-change-transform animate-fog-drift-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 140, 255, 0.3) 0%, rgba(0, 51, 204, 0.18) 45%, transparent 75%)',
        }}
      />

      {/* Subtle fine technical grid backdrop */}
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
