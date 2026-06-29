export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurado.' })

  try {
    let parsed
    if (req.body && typeof req.body === 'object') {
      parsed = req.body
    } else {
      const rawBody = await new Promise((resolve, reject) => {
        let data = ''
        req.on('data', chunk => { data += chunk })
        req.on('end', () => resolve(data))
        req.on('error', reject)
      })
      if (!rawBody) return res.status(400).json({ error: 'Body vazio.' })
      parsed = JSON.parse(rawBody)
    }

    const { prompt, imageBase64, mimeType = 'image/jpeg', maxTokens = 4096 } = parsed
    if (!prompt) return res.status(400).json({ error: 'Campo "prompt" em falta.' })

    const content = []
    if (imageBase64) {
      content.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } })
    }
    content.push({ type: 'text', text: prompt })

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content }]
      })
    })

    const data = await anthropicRes.json()
    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data.error?.message || 'Erro Anthropic API.' })
    }

    const texto = data.content?.[0]?.text || ''
    return res.status(200).json({ text: texto })

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno.' })
  }
}
