
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'PIXABAY_API_KEY is not configured.' });
    }

    const { q, page = 1, per_page = 20, category, video_type = 'all' } = req.query;

    const params = new URLSearchParams({
      key: apiKey,
      per_page: String(per_page),
      page: String(page),
      safesearch: 'true',
      video_type: String(video_type),
    });

    if (q) params.set('q', String(q));
    if (category) params.set('category', String(category));

    const response = await fetch(`https://pixabay.com/api/videos/?${params.toString()}`);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Pixabay video search error:', error);
    res.status(500).json({ error: error.message || 'Failed to search Pixabay videos' });
  }
}
