import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import * as path from 'path';
import * as cheerio from 'cheerio';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { renderComposition } from './src/lib/renderer';
import 'dotenv/config';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Initialize Firebase Admin
if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} else {
  // Try default initialization for local/dev
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin not initialized. Webhooks will fail to update credits.");
  }
}
const db = admin.firestore();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhook for Stripe must use raw body
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || '0', 10);

      if (userId && credits > 0) {
        try {
          const userRef = db.collection('users').doc(userId);
          await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const currentCredits = userDoc.exists ? (userDoc.data()?.credits || 0) : 0;
            transaction.set(userRef, { credits: currentCredits + credits }, { merge: true });
          });
          console.log(`Successfully added ${credits} credits to user ${userId}`);
        } catch (error) {
          console.error(`Failed to update credits for user ${userId}:`, error);
        }
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // API Route for scraping and generating script
  app.post('/api/scrape', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      let targetUrl = url;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      // Fetch the URL content with a User-Agent
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Parse HTML with cheerio
      const $ = cheerio.load(html);
      
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
      const ogImage = $('meta[property="og:image"]').attr('content') || '';
      
      const h1s: string[] = [];
      $('h1').each((_, el) => {
        h1s.push($(el).text().trim());
      });
      
      const h2s: string[] = [];
      $('h2').each((_, el) => {
        h2s.push($(el).text().trim());
      });

      // Extract page images for assets
      const pageImages: string[] = [];
      if (ogImage) pageImages.push(ogImage);
      $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.startsWith('data:') && !src.includes('icon') && !src.includes('favicon') && pageImages.length < 8) {
          // Resolve relative URLs
          try {
            const resolved = new URL(src, targetUrl).href;
            if (!pageImages.includes(resolved)) {
              pageImages.push(resolved);
            }
          } catch {}
        }
      });

      // Generate screenshot URL using thum.io
      const screenshotUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${encodeURIComponent(targetUrl)}`;

      const extractedData = `
Title: ${title}
Meta Description: ${metaDescription}
H1 Tags: ${h1s.join(' | ')}
H2 Tags: ${h2s.join(' | ')}
      `.trim();

      const prompt = `Based on the following extracted structure from ${url}, identify the primary value proposition and slogans to generate a short, punchy script and choreography for a motion graphics trailer. 
      
      Return ONLY a JSON object with this structure:
      {
        "siteName": "...",
        "scenes": [
          {
            "caption": "...",
            "transitionType": "one of: fade, slide, 3d-flip, zoom, domain-warp, ridged-burn, whip-pan, sdf-iris, ripple-waves, gravitational-lens, cinematic-zoom, chromatic-split, glitch, swirl-vortex, thermal-distortion, flash-through-white, cross-warp-morph, light-leak",
            "backgroundStyle": "one of: vibrant-glow, particles, grid, gradient-teal, gradient-rose, deep-ocean, sunset-fire, midnight",
            "textEffect": "one of: gsap-cascade, gsap-3d-roll, gsap-elastic, gsap-expand, gsap-tornado, gsap-merge-elastic, gsap-glow",
            "cameraPath": "one of: zoom-in, zoom-out, orbit-left, orbit-right, pan-down-tilt, static"
          }
        ]
      }
      
      Extracted Content:
      ${extractedData}`;
      
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let choreography;
      try {
        const text = aiResponse.text?.trim() || "{}";
        // Remove markdown code blocks if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        choreography = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        console.error('Failed to parse AI JSON:', e);
        // Fallback to simple script
        choreography = { siteName: title, scenes: [{ caption: aiResponse.text?.trim() || "Welcome" }] };
      }

      res.json({
        choreography,
        script: choreography.scenes.map((s: any) => s.caption).join('\n'),
        screenshotUrl,
        pageImages: pageImages.slice(0, 6),
        siteName: choreography.siteName || title,
      });
    } catch (error: any) {
      console.error('Scraping error:', error);
      res.status(500).json({ error: error.message || 'Failed to scrape URL or generate script' });
    }
  });

  // API Route for animating images using AI (Replicate)
  app.post('/api/animate-media', async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl is required' });
      }

      const token = process.env.REPLICATE_API_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'REPLICATE_API_TOKEN is not configured.' });
      }

      // 1. Create prediction using Stable Video Diffusion
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '3f0c2787034b394856f4d54b83ca6498c8c6b758da4f4ed781f8d4610ed98020',
          input: {
            image: imageUrl,
            video_length: '14_frames_with_svd',
            fps: 6,
            motion_bucket_id: 127
          }
        })
      });

      const prediction = await response.json();
      if (prediction.error) throw new Error(prediction.error);

      // 2. Simple polling to wait for completion (max 2 minutes)
      let finalUrl = null;
      for (let i = 0; i < 40; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        const pollData = await pollRes.json();
        
        if (pollData.status === 'succeeded') {
          // Replicate returns an array or string for SVD
          finalUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
          break;
        } else if (pollData.status === 'failed') {
          throw new Error('Animation failed.');
        }
      }

      if (!finalUrl) {
        return res.status(504).json({ error: 'Animation timed out.' });
      }

      res.json({ videoUrl: finalUrl });
    } catch (error: any) {
      console.error('Animation error:', error);
      res.status(500).json({ error: error.message || 'Failed to animate image' });
    }
  });

  // API Route for website screenshot
  app.post('/api/screenshot', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      let targetUrl = url;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      const screenshotUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${encodeURIComponent(targetUrl)}`;
      res.json({ screenshotUrl });
    } catch (error: any) {
      console.error('Screenshot error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate screenshot' });
    }
  });

  // Stripe Checkout Session Creation
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { userId, credits, amount } = req.body;

      if (!userId || !credits || !amount) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${credits} Credits for VibeTrailer`,
                description: `Add ${credits} credits to your account.`,
              },
              unit_amount: Math.round(amount * 100), // amount in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?success=true`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?canceled=true`,
        metadata: {
          userId,
          credits: credits.toString(),
        },
      });

      res.json({ id: session.id });
    } catch (error: any) {
      console.error('Stripe session error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // SHAREABLE VIDEOS + RENDER JOB API
  // =========================================================================

  // Upload a rendered video to Firebase Storage and create a shareable link
  app.post('/api/video/upload', express.raw({ type: 'video/*', limit: '100mb' }), async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const title = (req.headers['x-video-title'] as string) || 'Untitled Trailer';
      
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: 'No video data received' });
      }

      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const contentType = req.headers['content-type'] || 'video/webm';
      const ext = contentType.includes('mp4') ? 'mp4' : 'webm';
      const storagePath = `public-videos/${videoId}.${ext}`;

      // Upload to Firebase Storage via Admin SDK
      const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET || 'writeiq-44dd8.firebasestorage.app');
      const file = bucket.file(storagePath);
      
      await file.save(req.body, {
        metadata: {
          contentType,
          metadata: {
            videoId,
            userId: userId || 'anonymous',
            title,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Make the file publicly readable
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      // Store metadata in Firestore
      const videoDoc = {
        videoId,
        userId: userId || 'anonymous',
        title,
        url: publicUrl,
        storagePath,
        status: 'complete',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        views: 0,
        ext
      };

      await db.collection('videos').doc(videoId).set(videoDoc);

      const shareUrl = `${process.env.APP_URL || 'https://vibetrailer.com'}/share/${videoId}`;

      res.json({ 
        videoId,
        shareUrl,
        videoUrl: publicUrl
      });
    } catch (error: any) {
      console.error('Video upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload video' });
    }
  });

  // Get video metadata for the share page
  app.get('/api/video/:id', async (req, res) => {
    try {
      const videoId = req.params.id;
      const videoDoc = await db.collection('videos').doc(videoId).get();

      if (!videoDoc.exists) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const data = videoDoc.data();

      // Increment view count
      await db.collection('videos').doc(videoId).update({
        views: admin.firestore.FieldValue.increment(1)
      });

      res.json({
        videoId: data?.videoId,
        title: data?.title,
        url: data?.url,
        status: data?.status,
        views: (data?.views || 0) + 1,
        createdAt: data?.createdAt
      });
    } catch (error: any) {
      console.error('Video fetch error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch video' });
    }
  });

  // Create a render job (for the X bot to trigger server-side rendering)
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
        sourceType: sourceType || 'api',  // 'x-bot', 'api', etc.
        sourceId: sourceId || null,        // X post ID, etc.
        status: 'pending',                 // pending → rendering → complete → failed
        videoId: null,
        videoUrl: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        createdAt: data?.createdAt
      });
    } catch (error: any) {
      console.error('Render job fetch error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch render job' });
    }
  });

  // HyperFrames Server-Side Render Trigger
  app.post('/api/render-hyperframes', async (req, res) => {
    try {
      const { url, duration, jobId } = req.body;
      
      if (!url || !duration) {
        return res.status(400).json({ error: 'URL and duration are required' });
      }

      const os = await import('os');
      const tempDir = os.tmpdir();
      const id = jobId || `job_${Date.now()}`;
      const outputPath = path.join(tempDir, `${id}.mp4`);
      
      // Update job status to rendering
      // Initialize/Update job status to rendering
      if (jobId) {
        await db.collection('render-jobs').doc(jobId).set({
          status: 'rendering',
          progress: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // Start asynchronous render
      renderComposition(url, outputPath, {
        duration,
        onProgress: async (p) => {
          if (jobId) {
            await db.collection('render-jobs').doc(jobId).set({
              progress: Math.round(p * 100)
            }, { merge: true });
          }
        }
      }).then(async (renderedPath) => {
        // 1. Read the rendered file
        const fs = await import('fs/promises');
        const videoBuffer = await fs.readFile(renderedPath);
        
        // 2. Upload to Firebase
        const videoId = `vid_hf_${Date.now()}`;
        const storagePath = `public-videos/${videoId}.mp4`;
        const bucket = admin.storage().bucket();
        const file = bucket.file(storagePath);
        
        await file.save(videoBuffer, {
          metadata: {
            contentType: 'video/mp4',
            metadata: { videoId, source: 'hyperframes-headless' }
          }
        });
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
        
        // 3. Create video document
        await db.collection('videos').doc(videoId).set({
          videoId,
          title: 'HyperRender Video',
          url: publicUrl,
          storagePath,
          status: 'complete',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          views: 0,
          ext: 'mp4'
        });

        // 4. Update job status
        if (jobId) {
          await db.collection('render-jobs').doc(jobId).update({
            status: 'complete',
            progress: 100,
            videoId: videoId,
            videoUrl: publicUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // 5. Cleanup temp file
        await fs.unlink(renderedPath).catch(() => {});
      }).catch(async (err) => {
        console.error('Render job error:', err);
        if (jobId) {
          await db.collection('render-jobs').doc(jobId).update({
            status: 'failed',
            error: err.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });

      res.json({ jobId: id, status: 'started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
