
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

    // 2. Poll for completion (max 2 minutes)
    let finalUrl = null;
    for (let i = 0; i < 40; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const pollData = await pollRes.json();
      
      if (pollData.status === 'succeeded') {
        finalUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
        break;
      } else if (pollData.status === 'failed') {
        throw new Error('Animation failed.');
      }
    }

    if (!finalUrl) {
      return res.status(504).json({ error: 'Animation timed out.' });
    }

    res.status(200).json({ videoUrl: finalUrl });
  } catch (error: any) {
    console.error('Animation error:', error);
    res.status(500).json({ error: error.message || 'Failed to animate image' });
  }
}
