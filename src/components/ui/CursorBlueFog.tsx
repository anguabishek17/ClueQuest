import React, { useEffect, useRef } from 'react';

/**
 * CursorBlueFog - High-Performance 2D Canvas Interactive Blue Atmospheric Fog
 * 
 * Features:
 * - Direct mousemove tracking with smoothed lerp damping + physical inertia.
 * - Multi-point delayed trailing history (creates flowing mist, not just a cursor dot).
 * - Mouse velocity-driven dynamic cloud expansion & atmospheric disturbance.
 * - Multi-speed vertical & horizontal scroll parallax.
 * - 5 primary atmospheric fog fields (Electric Blue, Vivid Cyan, Sky Glow, Deep Ambient Navy).
 * - High-density radial gradients with composite operations for glowing mist against #03070D.
 * - 60 FPS requestAnimationFrame loop with full DPR (devicePixelRatio) retina support.
 * - Respects prefers-reduced-motion.
 * - Pointer-events: none (zero interference with clicks or scrolling).
 */

interface FogField {
  baseRelX: number; // 0..1 relative to canvas width
  baseRelY: number; // 0..1 relative to canvas height
  curX: number;
  curY: number;
  radius: number;
  baseRadius: number;
  maxOpacity: number;
  r: number;
  g: number;
  b: number;
  mouseFollowWeight: number; // How much it pulls towards cursor
  scrollParallaxWeight: number; // Parallax multiplier on scroll
  driftSpeed: number;
  driftPhase: number;
}

interface TrailPoint {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  decay: number;
}

export const CursorBlueFog: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

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

    // Target positions
    let targetMouseX = width * 0.5;
    let targetMouseY = height * 0.4;
    let targetScrollY = window.scrollY;

    // Current smoothed coordinates
    let curMouseX = targetMouseX;
    let curMouseY = targetMouseY;
    let prevMouseX = targetMouseX;
    let prevMouseY = targetMouseY;
    let mouseVelX = 0;
    let mouseVelY = 0;
    let smoothedVelocity = 0;

    let curScrollY = targetScrollY;
    let prevScrollY = targetScrollY;
    let scrollVelocity = 0;

    let hasReceivedMouse = false;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      hasReceivedMouse = true;
    };

    const onScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    // 5 Distinct Atmospheric Fog Clouds
    const fogFields: FogField[] = [
      // 1. Primary Direct Cursor-Responsive Electric Blue Cloud
      {
        baseRelX: 0.5,
        baseRelY: 0.35,
        curX: width * 0.5,
        curY: height * 0.35,
        radius: Math.max(340, width * 0.28),
        baseRadius: Math.max(340, width * 0.28),
        maxOpacity: 0.26,
        r: 0,
        g: 195,
        b: 255, // Vivid Electric Cyan
        mouseFollowWeight: 0.45,
        scrollParallaxWeight: -0.15,
        driftSpeed: 0.0006,
        driftPhase: 0,
      },
      // 2. High-Altitude Trailing Atmospheric Mist (Upper Right)
      {
        baseRelX: 0.75,
        baseRelY: 0.2,
        curX: width * 0.75,
        curY: height * 0.2,
        radius: Math.max(420, width * 0.35),
        baseRadius: Math.max(420, width * 0.35),
        maxOpacity: 0.20,
        r: 0,
        g: 130,
        b: 255, // Deep Radiant Blue
        mouseFollowWeight: -0.25, // Divergent atmospheric flow
        scrollParallaxWeight: -0.08,
        driftSpeed: 0.0004,
        driftPhase: Math.PI * 0.5,
      },
      // 3. Central Ambient Luminescent Glow (Hero Core / Clue Quest Backdrop)
      {
        baseRelX: 0.25,
        baseRelY: 0.45,
        curX: width * 0.25,
        curY: height * 0.45,
        radius: Math.max(380, width * 0.32),
        baseRadius: Math.max(380, width * 0.32),
        maxOpacity: 0.22,
        r: 0,
        g: 225,
        b: 255, // Soft Neon Aqua
        mouseFollowWeight: 0.30,
        scrollParallaxWeight: 0.12,
        driftSpeed: 0.0005,
        driftPhase: Math.PI,
      },
      // 4. Lower Parallax Mist Base
      {
        baseRelX: 0.6,
        baseRelY: 0.8,
        curX: width * 0.6,
        curY: height * 0.8,
        radius: Math.max(450, width * 0.38),
        baseRadius: Math.max(450, width * 0.38),
        maxOpacity: 0.16,
        r: 30,
        g: 90,
        b: 235, // Deep Navy-Blue Glow
        mouseFollowWeight: -0.15,
        scrollParallaxWeight: -0.22,
        driftSpeed: 0.0003,
        driftPhase: Math.PI * 1.5,
      },
      // 5. Dynamic Velocity-Responsive Cursor Haze (Follows cursor center directly)
      {
        baseRelX: 0.5,
        baseRelY: 0.5,
        curX: width * 0.5,
        curY: height * 0.5,
        radius: Math.max(260, width * 0.2),
        baseRadius: Math.max(260, width * 0.2),
        maxOpacity: 0.24,
        r: 0,
        g: 170,
        b: 255, // Bright Sky Blue
        mouseFollowWeight: 0.70, // Strong direct tracking
        scrollParallaxWeight: -0.05,
        driftSpeed: 0.0008,
        driftPhase: 0.7,
      },
    ];

    // Trailing mist points
    const trail: TrailPoint[] = [];
    let lastTrailTime = 0;

    let animationFrameId: number;
    let time = 0;

    const render = (now: number) => {
      time += 1;

      // 1. Interpolate Mouse with fluid damping (lerp 0.075)
      curMouseX += (targetMouseX - curMouseX) * 0.075;
      curMouseY += (targetMouseY - curMouseY) * 0.075;

      mouseVelX = curMouseX - prevMouseX;
      mouseVelY = curMouseY - prevMouseY;
      const instantVelocity = Math.sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY);
      smoothedVelocity += (instantVelocity - smoothedVelocity) * 0.1;

      prevMouseX = curMouseX;
      prevMouseY = curMouseY;

      // 2. Interpolate Scroll
      curScrollY += (targetScrollY - curScrollY) * 0.08;
      scrollVelocity = curScrollY - prevScrollY;
      prevScrollY = curScrollY;

      // 3. Clear canvas for fresh composite frame
      ctx.clearRect(0, 0, width, height);

      // In reduced motion mode, render static peaceful fog
      if (prefersReducedMotion) {
        fogFields.forEach((field) => {
          const x = field.baseRelX * width;
          const y = field.baseRelY * height;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, field.radius);
          grad.addColorStop(0, `rgba(${field.r}, ${field.g}, ${field.b}, ${field.maxOpacity})`);
          grad.addColorStop(0.4, `rgba(${field.r}, ${field.g}, ${field.b}, ${field.maxOpacity * 0.45})`);
          grad.addColorStop(1, `rgba(${field.r}, ${field.g}, ${field.b}, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, field.radius, 0, Math.PI * 2);
          ctx.fill();
        });
        return;
      }

      // Add trailing mist particles when cursor moves
      if (hasReceivedMouse && now - lastTrailTime > 40 && smoothedVelocity > 1.2) {
        lastTrailTime = now;
        trail.push({
          x: curMouseX + (Math.random() - 0.5) * 40,
          y: curMouseY + (Math.random() - 0.5) * 40,
          radius: Math.min(180, 70 + smoothedVelocity * 4),
          opacity: Math.min(0.24, 0.08 + smoothedVelocity * 0.008),
          decay: 0.006 + Math.random() * 0.004,
        });

        if (trail.length > 25) {
          trail.shift();
        }
      }

      // 4. Render and update trailing mist
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.opacity -= p.decay;
        p.radius += 0.8; // Dissipating atmospheric spread
        p.y += (scrollVelocity * -0.05) - 0.2; // Slow vertical drift

        if (p.opacity <= 0.005) {
          trail.splice(i, 1);
          continue;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(0, 210, 255, ${p.opacity})`);
        grad.addColorStop(0.5, `rgba(0, 130, 255, ${p.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(0, 60, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Update & Render 5 Main Fog Fields
      fogFields.forEach((field, index) => {
        // Organic sinusoidal floating
        const driftX = Math.sin(time * field.driftSpeed + field.driftPhase) * 60;
        const driftY = Math.cos(time * field.driftSpeed * 0.8 + field.driftPhase) * 45;

        // Target center coordinates combining: Base + Mouse Influence + Scroll Parallax + Velocity Disturb
        const baseX = field.baseRelX * width;
        const baseY = field.baseRelY * height;

        const mouseDistX = (curMouseX - width * 0.5) * field.mouseFollowWeight;
        const mouseDistY = (curMouseY - height * 0.5) * field.mouseFollowWeight;

        // Velocity inertia pushes the fog in the direction of fast mouse movements
        const velocityPushX = mouseVelX * field.mouseFollowWeight * 2.2;
        const velocityPushY = mouseVelY * field.mouseFollowWeight * 2.2;

        const scrollOffsetY = curScrollY * field.scrollParallaxWeight;

        const targetX = baseX + mouseDistX + driftX + velocityPushX;
        const targetY = baseY + mouseDistY + scrollOffsetY + driftY + velocityPushY;

        // Smooth physical inertia
        field.curX += (targetX - field.curX) * 0.06;
        field.curY += (targetY - field.curY) * 0.06;

        // Dynamic radius expansion when cursor is active
        const velocityRadiusExpansion = Math.min(80, smoothedVelocity * 1.5);
        field.radius = field.baseRadius + velocityRadiusExpansion;

        // Dynamic intensity boost on active movement
        const activeOpacityBoost = Math.min(0.08, smoothedVelocity * 0.003);
        const dynamicOpacity = Math.min(0.32, field.maxOpacity + activeOpacityBoost);

        // Draw radial gradient fog circle
        const grad = ctx.createRadialGradient(
          field.curX,
          field.curY,
          0,
          field.curX,
          field.curY,
          field.radius
        );

        grad.addColorStop(0, `rgba(${field.r}, ${field.g}, ${field.b}, ${dynamicOpacity})`);
        grad.addColorStop(0.35, `rgba(${field.r}, ${field.g}, ${field.b}, ${dynamicOpacity * 0.55})`);
        grad.addColorStop(0.70, `rgba(${field.r}, ${field.g}, ${field.b}, ${dynamicOpacity * 0.18})`);
        grad.addColorStop(1, `rgba(${field.r}, ${field.g}, ${field.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(field.curX, field.curY, field.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[1] select-none block w-full h-full"
      style={{
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    />
  );
};
