import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const resolveUrl = (base: string, relative: string) => {
  if (!relative) return null;
  if (/^https?:\/\//i.test(relative)) return relative;
  if (relative.startsWith('//')) return 'https:' + relative;
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 1. Extract Basic Metadata
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    
    // 2. Extract Images
    const images: string[] = [];
    
    // Favicon & OG Image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) images.push(resolveUrl(targetUrl, ogImage)!);
    
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
    if (favicon) images.push(resolveUrl(targetUrl, favicon)!);

    // Regular Images (filter for potentially usable ones)
    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (!src && $(el).attr('srcset')) {
        src = $(el).attr('srcset')?.split(',')[0].trim().split(' ')[0];
      }
      if (src && !src.includes('data:image') && !src.endsWith('.svg')) {
        const fullUrl = resolveUrl(targetUrl, src);
        if (fullUrl && !images.includes(fullUrl)) images.push(fullUrl);
      }
    });

    // 3. Extract Design Clues (Hex Colors)
    const hexRegex = /#([a-f0-9]{3,6})\b/gi;
    const bodyContent = $('body').text().slice(0, 5000); // Sample for text context
    const styles = $('style').text() + $('[style]').attr('style');
    const colorMatches: string[] = (styles + bodyContent).match(hexRegex) || [];
    
    // Get unique colors and count frequency
    const colorFreq: Record<string, number> = {};
    colorMatches.forEach((c: string) => {
      const normalized = c.toLowerCase();
      colorFreq[normalized] = (colorFreq[normalized] || 0) + 1;
    });
    const topColors = Object.entries(colorFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(e => e[0]);

    // 4. AI Analysis
    const extractedData = `
      Title: ${title}
      Description: ${metaDescription}
      Images Found: ${images.length}
      Top Hex Colors Found: ${topColors.join(', ')}
      H1/H2 Headers: ${$('h1, h2').text().slice(0, 500)}
    `.trim();

    const prompt = `
      Analyze this website metadata and provide architectural design tokens for a cinematic motion graphics trailer.
      
      WEBSITE DATA:
      ${extractedData}

      RESPONSE FORMAT (JSON ONLY):
      {
        "script": "A 5-8 line punchy script. IMPORTANT: Do NOT use generic boilerplate about 'AI' or 'KasperMotion'. Use the ACTUAL product names and value propositions found in the website content (H1s, H2s, Meta Description). Each line must be unique and punchy.",
        "colors": {
          "primary": "Suggest a hex code for primary text",
          "accent": "Suggest a hex code for highlights",
          "background": "Suggest a hex code for scene background (ink, ivory, or specific branding)"
        },
        "typography": {
          "vibe": "sans" | "serif" | "mono" | "display",
          "pairing": "Suggested font style name"
        },
        "mood": "energetic" | "professional" | "minimal" | "cinematic",
        "pacing": "rapid-tiktok" | "standard" | "cinematic-slow",
        "sceneComplexity": "simple" | "dense" | "layered",
        "choreographySkeleton": "launch_teaser" | "product_explainer" | "cinematic_title" | "custom",
        "choreography": {
          "scenes": [
            {
              "sceneType": "standard" | "macos-notification" | "instagram-follow" | "reddit-post" | "x-post" | "spotify-card",
              "shape": "pill" | "square" | "circle" | "message" | "star" | "flower",
              "textEffect": "gsap-cascade" | "gsap-3d-roll" | "gsap-elastic" | "gsap-tornado" | "gsap-funnel" | "gsap-stack",
              "cameraPath": "zoom-in" | "zoom-out" | "orbit-left" | "dolly-zoom" | "hyper-glide" | "parallax-sweep",
              "backgroundStyle": "black" | "ivory" | "cream" | "vibrant-glow",
              "secondaryAssetIntent": "Thematic keyword for animated motion icons or 3D assets. MUST CHOOSE ONE from: 'growth', 'launch', 'secure', 'connect', 'cloud', 'data', 'idea', 'victory', 'alert', 'social'. LEAVE EMPTY ONLY IF UNRELATED."
            }
          ]
        }
      }
    `;
    
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview', // Precise 2026 preview string
      contents: prompt,
    });

    const resultText = aiResponse.text?.trim() || '{}';
    // Handle potential markdown code blocks in response
    const jsonStr = resultText.replace(/```json|```/g, '').trim();
    let aiData = {};
    try {
      aiData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', jsonStr);
    }

    // Fetch live website screenshot using Microlink
    let screenshotUrl = '';
    try {
      const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&embed=screenshot.url`;
      const screenshotRes = await fetch(microlinkUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });
      if (screenshotRes.ok) {
        const buffer = await screenshotRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        screenshotUrl = `data:image/png;base64,${base64}`;
      }
    } catch (e) {
      console.error('Failed to capture screenshot via Microlink:', e);
    }

    // Fetch and convert top images to base64 to avoid CORS on client
    const fetchedImages: string[] = [];
    const imageCandidates = images.slice(0, 10);
    
    await Promise.allSettled(
      imageCandidates.map(async (imgUrl) => {
        try {
          const imgRes = await fetch(imgUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
          });
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
            const base64 = Buffer.from(buffer).toString('base64');
            fetchedImages.push(`data:${mimeType};base64,${base64}`);
          }
        } catch (e) {
          console.error('Failed to fetch image:', imgUrl, e);
        }
      })
    );

    res.status(200).json({ 
      ...aiData,
      scrapedImages: fetchedImages.length > 0 ? fetchedImages.slice(0, 8) : images.slice(0, 8),
      screenshotUrl,
      brandTitle: title || 'New Project'
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message || 'Failed to scrape URL or generate script' });
  }
}
