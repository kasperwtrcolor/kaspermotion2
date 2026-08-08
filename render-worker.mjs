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

// Serve rendered files
app.use('/outputs', express.static(os.tmpdir()));

app.post('/api/render-hyperframes', async (req, res) => {
  const { jobId, url, duration, width = 1920, height = 1080, fps = 30 } = req.body;
  const job = jobs.get(jobId) || { jobId, status: 'rendering', progress: 0 };
  job.status = 'rendering';
  jobs.set(jobId, job);

  // Respond immediately so client can start polling
  res.json({ jobId, status: 'started' });

  // Background render
  const outputPath = path.join(os.tmpdir(), `${jobId}.mp4`);
  const totalFrames = Math.ceil((duration || 5) * fps);

  try {
    console.log(`[Render] Starting job ${jobId}: ${url} (${duration}s, ${width}x${height}, ${fps}fps, ${totalFrames} frames)`);
    
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

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 3000)); // let animations init
      
      // Create temp dir for frames
      const tempDir = path.join(os.tmpdir(), `render_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      const frames = [];
      const frameDurationMs = 1000 / fps;

      for (let frame = 0; frame < totalFrames; frame++) {
        const framePath = path.join(tempDir, `frame_${String(frame).padStart(6, '0')}.png`);
        
        await page.screenshot({ path: framePath, type: 'png' });
        frames.push(framePath);

        // Sleep to maintain roughly real-time capture
        await new Promise(r => setTimeout(r, Math.max(frameDurationMs * 0.5, 16)));

        // Update progress
        if (frame % 5 === 0) {
          job.progress = Math.round((frame / totalFrames) * 80); // 0-80% = capture
          jobs.set(jobId, job);
          console.log(`[Render] Frame ${frame}/${totalFrames} (${job.progress}%)`);
        }
      }

      console.log(`[Render] Captured ${totalFrames} frames. Encoding with FFmpeg...`);
      job.progress = 80;

      // FFmpeg encode
      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
      await new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, [
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

        proc.stderr.on('data', (data) => {
          const msg = data.toString();
          const match = msg.match(/frame=\s*(\d+)/);
          if (match) {
            job.progress = 80 + Math.round((parseInt(match[1]) / totalFrames) * 20);
          }
        });

        proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg exit ${code}`)));
        proc.on('error', reject);
      });

      // Cleanup temp frames
      try {
        const files = await fs.readdir(tempDir);
        await Promise.all(files.map(f => fs.unlink(path.join(tempDir, f))));
        await fs.rmdir(tempDir);
      } catch {}

      job.status = 'complete';
      job.progress = 100;
      job.videoUrl = `/outputs/${jobId}.mp4`;
      console.log(`[Render] Job ${jobId} complete: ${outputPath}`);

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
