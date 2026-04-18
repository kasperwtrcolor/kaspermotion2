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

    const screenshotUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${encodeURIComponent(targetUrl)}`;
    res.status(200).json({ screenshotUrl });
  } catch (error: any) {
    console.error('Screenshot error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate screenshot' });
  }
}
