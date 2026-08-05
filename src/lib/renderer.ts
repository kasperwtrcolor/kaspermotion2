import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';

/**
 * HyperFrames Renderer — Headless MP4 Generation
 * 
 * Primary: Uses @hyperframes/producer if available.
 * Fallback: Direct Puppeteer frame capture + FFmpeg pipeline.
 */

interface RenderOptions {
  duration: number;
  fps?: number;
  width?: number;
  height?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Attempt the HyperFrames high-level API first.
 * Falls back to raw Puppeteer + FFmpeg if unavailable.
 */
export async function renderComposition(
  url: string,
  outputPath: string,
  options: RenderOptions
) {
  const {
    duration,
    fps = 30,
    width = 1920,
    height = 1080,
    onProgress
  } = options;

  console.log(`[Renderer] Starting render for ${url} (${duration}s @ ${fps}fps, ${width}x${height})`);

  // Try HyperFrames first
  try {
    const HyperProducerModule = await import('@hyperframes/producer');
    const producerModule = HyperProducerModule as any;
    const executeRenderJob = producerModule.executeRenderJob || producerModule.renderVideo;
    const createRenderJob = producerModule.createRenderJob || ((u: string, o: any) => ({ url: u, ...o }));

    if (typeof executeRenderJob === 'function') {
      console.log('[Renderer] Using @hyperframes/producer');
      const job = createRenderJob(url, {
        outputPath,
        width,
        height,
        fps,
        totalFrames: Math.ceil(duration * fps),
        executablePath: process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        ffmpegPath: process.env.FFMPEG_PATH || undefined,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });

      await executeRenderJob(job, {
        onProgress: (progress: number) => {
          if (onProgress) onProgress(progress);
        }
      });

      console.log(`[Renderer] HyperFrames render complete: ${outputPath}`);
      return outputPath;
    }
  } catch (err) {
    console.warn('[Renderer] @hyperframes/producer unavailable, falling back to Puppeteer + FFmpeg');
  }

  // Fallback: Direct Puppeteer frame capture → FFmpeg
  return renderWithPuppeteer(url, outputPath, { duration, fps, width, height, onProgress });
}

/**
 * Fallback renderer: Puppeteer captures screenshots frame-by-frame,
 * pipes raw RGBA/PNG data into FFmpeg to produce an MP4.
 */
async function renderWithPuppeteer(
  url: string,
  outputPath: string,
  options: Required<Omit<RenderOptions, 'onProgress'>> & { onProgress?: (progress: number) => void }
) {
  const { duration, fps, width, height, onProgress } = options;
  const totalFrames = Math.ceil(duration * fps);

  console.log(`[Renderer/Puppeteer] Rendering ${totalFrames} frames at ${fps}fps`);

  // Dynamic import of puppeteer (server-only)
  const puppeteer = await import('puppeteer');

  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      `--window-size=${width},${height}`
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Navigate to the playing URL
    console.log(`[Renderer/Puppeteer] Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for content to be ready
    await new Promise(r => setTimeout(r, 2000));

    // Create temp directory for frames
    const tempDir = path.join(os.tmpdir(), `render_${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Capture frames
    const frameDurationMs = 1000 / fps;

    for (let frame = 0; frame < totalFrames; frame++) {
      const framePath = path.join(tempDir, `frame_${String(frame).padStart(6, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });

      // Advance time in the page (inject next frame timestamp)
      await page.evaluate((ms: number) => {
        // Dispatch a custom event the app can listen for to advance scenes
        window.dispatchEvent(new CustomEvent('renderer-tick', { detail: { timeMs: ms } }));
      }, frame * frameDurationMs);

      // Wait for next frame interval
      await new Promise(r => setTimeout(r, frameDurationMs));

      if (onProgress) {
        onProgress(frame / totalFrames);
      }

      if (frame % 30 === 0) {
        console.log(`[Renderer/Puppeteer] Frame ${frame}/${totalFrames} (${Math.round((frame / totalFrames) * 100)}%)`);
      }
    }

    console.log(`[Renderer/Puppeteer] All ${totalFrames} frames captured. Encoding with FFmpeg...`);

    // FFmpeg: Stitch frames into MP4
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
        '-y',
        '-framerate', String(fps),
        '-i', path.join(tempDir, 'frame_%06d.png'),
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-vf', `scale=${width}:${height}`,
        outputPath
      ]);

      ffmpeg.stderr.on('data', (data: Buffer) => {
        const msg = data.toString();
        if (msg.includes('frame=')) {
          // Parse FFmpeg progress
          const match = msg.match(/frame=\s*(\d+)/);
          if (match && onProgress) {
            const encodedFrame = parseInt(match[1], 10);
            onProgress(0.8 + (encodedFrame / totalFrames) * 0.2); // 80-100% for encoding
          }
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`[Renderer/FFmpeg] Encoding complete: ${outputPath}`);
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });

    // Cleanup temp frames
    try {
      const files = await fs.readdir(tempDir);
      await Promise.all(files.map(f => fs.unlink(path.join(tempDir, f))));
      await fs.rmdir(tempDir);
    } catch {
      // Ignore cleanup errors
    }

    if (onProgress) onProgress(1);
    console.log(`[Renderer] Render complete: ${outputPath}`);
    return outputPath;

  } finally {
    await browser.close();
  }
}
