import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import * as path from 'path';
import * as cheerio from 'cheerio';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
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

      const prompt = `Based on the following extracted structure from ${url}, identify the primary value proposition and slogans to generate a short, punchy script for a motion graphics trailer. 
      Return ONLY the script, with each scene's caption on a new line. Do not include scene numbers or prefixes. Keep it under 10 lines.
      
      Extracted Content:
      ${extractedData}`;
      
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        script: aiResponse.text?.trim(),
        screenshotUrl,
        pageImages: pageImages.slice(0, 6),
        siteName: title,
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
