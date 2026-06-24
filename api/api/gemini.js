export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurado no Vercel.' })

  try {
    // Ler body — funciona para qualquer tamanho
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

    const { prompt, pdfBase64 } = parsed
    if (!prompt) return res.status(400).json({ error: 'Campo "prompt" em falta.' })

    const parts = []
    if (pdfBase64) {
      parts.push({ inline_data: { mime_type: 'application/pdf', data: pdfBase64 } })
    }
    parts.push({ text: prompt })

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        }),
      }
    )

    const geminiText = await geminiRes.text()

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({ error: `Gemini error ${geminiRes.status}: ${geminiText.slice(0, 300)}` })
    }

    const geminiData = JSON.parse(geminiText)
    const texto = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!texto) {
      return res.status(500).json({ error: 'Gemini não retornou texto. Verifica se o PDF é legível.' })
    }

    return res.status(200).json({ text: texto })

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno.' })
  }
}
