import { useEffect, useRef } from "react";
import { createRenderer } from "./black-hole-utils/renderer.js";

export function BlackHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = createRenderer({ canvas });
    void renderer.ready;

    return () => renderer.dispose();
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none select-none">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}

export default BlackHole;
