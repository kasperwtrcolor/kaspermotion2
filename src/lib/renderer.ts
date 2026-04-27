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
  const resolveClass = (mod: any, className: string) => {
    console.log(`[HyperFlow] Fulfillment Probe (${className}):`, {
      keys: Object.keys(mod || {}),
      typeof: typeof mod,
      hasDefault: !!(mod && mod.default),
      defaultKeys: mod?.default ? Object.keys(mod.default) : 'n/a'
    });

    if (!mod) return null;
    if (typeof mod[className] === 'function') return mod[className];
    if (mod.default && typeof mod.default[className] === 'function') return mod.default[className];
    if (typeof mod.default === 'function') return mod.default;
    if (typeof mod === 'function') return mod;
    return null;
  };

  const Engine = resolveClass(HyperEngineModule, 'Engine');
  const Producer = resolveClass(HyperProducerModule, 'Producer');

  if (!Engine || typeof Engine !== 'function') {
    throw new Error(`Critical: 'Engine' constructor resolution failed. Value: ${typeof Engine}`);
  }

  const {
    duration,
    fps = 60,
    width = 1920,
    height = 1080,
    onProgress
  } = options;

  console.log(`[HyperFrames] Starting render for ${url} (${duration}s @ ${fps}fps)`);

  const engine = new Engine({
    width,
    height,
    // HyperFrames BeginFrame hook for deterministic seeking
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined
  });

  const producer = new Producer(engine, {
    fps,
    outputPath,
    ffmpegPath: process.env.FFMPEG_PATH || (typeof ffmpeg === 'function' ? undefined : undefined) // Use system ffmpeg by default
  });

  try {
    await engine.init();
    
    // Start the capture pipeline
    await producer.start(url, {
      totalFrames: Math.ceil(duration * fps),
      onFrame: (frame, total) => {
        if (onProgress) {
          onProgress(frame / total);
        }
      }
    });

    console.log(`[HyperFrames] Render complete! Output saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('[HyperFrames] Render failed:', error);
    throw error;
  } finally {
    await engine.close();
  }
}
