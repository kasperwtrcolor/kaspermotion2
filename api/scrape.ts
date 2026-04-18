import { ai } from './_utils/init';
import * as cheerio from 'cheerio';

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
    
    const h1s: string[] = [];
    $('h1').each((_, el) => {
      h1s.push($(el).text().trim());
    });
    
    const h2s: string[] = [];
    $('h2').each((_, el) => {
      h2s.push($(el).text().trim());
    });

    const pageImages: string[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:') && !src.includes('icon') && !src.includes('favicon') && pageImages.length < 8) {
        try {
          const resolved = new URL(src, targetUrl).href;
          if (!pageImages.includes(resolved)) {
            pageImages.push(resolved);
          }
        } catch {}
      }
    });

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
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    res.status(200).json({ 
      script: aiResponse.text?.trim(),
      screenshotUrl,
      pageImages: pageImages.slice(0, 6),
      siteName: title
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message || 'Failed to scrape URL or generate script' });
  }
}
