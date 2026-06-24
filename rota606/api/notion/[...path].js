export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN não configurado' });

  const pathSegments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const notionPath = pathSegments.filter(Boolean).join('/');

  const queryParams = Object.entries(req.query)
    .filter(([k]) => k !== 'path')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const notionUrl = `https://api.notion.com/v1/${notionPath}${queryParams ? '?' + queryParams : ''}`;

  try {
    const response = await fetch(notionUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: ['POST', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
