import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import * as path from 'path';
import * as cheerio from 'cheerio';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for scraping and generating script
  app.post('/api/scrape', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Fetch the URL content
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse HTML with cheerio
      const $ = cheerio.load(html);
      
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
      
      const h1s: string[] = [];
      $('h1').each((_, el) => {
        h1s.push($(el).text().trim());
      });
      
      const h2s: string[] = [];
      $('h2').each((_, el) => {
        h2s.push($(el).text().trim());
      });

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

      res.json({ script: aiResponse.text?.trim() });
    } catch (error) {
      console.error('Scraping error:', error);
      res.status(500).json({ error: 'Failed to scrape URL or generate script' });
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
