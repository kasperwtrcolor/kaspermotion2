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

    if (!process.env.GEMINI_API_KEY) {
       return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment.' });
    }

    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // Fetch the URL content with a User-Agent
    let response;
    try {
      response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
    } catch (fetchErr: any) {
      return res.status(500).json({ error: `Failed to fetch target URL: ${fetchErr.message}` });
    }
    
    if (!response.ok) {
      return res.status(500).json({ error: `Target URL returned ${response.status}: ${response.statusText}` });
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    
    const h1s: string[] = [];
    $('h1').each((_, el) => { h1s.push($(el).text().trim()); });
    
    const pageImages: string[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:') && !src.includes('icon') && pageImages.length < 8) {
        try {
          const resolved = new URL(src, targetUrl).href;
          if (!pageImages.includes(resolved)) pageImages.push(resolved);
        } catch {}
      }
    });

    const screenshotUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${encodeURIComponent(targetUrl)}`;
    const extractedData = `Title: ${title}\nMeta: ${metaDescription}\nH1: ${h1s.join(' | ')}`;

    const prompt = `Based on this structure from ${url}, identify the primary value proposition and generate a short, punchy trailer script. Return ONLY the script, one scene per line. No numbers. Max 10 lines.\n\nContent: ${extractedData}`;
    
    try {
      // Trying 1.5-flash as it's more standard if 2.0 isn't live in this region/sdk
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const aiResult = await model.generateContent(prompt);
      const aiResponseText = aiResult.response.text();

      res.status(200).json({ 
        script: aiResponseText.trim(),
        screenshotUrl,
        pageImages: pageImages.slice(0, 6),
        siteName: title
      });
    } catch (aiErr: any) {
      res.status(500).json({ 
        error: `AI Generation failed: ${aiErr.message}`,
        screenshotUrl, // Provide what we can even if AI fails
        pageImages: pageImages.slice(0, 6),
        siteName: title
      });
    }
  } catch (globalErr: any) {
    console.error('Global Scraper error:', globalErr);
    res.status(500).json({ error: `Scraper error: ${globalErr.message}` });
  }
}
