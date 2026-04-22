import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { vertSrc, SHADER_LIBRARY } from '../lib/ShaderTransitionSource';

interface ShaderTransitionProps {
  fromImage: string | HTMLCanvasElement;
  toImage: string | HTMLCanvasElement;
  progress: number;
  shaderName: string;
  resolution: { width: number; height: number };
  accentColor?: string;
  accentBrightColor?: string;
  accentDarkColor?: string;
}

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

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) return;
    glRef.current = gl;

    // Create Shader Program
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const fragRef = SHADER_LIBRARY[shaderName] || SHADER_LIBRARY['whip-pan'];
    const vs = createShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragRef);

    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    programRef.current = program;

    // Set up geometry (fullscreen quad)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Load Textures
    const createTexture = (source: string | HTMLCanvasElement) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      if (typeof source === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        };
        img.src = source;
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
      gl.deleteBuffer(buffer);
      if (texturesRef.current.from) gl.deleteTexture(texturesRef.current.from);
      if (texturesRef.current.to) gl.deleteTexture(texturesRef.current.to);
    };
  }, [shaderName, fromImage, toImage]);

  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    gl.useProgram(program);

    // Uniforms
    const uProgress = gl.getUniformLocation(program, 'u_progress');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uAccent = gl.getUniformLocation(program, 'u_accent');
    const uAccentBright = gl.getUniformLocation(program, 'u_accent_bright');
    const uAccentDark = gl.getUniformLocation(program, 'u_accent_dark');
    const uFrom = gl.getUniformLocation(program, 'u_from');
    const uTo = gl.getUniformLocation(program, 'u_to');

    gl.uniform1f(uProgress, progress);
    gl.uniform2f(uRes, resolution.width, resolution.height);
    
    const rgb = hexToRgb(accentColor);
    gl.uniform3f(uAccent, rgb[0], rgb[1], rgb[2]);
    
    const brightRgb = hexToRgb(accentBrightColor);
    gl.uniform3f(uAccentBright, brightRgb[0], brightRgb[1], brightRgb[2]);
    
    const darkRgb = hexToRgb(accentDarkColor);
    gl.uniform3f(uAccentDark, darkRgb[0], darkRgb[1], darkRgb[2]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.from);
    gl.uniform1i(uFrom, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.to);
    gl.uniform1i(uTo, 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [progress, resolution, accentColor, accentBrightColor, accentDarkColor]);

  return (
    <canvas
      ref={canvasRef}
      width={resolution.width}
      height={resolution.height}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1000] scale-[1.02]"
      style={{ mixBlendMode: 'normal' }}
    />
  );
};

export default ShaderTransitionCanvas;
