import React, { useEffect, useRef } from 'react';
import { vertSrc, SHADER_LIBRARY } from '../lib/ShaderTransitionSource';

/**
 * ShaderTransitionCanvas — WebGL-based shader transitions
 * Rewritten to match the HyperFrames (@hyperframes/shader-transitions) WebGL pipeline.
 * Key fixes from upstream:
 *   - Uses TRIANGLE_STRIP with 4 vertices (not TRIANGLES with 6)
 *   - Sets gl.pixelStorei(UNPACK_FLIP_Y_WEBGL, false)
 *   - Initializes textures with 1x1 placeholder
 *   - Caches uniform locations
 *   - Sets viewport on every frame
 */

interface ShaderTransitionProps {
  fromImage: string | HTMLCanvasElement;
  toImage: string | HTMLCanvasElement;
  progress: number | import('motion/react').MotionValue<number>;
  shaderName: string;
  resolution: { width: number; height: number };
  accentColor?: string;
  accentBrightColor?: string;
  accentDarkColor?: string;
}

// Matches HyperFrames quad geometry exactly
const QUAD_VERTS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

const ShaderTransitionCanvas: React.FC<ShaderTransitionProps> = ({
  fromImage,
  toImage,
  progress,
  shaderName,
  resolution,
  accentColor = '#ff6b2b',
  accentBrightColor = '#ffffff',
  accentDarkColor = '#000000'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texturesRef = useRef<{ from: WebGLTexture | null; to: WebGLTexture | null }>({ from: null, to: null });
  const locsRef = useRef<Record<string, WebGLUniformLocation | null | number>>({});
  const quadBufRef = useRef<WebGLBuffer | null>(null);

  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    if (h.length < 6) return [0.5, 0.5, 0.5];
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    if (isNaN(r) || isNaN(g) || isNaN(b)) return [0.5, 0.5, 0.5];
    return [r, g, b];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Match HyperFrames: createContext()
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) return;
    gl.viewport(0, 0, resolution.width, resolution.height);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    glRef.current = gl;

    // Match HyperFrames: setupQuad()
    const quadBuf = gl.createBuffer();
    if (!quadBuf) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTS, gl.STATIC_DRAW);
    quadBufRef.current = quadBuf;

    // Match HyperFrames: createProgram()
    const compileShader = (src: string, type: number): WebGLShader | null => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[ShaderTransition] Shader compile:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const fragSrc = SHADER_LIBRARY[shaderName] || SHADER_LIBRARY['fade'];
    const vs = compileShader(vertSrc, gl.VERTEX_SHADER);
    const fs = compileShader(fragSrc, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[ShaderTransition] Program link:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    // Cache uniform locations (matches HyperFrames pattern)
    locsRef.current = {
      from: gl.getUniformLocation(program, 'u_from'),
      to: gl.getUniformLocation(program, 'u_to'),
      progress: gl.getUniformLocation(program, 'u_progress'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      accent: gl.getUniformLocation(program, 'u_accent'),
      accentDark: gl.getUniformLocation(program, 'u_accent_dark'),
      accentBright: gl.getUniformLocation(program, 'u_accent_bright'),
      aPos: gl.getAttribLocation(program, 'a_pos'),
    };

    // Match HyperFrames: createTexture() — initialize with 1x1 placeholder
    const createTexture = (source: string | HTMLCanvasElement) => {
      const tex = gl.createTexture();
      if (!tex) return null;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // Start with 1x1 placeholder (HyperFrames pattern)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      if (typeof source === 'string') {
        if (!source || source.trim() === '') {
          return tex;
        }

        const isVideo = source.match(/\.(mp4|webm|mov|ogg)($|\?)/i) || source.includes('video');

        if (isVideo) {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.playsInline = true;
          video.loop = true;
          video.onloadeddata = () => {
            video.play().catch(() => {});
            // Draw initial frame
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          };
          video.onerror = () => {
            console.warn('ShaderTransition: Failed to load video from URL', source);
            // Fallback without crossOrigin to bypass strict CORS if we ONLY want local visual preview
            // Note: this will taint the canvas in strict mode but works for rendering passes if safe
          };
          video.src = source;
        } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          };
          img.onerror = () => {
             console.warn('ShaderTransition: Failed to load texture from', source, '- attempting CORS bypass');
             // Attempt CORS bypass silently if strict fetching failed
             const fallbackImg = new Image();
             fallbackImg.onload = () => {
                try {
                  gl.bindTexture(gl.TEXTURE_2D, tex);
                  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fallbackImg);
                } catch (e) {
                   console.warn('ShaderTransition: WebGL Canvas tainted by CORS restrictions.');
                }
             };
             fallbackImg.src = source;
          };
          img.src = source;
        }
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      }
      return tex;
    };

    texturesRef.current.from = createTexture(fromImage);
    texturesRef.current.to = createTexture(toImage);

    return () => {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (quadBuf) gl.deleteBuffer(quadBuf);
      if (texturesRef.current.from) gl.deleteTexture(texturesRef.current.from);
      if (texturesRef.current.to) gl.deleteTexture(texturesRef.current.to);
    };
  }, [shaderName, fromImage, toImage]);

  useEffect(() => {
    let animFrame: number;
    const renderLoop = () => {
      const gl = glRef.current;
      const program = programRef.current;
      const locs = locsRef.current;
      const quadBuf = quadBufRef.current;
      if (!gl || !program || !quadBuf) return;

      gl.useProgram(program);
      gl.viewport(0, 0, resolution.width, resolution.height);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.from);
      gl.uniform1i(locs.from as WebGLUniformLocation, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.to);
      gl.uniform1i(locs.to as WebGLUniformLocation, 1);

      const p = typeof progress === 'number' ? progress : progress.get();
      gl.uniform1f(locs.progress as WebGLUniformLocation, p);
      gl.uniform2f(locs.resolution as WebGLUniformLocation, resolution.width, resolution.height);

      const accentRgb = hexToRgb(accentColor);
      gl.uniform3f(locs.accent as WebGLUniformLocation, accentRgb[0], accentRgb[1], accentRgb[2]);

      const darkRgb = hexToRgb(accentDarkColor);
      gl.uniform3f(locs.accentDark as WebGLUniformLocation, darkRgb[0], darkRgb[1], darkRgb[2]);

      const brightRgb = hexToRgb(accentBrightColor);
      gl.uniform3f(locs.accentBright as WebGLUniformLocation, brightRgb[0], brightRgb[1], brightRgb[2]);

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(locs.aPos as number);
      gl.vertexAttribPointer(locs.aPos as number, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animFrame = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animFrame);
  }, [progress, resolution, accentColor, accentBrightColor, accentDarkColor]);

  return (
    <div className="absolute inset-0 z-[1000] pointer-events-none overflow-hidden">
      {/* Background Haze Overlay */}
      <div 
        className="absolute inset-0 opacity-20 blur-[100px] transition-colors duration-1000"
        style={{ backgroundColor: accentColor }}
      />
      <canvas
        ref={canvasRef}
        width={resolution.width}
        height={resolution.height}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'normal' }}
      />
    </div>
  );
};

export default ShaderTransitionCanvas;
