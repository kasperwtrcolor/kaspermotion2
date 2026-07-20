import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const decoded = decodeURIComponent(url);
    
    // Only allow proxying from trusted video sources
    const allowed = [
      'video.twimg.com',
      'pbs.twimg.com',
      'abs.twimg.com',
    ];
    const parsed = new URL(decoded);
    if (!allowed.some(h => parsed.hostname.endsWith(h))) {
      return res.status(403).json({ error: 'Domain not allowed for proxying' });
    }

    const upstream = await fetch(decoded, {
      headers: {
        'Referer': 'https://x.com/',
        'Origin': 'https://x.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` });
    }

    const contentType = upstream.headers.get('content-type') || 'video/mp4';
    const contentLength = upstream.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Stream the response body
    const reader = upstream.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'No response body' });
    }

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    };

    await pump();
  } catch (err: any) {
    console.error('Video proxy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Proxy failed' });
    }
  }
}
