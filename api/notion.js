export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN não configurado' });

  const { notionPath, ...queryParams } = req.query;
  if (!notionPath) return res.status(400).json({ error: 'notionPath em falta' });

  const qs = Object.entries(queryParams)
    .map(([k,v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const notionUrl = `https://api.notion.com/v1/${notionPath}${qs ? '?' + qs : ''}`;

  // Garantir que o body é lido corretamente
  let body = undefined;
  if (['POST', 'PATCH'].includes(req.method)) {
    if (typeof req.body === 'string') {
      body = req.body;
    } else if (req.body) {
      body = JSON.stringify(req.body);
    } else {
      // Ler body manualmente se não vier parseado
      body = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data || '{}'));
      });
    }
  }

  try {
    const response = await fetch(notionUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
