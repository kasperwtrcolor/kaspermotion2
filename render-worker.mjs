import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// In-memory job tracking
const jobs = new Map();

app.post('/api/render-job', (req, res) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // Store the config sent by the client so the headless browser can fetch it
  jobs.set(jobId, { jobId, status: 'pending', progress: 0, config: req.body.config });
  res.json({ jobId, status: 'pending' });
});

app.get('/api/render-job/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

// Serve rendered files from /tmp
app.use('/outputs', express.static(os.tmpdir(), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Disposition', 'attachment; filename="vibetrailer-export.mp4"');
    }
  }
}));

app.post('/api/render-hyperframes', async (req, res) => {
  const { jobId, url, duration, width = 1920, height = 1080 } = req.body;
  const job = jobs.get(jobId) || { jobId, status: 'rendering', progress: 0 };
  job.status = 'rendering';
  job.progress = 5;
  jobs.set(jobId, job);

  // Respond immediately so client can start polling
  res.json({ jobId, status: 'started' });

  const webmPath = path.join(os.tmpdir(), `${jobId}.webm`);
  const mp4Path = path.join(os.tmpdir(), `${jobId}.mp4`);
  const totalDuration = duration || 10;

  try {
    console.log(`[Render] Starting job ${jobId}: ${url} (${totalDuration}s, ${width}x${height})`);
    
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
      
      console.log(`[Render] Navigating to: ${url}`);
      job.progress = 10;

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Wait for app to load, fetch config, and start playing
      console.log(`[Render] Page loaded, waiting for app to initialize...`);
      job.progress = 15;
      await new Promise(r => setTimeout(r, 5000));

      // Start screencast recording (Puppeteer 21+ built-in API)
      // This is MUCH faster than frame-by-frame screenshots
      console.log(`[Render] Starting screencast recording for ${totalDuration}s...`);
      job.progress = 20;
      
      const recorder = await page.screencast({ path: webmPath });

      // Let the page play for the full duration, updating progress
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(elapsed / totalDuration, 1);
        job.progress = 20 + Math.round(pct * 60); // 20-80% = recording
      }, 1000);

      await new Promise(r => setTimeout(r, totalDuration * 1000));
      clearInterval(checkInterval);

      // Stop recording
      await recorder.stop();
      console.log(`[Render] Screencast saved to ${webmPath}`);
      job.progress = 80;

      // Convert WebM → MP4 with FFmpeg
      console.log(`[Render] Converting to MP4...`);
      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
      
      await new Promise((resolve, reject) => {
        const globalAudioUrl = job.config?.settings?.globalAudioUrl;
        
        const ffmpegArgs = [
          '-y',
          '-i', webmPath
        ];

        if (globalAudioUrl) {
          ffmpegArgs.push('-i', globalAudioUrl);
        }

        ffmpegArgs.push(
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        );

        if (globalAudioUrl) {
          ffmpegArgs.push(
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest'
          );
        } else {
          ffmpegArgs.push('-an');
        }

        ffmpegArgs.push(mp4Path);

        const proc = spawn(ffmpegPath, ffmpegArgs);

        proc.stderr.on('data', (data) => {
          const msg = data.toString();
          if (msg.includes('frame=')) {
            job.progress = 85;
          }
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });
        proc.on('error', reject);
      });

      // Clean up WebM
      try { await fs.unlink(webmPath); } catch {}

      job.status = 'complete';
      job.progress = 100;
      job.videoUrl = `/outputs/${jobId}.mp4`;
      console.log(`[Render] Job ${jobId} complete: ${mp4Path}`);

    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error(`[Render] Job ${jobId} failed:`, err);
    job.status = 'failed';
    job.error = err.message || 'Render failed';
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Render Worker] Running on port ${PORT}`);
});
