import express from 'express';
import cors from 'cors';
import * as path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', engine: 'RenderWorker', timestamp: Date.now() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', engine: 'RenderWorker' });
});

// In-memory render job state for tracking
const jobs = new Map<string, any>();

app.post('/api/render-job', (req, res) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  jobs.set(jobId, {
    jobId,
    status: 'pending',
    progress: 0,
    createdAt: Date.now()
  });
  res.json({ jobId, status: 'pending' });
});

app.get('/api/render-job/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

app.post('/api/render-hyperframes', async (req, res) => {
  const { jobId, url, duration, width, height } = req.body;
  const job = jobs.get(jobId) || { jobId, status: 'rendering', progress: 0 };
  job.status = 'rendering';
  jobs.set(jobId, job);

  // Send fast response so client doesn't hang
  res.json({ jobId, status: 'started' });

  // Execute render in background using puppeteer fallback
  try {
    const { renderComposition } = await import('./src/lib/renderer');
    const os = await import('os');
    const outputPath = path.join(os.tmpdir(), `${jobId}.mp4`);

    await renderComposition(url || 'http://localhost:3000', outputPath, {
      duration: duration || 5,
      width: width || 1920,
      height: height || 1080,
      fps: 30,
      onProgress: (p: number) => {
        job.progress = Math.round(p * 100);
      }
    });

    job.status = 'complete';
    job.progress = 100;
    job.videoUrl = `/outputs/${jobId}.mp4`;
  } catch (err: any) {
    console.error(`Render job ${jobId} failed:`, err);
    job.status = 'failed';
    job.error = err.message || 'Render failed';
  }
});

app.use('/outputs', express.static(require('os').tmpdir()));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Render Worker] Running on port ${PORT}`);
});

