export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurado' })

  let body
  if (typeof req.body === 'string') {
    body = req.body
  } else if (req.body) {
    body = JSON.stringify(req.body)
  } else {
    body = await new Promise((resolve) => {
      let data = ''
      req.on('data', chunk => { data += chunk })
      req.on('end', () => resolve(data || '{}'))
    })
  }

  try {
    const parsed = JSON.parse(body)
    const { prompt, pdfBase64 } = parsed

    const geminiBody = {
      contents: [{
        parts: [
          ...(pdfBase64 ? [{
            inline_data: {
              mime_type: 'application/pdf',
              data: pdfBase64
            }
          }] : []),
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    )

    const data = await response.json()

    // Extrair texto da resposta Gemini
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.status(200).json({ text: texto, raw: data })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
