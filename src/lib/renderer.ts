import path from 'path';
import * as HyperProducerModule from '@hyperframes/producer';
import * as HyperEngineModule from '@hyperframes/engine';
import ffmpeg from 'fluent-ffmpeg';

/**
 * HyperFrames Renderer — Headless MP4 Generation
 * Orchestrates Puppeteer and FFmpeg to render the composition frame-by-frame.
 */
export async function renderComposition(
  url: string,
  outputPath: string,
  options: {
    duration: number;
    fps?: number;
    width?: number;
    height?: number;
    onProgress?: (progress: number) => void;
  }
) {
  const {
    duration,
    fps = 60,
    width = 1920,
    height = 1080,
    onProgress
  } = options;

  console.log(`[HyperFrames] Starting functional render for ${url} (${duration}s @ ${fps}fps)`);

  const engineModule = HyperEngineModule as any;
  const producerModule = HyperProducerModule as any;

  // Resolve API - Fallback to any method that looks like a renderer
  const executeRenderJob = producerModule.executeRenderJob || producerModule.renderVideo;
  const createRenderJob = producerModule.createRenderJob || ((u: string, o: any) => ({ url: u, ...o }));

  if (typeof executeRenderJob !== 'function') {
    throw new Error('Critical: High-level executeRenderJob not found in @hyperframes/producer');
  }

  try {
    // HyperFrames High-Level API Transition
    const job = createRenderJob(url, {
      outputPath,
      width,
      height,
      fps,
      totalFrames: Math.ceil(duration * fps),
      executablePath: process.env.CHROME_PATH || undefined,
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

    console.log(`[HyperFrames] Render complete! Output saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('[HyperFrames] Render failed:', error);
    throw error;
  }
}
