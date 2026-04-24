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
  const videosRef = useRef<{ from: HTMLVideoElement | null; to: HTMLVideoElement | null }>({ from: null, to: null });
  const locsRef = useRef<Record<string, WebGLUniformLocation | null | number>>({});
  const quadBufRef = useRef<WebGLBuffer | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const texturesReadyRef = useRef<{ from: boolean; to: boolean }>({ from: false, to: false });

  const checkReady = () => {
    if (texturesReadyRef.current.from && texturesReadyRef.current.to) {
      if (isMountedRef.current) setIsReady(true);
    }
  };

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
    isMountedRef.current = true;
    setIsReady(false);
    texturesReadyRef.current = { from: false, to: false };

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset video refs when images change
    videosRef.current = { from: null, to: null };

    // Match HyperFrames: createContext()
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: true });
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
    const createTexture = (source: string | HTMLCanvasElement, targetKey: 'from' | 'to') => {
      const tex = gl.createTexture();
      if (!tex) return null;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));

      if (typeof source === 'string') {
        if (!source || source.trim() === '') {
          texturesReadyRef.current[targetKey] = true;
          checkReady();
          return tex;
        }

        const isVideo = source.match(/\.(mp4|webm|mov|ogg)($|\?)/i) || source.includes('video');

        const loadVideo = (url: string) => {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.playsInline = true;
          video.loop = true;
          video.onloadeddata = () => {
             if (!isMountedRef.current) return;
             video.play().catch(() => {});
             gl.bindTexture(gl.TEXTURE_2D, tex);
             gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
             texturesReadyRef.current[targetKey] = true;
             checkReady();
          };
          video.onerror = () => {
            console.warn('ShaderTransition: Failed to load video from URL', url);
            // On error, mark as "ready" so we at least show the black fallback or nothing
            texturesReadyRef.current[targetKey] = true;
            checkReady();
          };
          video.src = url;
          videosRef.current[targetKey] = video;
        };

        if (isVideo) {
          loadVideo(source);
        } else {
          // Attempt Image creation with CORS
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            if (!isMountedRef.current) return;
            try {
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
              texturesReadyRef.current[targetKey] = true;
              checkReady();
            } catch (e) {
              console.warn('ShaderTransition: Image bind failed', source);
            }
          };
          img.onerror = () => {
             if (!isMountedRef.current) return;
             fetch(source)
               .then(res => res.blob())
               .then(blob => {
                 const url = URL.createObjectURL(blob);
                 const fbImg = new Image();
                 fbImg.onload = () => {
                   if (!isMountedRef.current) return;
                   gl.bindTexture(gl.TEXTURE_2D, tex);
                   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fbImg);
                   texturesReadyRef.current[targetKey] = true;
                   checkReady();
                   URL.revokeObjectURL(url);
                 };
                 fbImg.src = url;
               })
               .catch(() => {
                 texturesReadyRef.current[targetKey] = true;
                 checkReady();
               });
          };
          img.src = source;
        }
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        texturesReadyRef.current[targetKey] = true;
        checkReady();
      }
      return tex;
    };

    texturesRef.current.from = createTexture(fromImage, 'from');
    texturesRef.current.to = createTexture(toImage, 'to');

    return () => {
      isMountedRef.current = false;
      gl.useProgram(null);
      if (quadBuf) gl.deleteBuffer(quadBuf);
      if (texturesRef.current.from) gl.deleteTexture(texturesRef.current.from);
      if (texturesRef.current.to) gl.deleteTexture(texturesRef.current.to);
      texturesRef.current = { from: null, to: null };
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      
      if (videosRef.current.from) { try { videosRef.current.from.pause(); videosRef.current.from.src = ""; } catch(e){} }
      if (videosRef.current.to) { try { videosRef.current.to.pause(); videosRef.current.to.src = ""; } catch(e){} }
      videosRef.current = { from: null, to: null };
    };
  }, [shaderName, fromImage, toImage, resolution.width, resolution.height]);

  useEffect(() => {
    let animFrame: number;
    const renderLoop = () => {
      if (!isMountedRef.current) return;
      const gl = glRef.current;
      const program = programRef.current;
      const locs = locsRef.current;
      const quadBuf = quadBufRef.current;
      
      if (!gl || !program || !quadBuf || !texturesRef.current.from || !texturesRef.current.to) {
        animFrame = requestAnimationFrame(renderLoop);
        return;
      }

      gl.useProgram(program);
      gl.viewport(0, 0, resolution.width, resolution.height);

      // Update Video Textures
      try {
        if (videosRef.current.from && videosRef.current.from.readyState >= 2) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.from);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videosRef.current.from);
        }
        if (videosRef.current.to && videosRef.current.to.readyState >= 2) {
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.to);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videosRef.current.to);
        }

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
      } catch (e) {}

      animFrame = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animFrame);
  }, [progress, resolution.width, resolution.height, accentColor, accentBrightColor, accentDarkColor]);

  return (
    <div className={`absolute inset-0 z-[1000] pointer-events-none transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      <canvas
        ref={canvasRef}
        width={resolution.width}
        height={resolution.height}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default ShaderTransitionCanvas;
