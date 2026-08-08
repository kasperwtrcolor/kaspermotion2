import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// Health check — always responds
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// In-memory job tracking
const jobs = new Map<string, any>();

app.post('/api/render-job', (req, res) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(jobId, { jobId, status: 'pending', progress: 0 });
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
  const { jobId, url, duration, width, height } = req.body;
  const job = jobs.get(jobId) || { jobId, status: 'rendering', progress: 0 };
  job.status = 'rendering';
  jobs.set(jobId, job);

  res.json({ jobId, status: 'started' });

  try {
    const { renderComposition } = await import('./src/lib/renderer.js');
    const outputPath = path.join(os.tmpdir(), `${jobId}.mp4`);

    await renderComposition(url || 'http://localhost:3000', outputPath, {
      duration: duration || 5,
      width: width || 1920,
      height: height || 1080,
      fps: 30,
      onProgress: (p: number) => { job.progress = Math.round(p * 100); }
    });

    job.status = 'complete';
    job.progress = 100;
    job.videoUrl = `/outputs/${jobId}.mp4`;
  } catch (err: any) {
    console.error(`[Render] Job ${jobId} failed:`, err);
    job.status = 'failed';
    job.error = err.message;
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Render Worker] Running on port ${PORT}`);
});
