// WebGL Black Hole Procedural Accretion Disk & Event Horizon Renderer
// High-performance, robust, self-contained fragment shader with zero external dependencies

export interface RendererOptions {
  canvas: HTMLCanvasElement;
}

export interface RendererInstance {
  ready: Promise<void>;
  dispose: () => void;
}

export function createRenderer({ canvas }: RendererOptions): RendererInstance {
  let isDisposed = false;
  let animationFrameId: number | null = null;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

  let startTime = performance.now();
  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetMouseX = 0.5;
  let targetMouseY = 0.5;

  const vsSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // Robust, visually striking Black Hole GLSL Shader
  const fsSource = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    #define PI 3.14159265359

    // Fast 2D noise for gas clouds and stars
    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = rot * p * 2.1 + vec2(u_time * 0.15, -u_time * 0.05);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Normalized coordinates centered at origin
      vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
      
      // Black hole center slightly shifted upward for dramatic hero headroom
      vec2 center = vec2(0.0, 0.12);
      
      // Subtle parallax response to mouse
      vec2 mouseOffset = (u_mouse - 0.5) * 0.08;
      vec2 p = st - center - mouseOffset;

      // Distance from center
      float r = length(p);
      float angle = atan(p.y, p.x);

      // Deep space background with subtle star dust
      vec3 col = vec3(0.024, 0.043, 0.078); // Deep obsidian navy #060B14
      
      // Distant stars distorted by gravity
      float starR = r + 0.15 / (r + 0.05); // Gravitational lensing deflection
      vec2 starCoord = vec2(cos(angle), sin(angle)) * starR;
      float star = pow(hash(floor(starCoord * 60.0)), 32.0) * 0.6;
      col += vec3(star) * vec3(0.4, 0.8, 1.0);

      // --- ACCRETION DISK ---
      // Tilted ellipse projection
      float tilt = 0.42; // Inclination angle
      vec2 ep = vec2(p.x, p.y / tilt);
      float er = length(ep);
      float eAngle = atan(ep.y, ep.x);

      // Gravitational warp on accretion disk
      float warp = 0.08 / (r + 0.04);
      float diskRot = eAngle - u_time * (1.2 / (er + 0.2)) + warp;

      // Disk density using FBM spiral arms
      vec2 diskCoord = vec2(er * 3.2, diskRot * 2.0);
      float diskNoise = fbm(diskCoord);
      
      // Accretion disk radial bounds (ISCO to Outer Edge)
      float isco = 0.32;
      float outer = 1.35;
      float diskMask = smoothstep(isco, isco + 0.1, er) * (1.0 - smoothstep(outer - 0.4, outer, er));

      // Relativistic Doppler boosting (Left side moves toward observer -> brighter/bluer)
      float doppler = -cos(eAngle) * 0.5 + 0.5;
      float dopplerFactor = pow(doppler + 0.4, 2.2);

      // Color Palette: Electric Cyan -> Sky Blue -> Deep Indigo
      vec3 innerCyan = vec3(0.0, 0.95, 1.0);     // #00F2FE Electric Cyan
      vec3 midBlue = vec3(0.12, 0.55, 0.98);     // #1E90FF Sky Blue
      vec3 outerIndigo = vec3(0.04, 0.15, 0.45); // Deep Indigo

      float colorT = smoothstep(isco, outer, er);
      vec3 diskColor = mix(innerCyan, mix(midBlue, outerIndigo, colorT), colorT);

      // Add accretion disk light
      float diskIntensity = diskNoise * diskMask * dopplerFactor * 2.2;
      col += diskColor * diskIntensity;

      // --- PHOTON SPHERE & GRAVITATIONAL LENSING RING ---
      // Bright glowing photon ring around Schwarzschild event horizon
      float photonRadius = 0.22;
      float ringGlow = exp(-pow((r - photonRadius) * 22.0, 2.0)) * 1.6;
      float ringOuterGlow = exp(-pow((r - photonRadius) * 8.0, 2.0)) * 0.5;
      
      vec3 photonRingColor = vec3(0.0, 0.95, 1.0) * ringGlow + vec3(0.2, 0.7, 1.0) * ringOuterGlow;
      col += photonRingColor;

      // Gravitational lensing upper and lower secondary arcs
      float arcGlow = exp(-pow((abs(p.y) - 0.28) * 12.0, 2.0)) * smoothstep(0.1, 0.35, abs(p.x)) * (1.0 - smoothstep(0.5, 0.9, r));
      col += vec3(0.0, 0.85, 1.0) * arcGlow * 0.4;

      // --- EVENT HORIZON (BLACK HOLE SHADOW) ---
      // Absolute pitch black core where light cannot escape
      float eventHorizon = smoothstep(photonRadius - 0.04, photonRadius, r);
      col *= eventHorizon;

      // Subtle atmospheric edge vignette
      col *= 1.0 - 0.35 * dot(st, st);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function createShader(glCtx: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = glCtx.createShader(type);
    if (!shader) return null;
    glCtx.shaderSource(shader, source);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', glCtx.getShaderInfoLog(shader));
      glCtx.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const readyPromise = new Promise<void>((resolve) => {
    try {
      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      }) || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

      if (!gl) {
        console.warn('WebGL not supported for Black Hole effect.');
        resolve();
        return;
      }

      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

      if (!vs || !fs) {
        resolve();
        return;
      }

      program = gl.createProgram();
      if (!program) {
        resolve();
        return;
      }

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        resolve();
        return;
      }

      // Full screen quad covering [-1, 1] NDC
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1.0, -1.0,
           1.0, -1.0,
          -1.0,  1.0,
          -1.0,  1.0,
           1.0, -1.0,
           1.0,  1.0,
        ]),
        gl.STATIC_DRAW
      );

      // Handle Resize & Device Pixel Ratio
      const updateSize = () => {
        if (!gl || !canvas || isDisposed) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const width = Math.max(1, Math.floor((rect.width || window.innerWidth) * dpr));
        const height = Math.max(1, Math.floor((rect.height || window.innerHeight) * dpr));

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      };

      updateSize();

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => updateSize());
        resizeObserver.observe(canvas);
      }

      // Subtle mouse interaction
      mouseMoveHandler = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width && rect.height) {
          targetMouseX = (e.clientX - rect.left) / rect.width;
          targetMouseY = (e.clientY - rect.top) / rect.height;
        }
      };
      window.addEventListener('mousemove', mouseMoveHandler, { passive: true });

      // Uniform & Attribute Locations
      const uResLoc = gl.getUniformLocation(program, 'u_resolution');
      const uTimeLoc = gl.getUniformLocation(program, 'u_time');
      const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
      const posLoc = gl.getAttribLocation(program, 'position');

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const render = (time: number) => {
        if (isDisposed || !gl || !program) return;

        // Smooth mouse damping
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        const elapsedTime = prefersReducedMotion ? 1.0 : (time - startTime) * 0.001;

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(uResLoc, canvas.width, canvas.height);
        gl.uniform1f(uTimeLoc, elapsedTime);
        gl.uniform2f(uMouseLoc, mouseX, mouseY);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (!prefersReducedMotion) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      animationFrameId = requestAnimationFrame(render);
      resolve();
    } catch (err) {
      console.warn('Black hole renderer error:', err);
      resolve();
    }
  });

  return {
    ready: readyPromise,
    dispose: () => {
      isDisposed = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (mouseMoveHandler) {
        window.removeEventListener('mousemove', mouseMoveHandler);
        mouseMoveHandler = null;
      }
      if (gl) {
        if (program) {
          gl.deleteProgram(program);
          program = null;
        }
        if (buffer) {
          gl.deleteBuffer(buffer);
          buffer = null;
        }
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) {
          ext.loseContext();
        }
        gl = null;
      }
    },
  };
}
