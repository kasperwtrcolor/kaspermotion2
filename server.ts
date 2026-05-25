import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import * as path from 'path';
import * as cheerio from 'cheerio';
import Stripe from 'stripe';
import cors from 'cors';
import { initializeApp, cert, credential, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { renderComposition } from './src/lib/renderer';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

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
    try {
      initializeApp();
    } catch (e) {
      console.warn("Firebase Admin not initialized. Webhooks will fail to update credits.");
    }
  }
}

const db = getFirestore(process.env.FIREBASE_DATABASE_ID || 'ai-studio-05e7b484-8619-4800-9e84-75b7d72457cd');
const storageBucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET || 'writeiq-44dd8.firebasestorage.app');

const adminUtils = {
  firestore: { FieldValue }
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-video-title']
  }));

  // Health check for persistent deployment
  app.get('/api/health', (req, res) => res.json({ status: 'healthy', engine: 'HyperFlow' }));

  // Global logging middleware
  app.use((req, res, next) => {
    console.log(`[Vibe Engine] ${req.method} ${req.url}`);
    next();
  });

  // Dynamic configuration to hide secrets from client
  app.get('/api/config', (req, res) => {
    res.json({
      firebaseConfig: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'writeiq-44dd8.firebasestorage.app',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
      }
    });
  });

  // Giphy Proxy to hide API Key
  app.get('/api/giphy/search', async (req, res) => {
    try {
      const { q, limit = 20, offset = 0 } = req.query;
      const apiKey = process.env.GIPHY_API_KEY || 'missing_key';
      const response = await fetch(`https://api.giphy.com/v1/stickers/search?api_key=${apiKey}&q=${encodeURIComponent(q as string)}&limit=${limit}&offset=${offset}`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Webhook for Stripe must use raw body
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('❌ STRIPE_WEBHOOK_SECRET is NOT set in environment variables! Webhook signature verification WILL fail.');
      } else {
        console.log(`📡 Attempting webhook verification with secret (len: ${webhookSecret.length})`);
      }
      
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret || ''
      );
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      console.log('💡 Tip: Ensure your STRIPE_WEBHOOK_SECRET matches the one in the Stripe Dashboard for this endpoint.');
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    console.log(`🔔 Webhook received: ${event.type} [${event.id}]`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);

      console.log(`💳 Checkout session completed for user: ${userId}, credits: ${creditsToAdd}`);

      if (userId && creditsToAdd > 0) {
        try {
          const userRef = db.collection('users').doc(userId);
          await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const currentCredits = userDoc.exists ? (userDoc.data()?.credits || 0) : 0;
            const newCredits = currentCredits + creditsToAdd;
            
            console.log(`🔄 Transaction: updating user ${userId} credits from ${currentCredits} to ${newCredits}`);
            
            transaction.set(userRef, { 
              credits: newCredits,
              lastPurchaseDate: new Date().toISOString()
            }, { merge: true });
          });
          console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to update credits for user ${userId}:`, error);
        }
      } else {
        console.warn(`⚠️ Missing metadata in session: userId=${userId}, credits=${creditsToAdd}`);
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
            "textEffect": "one of: gsap-cascade, gsap-3d-roll, gsap-elastic, gsap-expand, gsap-tornado, gsap-merge-elastic, gsap-glow, gsap-typewriter, gsap-glitch, gsap-wave, gsap-blur-reveal",
            "cameraPath": "one of: zoom-in, zoom-out, orbit-left, orbit-right, pan-down-tilt, static, crane-up, parallax-drift",
            "shape": "one of: square, rounded-rect, fullscreen"
          }
        ]
      }

      STYLE GUIDELINES:
      - Use 'fullscreen' shape for dramatic hero shots, app screenshots, or cinematic reveals where the image should fill the entire background behind the text. Use it for 1-2 scenes maximum per trailer.
      - Use 'gsap-typewriter' for taglines, product names, or technical descriptions.
      - Use 'gsap-glitch' for tech/startup brands or dramatic reveals.
      - Use 'gsap-wave' for playful or creative brands.
      - Use 'gsap-blur-reveal' for premium or luxury reveals.
      - Use 'crane-up' camera for dramatic opening or closing scenes.
      - Use 'parallax-drift' camera for scenes showing depth or layers.
      
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

  // Solana Blockhash Fetching endpoint
  app.get('/api/solana-blockhash', async (req, res) => {
    try {
      const userHeliusRpc = process.env.HELIUS_RPC_URL || process.env.VITE_HELIUS_RPC_URL || process.env.HELIUS_RPC;
      const walletAddress = req.query.wallet as string;
      const recipientAtaAddress = req.query.recipientAta as string;

      const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

      const rpcNodes: string[] = [];
      if (userHeliusRpc) {
        rpcNodes.push(userHeliusRpc);
      }
      rpcNodes.push('https://rpc.ankr.com/solana');
      rpcNodes.push('https://solana-mainnet.public.blastapi.io');
      rpcNodes.push('https://api.mainnet-beta.solana.com');

      let blockhash = '';
      let balance = 0;
      let balanceExists = false;
      let senderATA = '';
      let recipientAtaExists = false;
      let lastError: any = null;

      for (const nodeUrl of rpcNodes) {
        try {
          console.log(`[Vibe Engine] Connecting to Solana RPC: ${nodeUrl}`);

          // 1. Fetch latest blockhash
          const response = await fetch(nodeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getLatestBlockhash',
              params: [{ commitment: 'confirmed' }],
            }),
          });

          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
          const data: any = await response.json();
          if (data.error) throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`);

          if (data.result?.value?.blockhash) {
            blockhash = data.result.value.blockhash;
            console.log(`[Vibe Engine] Got blockhash from ${nodeUrl}`);
          } else {
            throw new Error('Invalid blockhash response');
          }

          // 2. Discover sender's USDC token account using getTokenAccountsByOwner
          if (walletAddress) {
            console.log(`[Vibe Engine] Discovering USDC accounts for wallet: ${walletAddress}`);
            const tokenAccountsResponse = await fetch(nodeUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'getTokenAccountsByOwner',
                params: [
                  walletAddress,
                  { mint: USDC_MINT },
                  { encoding: 'jsonParsed' },
                ],
              }),
            });

            if (tokenAccountsResponse.ok) {
              const tokenData: any = await tokenAccountsResponse.json();
              if (tokenData.result?.value && tokenData.result.value.length > 0) {
                let bestAccount = tokenData.result.value[0];
                let bestBalance = 0;
                for (const account of tokenData.result.value) {
                  const info = account.account?.data?.parsed?.info;
                  if (info) {
                    const amt = Number(info.tokenAmount?.uiAmount || 0);
                    if (amt >= bestBalance) {
                      bestBalance = amt;
                      bestAccount = account;
                    }
                  }
                }
                senderATA = bestAccount.pubkey;
                const info = bestAccount.account?.data?.parsed?.info;
                balance = Number(info?.tokenAmount?.uiAmount || 0);
                balanceExists = true;
                console.log(`[Vibe Engine] Found USDC account: ${senderATA}, balance: ${balance}`);
              } else {
                balanceExists = true;
                balance = 0;
                console.log(`[Vibe Engine] No USDC accounts found for wallet ${walletAddress}`);
              }
            }
          }

          // 3. Check recipient ATA existence
          if (recipientAtaAddress) {
            console.log(`[Vibe Engine] Checking recipient ATA: ${recipientAtaAddress}`);
            const accountResponse = await fetch(nodeUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 3,
                method: 'getAccountInfo',
                params: [recipientAtaAddress, { encoding: 'jsonParsed' }],
              }),
            });

            if (accountResponse.ok) {
              const accountData: any = await accountResponse.json();
              recipientAtaExists = !!(accountData.result && accountData.result.value !== null);
              console.log(`[Vibe Engine] Recipient ATA exists: ${recipientAtaExists}`);
            }
          }

          break; // success
        } catch (err: any) {
          console.warn(`[Vibe Engine] Failed on ${nodeUrl}:`, err.message || err);
          lastError = err;
        }
      }

      if (!blockhash) {
        throw new Error(`Failed to connect to Solana RPC: ${lastError?.message || 'All nodes failed'}`);
      }

      res.json({ blockhash, balance, balanceExists, senderATA, recipientAtaExists });
    } catch (error: any) {
      console.error('[Vibe Engine] Failed to fetch blockhash:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch blockhash' });
    }
  });

  // Solana Signature Confirmation endpoint
  app.get('/api/solana-confirm', async (req, res) => {
    try {
      const signature = req.query.signature as string;
      if (!signature) {
        return res.status(400).json({ error: 'Signature is required' });
      }

      const userHeliusRpc = process.env.HELIUS_RPC_URL || process.env.VITE_HELIUS_RPC_URL || process.env.HELIUS_RPC;
      
      const rpcNodes: string[] = [];
      if (userHeliusRpc) {
        rpcNodes.push(userHeliusRpc);
      }
      rpcNodes.push('https://rpc.ankr.com/solana');
      rpcNodes.push('https://solana-mainnet.public.blastapi.io');
      rpcNodes.push('https://solana-mainnet.g.allthatnode.com');
      rpcNodes.push('https://api.mainnet-beta.solana.com');

      let confirmed = false;
      let errDetail: any = null;

      for (const nodeUrl of rpcNodes) {
        try {
          console.log(`[Vibe Engine] Checking signature status on: ${nodeUrl}`);
          const response = await fetch(nodeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getSignatureStatuses',
              params: [[signature], { searchTransactionHistory: true }],
            }),
          });

          if (response.ok) {
            const data: any = await response.json();
            const status = data.result?.value?.[0];
            if (status) {
              if (status.err) {
                errDetail = status.err;
                console.error(`[Vibe Engine] Transaction failed on-chain: ${JSON.stringify(status.err)}`);
                break; // transaction failed on-chain, stop loop
              }
              if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
                confirmed = true;
                console.log(`[Vibe Engine] Transaction confirmed successfully on ${nodeUrl}`);
                break;
              }
            }
          }
        } catch (e) {
          console.warn(`[Vibe Engine] Failed to verify signature on ${nodeUrl}:`, e);
        }
      }

      res.json({ confirmed, error: errDetail });
    } catch (error: any) {
      console.error('[Vibe Engine] Failed to confirm signature:', error);
      res.status(500).json({ error: error.message || 'Failed to confirm signature' });
    }
  });

  // Stripe Checkout Session Creation
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { userId, credits, amount } = req.body;

      if (!userId || !credits) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: '30 VibeTrailer Credits',
                description: 'One-time purchase of 30 export credits for cinematic trailers.',
              },
              unit_amount: 500, // $5.00 in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'https://vibetrailer.fun'}/?payment=success`,
        cancel_url: `${process.env.APP_URL || 'https://vibetrailer.fun'}/?payment=canceled`,
        metadata: {
          userId,
          credits: credits.toString(),
        },
      });

      res.json({ id: session.id, url: session.url });
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
      const bucket = storageBucket;
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
        createdAt: FieldValue.serverTimestamp(),
        views: 0,
        ext,
        size: req.body.length
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
        views: FieldValue.increment(1)
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
        createdAt: data?.createdAt
      });
    } catch (error: any) {
      console.error('Render job fetch error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch render job' });
    }
  });

  // HyperFrames Server-Side Render Trigger
  app.post('/api/render-hyperframes', async (req, res) => {
    console.log('[HyperFlow] Received render request');
    try {
      const { url, duration, jobId } = req.body;
      console.log(`[HyperFlow] Job: ${jobId}, Duration: ${duration}s`);
      
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
          updatedAt: FieldValue.serverTimestamp()
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
        const bucket = storageBucket;
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
          createdAt: FieldValue.serverTimestamp(),
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
            updatedAt: FieldValue.serverTimestamp()
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
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      });

      res.json({ jobId: id, status: 'started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API 404 Catch-all
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Elite Route ${req.method} ${req.url} not recognized.` });
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
    // Ensure API routes take precedence
    app.get(/^(?!\/api).*$/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
