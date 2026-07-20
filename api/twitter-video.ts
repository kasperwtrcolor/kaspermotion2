import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL' });
  }

  // Parse tweet ID from x.com or twitter.com URLs
  const match = url.match(/(?:x\.com|twitter\.com)\/(\w+)\/status\/(\d+)/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid X/Twitter URL. Expected format: https://x.com/username/status/123456789' });
  }

  const [, username, tweetId] = match;

  try {
    // Use FxTwitter API — free, no auth required
    const fxRes = await fetch(`https://api.fxtwitter.com/${username}/status/${tweetId}`, {
      headers: {
        'User-Agent': 'VibeTrailer/1.0',
      },
    });

    if (!fxRes.ok) {
      throw new Error(`FxTwitter API returned ${fxRes.status}`);
    }

    const data = await fxRes.json();

    // Extract video URL from the response
    const media = data?.tweet?.media;
    
    if (!media?.videos || media.videos.length === 0) {
      // Check for media.all array (alternative response format)
      const allMedia = media?.all;
      if (allMedia && Array.isArray(allMedia)) {
        const videoItem = allMedia.find((m: any) => m.type === 'video' || m.type === 'gif');
        if (videoItem?.url) {
          const proxiedUrl = `/api/video-proxy?url=${encodeURIComponent(videoItem.url)}`;
          return res.status(200).json({ 
            videoUrl: proxiedUrl,
            thumbnail: videoItem.thumbnail_url || data?.tweet?.media?.mosaic?.formats?.jpeg,
            source: 'fxtwitter',
            tweetText: data?.tweet?.text?.slice(0, 100),
          });
        }
      }
      return res.status(404).json({ error: 'No video found in this tweet. Make sure the tweet contains a video.' });
    }

    // Get the highest quality video
    const videos = media.videos;
    const bestVideo = videos.reduce((best: any, current: any) => {
      if (!best) return current;
      const bestSize = (best.width || 0) * (best.height || 0);
      const currentSize = (current.width || 0) * (current.height || 0);
      return currentSize > bestSize ? current : best;
    }, null);

    const videoUrl = bestVideo?.url || videos[0]?.url;

    if (!videoUrl) {
      return res.status(404).json({ error: 'Could not extract video URL from tweet.' });
    }

    const proxiedUrl = `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`;

    return res.status(200).json({
      videoUrl: proxiedUrl,
      thumbnail: media?.mosaic?.formats?.jpeg || bestVideo?.thumbnail_url,
      source: 'fxtwitter',
      tweetText: data?.tweet?.text?.slice(0, 100),
    });

  } catch (err: any) {
    console.error('Twitter video extraction error:', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to extract video from tweet.',
    });
  }
}
