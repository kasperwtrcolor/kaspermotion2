/**
 * Render Worker — Lightweight Express server for Railway.
 * 
 * Only handles video rendering endpoints. No Stripe, no Gemini, no Giphy, no Vite.
 * Requires ONLY Firebase credentials (for job tracking + video upload).
 */
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { renderComposition } from './src/lib/renderer';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Initialize Firebase Admin
if (getApps().length === 0) {
  if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'writeiq-44dd8.firebasestorage.app'
    });
  } else {
    console.error('[Render Worker] FIREBASE_PROJECT_ID is required');
    process.exit(1);
  }
}

const db = getFirestore(process.env.FIREBASE_DATABASE_ID || 'ai-studio-05e7b484-8619-4800-9e84-75b7d72457cd');
const storageBucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET || 'writeiq-44dd8.firebasestorage.app');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`[Render Worker] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', engine: 'RenderWorker', uptime: process.uptime() });
});

// Create a render job
app.post('/api/render-job', async (req, res) => {
  try {
    const { script, mediaUrls, config, sourceType, sourceId } = req.body;

    if (!script) {
      return res.status(400).json({ error: 'Script is required' });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const jobDoc = {
      jobId,
      script,
      mediaUrls: mediaUrls || [],
      config: config || {},
      sourceType: sourceType || 'api',
      sourceId: sourceId || null,
      status: 'pending',
      videoId: null,
      videoUrl: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await db.collection('render-jobs').doc(jobId).set(jobDoc);
    res.json({ jobId, status: 'pending' });
  } catch (error: any) {
    console.error('Render job creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create render job' });
  }
});

// Get render job status
app.get('/api/render-job/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const jobDoc = await db.collection('render-jobs').doc(jobId).get();

    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Render job not found' });
    }

    const data = jobDoc.data();
    res.json({
      jobId: data?.jobId,
      status: data?.status,
      videoId: data?.videoId,
      videoUrl: data?.videoUrl,
      progress: data?.progress || 0,
      error: data?.error || null,
      createdAt: data?.createdAt
    });
  } catch (error: any) {
    console.error('Render job fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch render job' });
  }
});

// Trigger headless render
app.post('/api/render-hyperframes', async (req, res) => {
  console.log('[Render Worker] Received render request');
  try {
    const { url, duration, jobId, width, height, fps } = req.body;
    console.log(`[Render Worker] Job: ${jobId}, Duration: ${duration}s, Resolution: ${width}x${height}`);

    if (!url || !duration) {
      return res.status(400).json({ error: 'URL and duration are required' });
    }

    const os = await import('os');
    const tempDir = os.tmpdir();
    const id = jobId || `job_${Date.now()}`;
    const outputPath = path.join(tempDir, `${id}.mp4`);

    // Update job status to rendering
    if (jobId) {
      await db.collection('render-jobs').doc(jobId).set({
        status: 'rendering',
        progress: 0,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Start asynchronous render (respond immediately)
    renderComposition(url, outputPath, {
      duration,
      fps: fps || 30,
      width: width || 1920,
      height: height || 1080,
      onProgress: async (p) => {
        if (jobId) {
          await db.collection('render-jobs').doc(jobId).set({
            progress: Math.round(p * 100)
          }, { merge: true });
        }
      }
    }).then(async (renderedPath) => {
      const fs = await import('fs/promises');
      const videoBuffer = await fs.readFile(renderedPath);

      // Upload to Firebase Storage
      const videoId = `vid_hf_${Date.now()}`;
      const storagePath = `public-videos/${videoId}.mp4`;
      const file = storageBucket.file(storagePath);

      await file.save(videoBuffer, {
        metadata: {
          contentType: 'video/mp4',
          metadata: { videoId, source: 'render-worker' }
        }
      });
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${storageBucket.name}/${storagePath}`;

      // Create video document
      await db.collection('videos').doc(videoId).set({
        videoId,
        title: 'HyperRender Video',
        url: publicUrl,
        storagePath,
        status: 'complete',
        createdAt: FieldValue.serverTimestamp(),
        views: 0,
        ext: 'mp4'
      });

      // Update job status
      if (jobId) {
        await db.collection('render-jobs').doc(jobId).update({
          status: 'complete',
          progress: 100,
          videoId,
          videoUrl: publicUrl,
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      // Cleanup
      await fs.unlink(renderedPath).catch(() => {});
      console.log(`[Render Worker] Job ${id} complete: ${publicUrl}`);
    }).catch(async (err) => {
      console.error(`[Render Worker] Job ${id} failed:`, err);
      if (jobId) {
        await db.collection('render-jobs').doc(jobId).update({
          status: 'failed',
          error: err.message,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    });

    // Respond immediately — client will poll for status
    res.json({ jobId: id, status: 'started' });
  } catch (error: any) {
    console.error('[Render Worker] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'This is a render-only worker. This endpoint is not available here.',
    available: ['/api/health', '/api/render-job', '/api/render-job/:id', '/api/render-hyperframes']
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Render Worker] Running on port ${PORT}`);
});
