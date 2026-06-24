import { useState, useEffect, useCallback } from 'react'

// ─── CONFIG NOTION ────────────────────────────────────────────
const PAGE_IDS = {
  root:       '37493fb1601f8115814be9b61144a3ef',
  assistencia:'38793fb1601f81c4b22adee0f464d232',
  chamadosJun:'38793fb1601f8137b406efc68d97b49e',
  chamadosDB: 'e23c2dda18c547d6b023b09165eef552',
  frescos:    '38893fb1601f81ebbd7ac56637d8e95a',
  pdv806477:  '37493fb1601f80649eeeffcd6d4c3772',
  pdv807542:  '37493fb1601f818ca971d90764e2752c',
}

async function notionGet(notionPath, params = {}) {
  const qs = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  const url = `/api/notion?notionPath=${encodeURIComponent(notionPath)}${qs ? '&' + qs : ''}`
  const r = await fetch(url)
  return r.json()
}

async function notionPost(notionPath, body) {
  const url = `/api/notion?notionPath=${encodeURIComponent(notionPath)}`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}

async function notionDelete(notionPath) {
  const url = `/api/notion?notionPath=${encodeURIComponent(notionPath)}`
  return fetch(url, { method: 'DELETE' })
}

// ─── ESTILOS ────────────────────────────────────────────────
const S = {
  app: {
    minHeight: '100vh',
    background: '#0D1117',
    color: '#E6EDF3',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: '14px',
  },
  header: {
    background: '#161B22',
    borderBottom: '1px solid #21262D',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 700,
    fontSize: '16px',
    color: '#10D9A0',
  },
  syncBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#8B949E',
  },
  syncDot: (ok) => ({
    width: '8px', height: '8px', borderRadius: '50%',
    background: ok ? '#10D9A0' : '#F85149',
    flexShrink: 0,
  }),
  syncBtn: {
    background: 'none',
    border: '1px solid #30363D',
    color: '#8B949E',
    borderRadius: '6px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  nav: {
    display: 'flex',
    borderBottom: '1px solid #21262D',
    background: '#161B22',
    padding: '0 24px',
    gap: '4px',
    overflowX: 'auto',
  },
  navBtn: (active) => ({
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    color: active ? '#10D9A0' : '#8B949E',
    borderBottom: active ? '2px solid #10D9A0' : '2px solid transparent',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    fontSize: '14px',
    whiteSpace: 'nowrap',
    transition: 'color 0.15s',
  }),
  main: {
    padding: '24px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  card: {
    background: '#161B22',
    border: '1px solid #21262D',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '15px',
    marginBottom: '12px',
    color: '#E6EDF3',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: (color) => ({
    background: color + '22',
    color: color,
    border: `1px solid ${color}44`,
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 500,
  }),
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    background: '#0D1117',
    color: '#8B949E',
    fontSize: '12px',
    fontWeight: 600,
    borderBottom: '1px solid #21262D',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #21262D',
    color: '#E6EDF3',
    verticalAlign: 'top',
  },
  input: {
    background: '#0D1117',
    border: '1px solid #30363D',
    borderRadius: '6px',
    color: '#E6EDF3',
    padding: '8px 12px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btn: {
    background: '#10D9A0',
    color: '#0D1117',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
  },
  btnDanger: {
    background: 'transparent',
    color: '#F85149',
    border: '1px solid #F8514944',
    borderRadius: '6px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  label: {
    color: '#8B949E',
    fontSize: '12px',
    marginBottom: '4px',
    display: 'block',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  tag: {
    background: '#21262D',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    color: '#8B949E',
    display: 'inline-block',
    margin: '2px',
  },
}

// ─── ROTA SEMANAL ────────────────────────────────────────────
const ROTA = {
  '2ª Feira': [
    { cliente: 'SAICA PACK PORTUGAL', maquinas: ['811865 - CONCERTO','811866 - CONCERTO','811867 - LEI 301 COMBI','811868 - VIVACE','811869 - VIVACE','814082 - FAS 900'] },
    { cliente: 'FAMOLDE', maquinas: ['809403 - FAS 500 SLAVE - P3','809404 - FAS 500 SLAVE'] },
    { cliente: 'BA VIDROS - ENTRADA', maquinas: ['806066 - FAS 1050','806071 - LEI 400','806476 - LEI 400','807016 - MELODIA','809449 - FAS YOUNG','810925 - CONCERTO'] },
    { cliente: 'BA VIDROS - REFEITÓRIO P1', maquinas: ['806068 - LEI 400','806069 - LEI 400','806477 - FAS YOUNG','807542 - FAS 1050','814999 - FLEXSTACK'] },
    { cliente: 'VIDROMOLDE', maquinas: ['815228 - LEI 301 COMBI'] },
    { cliente: 'MEGO INDUSTRIA MOLDES', maquinas: ['815229 - LEI 301 COMBI'] },
    { cliente: 'PES - PROJETOS EQUIPAMENTOS', maquinas: ['815691 - FAS 500 SLAVE'] },
    { cliente: 'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas: ['815504 - LEI 400 SLAVE','815505 - MELODIA','815506 - FAS 500'] },
    { cliente: 'MG2 - BA', maquinas: ['807540 - FAS YOUNG','815356 - BRIO UP'] },
    { cliente: 'IEFP-C.E. MARINHA GRANDE', maquinas: ['806079 - FAS 1050','809788 - CONCERTO'] },
  ],
  '3ª Feira': [
    { cliente: 'SAICA PACK PORTUGAL', maquinas: ['811865 - CONCERTO','811866 - CONCERTO','811867 - LEI 301 COMBI','811868 - VIVACE','811869 - VIVACE','814082 - FAS 900'] },
    { cliente: 'BA VIDROS - ENTRADA', maquinas: ['806066 - FAS 1050','806071 - LEI 400','806476 - LEI 400','807016 - MELODIA','809449 - FAS YOUNG','810925 - CONCERTO'] },
    { cliente: 'BA VIDROS - REFEITÓRIO P1', maquinas: ['806068 - LEI 400','806069 - LEI 400','806477 - FAS YOUNG','807542 - FAS 1050','814999 - FLEXSTACK'] },
    { cliente: 'PALBASE', maquinas: ['810926 - BRIO KEY'] },
    { cliente: 'INNOVCOATING', maquinas: ['812421 - FAS MIA','812422 - FAS MIA','812420 - LEI 301 COMBI'] },
    { cliente: 'IMV', maquinas: ['813878 - LEI 301 COMBI','807486 - FAS 400'] },
    { cliente: 'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas: ['815504 - LEI 400 SLAVE','815505 - MELODIA','815506 - FAS 500'] },
    { cliente: 'PROMOPLAS', maquinas: ['813266 - FAS MIA','813267 - FLESSY'] },
  ],
  '4ª Feira': [
    { cliente: 'SAICA PACK PORTUGAL', maquinas: ['811865 - CONCERTO','811866 - CONCERTO','811867 - LEI 301 COMBI','811868 - VIVACE','811869 - VIVACE','814082 - FAS 900'] },
    { cliente: 'BA VIDROS - ENTRADA', maquinas: ['806066 - FAS 1050','806071 - LEI 400','806476 - LEI 400','807016 - MELODIA','809449 - FAS YOUNG','810925 - CONCERTO'] },
    { cliente: 'BA VIDROS - REFEITÓRIO P1', maquinas: ['806068 - LEI 400','806069 - LEI 400','806477 - FAS YOUNG','807542 - FAS 1050','814999 - FLEXSTACK'] },
    { cliente: 'BA VIDROS - ENGENHEIROS', maquinas: ['811384 - BRIO KEY'] },
    { cliente: 'ARMAZÉM 3 BA VIDROS', maquinas: ['813414 - BRIO UP COMBI'] },
    { cliente: 'INNOVCOATING', maquinas: ['812421 - FAS MIA','812422 - FAS MIA','812420 - LEI 301 COMBI'] },
    { cliente: 'IMV', maquinas: ['813878 - LEI 301 COMBI','807486 - FAS 400'] },
    { cliente: 'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas: ['815504 - LEI 400 SLAVE','815505 - MELODIA','815506 - FAS 500'] },
    { cliente: 'PES - PROJETOS EQUIPAMENTOS', maquinas: ['815691 - FAS 500 SLAVE'] },
    { cliente: 'VIDROMOLDE', maquinas: ['815228 - LEI 301 COMBI'] },
    { cliente: 'IPL MARINHA GRANDE', maquinas: ['810601 - FAS 300 COMBI'] },
  ],
  '5ª Feira': [
    { cliente: 'SAICA PACK PORTUGAL', maquinas: ['811865 - CONCERTO','811866 - CONCERTO','811867 - LEI 301 COMBI','811868 - VIVACE','811869 - VIVACE','814082 - FAS 900'] },
    { cliente: 'FAMOLDE', maquinas: ['809403 - FAS 500 SLAVE - P3','809404 - FAS 500 SLAVE'] },
    { cliente: 'BA VIDROS - ENTRADA', maquinas: ['806066 - FAS 1050','806071 - LEI 400','806476 - LEI 400','807016 - MELODIA','809449 - FAS YOUNG','810925 - CONCERTO'] },
    { cliente: 'BA VIDROS - REFEITÓRIO P1', maquinas: ['806068 - LEI 400','806069 - LEI 400','806477 - FAS YOUNG','807542 - FAS 1050','814999 - FLEXSTACK'] },
    { cliente: 'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas: ['815504 - LEI 400 SLAVE','815505 - MELODIA','815506 - FAS 500'] },
    { cliente: 'MEGO INDUSTRIA MOLDES', maquinas: ['815229 - LEI 301 COMBI'] },
    { cliente: 'MG2 - BA', maquinas: ['807540 - FAS YOUNG'] },
    { cliente: 'IEFP-C.E. MARINHA GRANDE', maquinas: ['806079 - FAS 1050','809788 - CONCERTO'] },
  ],
  '6ª Feira': [
    { cliente: 'SAICA PACK PORTUGAL', maquinas: ['811865 - CONCERTO','811866 - CONCERTO','811867 - LEI 301 COMBI','811868 - VIVACE','814082 - FAS 900'] },
    { cliente: 'BA VIDROS - ENTRADA', maquinas: ['806066 - FAS 1050','806071 - LEI 400','806476 - LEI 400','807016 - MELODIA','809449 - FAS YOUNG','810925 - CONCERTO'] },
    { cliente: 'BA VIDROS - REFEITÓRIO P1', maquinas: ['806068 - LEI 400','806069 - LEI 400','806477 - FAS YOUNG','807542 - FAS 1050','814999 - FLEXSTACK'] },
    { cliente: 'INNOVCOATING', maquinas: ['812421 - FAS MIA','812422 - FAS MIA','812420 - LEI 301 COMBI'] },
    { cliente: 'IMV', maquinas: ['813878 - LEI 301 COMBI','807486 - FAS 400'] },
    { cliente: 'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas: ['815504 - LEI 400 SLAVE','815505 - MELODIA','815506 - FAS 500'] },
    { cliente: 'PES - PROJETOS EQUIPAMENTOS', maquinas: ['815691 - FAS 500 SLAVE'] },
    { cliente: 'VIDROMOLDE', maquinas: ['815228 - LEI 301 COMBI'] },
    { cliente: 'PROMOPLAS', maquinas: ['813266 - FAS MIA','813267 - FLESSY'] },
  ],
}

// ─── HELPERS ────────────────────────────────────────────────
function extractText(blocks) {
  if (!blocks) return ''
  return blocks
    .filter(b => b.type === 'paragraph' || b.type === 'heading_2' || b.type === 'heading_3' || b.type === 'bulleted_list_item' || b.type === 'table_row')
    .map(b => {
      const content = b[b.type]
      if (!content) return ''
      if (b.type === 'table_row') return content.cells?.map(c => c.map(t => t.plain_text).join('')).join(' | ') || ''
      return content.rich_text?.map(t => t.plain_text).join('') || ''
    })
    .filter(Boolean)
    .join('\n')
}

function today() {
  return new Date().toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric' })
}

// ─── COMPONENTES ────────────────────────────────────────────

function SyncBar({ lastSync, syncing, ok, onSync }) {
  return (
    <div style={S.syncBar}>
      <div style={S.syncDot(ok)} />
      <span>{syncing ? 'A sincronizar…' : `Notion · ${lastSync || '–'}`}</span>
      <button style={S.syncBtn} onClick={onSync} disabled={syncing}>↻ Sync</button>
    </div>
  )
}

// ─── ABA INÍCIO ─────────────────────────────────────────────
function TabInicio({ pdvYoung, pdv1050, loading }) {
  const diaAtual = ['', '2ª Feira', '3ª Feira', '4ª Feira', '5ª Feira', '6ª Feira'][new Date().getDay()] || '2ª Feira'

  return (
    <div>
      <div style={{ ...S.card, borderColor: '#10D9A044' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={S.cardTitle}>🗓️ Hoje — {diaAtual}, {today()}</div>
        </div>
        <div style={{ color: '#8B949E', fontSize: '13px' }}>
          {ROTA[diaAtual]?.length || 0} clientes na rota hoje
          {' · '}
          {ROTA[diaAtual]?.reduce((a, c) => a + c.maquinas.length, 0) || 0} máquinas
        </div>
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>📦 PDV 806477 — BA Vidros Young</div>
          {loading ? <span style={{ color: '#8B949E' }}>A carregar…</span> : (
            <pre style={{ margin: 0, color: '#E6EDF3', fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {pdvYoung || <span style={{ color: '#8B949E' }}>Sem reposição pendente</span>}
            </pre>
          )}
          <a href={`https://notion.so/${PAGE_IDS.pdv806477}`} target="_blank" rel="noreferrer"
            style={{ color: '#10D9A0', fontSize: '12px', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
            Abrir no Notion ↗
          </a>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>📦 PDV 807542 — BA Vidros 1050</div>
          {loading ? <span style={{ color: '#8B949E' }}>A carregar…</span> : (
            <pre style={{ margin: 0, color: '#E6EDF3', fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {pdv1050 || <span style={{ color: '#8B949E' }}>Sem reposição pendente</span>}
            </pre>
          )}
          <a href={`https://notion.so/${PAGE_IDS.pdv807542}`} target="_blank" rel="noreferrer"
            style={{ color: '#10D9A0', fontSize: '12px', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
            Abrir no Notion ↗
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── ABA PDVs ───────────────────────────────────────────────
function TabPDVs({ pdvYoung, pdv1050, loading, onSave }) {
  const [youngText, setYoungText] = useState('')
  const [text1050, settext1050] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setYoungText(pdvYoung || '') }, [pdvYoung])
  useEffect(() => { settext1050(pdv1050 || '') }, [pdv1050])

  const save = async (pdv, text) => {
    setSaving(true)
    await onSave(pdv, text)
    setSaving(false)
  }

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>📦 PDV 806477 — BA Vidros Refeitório Young</div>
        <label style={S.label}>Reposição pendente</label>
        <textarea
          value={youngText}
          onChange={e => setYoungText(e.target.value)}
          rows={6}
          style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Ex: 6 água com gás&#10;15 Sumol laranja"
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button style={S.btn} onClick={() => save('young', youngText)} disabled={saving}>
            {saving ? 'A guardar…' : '💾 Guardar no Notion'}
          </button>
          <button style={S.btnDanger} onClick={() => save('young', '')} disabled={saving}>
            🗑 Limpar
          </button>
        </div>
        <a href={`https://notion.so/${PAGE_IDS.pdv806477}`} target="_blank" rel="noreferrer"
          style={{ color: '#10D9A0', fontSize: '12px', textDecoration: 'none', marginTop: '10px', display: 'inline-block' }}>
          Abrir no Notion ↗
        </a>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📦 PDV 807542 — BA Vidros Refeitório 1050</div>
        <label style={S.label}>Reposição pendente</label>
        <textarea
          value={text1050}
          onChange={e => settext1050(e.target.value)}
          rows={6}
          style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Ex: 6 água com gás&#10;15 Sumol laranja"
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button style={S.btn} onClick={() => save('1050', text1050)} disabled={saving}>
            {saving ? 'A guardar…' : '💾 Guardar no Notion'}
          </button>
          <button style={S.btnDanger} onClick={() => save('1050', '')} disabled={saving}>
            🗑 Limpar
          </button>
        </div>
        <a href={`https://notion.so/${PAGE_IDS.pdv807542}`} target="_blank" rel="noreferrer"
          style={{ color: '#10D9A0', fontSize: '12px', textDecoration: 'none', marginTop: '10px', display: 'inline-block' }}>
          Abrir no Notion ↗
        </a>
      </div>
    </div>
  )
}

// ─── ABA CHAMADOS ──────────────────────────────────────────
function TabChamados({ chamados, loading }) {
  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>🔧 Chamados Técnicos — Jun/2026</div>
        {loading ? <span style={{ color: '#8B949E' }}>A carregar…</span> :
          chamados.length === 0 ? <span style={{ color: '#8B949E' }}>Nenhum chamado registado</span> : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Título</th>
                  <th style={S.th}>Link</th>
                </tr>
              </thead>
              <tbody>
                {chamados.map((c, i) => (
                  <tr key={i}>
                    <td style={S.td}>{c.titulo}</td>
                    <td style={S.td}>
                      <a href={c.url} target="_blank" rel="noreferrer"
                        style={{ color: '#10D9A0', textDecoration: 'none' }}>Abrir ↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
        <a href={`https://notion.so/${PAGE_IDS.chamadosJun}`} target="_blank" rel="noreferrer"
          style={{ color: '#10D9A0', fontSize: '12px', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}>
          Ver todos no Notion ↗
        </a>
      </div>
    </div>
  )
}

// ─── ABA FRESCOS ────────────────────────────────────────────
const FRESCOS_CONFIG = [
  { pdv: '809404', cliente: 'Famolde P1', doces: '21,22,24,25,27', salgados: '41–47', tentacao: '48' },
  { pdv: '809449', cliente: 'BA Vidros Entrada', doces: '—', salgados: '41–46', tentacao: '—' },
  { pdv: '806066', cliente: 'BA Vidros Entrada', doces: '11,13,17,19,51–56', salgados: '40–49', tentacao: '15 (fixo: Hambúrguer)' },
  { pdv: '812420', cliente: 'Innovcoating', doces: 'mix', salgados: '—', tentacao: 'A13,A14' },
  { pdv: '813878', cliente: 'IMV', doces: 'A13,A14', salgados: 'A15–A18', tentacao: '—' },
  { pdv: '815691', cliente: 'PES', doces: '21,22,24,25,28,41–48', salgados: '—', tentacao: '—' },
  { pdv: '813267', cliente: 'Promoplas', doces: 'A22,A24,A26,A41–A46', salgados: '—', tentacao: '—' },
  { pdv: '815504', cliente: 'HRV Administração', doces: 'A31,A32', salgados: 'A33–A37', tentacao: '—', gourmet: 'A38' },
  { pdv: '807540', cliente: 'BA MG2', doces: '21,22', salgados: '41,42,43', tentacao: '44,45,46' },
]

function TabFrescos() {
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>🥐 Configuração Frescos — Máquinas</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>PDV</th>
              <th style={S.th}>Cliente</th>
              <th style={S.th}>Doces</th>
              <th style={S.th}>Salgados</th>
              <th style={S.th}>🟡 Tentação</th>
              <th style={S.th}>⭐ Gourmet</th>
            </tr>
          </thead>
          <tbody>
            {FRESCOS_CONFIG.map((r, i) => (
              <tr key={i}>
                <td style={S.td}><span style={S.tag}>{r.pdv}</span></td>
                <td style={S.td}>{r.cliente}</td>
                <td style={S.td}>{r.doces}</td>
                <td style={S.td}>{r.salgados}</td>
                <td style={S.td}>{r.tentacao || '—'}</td>
                <td style={S.td}>{r.gourmet || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a href={`https://notion.so/${PAGE_IDS.frescos}`} target="_blank" rel="noreferrer"
        style={{ color: '#10D9A0', fontSize: '12px', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}>
        Ver configurações no Notion ↗
      </a>
    </div>
  )
}

// ─── ABA ROTA ───────────────────────────────────────────────
function TabRota() {
  const [diaAtivo, setDiaAtivo] = useState('2ª Feira')
  const dias = Object.keys(ROTA)

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {dias.map(d => (
          <button key={d} onClick={() => setDiaAtivo(d)}
            style={{
              background: diaAtivo === d ? '#10D9A0' : '#21262D',
              color: diaAtivo === d ? '#0D1117' : '#E6EDF3',
              border: 'none', borderRadius: '6px',
              padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
            }}>
            {d}
          </button>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>🗺️ {diaAtivo}</div>
        {ROTA[diaAtivo].map((c, i) => (
          <div key={i} style={{ marginBottom: '14px' }}>
            <div style={{ color: '#10D9A0', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>{c.cliente}</div>
            {c.maquinas.map((m, j) => (
              <div key={j} style={{ ...S.tag, display: 'inline-block', marginBottom: '4px' }}>{m}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ABA PRODUTOS ───────────────────────────────────────────
const PRODUTOS = [
  {cod:'383721',nome:'RIM',total:46},{cod:'383710',nome:'Croissant de chocolate',total:98},
  {cod:'383711',nome:'Croissant de ovo',total:58},{cod:'383713',nome:'Bolo brigadeiro',total:54},
  {cod:'383714',nome:'Bolo de cenoura',total:60},{cod:'383718',nome:'Mil folhas',total:131},
  {cod:'383719',nome:'Palmier chocolate',total:91},{cod:'383722',nome:'Bom bocado',total:42},
  {cod:'383724',nome:'Torta de chocolate',total:36},{cod:'383715',nome:'Fatia corada',total:27},
  {cod:'383702',nome:'Croissant brioche misto',total:161},{cod:'383706',nome:'Pão de deus misto',total:105},
  {cod:'383729',nome:'Supremo misto com salsicha',total:62},{cod:'383727',nome:'Pão com chouriço',total:66},
  {cod:'383668',nome:'Sande pasta frango, cenoura & alho',total:80},{cod:'383590',nome:'Sande pasta atum & cenoura',total:82},
  {cod:'383681',nome:'Folhado ovo/salsicha SC',total:40},{cod:'383726',nome:'Lanche misto',total:38},
  {cod:'383735',nome:'Hambúrguer',total:46},{cod:'383682',nome:'Pastel de Chaves SC',total:27},
  {cod:'383684',nome:'Sande bifana baguete rústica SC',total:10},{cod:'383708',nome:'Pão de leite misto',total:21},
  {cod:'383703',nome:'Croissant folhado misto',total:16},{cod:'383683',nome:'Pizza SC',total:5},
  {cod:'383691',nome:'Sande omelete bag. rústica SC',total:4},{cod:'383598',nome:'Sande mista tosta',total:4},
  {cod:'383734',nome:'Frango grelhado molho iogurte',total:6},{cod:'383736',nome:'Pão de sementes queijo e fiambre',total:6},
  {cod:'383737',nome:'Baguete panado frango SC',total:6},{cod:'383704',nome:'Croissant brioche queijo',total:6},
  {cod:'383720',nome:'Palmier recheado',total:3},{cod:'383717',nome:'Jesuíta de amêndoa',total:3},
]

function TabProdutos() {
  const sorted = [...PRODUTOS].sort((a, b) => b.total - a.total)
  const max = sorted[0]?.total || 1

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>📊 Produtos — Semana 22/06/2026 · 1 442 un.</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Código</th>
              <th style={S.th}>Produto</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Total</th>
              <th style={S.th}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={i}>
                <td style={{ ...S.td, color: '#8B949E', fontSize: '12px' }}>{p.cod}</td>
                <td style={S.td}>{p.nome}</td>
                <td style={{ ...S.td, textAlign: 'right', fontWeight: 600 }}>{p.total}</td>
                <td style={{ ...S.td, minWidth: '120px' }}>
                  <div style={{ background: '#21262D', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      background: '#10D9A0',
                      height: '100%',
                      width: `${(p.total / max) * 100}%`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── APP PRINCIPAL ──────────────────────────────────────────
const TABS = ['🏠 Início', '🔧 Chamados', '📦 PDVs', '🥐 Frescos', '📊 Produtos', '🗺️ Rota']

export default function App() {
  const [tab, setTab] = useState(0)
  const [lastSync, setLastSync] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncOk, setSyncOk] = useState(true)

  const [pdvYoung, setPdvYoung] = useState('')
  const [pdv1050, setPdv1050] = useState('')
  const [chamados, setChamados] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPdvContent = async (pageId) => {
    const data = await notionGet(`blocks/${pageId}/children`, { page_size: '50' })
    if (!data.results) return ''
    return extractText(data.results)
  }

  const fetchChamados = async () => {
    const data = await notionGet(`blocks/${PAGE_IDS.chamadosJun}/children`, { page_size: '50' })
    if (!data.results) return []
    return data.results
      .filter(b => b.type === 'child_page')
      .map(b => ({ titulo: b.child_page?.title || 'Sem título', url: `https://notion.so/${b.id.replace(/-/g,'')}` }))
  }

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const [young, mil, ch] = await Promise.all([
        fetchPdvContent(PAGE_IDS.pdv806477),
        fetchPdvContent(PAGE_IDS.pdv807542),
        fetchChamados(),
      ])
      setPdvYoung(young)
      setPdv1050(mil)
      setChamados(ch)
      setSyncOk(true)
      setLastSync(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setSyncOk(false)
    } finally {
      setSyncing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    sync()
    const interval = setInterval(sync, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [sync])

  const savePdv = async (pdv, text) => {
    const pageId = pdv === 'young' ? PAGE_IDS.pdv806477 : PAGE_IDS.pdv807542

    const existing = await notionGet(`blocks/${pageId}/children`, { page_size: '50' })
    if (existing.results) {
      for (const block of existing.results) {
        await notionDelete(`blocks/${block.id}`)
      }
    }

    if (text.trim()) {
      const linhas = text.split('\n').filter(Boolean)
      const children = linhas.map(l => ({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: l } }] }
      }))
      await notionPost(`blocks/${pageId}/children`, { children })
    }

    if (pdv === 'young') setPdvYoung(text)
    else setPdv1050(text)
  }

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.logo}>
          <span>☕</span>
          <span>Rota 606</span>
          <span style={{ color: '#8B949E', fontWeight: 400, fontSize: '13px' }}>mybreak by Delta Cafés</span>
        </div>
        <SyncBar lastSync={lastSync} syncing={syncing} ok={syncOk} onSync={sync} />
      </header>

      <nav style={S.nav}>
        {TABS.map((t, i) => (
          <button key={i} style={S.navBtn(tab === i)} onClick={() => setTab(i)}>{t}</button>
        ))}
      </nav>

      <main style={S.main}>
        {tab === 0 && <TabInicio pdvYoung={pdvYoung} pdv1050={pdv1050} loading={loading} />}
        {tab === 1 && <TabChamados chamados={chamados} loading={loading} />}
        {tab === 2 && <TabPDVs pdvYoung={pdvYoung} pdv1050={pdv1050} loading={loading} onSave={savePdv} />}
        {tab === 3 && <TabFrescos />}
        {tab === 4 && <TabProdutos />}
        {tab === 5 && <TabRota />}
      </main>
    </div>
  )
}
