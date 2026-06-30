import { useState, useEffect, useCallback } from 'react'

const PAGE_IDS = {
  rotaRoot:   '37493fb1601f8115814be9b61144a3ef',
  assistenciaTecnica: '38793fb1601f81c4b22adee0f464d232',
  frescos:    '38893fb1601f81ebbd7ac56637d8e95a',
  pdv806477:  '37493fb1601f80649eeeffcd6d4c3772',
  pdv807542:  '37493fb1601f818ca971d90764e2752c',
}

const MESES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function getMesLabel() {
  return new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
}

function getMesRange() {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fmt = d => d.toISOString().split('T')[0]
  return { inicio: fmt(inicio), fim: fmt(fim) }
}

async function nGet(path, params = {}) {
  const qs = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  const r = await fetch(`/api/notion?notionPath=${encodeURIComponent(path)}${qs ? '&'+qs : ''}`)
  return r.json()
}
async function nPost(path, body) {
  const r = await fetch(`/api/notion?notionPath=${encodeURIComponent(path)}`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  })
  return r.json()
}
async function nPatch(path, body) {
  const r = await fetch(`/api/notion?notionPath=${encodeURIComponent(path)}`, {
    method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  })
  return r.json()
}
async function nDelete(path) {
  return fetch(`/api/notion?notionPath=${encodeURIComponent(path)}`, { method:'DELETE' })
}

function extractText(blocks) {
  if (!blocks) return ''
  return blocks.map(b => {
    if (b.type === 'paragraph') return b.paragraph?.rich_text?.map(t=>t.plain_text).join('') || ''
    if (b.type === 'bulleted_list_item') return '• ' + (b.bulleted_list_item?.rich_text?.map(t=>t.plain_text).join('') || '')
    if (b.type === 'heading_2') return b.heading_2?.rich_text?.map(t=>t.plain_text).join('') || ''
    if (b.type === 'table_row') return b.table_row?.cells?.map(c=>c.map(t=>t.plain_text).join('')).join(' | ') || ''
    return ''
  }).filter(Boolean).join('\n')
}

function today() {
  return new Date().toLocaleDateString('pt-PT', {day:'2-digit',month:'2-digit',year:'numeric'})
}
function todayISO() {
  return new Date().toISOString().split('T')[0]
}
function minutesToHM(min) {
  if (min < 0) min = 0
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2,'0')}h${String(m).padStart(2,'0')}m`
}
function timeToMin(hhmm) {
  const [h,m] = (hhmm||'00:00').split(':').map(Number)
  return (h||0)*60 + (m||0)
}

// ── ROTA ──────────────────────────────────────────────────────
const ROTA = {
  '2ª Feira': [
    {cliente:'SAICA PACK PORTUGAL', maquinas:['811865','811866','811867','811868','811869','814082']},
    {cliente:'FAMOLDE', maquinas:['809403','809404']},
    {cliente:'BA VIDROS - ENTRADA', maquinas:['806066','806071','806476','807016','809449','810925']},
    {cliente:'BA VIDROS - REFEITÓRIO P1', maquinas:['806068','806069','806477','807542','814999']},
    {cliente:'VIDROMOLDE', maquinas:['815228']},
    {cliente:'MEGO INDUSTRIA MOLDES', maquinas:['815229']},
    {cliente:'PES - PROJETOS EQUIPAMENTOS', maquinas:['815691']},
    {cliente:'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas:['815504','815505','815506']},
    {cliente:'MG2 - BA', maquinas:['807540','815356']},
    {cliente:'IEFP-C.E. MARINHA GRANDE', maquinas:['806079','809788']},
  ],
  '3ª Feira': [
    {cliente:'SAICA PACK PORTUGAL', maquinas:['811865','811866','811867','811868','811869','814082']},
    {cliente:'BA VIDROS - ENTRADA', maquinas:['806066','806071','806476','807016','809449','810925']},
    {cliente:'BA VIDROS - REFEITÓRIO P1', maquinas:['806068','806069','806477','807542','814999']},
    {cliente:'PALBASE', maquinas:['810926']},
    {cliente:'INNOVCOATING', maquinas:['812421','812422','812420']},
    {cliente:'IMV', maquinas:['813878','807486']},
    {cliente:'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas:['815504','815505','815506']},
    {cliente:'PROMOPLAS', maquinas:['813266','813267']},
  ],
  '4ª Feira': [
    {cliente:'SAICA PACK PORTUGAL', maquinas:['811865','811866','811867','811868','811869','814082']},
    {cliente:'BA VIDROS - ENTRADA', maquinas:['806066','806071','806476','807016','809449','810925']},
    {cliente:'BA VIDROS - REFEITÓRIO P1', maquinas:['806068','806069','806477','807542','814999']},
    {cliente:'BA VIDROS - ENGENHEIROS', maquinas:['811384']},
    {cliente:'ARMAZÉM 3 BA VIDROS', maquinas:['813414']},
    {cliente:'INNOVCOATING', maquinas:['812421','812422','812420']},
    {cliente:'IMV', maquinas:['813878','807486']},
    {cliente:'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas:['815504','815505','815506']},
    {cliente:'PES - PROJETOS EQUIPAMENTOS', maquinas:['815691']},
    {cliente:'VIDROMOLDE', maquinas:['815228']},
    {cliente:'IPL MARINHA GRANDE', maquinas:['810601']},
  ],
  '5ª Feira': [
    {cliente:'SAICA PACK PORTUGAL', maquinas:['811865','811866','811867','811868','811869','814082']},
    {cliente:'FAMOLDE', maquinas:['809403','809404']},
    {cliente:'BA VIDROS - ENTRADA', maquinas:['806066','806071','806476','807016','809449','810925']},
    {cliente:'BA VIDROS - REFEITÓRIO P1', maquinas:['806068','806069','806477','807542','814999']},
    {cliente:'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas:['815504','815505','815506']},
    {cliente:'MEGO INDUSTRIA MOLDES', maquinas:['815229']},
    {cliente:'MG2 - BA', maquinas:['807540']},
    {cliente:'IEFP-C.E. MARINHA GRANDE', maquinas:['806079','809788']},
  ],
  '6ª Feira': [
    {cliente:'SAICA PACK PORTUGAL', maquinas:['811865','811866','811867','811868','814082']},
    {cliente:'BA VIDROS - ENTRADA', maquinas:['806066','806071','806476','807016','809449','810925']},
    {cliente:'BA VIDROS - REFEITÓRIO P1', maquinas:['806068','806069','806477','807542','814999']},
    {cliente:'INNOVCOATING', maquinas:['812421','812422','812420']},
    {cliente:'IMV', maquinas:['813878','807486']},
    {cliente:'HRV - EQUIPAMENTOS DE PROCESSO S.A.', maquinas:['815504','815505','815506']},
    {cliente:'PES - PROJETOS EQUIPAMENTOS', maquinas:['815691']},
    {cliente:'VIDROMOLDE', maquinas:['815228']},
    {cliente:'PROMOPLAS', maquinas:['813266','813267']},
  ],
}

// ── FRESCOS CONFIG ────────────────────────────────────────────
const FRESCOS = [
  {pdv:'809404', cliente:'Famolde P1', notionId:'', doces:'21,22,24,25,27', salgados:'41–47', tentacao:'48', gourmet:'—', instrucoes:'Espirais doces nos slots 21,22,24,25,27. Salgados nos slots 41-47. Tentação no slot 48.'},
  {pdv:'809449', cliente:'BA Vidros Entrada (FAS Young)', notionId:'', doces:'—', salgados:'41–46', tentacao:'—', gourmet:'—', instrucoes:'Apenas salgados nos slots 41-46. Sem frescos doces ou Tentação nesta máquina.'},
  {pdv:'806066', cliente:'BA Vidros Entrada (FAS 1050)', notionId:'', doces:'11,13,17,19,51–56', salgados:'40–49', tentacao:'15 (fixo: Hambúrguer)', gourmet:'—', instrucoes:'Doces nos slots 11,13,17,19 e 51-56. Salgados nos slots 40-49. Slot 15 FIXO: Hambúrguer Tentação (não alterar).'},
  {pdv:'812420', cliente:'Innovcoating', notionId:'', doces:'mix', salgados:'mix', tentacao:'A13,A14', gourmet:'—', mix:true, instrucoes:'Slots A13 e A14 são Tentação — rotar o produto com melhor venda e menor quebra. Slots A15-A18: ⚠️ Mix: neste PDV as espirais aceitam tanto frescos doces como salgados ao mesmo preço — sem separação por tipo. Abastecer com o produto de melhor venda independentemente da categoria.'},
  {pdv:'813878', cliente:'IMV', notionId:'', doces:'A13,A14', salgados:'A15–A18', tentacao:'—', gourmet:'—', instrucoes:'Doces nos slots A13-A14. Salgados nos slots A15-A18.'},
  {pdv:'815691', cliente:'PES - Projetos Equipamentos', notionId:'', doces:'mix', salgados:'mix', tentacao:'—', gourmet:'—', mix:true, instrucoes:'Slots 21,22,24,25,28 e 41-48: ⚠️ Mix: neste PDV as espirais aceitam tanto frescos doces como salgados ao mesmo preço — sem separação por tipo. Abastecer com o produto de melhor venda independentemente da categoria.'},
  {pdv:'813267', cliente:'Promoplas', notionId:'', doces:'mix', salgados:'mix', tentacao:'—', gourmet:'—', mix:true, instrucoes:'Slots A22, A24, A26 e A41-A46: ⚠️ Mix: neste PDV as espirais aceitam tanto frescos doces como salgados ao mesmo preço — sem separação por tipo. Abastecer com o produto de melhor venda independentemente da categoria.'},
  {pdv:'815504', cliente:'HRV Administração', notionId:'', doces:'A31,A32', salgados:'A33–A37', tentacao:'—', gourmet:'A38', instrucoes:'Doces A31-A32. Salgados A33-A37. Slot A38 reservado para Gourmet ⭐.'},
  {pdv:'807540', cliente:'BA MG2', notionId:'', doces:'21,22', salgados:'41,42,43', tentacao:'44,45,46', gourmet:'—', instrucoes:'Doces 21-22. Salgados 41-43. Tentação nos slots 44,45,46 — rotar produto com melhor venda.'},
  // ── Catalogados em 25/06/2026 ──
  {pdv:'814082', cliente:'Saica Pack Portugal (FAS 900)', notionId:'38a93fb1601f81ac89f9e6b9aa58297b', doces:'21,22,24,25,27', salgados:'41,42,43,44,45,47,48', tentacao:'—', gourmet:'46', instrucoes:'Doces: 21,22,24,25,27. Salgados: 41,42,43,44,45,47,48. Slot 46 reservado para Gourmet ⭐.'},
  {pdv:'811869', cliente:'Saica Pack Caneladora', notionId:'38a93fb1601f8118a767ce7c3be0d752', doces:'21,23,25', salgados:'11,13,15,40,41,42,43,44', tentacao:'—', gourmet:'45', instrucoes:'Doces: 21,23,25. Salgados: 11,13,15,40,41,42,43,44. Slot 45 reservado para Gourmet ⭐.'},
  {pdv:'811867', cliente:'Saica Pack Combi', notionId:'38a93fb1601f8125a171d47fe4300c44', doces:'A18,A37,A38', salgados:'A14,A15,A16,A17', tentacao:'—', gourmet:'—', instrucoes:'Doces: A18, A37, A38. Salgados: A14, A15, A16, A17.'},
  {pdv:'807542', cliente:'BA Vidros Refeitório Fabricação', notionId:'38a93fb1601f8183b052ffa15e2c4f86', doces:'mix', salgados:'mix', tentacao:'49,40', gourmet:'—', mix:true, instrucoes:'Frescos mesmo preço — todos os slots 11-30, 31-39, 41-48 ao mesmo preço sem distinção. Tentação nos slots 49 e 40.'},
  {pdv:'815507', cliente:'HRV Fabricação', notionId:'38a93fb1601f81c68499f6ba797f53a5', doces:'21,23,25', salgados:'40,41,42,43,53,54,55', tentacao:'44,45', gourmet:'—', instrucoes:'Doces: 21,23,25. Salgados: 40,41,42,43,53,54,55. Tentação: 44 e 45. Atenção: slots 50,51,52 não são frescos.'},
  {pdv:'817004', cliente:'Vidrimolde', notionId:'38a93fb1601f8124ac11cf75e2650df9', doces:'mix', salgados:'mix', tentacao:'—', gourmet:'—', mix:true, instrucoes:'Frescos mesmo preço — slots 21,22,24,41,42,43,44,45,46. Doces e salgados ao mesmo preço sem distinção.'},
]

// PDVs que têm frescos (para deteção na rota)
const FRESCOS_PDVS = FRESCOS.map(f => f.pdv)

const PRODUTOS = [
  {cod:'383702',nome:'Croissant brioche misto',total:161},{cod:'383718',nome:'Mil folhas',total:131},
  {cod:'383706',nome:'Pão de deus misto',total:105},{cod:'383710',nome:'Croissant de chocolate',total:98},
  {cod:'383719',nome:'Palmier chocolate',total:91},{cod:'383590',nome:'Sande pasta atum & cenoura',total:82},
  {cod:'383668',nome:'Sande pasta frango & alho',total:80},{cod:'383727',nome:'Pão com chouriço',total:66},
  {cod:'383729',nome:'Supremo misto com salsicha',total:62},{cod:'383714',nome:'Bolo de cenoura',total:60},
  {cod:'383711',nome:'Croissant de ovo',total:58},{cod:'383713',nome:'Bolo brigadeiro',total:54},
  {cod:'383721',nome:'RIM',total:46},{cod:'383735',nome:'Hambúrguer',total:46},
  {cod:'383722',nome:'Bom bocado',total:42},{cod:'383681',nome:'Folhado ovo/salsicha SC',total:40},
  {cod:'383724',nome:'Torta de chocolate',total:36},{cod:'383726',nome:'Lanche misto',total:38},
  {cod:'383682',nome:'Pastel de Chaves SC',total:27},{cod:'383715',nome:'Fatia corada',total:27},
  {cod:'383708',nome:'Pão de leite misto',total:21},{cod:'383703',nome:'Croissant folhado misto',total:16},
  {cod:'383684',nome:'Sande bifana baguete rústica SC',total:10},{cod:'383736',nome:'Pão de sementes queijo e fiambre',total:6},
  {cod:'383737',nome:'Baguete panado frango SC',total:6},{cod:'383734',nome:'Frango grelhado molho iogurte',total:6},
  {cod:'383704',nome:'Croissant brioche queijo',total:6},{cod:'383683',nome:'Pizza SC',total:5},
  {cod:'383691',nome:'Sande omelete bag. rústica SC',total:4},{cod:'383598',nome:'Sande mista tosta',total:4},
  {cod:'383720',nome:'Palmier recheado',total:3},{cod:'383717',nome:'Jesuíta de amêndoa',total:3},
]

const STATUS_OPTS = ['🔴 Aguardando Assistência','🟢 Em Atendimento','✅ Resolvido','🔁 Recorrente']
const STATUS_COLOR = {
  '🔴 Aguardando Assistência':'#F85149',
  '🟢 Em Atendimento':'#10D9A0',
  '✅ Resolvido':'#3FB950',
  '🔁 Recorrente':'#E3A340',
}

// ── ESTILOS ───────────────────────────────────────────────────
const C = {
  bg:'#0D1117', card:'#161B22', border:'#21262D',
  accent:'#10D9A0', text:'#E6EDF3', muted:'#8B949E',
  danger:'#F85149', warning:'#E3A340',
}

const S = {
  app:{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:'14px'},
  header:{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'0 16px',paddingLeft:'calc(16px + env(safe-area-inset-left))',paddingRight:'calc(16px + env(safe-area-inset-right))',paddingTop:'env(safe-area-inset-top)',display:'flex',alignItems:'center',justifyContent:'space-between',minHeight:'56px',position:'sticky',top:0,zIndex:100,width:'100%'},
  logo:{display:'flex',flexDirection:'column',lineHeight:1.2},
  logoMain:{fontWeight:700,fontSize:'15px',color:C.accent},
  logoSub:{fontSize:'10px',color:C.muted},
  syncBar:{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:C.muted},
  syncDot:(ok)=>({width:'8px',height:'8px',borderRadius:'50%',background:ok?C.accent:C.danger,flexShrink:0}),
  syncBtn:{background:'none',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'11px'},
  nav:{display:'flex',borderBottom:`1px solid ${C.border}`,background:C.card,padding:'0 4px',paddingLeft:'calc(4px + env(safe-area-inset-left))',paddingRight:'calc(4px + env(safe-area-inset-right))',gap:'0',overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',width:'100%'},
  navBtn:(a)=>({padding:'14px 12px',background:a?`${C.accent}11`:'none',border:'none',color:a?C.accent:C.muted,borderBottom:a?`2px solid ${C.accent}`:'2px solid transparent',cursor:'pointer',fontWeight:a?700:400,fontSize:'13px',whiteSpace:'nowrap',transition:'all 0.15s',borderRadius:'0'}),
  main:{padding:'16px',paddingLeft:'calc(16px + env(safe-area-inset-left))',paddingRight:'calc(16px + env(safe-area-inset-right))',paddingBottom:'calc(16px + env(safe-area-inset-bottom))',maxWidth:'900px',margin:'0 auto',width:'100%',flex:1},
  card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:'10px',padding:'16px',marginBottom:'12px'},
  cardTitle:{fontWeight:600,fontSize:'14px',marginBottom:'12px',color:C.text,display:'flex',alignItems:'center',gap:'8px'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:'13px'},
  th:{textAlign:'left',padding:'8px 10px',background:C.bg,color:C.muted,fontSize:'11px',fontWeight:600,borderBottom:`1px solid ${C.border}`},
  td:{padding:'8px 10px',borderBottom:`1px solid ${C.border}`,color:C.text,verticalAlign:'top'},
  input:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'6px',color:C.text,padding:'8px 12px',fontSize:'14px',width:'100%',boxSizing:'border-box',outline:'none'},
  btn:{background:C.accent,color:'#0D1117',border:'none',borderRadius:'6px',padding:'8px 16px',fontWeight:600,cursor:'pointer',fontSize:'13px'},
  btnSm:{background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'12px'},
  btnDanger:{background:'transparent',color:C.danger,border:`1px solid ${C.danger}44`,borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'12px'},
  tag:{background:C.border,borderRadius:'4px',padding:'2px 7px',fontSize:'11px',color:C.muted,display:'inline-block',margin:'2px'},
  tagAccent:{background:`${C.accent}22`,borderRadius:'4px',padding:'2px 7px',fontSize:'11px',color:C.accent,display:'inline-block',margin:'2px',cursor:'pointer'},
  badge:(c)=>({background:`${c}22`,color:c,border:`1px solid ${c}44`,borderRadius:'12px',padding:'2px 8px',fontSize:'11px',fontWeight:600,display:'inline-block'}),
  select:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'6px',color:C.text,padding:'4px 8px',fontSize:'12px',cursor:'pointer',outline:'none'},
  divider:{height:'1px',background:C.border,margin:'12px 0'},
  link:{color:C.accent,fontSize:'12px',textDecoration:'none',display:'inline-block',marginTop:'8px'},
  frescoCard:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'12px',marginBottom:'8px',cursor:'pointer',transition:'border-color 0.15s'},
}

// ── COMPONENTES AUXILIARES ─────────────────────────────────────

function SyncBar({lastSync,syncing,ok,onSync}) {
  return (
    <div style={S.syncBar}>
      <div style={S.syncDot(ok)}/>
      <span style={{fontSize:'11px'}}>{syncing?'Sync…':lastSync||'–'}</span>
      <button style={S.syncBtn} onClick={onSync} disabled={syncing}>↻</button>
    </div>
  )
}

// ── PÁGINA DETALHE FRESCO ─────────────────────────────────────
function FrescoDetalhe({fresco, onBack}) {
  return (
    <div>
      <button onClick={onBack} style={{...S.btnSm,marginBottom:'16px'}}>← Voltar</button>
      <div style={S.card}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
          <div style={{background:`${C.accent}22`,borderRadius:'50%',width:'48px',height:'48px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px'}}>🥐</div>
          <div>
            <div style={{fontWeight:700,fontSize:'16px',color:C.text}}>{fresco.cliente}</div>
            <div style={{color:C.muted,fontSize:'12px'}}>PDV {fresco.pdv}</div>
          </div>
        </div>
        <div style={S.divider}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
          <div style={S.card}>
            <div style={{color:C.muted,fontSize:'11px',marginBottom:'6px'}}>🍰 ESPIRAIS DOCES</div>
            <div style={{fontWeight:600,color:C.text}}>{fresco.doces}</div>
          </div>
          <div style={S.card}>
            <div style={{color:C.muted,fontSize:'11px',marginBottom:'6px'}}>🥪 ESPIRAIS SALGADOS</div>
            <div style={{fontWeight:600,color:C.text}}>{fresco.salgados}</div>
          </div>
          <div style={S.card}>
            <div style={{color:C.muted,fontSize:'11px',marginBottom:'6px'}}>🟡 TENTAÇÃO</div>
            <div style={{fontWeight:600,color:C.text}}>{fresco.tentacao}</div>
          </div>
          <div style={S.card}>
            <div style={{color:C.muted,fontSize:'11px',marginBottom:'6px'}}>⭐ GOURMET</div>
            <div style={{fontWeight:600,color:C.text}}>{fresco.gourmet}</div>
          </div>
        </div>
        {fresco.mix && (
          <div style={{...S.card,background:'#E3A34011',border:'1px solid #E3A34044',marginBottom:'8px'}}>
            <div style={{color:'#E3A340',fontSize:'12px',fontWeight:600,marginBottom:'4px'}}>⚠️ PDV MIX — Doces e Salgados ao Mesmo Preço</div>
            <div style={{color:C.text,fontSize:'12px',lineHeight:1.6}}>As espirais deste PDV aceitam tanto frescos doces como salgados ao mesmo preço — sem separação por tipo. Abastecer com o produto de melhor venda independentemente da categoria.</div>
          </div>
        )}
        <div style={{...S.card,background:`${C.accent}11`,border:`1px solid ${C.accent}33`}}>
          <div style={{color:C.accent,fontSize:'12px',fontWeight:600,marginBottom:'8px'}}>📋 Instruções de Abastecimento</div>
          <div style={{color:C.text,fontSize:'13px',lineHeight:1.6}}>{fresco.instrucoes}</div>
        </div>
      </div>
    </div>
  )
}

// ── ABA INÍCIO ────────────────────────────────────────────────
function TabInicio({chamados,loading,onVerFresco,onVerAT,pdvYoung,pdv1050,pdvYoungEdit,pdv1050Edit}) {
  const ENTRADA_FIXA = '05:00'
  const JORNADA_MIN = 7 * 60

  const [pontoHoje, setPontoHoje] = useState(() => {
    try {
      const s = localStorage.getItem('ponto_today')
      if (!s) return null
      const p = JSON.parse(s)
      if (p.date !== todayISO()) return null
      return p
    } catch { return null }
  })
  const [registandoPonto, setRegistandoPonto] = useState(false)
  const [pontoSalvo, setPontoSalvo] = useState(false)

  const registrarSaida = async () => {
    setRegistandoPonto(true)
    try {
      const agora = new Date()
      const saida = `${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}`
      const totalMin = timeToMin(saida) - timeToMin(ENTRADA_FIXA)
      const normalMin = Math.min(totalMin, JORNADA_MIN)
      const extraMin = Math.max(0, totalMin - JORNADA_MIN)
      const dateISO = todayISO()
      const dateFmt = today()
      const mesIdx = agora.getMonth()
      const mesLabel = `${MESES_PT[mesIdx].charAt(0).toUpperCase()+MESES_PT[mesIdx].slice(1)}/${agora.getFullYear()}`

      // Get or create ponto root
      let rootId = localStorage.getItem('ponto_root_id') || null
      if (!rootId) {
        const ch = await nGet(`blocks/${PAGE_IDS.rotaRoot}/children`, { page_size: 100 })
        const ex = ch.results?.find(b => b.type === 'child_page' && b.child_page?.title === '⏱️ Ponto — Rota 606')
        rootId = ex ? ex.id : (await nPost('pages', {
          parent: { page_id: PAGE_IDS.rotaRoot },
          properties: { title: { title: [{ text: { content: '⏱️ Ponto — Rota 606' } }] } },
          icon: { type: 'emoji', emoji: '⏱️' }
        })).id
        try { localStorage.setItem('ponto_root_id', rootId) } catch {}
      }

      // Get or create monthly subfolder
      const mesKey = `ponto_mes_${agora.getFullYear()}_${mesIdx}`
      let mesId = localStorage.getItem(mesKey) || null
      if (!mesId) {
        const chMes = await nGet(`blocks/${rootId}/children`, { page_size: 50 })
        const exMes = chMes.results?.find(b => b.type === 'child_page' && b.child_page?.title === mesLabel)
        mesId = exMes ? exMes.id : (await nPost('pages', {
          parent: { page_id: rootId },
          properties: { title: { title: [{ text: { content: mesLabel } }] } }
        })).id
        try { localStorage.setItem(mesKey, mesId) } catch {}
      }

      // Create day page in Notion
      const pageContent = `Entrada: ${ENTRADA_FIXA}\nSaída: ${saida}\nTotal: ${minutesToHM(totalMin)}\nHoras Normais: ${minutesToHM(normalMin)}\nHoras Extra: ${minutesToHM(extraMin)}`
      const pg = await nPost('pages', {
        parent: { page_id: mesId },
        properties: { title: { title: [{ text: { content: `⏱️ Ponto — ${dateFmt}` } }] } },
        icon: { type: 'emoji', emoji: '⏱️' },
        children: [{ object:'block', type:'paragraph', paragraph:{ rich_text:[{ type:'text', text:{ content: pageContent } }] } }]
      })

      const ponto = { date: dateISO, entrada: ENTRADA_FIXA, saida, totalMin, normalMin, extraMin, notionPageId: pg.id }
      try { localStorage.setItem('ponto_today', JSON.stringify(ponto)) } catch {}
      setPontoHoje(ponto)
      setPontoSalvo(true)
      setTimeout(() => setPontoSalvo(false), 4000)
    } catch(e) { console.error('Ponto error:', e) }
    finally { setRegistandoPonto(false) }
  }

  const diaIdx = new Date().getDay()
  const dias = ['','2ª Feira','3ª Feira','4ª Feira','5ª Feira','6ª Feira']
  const diaAtual = dias[diaIdx] || '2ª Feira'
  const rotaHoje = ROTA[diaAtual] || []

  // Detectar PDVs com frescos na rota de hoje
  const clientesComFrescos = rotaHoje.map(c => {
    const pdvsFrescos = c.maquinas.filter(m => FRESCOS_PDVS.includes(m))
    return {...c, pdvsFrescos}
  }).filter(c => c.pdvsFrescos.length > 0)

  // BA Vidros — calcular supply date (editDate + 1 dia) e comparar com hoje
  function editDatePlusOne(isoDate) {
    // isoDate = "YYYY-MM-DD"
    if (!isoDate) return null
    const [y,m,d] = isoDate.split('-').map(Number)
    const next = new Date(y, m-1, d)
    next.setDate(next.getDate() + 1)
    return next.toLocaleDateString('pt-PT', {day:'2-digit',month:'2-digit',year:'numeric'})
  }

  function parseItens(texto) {
    if (!texto) return []
    return texto.split('\n')
      .filter(l => !l.startsWith('#'))
      .map(l => l.replace(/^[•·\-]\s*/, '').trim())
      .filter(Boolean)
  }

  const itensYoung = parseItens(pdvYoung)
  const itens1050 = parseItens(pdv1050)
  const todayFmt = today()

  // Mostrar APENAS se hoje = data de edição + 1 dia (dia real de abastecimento)
  const supplyYoung = editDatePlusOne(pdvYoungEdit)
  const supply1050 = editDatePlusOne(pdv1050Edit)
  const mostrarYoung = itensYoung.length > 0 && supplyYoung === todayFmt
  const mostrar1050 = itens1050.length > 0 && supply1050 === todayFmt
  const temBAVidros = mostrarYoung || mostrar1050

  return (
    <div>
      {/* Cabeçalho do dia */}
      <div style={{...S.card,borderColor:`${C.accent}44`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontWeight:700,fontSize:'16px',color:C.accent}}>🗓️ {diaAtual}</div>
            <div style={{color:C.muted,fontSize:'12px',marginTop:'2px'}}>{today()} · {rotaHoje.length} clientes · {rotaHoje.reduce((a,c)=>a+c.maquinas.length,0)} máquinas</div>
          </div>
          {chamados.length > 0 && (
            <div style={S.badge(C.warning)}>{chamados.length} chamado{chamados.length>1?'s':''}</div>
          )}
        </div>
      </div>

      {/* Ponto do dia */}
      <div style={{...S.card, borderColor: pontoHoje ? `${C.accent}44` : C.border}}>
        <div style={S.cardTitle}>🕐 Ponto do Dia</div>
        {pontoHoje ? (
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'10px'}}>
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                <div style={{color:C.muted,fontSize:'10px',fontWeight:600,marginBottom:'4px'}}>ENTRADA</div>
                <div style={{color:C.text,fontSize:'20px',fontWeight:700}}>{pontoHoje.entrada}</div>
              </div>
              <div style={{background:C.bg,border:`1px solid ${C.accent}44`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                <div style={{color:C.muted,fontSize:'10px',fontWeight:600,marginBottom:'4px'}}>SAÍDA</div>
                <div style={{color:C.accent,fontSize:'20px',fontWeight:700}}>{pontoHoje.saida}</div>
              </div>
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                <div style={{color:C.muted,fontSize:'10px',fontWeight:600,marginBottom:'4px'}}>HORAS NORMAIS</div>
                <div style={{color:C.text,fontSize:'16px',fontWeight:700}}>{minutesToHM(pontoHoje.normalMin)}</div>
              </div>
              <div style={{background:pontoHoje.extraMin>0?`${C.warning}11`:C.bg,border:`1px solid ${pontoHoje.extraMin>0?C.warning+'44':C.border}`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                <div style={{color:C.muted,fontSize:'10px',fontWeight:600,marginBottom:'4px'}}>HORAS EXTRA</div>
                <div style={{color:pontoHoje.extraMin>0?C.warning:C.muted,fontSize:'16px',fontWeight:700}}>{minutesToHM(pontoHoje.extraMin)}</div>
              </div>
            </div>
            <div style={{background:`${C.accent}11`,border:`1px solid ${C.accent}33`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
              <div style={{color:C.muted,fontSize:'10px',fontWeight:600,marginBottom:'4px'}}>TOTAL DO DIA</div>
              <div style={{color:C.accent,fontSize:'22px',fontWeight:700}}>{minutesToHM(pontoHoje.totalMin)}</div>
            </div>
            {pontoSalvo && <div style={{color:C.accent,fontSize:'11px',fontWeight:600,textAlign:'center',marginTop:'8px'}}>✅ Guardado no Notion</div>}
          </div>
        ) : (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-around',marginBottom:'16px',padding:'10px 0'}}>
              <div style={{textAlign:'center'}}>
                <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'4px'}}>ENTRADA</div>
                <div style={{color:C.text,fontSize:'22px',fontWeight:700}}>05:00</div>
              </div>
              <div style={{color:C.muted,fontSize:'20px'}}>→</div>
              <div style={{textAlign:'center'}}>
                <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'4px'}}>SAÍDA</div>
                <div style={{color:C.muted,fontSize:'22px'}}>--:--</div>
              </div>
            </div>
            <button onClick={registrarSaida} disabled={registandoPonto}
              style={{...S.btn, width:'100%', padding:'14px', fontSize:'15px', letterSpacing:'0.3px', opacity:registandoPonto?0.6:1}}>
              {registandoPonto ? '⏳ A registar…' : '🟢 Registar Saída'}
            </button>
          </div>
        )}
      </div>

      {/* BA Vidros — alerta de reposição */}
      {temBAVidros && (
        <div style={{...S.card,borderColor:`${C.accent}66`,background:`${C.accent}08`}}>
          <div style={{...S.cardTitle,color:C.accent}}>📦 BA Vidros Refeitório — Reposição Hoje</div>
          {mostrarYoung && itensYoung.length > 0 && (
            <div style={{marginBottom:'12px'}}>
              <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'6px'}}>PDV 806477 — Young</div>
              {itensYoung.map((item,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'4px 0',borderBottom:i<itensYoung.length-1?`1px solid ${C.border}`:'none'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',background:C.accent,flexShrink:0}}/>
                  <div style={{color:C.text,fontSize:'13px'}}>{item}</div>
                </div>
              ))}
            </div>
          )}
          {mostrar1050 && itens1050.length > 0 && (
            <div>
              <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'6px'}}>PDV 807542 — 1050</div>
              {itens1050.map((item,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'4px 0',borderBottom:i<itens1050.length-1?`1px solid ${C.border}`:'none'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',background:C.accent,flexShrink:0}}/>
                  <div style={{color:C.text,fontSize:'13px'}}>{item}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rota do dia */}
      <div style={S.card}>
        <div style={S.cardTitle}>🗺️ Rota de Hoje</div>
        {rotaHoje.map((c,i) => (
          <div key={i} style={{marginBottom:'10px'}}>
            <div style={{color:C.accent,fontWeight:600,fontSize:'13px',marginBottom:'4px'}}>{c.cliente}</div>
            <div>{c.maquinas.map((m,j) => <span key={j} style={S.tag}>{m}</span>)}</div>
          </div>
        ))}
      </div>

      {/* PDVs com frescos hoje */}
      {clientesComFrescos.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>🥐 PDVs QUE LEVAM FRESCOS HOJE</div>
          <div style={{color:C.muted,fontSize:'12px',marginBottom:'12px'}}>Clica no PDV para ver a configuração da máquina</div>
          {clientesComFrescos.map((c,i) => (
            <div key={i} style={{marginBottom:'12px'}}>
              <div style={{color:C.text,fontWeight:600,fontSize:'13px',marginBottom:'6px'}}>{c.cliente}</div>
              {c.pdvsFrescos.map((pdv,j) => {
                const config = FRESCOS.find(f => f.pdv === pdv)
                return (
                  <div key={j}
                    onClick={() => config && onVerFresco(config)}
                    style={{...S.frescoCard, borderColor:config?`${C.accent}44`:C.border}}
                  >
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <span style={{...S.badge(C.accent),marginRight:'8px'}}>PDV {pdv}</span>
                        <span style={{color:C.text,fontSize:'13px'}}>{config?.cliente || pdv}</span>
                      </div>
                      {config && <span style={{color:C.accent,fontSize:'12px'}}>Ver config →</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Chamados do mês */}
      {chamados.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>🔧 ATs este mês ({chamados.length})</div>
          {chamados.slice(0,3).map((c,i) => (
            <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontWeight:600,fontSize:'13px'}}>{c.cliente} — Máq. {c.maquina}</div>
              {c.problema && <div style={{color:C.muted,fontSize:'12px',marginTop:'2px'}}>{c.problema}</div>}
            </div>
          ))}
          {chamados.length > 3 && (
            <div onClick={()=>onVerAT()} style={{color:C.accent,fontSize:'13px',fontWeight:600,marginTop:'10px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px',background:`${C.accent}15`,padding:'6px 12px',borderRadius:'6px',border:`1px solid ${C.accent}33`}}>
              +{chamados.length-3} mais — ver aba A.T. →
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── DETALHE CHAMADO ──────────────────────────────────────────
function ChamadoDetalhe({chamado, onBack, onDelete}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [conteudo, setConteudo] = useState([])
  const [loadingContent, setLoadingContent] = useState(true)

  useEffect(() => {
    nGet(`blocks/${chamado.pageId}/children`, { page_size: '50' })
      .then(data => {
        const rows = []
        if (data.results) {
          data.results.forEach(b => {
            if (b.type === 'table_row') {
              const cells = b.table_row?.cells?.map(c => c.map(t => t.plain_text).join('')) || []
              if (cells.length >= 2 && cells[0] && cells[1]) rows.push({ campo: cells[0], valor: cells[1] })
            }
            if (b.type === 'paragraph') {
              const txt = b.paragraph?.rich_text?.map(t => t.plain_text).join('') || ''
              if (txt) rows.push({ campo: '', valor: txt })
            }
            if (b.type === 'bulleted_list_item') {
              const txt = b.bulleted_list_item?.rich_text?.map(t => t.plain_text).join('') || ''
              if (txt) rows.push({ campo: '•', valor: txt })
            }
          })
        }
        setConteudo(rows)
        setLoadingContent(false)
      }).catch(() => setLoadingContent(false))
  }, [chamado.pageId])

  const ignorar = ['campo','cliente','número da máquina','data do chamado','status','tipo de máquina']

  const handleDelete = async () => {
    setDeleting(true)
    await nPatch(`pages/${chamado.pageId}`, { archived: true })
    setDeleting(false)
    onDelete(chamado.pageId)
  }

  return (
    <>
      {confirmDel && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:`1px solid ${C.danger}44`,borderRadius:'12px',padding:'24px',maxWidth:'300px',width:'100%'}}>
            <div style={{fontSize:'24px',textAlign:'center',marginBottom:'10px'}}>⚠️</div>
            <div style={{fontWeight:600,textAlign:'center',color:C.text,marginBottom:'6px'}}>Apagar chamado?</div>
            <div style={{color:C.muted,fontSize:'13px',textAlign:'center',marginBottom:'18px'}}>Esta AT será arquivada no Notion.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setConfirmDel(false)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} style={{flex:1,background:'transparent',color:C.danger,border:`1px solid ${C.danger}44`,borderRadius:'6px',padding:'10px',fontWeight:600,cursor:'pointer',fontSize:'13px'}}>
                {deleting ? 'A apagar…' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <button onClick={onBack} style={S.btnSm}>← Voltar</button>
          <button onClick={() => setConfirmDel(true)} style={S.btnDanger}>🗑 Apagar</button>
        </div>
        <div style={S.card}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
            <div style={{background:`${C.danger}22`,borderRadius:'50%',width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>🔧</div>
            <div>
              <div style={{fontWeight:700,fontSize:'15px',color:C.text}}>{chamado.cliente}</div>
              <div style={{color:C.muted,fontSize:'12px',marginTop:'2px'}}>Máq. {chamado.maquina} · {chamado.data}</div>
            </div>
          </div>
          <div style={{height:'1px',background:C.border,marginBottom:'14px'}}/>
          {chamado.problema && (
            <div style={{background:`${C.danger}11`,border:`1px solid ${C.danger}22`,borderRadius:'8px',padding:'12px',marginBottom:'12px'}}>
              <div style={{color:C.danger,fontSize:'11px',fontWeight:600,marginBottom:'4px'}}>OCORRÊNCIA</div>
              <div style={{color:C.text,fontSize:'13px',lineHeight:1.6}}>{chamado.problema}</div>
            </div>
          )}
          {loadingContent ? <div style={{color:C.muted,fontSize:'13px'}}>A carregar detalhes…</div> : (
            conteudo.filter(r => r.campo && !ignorar.includes(r.campo.toLowerCase())).map((r,i) => (
              <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'2px'}}>{r.campo.toUpperCase()}</div>
                <div style={{color:C.text,fontSize:'13px',lineHeight:1.6}}>{r.valor}</div>
              </div>
            ))
          )}
          {conteudo.filter(r => r.campo === '•').length > 0 && (
            <div style={{marginTop:'8px'}}>
              {conteudo.filter(r => r.campo === '•').map((r,i) => (
                <div key={i} style={{display:'flex',gap:'8px',padding:'4px 0',color:C.text,fontSize:'13px'}}>
                  <span style={{color:C.accent}}>•</span>{r.valor}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── ABA CHAMADOS ─────────────────────────────────────────────
function TabChamados({chamados: chamadosMesAtual, loading: loadingInicial}) {
  const [chamadoAtivo, setChamadoAtivo] = useState(null)
  const [confirmDelId, setConfirmDelId] = useState(null)

  // Filtros
  const [mesesDisponiveis, setMesesDisponiveis] = useState([])
  const [subpastaFiltro, setSubpastaFiltro] = useState(null) // null = mês atual
  const [filtroCliente, setFiltroCliente] = useState('')
  const [lista, setLista] = useState(chamadosMesAtual)
  const [loadingFiltro, setLoadingFiltro] = useState(false)
  const resetTimerRef = useState(null)
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false)
  const [textoRelatorio, setTextoRelatorio] = useState('')
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false)
  const [relatorioSalvoId, setRelatorioSalvoId] = useState(null)
  const [relatorioFolderId, setRelatorioFolderId] = useState(() => { try { return localStorage.getItem('at_relatorios_folder_id') || null } catch { return null } })

  // Carregar meses disponíveis (subpastas AT)
  useEffect(() => {
    nGet(`blocks/${PAGE_IDS.assistenciaTecnica}/children`, {page_size:'20'}).then(data => {
      if (data.results) {
        const meses = data.results
          .filter(b => b.type === 'child_page')
          .map(b => ({id: b.id, titulo: b.child_page?.title || ''}))
          .filter(m => /\w+\/\d{4}/.test(m.titulo))
          .reverse()
        setMesesDisponiveis(meses)
      }
    }).catch(() => {})
  }, [])

  // Sincronizar lista com chamados do mês atual quando não há filtro
  useEffect(() => {
    if (!subpastaFiltro) setLista(chamadosMesAtual)
  }, [chamadosMesAtual, subpastaFiltro])

  // Quando muda de subpasta, buscar chamados desse mês
  const fetchChamadosDaSubpasta = async (subpastaId) => {
    setLoadingFiltro(true)
    try {
      const data = await nGet(`blocks/${subpastaId}/children`, {page_size:'50'})
      if (!data.results) { setLista([]); return }
      const parsed = data.results
        .filter(b => b.type === 'child_page')
        .map(b => {
          const titulo = b.child_page?.title || ''
          const matchCliente = titulo.match(/–\s*(.+?)\s*[|]/)
          const matchMaq = titulo.match(/Máq\.?\s*([\w]+)/)
          const matchDesc = titulo.match(/Máq\.?\s*[\w]+\s*–\s*(.+)$/)
          const dataISO = (b.created_time || '').split('T')[0]
          const dataFmt = dataISO ? dataISO.split('-').reverse().join('/') : '–'
          return {
            pageId: b.id,
            titulo: titulo.replace(/🔧\s*Chamado Técnico\s*–\s*/,'').replace(/\\|/g,'|'),
            cliente: matchCliente?.[1]?.trim() || '–',
            maquina: matchMaq?.[1]?.trim() || '–',
            problema: matchDesc?.[1]?.trim() || '',
            data: dataFmt, dataISO,
          }
        }).sort((a,b) => b.dataISO.localeCompare(a.dataISO))
      setLista(parsed)
    } catch { setLista([]) }
    finally { setLoadingFiltro(false) }
  }

  const handleMesFiltro = (subpasta) => {
    // Limpar timer anterior
    if (resetTimerRef[0]) clearTimeout(resetTimerRef[0])

    if (!subpasta) {
      setSubpastaFiltro(null)
      setLista(chamadosMesAtual)
      resetTimerRef[0] = null
      return
    }
    setSubpastaFiltro(subpasta)
    fetchChamadosDaSubpasta(subpasta.id)

    // Smart reset: volta ao mês atual após 2 min de inatividade
    resetTimerRef[0] = setTimeout(() => {
      setSubpastaFiltro(null)
      setLista(chamadosMesAtual)
      resetTimerRef[0] = null
    }, 2 * 60 * 1000)
  }

  const handleDelete = (pageId) => {
    setLista(prev => prev.filter(c => c.pageId !== pageId))
    setChamadoAtivo(null)
  }


  const getRelatorioFolder = async () => {
    let fid = relatorioFolderId
    if (!fid) {
      try {
        const ch = await nGet(`blocks/${PAGE_IDS.assistenciaTecnica}/children`, { page_size: 100 })
        const ex = ch.results?.find(b => b.type === 'child_page' && b.child_page?.title === '📊 Relatórios AT')
        fid = ex ? ex.id : (await nPost('pages', {
          parent: { page_id: PAGE_IDS.assistenciaTecnica },
          icon: { type: 'emoji', emoji: '📊' },
          properties: { title: { title: [{ type: 'text', text: { content: '📊 Relatórios AT' } }] } }
        })).id
        localStorage.setItem('at_relatorios_folder_id', fid)
        setRelatorioFolderId(fid)
      } catch { return null }
    }
    return fid
  }
  const listaFiltrada = lista.filter(c =>
    !filtroCliente || c.cliente.toLowerCase().includes(filtroCliente.toLowerCase())
  )

  const porDia = listaFiltrada.reduce((acc, c) => {
    const key = c.dataISO || 'sem-data'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})
  const diasOrdenados = Object.keys(porDia).sort((a,b) => b.localeCompare(a))


  const gerarRelatorio = async () => {
    if (listaFiltrada.length === 0) return
    setGerandoRelatorio(true)
    try {
      const agora = new Date().toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
      let texto = `📋 RELATÓRIO DE ASSISTÊNCIA TÉCNICA\n`
      texto += `Período: ${labelMes}\n`
      texto += `Data de geração: ${agora}\n`
      texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      const porClienteRel = listaFiltrada.reduce((acc, c) => {
        if (!acc[c.cliente]) acc[c.cliente] = []
        acc[c.cliente].push(c)
        return acc
      }, {})
      for (const [cliente, chamados] of Object.entries(porClienteRel)) {
        for (const c of chamados) {
          texto += `*${cliente}* — PDV ${c.maquina}\n`
          if (c.problema) texto += `• ${c.problema}\n`
          texto += `\n`
        }
      }
      texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      texto += `Total: ${listaFiltrada.length} chamada${listaFiltrada.length !== 1 ? 's' : ''} técnica${listaFiltrada.length !== 1 ? 's' : ''}\n`
      texto += `Rota 606 · mybreak by Delta Cafés`
      setTextoRelatorio(texto)
      setMostrarRelatorio(true)
      const fid = await getRelatorioFolder()
      if (fid) {
        const titulo = `📊 Relatório AT — ${labelMes} — ${agora}`
        const linhas = texto.split('\n')
        const children = linhas.map(l => ({ object:'block', type:'paragraph', paragraph:{ rich_text:[{ type:'text', text:{ content: l } }] } }))
        const page = await nPost('pages', {
          parent: { page_id: fid },
          icon: { type: 'emoji', emoji: '📊' },
          properties: { title: { title: [{ type: 'text', text: { content: titulo } }] } },
          children
        })
        const pid = page.id
        setRelatorioSalvoId(pid)
        setTimeout(async () => {
          try { await nPatch(`pages/${pid}`, { archived: true }) } catch {}
          setRelatorioSalvoId(null)
        }, 15 * 60 * 1000)
      }
    } finally { setGerandoRelatorio(false) }
  }
  function formatDia(iso) {
    if (!iso || iso === 'sem-data') return 'Data desconhecida'
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('pt-PT', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })
  }

  if (chamadoAtivo) return <ChamadoDetalhe chamado={chamadoAtivo} onBack={() => setChamadoAtivo(null)} onDelete={handleDelete}/>

  const isFiltered = !!subpastaFiltro
  const labelMes = subpastaFiltro ? subpastaFiltro.titulo : getMesLabel()

  return (
    <div>
      {/* Cabeçalho + filtros */}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={S.cardTitle}>🔧 A.T. — {labelMes}
            {isFiltered && <span style={{...S.badge(C.warning),marginLeft:'8px',fontSize:'10px'}}>filtro ativo</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {listaFiltrada.length > 0 && <span style={S.badge(C.accent)}>{listaFiltrada.length}</span>}
            <button onClick={gerarRelatorio} disabled={gerandoRelatorio || listaFiltrada.length === 0}
              style={{...S.btnSm,background:`${C.accent}22`,color:C.accent,border:`1px solid ${C.accent}44`,fontSize:'11px',padding:'4px 10px'}}>
              {gerandoRelatorio ? '…' : '📊 Gerar Relatório'}
            </button>
          </div>
        </div>

        {/* Filtro mês */}
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'10px'}}>
          <div style={{flex:1,minWidth:'140px'}}>
            <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'4px'}}>📅 MÊS</div>
            <select value={subpastaFiltro?.id||''} onChange={e => {
              const found = mesesDisponiveis.find(m => m.id === e.target.value)
              handleMesFiltro(found || null)
            }} style={{...S.select,width:'100%'}}>
              <option value="">Mês atual ({getMesLabel()})</option>
              {mesesDisponiveis.map(m => (
                <option key={m.id} value={m.id}>{m.titulo}</option>
              ))}
            </select>
          </div>
          <div style={{flex:1,minWidth:'140px'}}>
            <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'4px'}}>🔍 CLIENTE</div>
            <input value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
              placeholder="Filtrar por cliente…" style={{...S.input,width:'100%',boxSizing:'border-box'}}/>
          </div>
          {(isFiltered || filtroCliente) && (
            <div style={{display:'flex',alignItems:'flex-end'}}>
              <button onClick={() => { handleMesFiltro(null); setFiltroCliente('') }} style={S.btnSm}>
                ✕ Limpar filtros
              </button>
            </div>
          )}
        </div>
        {isFiltered && (
          <div style={{color:C.muted,fontSize:'11px',background:`${C.warning}11`,border:`1px solid ${C.warning}33`,borderRadius:'6px',padding:'6px 10px'}}>
            ⏱️ Volta automaticamente ao mês atual em 2 min sem interação
          </div>
        )}
      </div>

      {(loadingInicial && !isFiltered) || loadingFiltro ? (
        <div style={{...S.card,textAlign:'center',padding:'32px',color:C.muted}}>A carregar…</div>
      ) : listaFiltrada.length === 0 ? (
        <div style={{...S.card,textAlign:'center',padding:'32px'}}>
          <div style={{fontSize:'28px',marginBottom:'8px'}}>📋</div>
          <div style={{color:C.muted}}>{filtroCliente ? `Sem resultados para "${filtroCliente}"` : 'Sem assistências técnicas neste período'}</div>
        </div>
      ) : diasOrdenados.map(dia => (
        <div key={dia} style={{marginBottom:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <div style={{height:'1px',background:C.border,flex:1}}/>
            <div style={{color:C.accent,fontSize:'11px',fontWeight:600,textTransform:'capitalize',whiteSpace:'nowrap',padding:'0 8px',background:`${C.accent}15`,borderRadius:'10px',border:`1px solid ${C.accent}33`}}>
              📅 {formatDia(dia)}
            </div>
            <div style={{height:'1px',background:C.border,flex:1}}/>
          </div>
          {porDia[dia].map((c,i) => (
            <div key={i} style={{...S.card,padding:'12px',marginBottom:'8px',cursor:'pointer',transition:'border-color 0.15s'}}
              onMouseEnter={e => e.currentTarget.style.borderColor=`${C.accent}55`}
              onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
              <div style={{display:'flex',alignItems:'flex-start',gap:'8px'}}>
                <div style={{flex:1}} onClick={() => setChamadoAtivo(c)}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px',flexWrap:'wrap'}}>
                    <span style={{...S.badge(C.danger),fontSize:'10px'}}>🔧 AT</span>
                    <span style={{fontWeight:600,fontSize:'13px',color:C.text}}>{c.cliente}</span>
                    <span style={{color:C.muted,fontSize:'12px'}}>· Máq. {c.maquina}</span>
                  </div>
                  {c.problema && <div style={{color:C.text,fontSize:'12px',background:C.bg,padding:'6px 8px',borderRadius:'6px',marginBottom:'6px'}}>{c.problema}</div>}
                  <div style={{color:C.accent,fontSize:'11px'}}>Ver detalhes →</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setConfirmDelId(c.pageId) }}
                  style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:'18px',padding:'0 4px',flexShrink:0}}>✕</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {mostrarRelatorio && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',padding:'20px',maxWidth:'480px',width:'100%',maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
              <div style={{fontWeight:600,color:C.text,fontSize:'14px'}}>📊 Relatório AT — {labelMes}</div>
              <button onClick={()=>setMostrarRelatorio(false)} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:'18px',padding:'0 4px'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',marginBottom:'12px'}}>
              <pre style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'12px',color:C.text,fontSize:'12px',lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0,fontFamily:'inherit'}}>{textoRelatorio}</pre>
            </div>
            {relatorioSalvoId && (
              <div style={{color:C.muted,fontSize:'11px',marginBottom:'8px',textAlign:'center'}}>⏱️ Este relatório será apagado automaticamente do Notion em 15 min</div>
            )}
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <button onClick={()=>navigator.clipboard.writeText(textoRelatorio)}
                style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>📋 Copiar</button>
              <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(textoRelatorio)}`,'_blank')}
                style={{flex:1,background:'#25D366',color:'#fff',border:'none',borderRadius:'6px',padding:'10px',fontWeight:600,cursor:'pointer',fontSize:'13px'}}>📲 Partilhar WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelId && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:`1px solid ${C.danger}44`,borderRadius:'12px',padding:'24px',maxWidth:'300px',width:'100%'}}>
            <div style={{fontSize:'24px',textAlign:'center',marginBottom:'10px'}}>⚠️</div>
            <div style={{fontWeight:600,textAlign:'center',color:C.text,marginBottom:'6px'}}>Apagar chamado?</div>
            <div style={{color:C.muted,fontSize:'13px',textAlign:'center',marginBottom:'18px'}}>Esta AT será arquivada no Notion.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setConfirmDelId(null)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={async () => {
                await nPatch(`pages/${confirmDelId}`, { archived: true })
                setLista(prev => prev.filter(c => c.pageId !== confirmDelId))
                setConfirmDelId(null)
              }} style={{flex:1,background:'transparent',color:C.danger,border:`1px solid ${C.danger}44`,borderRadius:'6px',padding:'10px',fontWeight:600,cursor:'pointer',fontSize:'13px'}}>Apagar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ── POPUP CONFIRMAÇÃO ────────────────────────────────────────
function ConfirmPopup({mensagem, onConfirm, onCancel}) {
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000aa',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{background:C.card,border:`1px solid ${C.danger}44`,borderRadius:'12px',padding:'24px',maxWidth:'320px',width:'100%'}}>
        <div style={{fontSize:'24px',textAlign:'center',marginBottom:'12px'}}>⚠️</div>
        <div style={{fontWeight:600,fontSize:'15px',textAlign:'center',marginBottom:'8px',color:C.text}}>Confirmar limpeza</div>
        <div style={{color:C.muted,fontSize:'13px',textAlign:'center',marginBottom:'20px'}}>{mensagem}</div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={onCancel} style={{...S.btnSm,flex:1,padding:'10px',fontSize:'13px'}}>Cancelar</button>
          <button onClick={onConfirm} style={{...S.btnDanger,flex:1,padding:'10px',fontSize:'13px',fontWeight:600}}>Sim, apagar</button>
        </div>
      </div>
    </div>
  )
}

// ── CARD PDV BA VIDROS ────────────────────────────────────────
function PDVCard({id, label, pageId, itens, onSave}) {
  const [qtd, setQtd] = useState('')
  const [produto, setProduto] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function amanha() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('pt-PT', {day:'2-digit',month:'2-digit',year:'numeric'})
  }

  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)

  const adicionar = async () => {
    if (!qtd.trim() || !produto.trim()) return
    const novoItem = `${qtd.trim()} ${produto.trim()}`
    const novosItens = [...itens, novoItem]
    setSaving(true)
    await onSave(id, novosItens)
    setSaving(false)
    setQtd(''); setProduto('')
  }

  const deletarItem = async (idx) => {
    const novosItens = itens.filter((_,i) => i !== idx)
    setSaving(true)
    await onSave(id, novosItens)
    setSaving(false)
    setConfirmDeleteItem(null)
  }

  const limpar = async () => {
    setSaving(true)
    await onSave(id, [])
    setSaving(false)
    setConfirmClear(false)
    setConfirmDelete(false)
  }

  return (
    <>
      {/* Popup Abastecido */}
      {confirmClear && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:'12px',padding:'24px',maxWidth:'300px',width:'100%'}}>
            <div style={{fontSize:'32px',textAlign:'center',marginBottom:'10px'}}>✅</div>
            <div style={{fontWeight:700,textAlign:'center',color:C.text,fontSize:'16px',marginBottom:'6px'}}>Confirmar Abastecimento</div>
            <div style={{color:C.muted,fontSize:'13px',textAlign:'center',marginBottom:'18px'}}>{label} — todos os produtos desta lista foram abastecidos?</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setConfirmClear(false)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={limpar} style={{flex:1,background:C.accent,color:'#0D1117',border:'none',borderRadius:'6px',padding:'10px',fontWeight:700,cursor:'pointer',fontSize:'13px'}}>
                ✅ Abastecido
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Popup Apagar Tudo */}
      {confirmDelete && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:`1px solid ${C.danger}44`,borderRadius:'12px',padding:'24px',maxWidth:'300px',width:'100%'}}>
            <div style={{fontSize:'32px',textAlign:'center',marginBottom:'10px'}}>🗑️</div>
            <div style={{fontWeight:700,textAlign:'center',color:C.text,fontSize:'16px',marginBottom:'6px'}}>Apagar Tudo</div>
            <div style={{color:C.muted,fontSize:'13px',textAlign:'center',marginBottom:'18px'}}>{label} — tens a certeza que queres apagar toda a lista?</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setConfirmDelete(false)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={limpar} style={{flex:1,background:'transparent',color:C.danger,border:`1px solid ${C.danger}44`,borderRadius:'6px',padding:'10px',fontWeight:700,cursor:'pointer',fontSize:'13px'}}>
                🗑️ Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={S.cardTitle}>📦 {label}</div>
          {itens.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:'6px',alignItems:'flex-end'}}>
              <button style={{...S.btn,fontSize:'12px',padding:'5px 12px',background:C.accent}} onClick={() => setConfirmClear(true)} disabled={saving}>✅ Abastecido</button>
              <button style={{...S.btnDanger,fontSize:'12px',padding:'4px 12px'}} onClick={() => setConfirmDelete(true)} disabled={saving}>🗑️ Apagar Tudo</button>
            </div>
          )}
        </div>

        {/* Lista de produtos — leitura */}
        {itens.length > 0 ? (
          <div style={{marginBottom:'16px'}}>
            <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              📋 Para amanhã, {amanha()}
            </div>
            <div style={{background:C.bg,borderRadius:'8px',padding:'12px',border:`1px solid ${C.border}`}}>
              {confirmDeleteItem !== null && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000aa',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
                <div style={{background:C.card,border:`1px solid ${C.danger}44`,borderRadius:'12px',padding:'24px',maxWidth:'300px',width:'100%'}}>
                  <div style={{fontSize:'22px',textAlign:'center',marginBottom:'10px'}}>⚠️</div>
                  <div style={{fontWeight:600,textAlign:'center',color:C.text,marginBottom:'6px'}}>Apagar produto?</div>
                  <div style={{color:C.muted,fontSize:'13px',textAlign:'center',marginBottom:'6px'}}>"{itens[confirmDeleteItem]}"</div>
                  <div style={{color:C.muted,fontSize:'12px',textAlign:'center',marginBottom:'18px'}}>Só este produto será removido da lista.</div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button onClick={() => setConfirmDeleteItem(null)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
                    <button onClick={() => deletarItem(confirmDeleteItem)} style={{flex:1,background:'transparent',color:C.danger,border:`1px solid ${C.danger}44`,borderRadius:'6px',padding:'10px',fontWeight:600,cursor:'pointer',fontSize:'13px'}}>Apagar</button>
                  </div>
                </div>
              </div>
            )}
            {itens.map((item, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom: i < itens.length-1 ? `1px solid ${C.border}` : 'none'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',background:C.accent,flexShrink:0}}/>
                  <div style={{color:C.text,fontSize:'14px',flex:1}}>{item}</div>
                  <button onClick={() => setConfirmDeleteItem(i)} style={{background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:'16px',padding:'0 4px',lineHeight:1,flexShrink:0}} title="Apagar produto">✕</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'16px 0',marginBottom:'12px'}}>
            Sem produtos na lista
          </div>
        )}

        {/* Adicionar produto */}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:'12px'}}>
          <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Adicionar produto</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={qtd}
              onChange={e => setQtd(e.target.value)}
              placeholder="Qtd"
              style={{...S.input,width:'70px',flexShrink:0}}
              onKeyDown={e => e.key==='Enter' && adicionar()}
            />
            <input
              type="text"
              value={produto}
              onChange={e => setProduto(e.target.value)}
              placeholder="Nome do produto"
              style={{...S.input,flex:1,minWidth:'140px'}}
              enterKeyHint="done"
              onKeyDown={e => e.key==='Enter' && adicionar()}
            />
            <button style={{...S.btn,flexShrink:0}} onClick={adicionar} disabled={saving||!qtd||!produto}>
              {saving ? '…' : '+ Adicionar'}
            </button>
          </div>
        </div>


      </div>
    </>
  )
}

// ── ABA BA VIDROS REFEITÓRIO ──────────────────────────────────
function TabBAVidros({pdvYoung, pdv1050, onSave}) {
  function parseItens(texto) {
    if (!texto) return []
    return texto.split('\n')
      .map(l => l.replace(/^[•·\-]\s*/, '').trim())
      .filter(Boolean)
  }

  const itensYoung = parseItens(pdvYoung)
  const itens1050 = parseItens(pdv1050)

  const handleSave = async (pdv, itens) => {
    const texto = itens.map(i => `• ${i}`).join('\n')
    await onSave(pdv, texto)
  }

  return (
    <div>
      <PDVCard id="young" label="PDV 806477 — Refeitório Young" pageId={PAGE_IDS.pdv806477} itens={itensYoung} onSave={handleSave}/>
      <PDVCard id="1050" label="PDV 807542 — Refeitório 1050" pageId={PAGE_IDS.pdv807542} itens={itens1050} onSave={handleSave}/>
    </div>
  )
}

// ── ABA FRESCOS ───────────────────────────────────────────────
function TabFrescos({onVerFresco}) {
  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>🥐 Configuração Frescos — Máquinas</div>
        <div style={{color:C.muted,fontSize:'12px',marginBottom:'12px'}}>Clica numa máquina para ver os detalhes e instruções de abastecimento</div>
        {FRESCOS.map((f,i) => (
          <div key={i} onClick={()=>onVerFresco(f)}
            style={{...S.frescoCard}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=`${C.accent}88`}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
              <div>
                <span style={{...S.badge(C.accent),marginRight:'8px'}}>PDV {f.pdv}</span>
                <span style={{fontWeight:600,color:C.text}}>{f.cliente}</span>
              </div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {f.mix && <span style={{...S.tag,background:'#E3A34022',color:'#E3A340'}}>⚠️ Mix</span>}
                {!f.mix && f.doces!=='—' && <span style={S.tag}>🍰 Doces</span>}
                {!f.mix && f.salgados!=='—' && <span style={S.tag}>🥪 Salgados</span>}
                {f.tentacao!=='—' && <span style={{...S.tag,background:`${C.warning}22`,color:C.warning}}>🟡 Tentação</span>}
                {f.gourmet!=='—' && <span style={{...S.tag,background:'#A371F722',color:'#A371F7'}}>⭐ Gourmet</span>}
                <span style={{color:C.accent,fontSize:'12px',marginLeft:'4px'}}>→</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ABA ROTA ──────────────────────────────────────────────────
function TabRota({onVerFresco}) {
  const dias = Object.keys(ROTA)
  const diaHoje = ['','2ª Feira','3ª Feira','4ª Feira','5ª Feira','6ª Feira'][new Date().getDay()]
  const [ativo,setAtivo] = useState(dias.includes(diaHoje)?diaHoje:dias[0])

  return (
    <div>
      <div style={{display:'flex',gap:'6px',marginBottom:'16px',flexWrap:'wrap'}}>
        {dias.map(d=>(
          <button key={d} onClick={()=>setAtivo(d)} style={{
            background:ativo===d?C.accent:C.border,color:ativo===d?'#0D1117':C.text,
            border:'none',borderRadius:'6px',padding:'7px 12px',cursor:'pointer',fontWeight:600,fontSize:'12px',
          }}>{d}</button>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>🗺️ {ativo} · {ROTA[ativo].length} clientes · {ROTA[ativo].reduce((a,c)=>a+c.maquinas.length,0)} máquinas</div>
        {ROTA[ativo].map((c,i)=>{
          const pdvsFrescos = c.maquinas.filter(m=>FRESCOS_PDVS.includes(m))
          return (
            <div key={i} style={{marginBottom:'14px'}}>
              <div style={{color:C.accent,fontWeight:600,fontSize:'13px',marginBottom:'6px'}}>{c.cliente}</div>
              <div>
                {c.maquinas.map((m,j)=>{
                  const temFrescos = FRESCOS_PDVS.includes(m)
                  const config = FRESCOS.find(f=>f.pdv===m)
                  return temFrescos ? (
                    <span key={j} onClick={()=>config&&onVerFresco(config)}
                      style={{...S.tagAccent,cursor:'pointer'}} title="Ver config frescos">
                      {m} 🥐
                    </span>
                  ) : (
                    <span key={j} style={S.tag}>{m}</span>
                  )
                })}
              </div>
              {pdvsFrescos.length>0 && (
                <div style={{fontSize:'11px',color:C.accent,marginTop:'4px'}}>
                  🥐 {pdvsFrescos.length} máquina{pdvsFrescos.length>1?'s com':'com'} frescos — clica para ver config
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ABA PRODUTOS ─────────────────────────────────────────────
function TabProdutos() {
  const sorted = [...PRODUTOS].sort((a,b)=>b.total-a.total)
  const max = sorted[0]?.total||1
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>📊 Produtos — Semana 22/06/2026 · 1 442 un.</div>
      <div style={{overflowX:'auto'}}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Código</th>
              <th style={S.th}>Produto</th>
              <th style={{...S.th,textAlign:'right'}}>Total</th>
              <th style={S.th}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p,i)=>(
              <tr key={i}>
                <td style={{...S.td,color:C.muted,fontSize:'11px'}}>{p.cod}</td>
                <td style={S.td}>{p.nome}</td>
                <td style={{...S.td,textAlign:'right',fontWeight:600}}>{p.total}</td>
                <td style={{...S.td,minWidth:'100px'}}>
                  <div style={{background:C.border,borderRadius:'4px',height:'6px',overflow:'hidden'}}>
                    <div style={{background:C.accent,height:'100%',width:`${(p.total/max)*100}%`}}/>
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


// ── TODAS AS MÁQUINAS DA ROTA (para comparação) ───────────────
const TODAS_MAQUINAS = [
  {pdv:'811865', cliente:'SAICA PACK PORTUGAL', modelo:'CONCERTO'},
  {pdv:'811866', cliente:'SAICA PACK PORTUGAL', modelo:'CONCERTO'},
  {pdv:'811867', cliente:'SAICA PACK PORTUGAL', modelo:'LEI 301 COMBI'},
  {pdv:'811868', cliente:'SAICA PACK PORTUGAL', modelo:'VIVACE'},
  {pdv:'811869', cliente:'SAICA PACK PORTUGAL', modelo:'VIVACE'},
  {pdv:'814082', cliente:'SAICA PACK PORTUGAL', modelo:'FAS 900'},
  {pdv:'809403', cliente:'FAMOLDE', modelo:'FAS 500 SLAVE P3'},
  {pdv:'809404', cliente:'FAMOLDE', modelo:'FAS 500 SLAVE'},
  {pdv:'806066', cliente:'BA VIDROS - ENTRADA', modelo:'FAS 1050'},
  {pdv:'806071', cliente:'BA VIDROS - ENTRADA', modelo:'LEI 400'},
  {pdv:'806476', cliente:'BA VIDROS - ENTRADA', modelo:'LEI 400'},
  {pdv:'807016', cliente:'BA VIDROS - ENTRADA', modelo:'MELODIA'},
  {pdv:'809449', cliente:'BA VIDROS - ENTRADA', modelo:'FAS YOUNG'},
  {pdv:'810925', cliente:'BA VIDROS - ENTRADA', modelo:'CONCERTO'},
  {pdv:'806068', cliente:'BA VIDROS - REFEITÓRIO P1', modelo:'LEI 400'},
  {pdv:'806069', cliente:'BA VIDROS - REFEITÓRIO P1', modelo:'LEI 400'},
  {pdv:'806477', cliente:'BA VIDROS - REFEITÓRIO P1', modelo:'FAS YOUNG'},
  {pdv:'807542', cliente:'BA VIDROS - REFEITÓRIO P1', modelo:'FAS 1050'},
  {pdv:'814999', cliente:'BA VIDROS - REFEITÓRIO P1', modelo:'FLEXSTACK'},
  {pdv:'815228', cliente:'VIDROMOLDE', modelo:'LEI 301 COMBI'},
  {pdv:'815229', cliente:'MEGO INDUSTRIA MOLDES', modelo:'LEI 301 COMBI'},
  {pdv:'815691', cliente:'PES - PROJETOS EQUIPAMENTOS', modelo:'FAS 500 SLAVE'},
  {pdv:'815504', cliente:'HRV - EQUIPAMENTOS DE PROCESSO S.A.', modelo:'LEI 400 SLAVE'},
  {pdv:'815505', cliente:'HRV - EQUIPAMENTOS DE PROCESSO S.A.', modelo:'MELODIA'},
  {pdv:'815506', cliente:'HRV - EQUIPAMENTOS DE PROCESSO S.A.', modelo:'FAS 500'},
  {pdv:'807540', cliente:'MG2 - BA', modelo:'FAS YOUNG'},
  {pdv:'815356', cliente:'MG2 - BA', modelo:'BRIO UP'},
  {pdv:'806079', cliente:'IEFP-C.E. MARINHA GRANDE', modelo:'FAS 1050'},
  {pdv:'809788', cliente:'IEFP-C.E. MARINHA GRANDE', modelo:'CONCERTO'},
  {pdv:'810926', cliente:'PALBASE', modelo:'BRIO KEY'},
  {pdv:'812421', cliente:'INNOVCOATING', modelo:'FAS MIA'},
  {pdv:'812422', cliente:'INNOVCOATING', modelo:'FAS MIA'},
  {pdv:'812420', cliente:'INNOVCOATING', modelo:'LEI 301 COMBI'},
  {pdv:'813878', cliente:'IMV', modelo:'LEI 301 COMBI'},
  {pdv:'807486', cliente:'IMV', modelo:'FAS 400'},
  {pdv:'813266', cliente:'PROMOPLAS', modelo:'FAS MIA'},
  {pdv:'813267', cliente:'PROMOPLAS', modelo:'FLESSY'},
  {pdv:'811384', cliente:'BA VIDROS - ENGENHEIROS', modelo:'BRIO KEY'},
  {pdv:'813414', cliente:'ARMAZÉM 3 BA VIDROS', modelo:'BRIO UP COMBI'},
  {pdv:'810601', cliente:'IPL MARINHA GRANDE', modelo:'FAS 300 COMBI'},
]

// ── ABA INVENTÁRIO ────────────────────────────────────────────
function TabInventario() {
  const [folderId, setFolderId] = useState(() => { try { return localStorage.getItem('inv_folder_id') || null } catch { return null } })
  const [history, setHistory] = useState([])
  const [aberto, setAberto] = useState(null)
  const [textoAberto, setTextoAberto] = useState(null)
  const [carregandoHist, setCarregandoHist] = useState(false)
  const [carregandoTexto, setCarregandoTexto] = useState(false)
  const [textoRelatorio, setTextoRelatorio] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [editTemp, setEditTemp] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [confirmApagar, setConfirmApagar] = useState(null)
  const [tituloRelatorio, setTituloRelatorio] = useState('')
  const [ultimoSalvo, setUltimoSalvo] = useState(null)

  const getFolder = useCallback(async () => {
    let fid = folderId
    if (!fid) {
      try {
        const ch = await nGet(`blocks/${PAGE_IDS.rotaRoot}/children`, { page_size: 100 })
        const ex = ch.results?.find(b => b.type === 'child_page' && b.child_page?.title === '📋 Inventários — Rota 606')
        fid = ex ? ex.id : (await nPost('pages', {
          parent: { page_id: PAGE_IDS.rotaRoot },
          icon: { type: 'emoji', emoji: '📋' },
          properties: { title: { title: [{ type: 'text', text: { content: '📋 Inventários — Rota 606' } }] } }
        })).id
        localStorage.setItem('inv_folder_id', fid)
        setFolderId(fid)
      } catch { return null }
    }
    return fid
  }, [folderId])

  const loadHistory = useCallback(async (fid) => {
    if (!fid) return
    setCarregandoHist(true)
    try {
      const res = await nGet(`blocks/${fid}/children`, { page_size: 50 })
      setHistory((res.results || []).filter(b => b.type === 'child_page').map(b => ({ id: b.id, title: b.child_page?.title || 'Inventário' })).reverse())
    } finally { setCarregandoHist(false) }
  }, [])

  useEffect(() => { getFolder().then(f => loadHistory(f)) }, [])

  const salvarNoNotion = async () => {
    if (!textoRelatorio.trim()) return
    setGuardando(true)
    try {
      const fid = await getFolder()
      if (!fid) throw new Error('Pasta não encontrada')
      const agora = new Date().toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
      const titulo = tituloRelatorio.trim() || `📋 Inventário — ${agora}`
      const linhas = textoRelatorio.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n')
      const children = linhas.map(l => ({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: l.slice(0, 1900) } }] }
      }))
      const novaPagina = await nPost('pages', {
        parent: { page_id: fid },
        icon: { type: 'emoji', emoji: '📋' },
        properties: { title: { title: [{ type: 'text', text: { content: titulo } }] } },
        children: children.slice(0, 100)
      })
      await loadHistory(fid)
      if (novaPagina?.id) { setUltimoSalvo(novaPagina.id); setAberto(novaPagina.id) }
      setTextoRelatorio('')
      setTituloRelatorio('')
    } catch(err) { alert('Erro ao guardar: ' + err.message) }
    finally { setGuardando(false) }
  }

  const abrirItem = async (pageId) => {
    if (aberto === pageId) { setAberto(null); setTextoAberto(null); return }
    setAberto(pageId)
    setCarregandoTexto(true)
    setTextoAberto(null)
    try {
      const res = await nGet(`blocks/${pageId}/children`, { page_size: 100 })
      const blocks = res.results || []
      const texto = blocks.filter(b => b.type === 'paragraph').map(b => b.paragraph?.rich_text?.map(t=>t.plain_text).join('') || '').join('\n')
      setTextoAberto({ texto })
    } catch { setTextoAberto({ texto: 'Erro ao carregar conteúdo.' }) }
    finally { setCarregandoTexto(false) }
  }

  const guardarEdit = async () => {
    if (!editando) return
    setGuardandoEdit(true)
    try {
      const res = await nGet(`blocks/${editando.pageId}/children`, { page_size: 100 })
      const blocks = (res.results || []).filter(b => b.type === 'paragraph')
      for (const b of blocks) { await nPatch(`blocks/${b.id}`, { archived: true }) }
      const linhas = editTemp.split('\n')
      const children = linhas.map(l => ({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: l.slice(0, 1900) } }] }
      }))
      await nPatch(`blocks/${editando.pageId}/children`, { children: children.slice(0, 100) })
      setTextoAberto(prev => ({ ...prev, texto: editTemp }))
      setEditando(null)
    } finally { setGuardandoEdit(false) }
  }

  const apagarItem = async (pageId) => {
    try { await nPatch(`pages/${pageId}`, { archived: true }) } catch {}
    setHistory(prev => prev.filter(h => h.id !== pageId))
    if (aberto === pageId) { setAberto(null); setTextoAberto(null) }
    setConfirmApagar(null)
  }

  return (
    <div>
      {editando && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',padding:'20px',maxWidth:'500px',width:'100%'}}>
            <div style={{fontWeight:600,color:C.text,marginBottom:'10px'}}>✏️ Editar Inventário</div>
            <textarea value={editTemp} onChange={e=>setEditTemp(e.target.value)} rows={10}
              style={{width:'100%',background:C.bg,border:'1px solid #30363D',borderRadius:'6px',color:C.text,padding:'10px',fontSize:'13px',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit',marginBottom:'10px'}}/>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setEditando(null)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={guardarEdit} disabled={guardandoEdit} style={{flex:1,background:C.accent,color:'#0D1117',border:'none',borderRadius:'6px',padding:'10px',fontWeight:700,cursor:'pointer',fontSize:'13px'}}>
                {guardandoEdit ? 'A guardar…' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmApagar && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:'1px solid #F8514944',borderRadius:'12px',padding:'20px',maxWidth:'300px',width:'100%',textAlign:'center'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>🗑️</div>
            <div style={{fontWeight:600,color:C.text,marginBottom:'6px'}}>Apagar inventário?</div>
            <div style={{color:C.muted,fontSize:'13px',marginBottom:'16px'}}>Este registo será apagado do Notion e do dashboard.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setConfirmApagar(null)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={()=>apagarItem(confirmApagar)} style={{flex:1,background:C.danger,color:'#fff',border:'none',borderRadius:'6px',padding:'10px',fontWeight:700,cursor:'pointer',fontSize:'13px'}}>Apagar</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <div style={S.cardTitle}>📋 Inventário — Rota 606</div>
        <div style={{color:C.muted,fontSize:'13px',marginBottom:'12px'}}>Cole aqui o relatório de inventário gerado pelo Claude e guarde no Notion.</div>
        <textarea value={tituloRelatorio} onChange={e=>setTituloRelatorio(e.target.value)} rows={3}
          placeholder="Título (ex: Inventário 29/06/2026)"
          style={{...S.input,resize:'none',fontFamily:'inherit',lineHeight:1.5,marginBottom:'8px'}}/>
        <textarea value={textoRelatorio} onChange={e=>setTextoRelatorio(e.target.value)} rows={8}
          placeholder="Cole aqui o relatório de inventário…"
          style={{...S.input,resize:'vertical',fontFamily:'inherit',lineHeight:1.6,marginBottom:'10px'}}/>
        <button onClick={salvarNoNotion} disabled={!textoRelatorio.trim() || guardando}
          style={{...S.btn,width:'100%',opacity:(!textoRelatorio.trim()||guardando)?0.5:1}}>
          {guardando ? 'A guardar no Notion…' : '💾 Salvar no Notion'}
        </button>
      </div>
      <div style={{...S.card,border:`1px solid ${C.accent}44`,background:`${C.accent}08`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <div style={{...S.cardTitle,marginBottom:0,color:C.accent}}>🗂️ Inventários Guardados no Notion</div>
          {history.length > 0 && <span style={S.badge(C.accent)}>{history.length}</span>}
        </div>
        {carregandoHist ? (
          <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'20px'}}>A carregar…</div>
        ) : history.length === 0 ? (
          <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'20px'}}>Sem inventários guardados ainda.<br/>Cole um relatório acima e clique em Salvar.</div>
        ) : history.map(item => (
          <div key={item.id} style={{borderBottom:`1px solid ${C.border}`,background:ultimoSalvo===item.id?`${C.accent}0a`:'transparent',borderRadius:'6px',marginBottom:'2px',transition:'background 0.3s'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'8px',padding:'10px 6px',cursor:'pointer'}} onClick={()=>abrirItem(item.id)}>
              <div style={{flex:1}}>
                <div style={{fontWeight:aberto===item.id?700:500,color:aberto===item.id?C.accent:C.text,fontSize:'13px',lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{item.title}</div>
                {ultimoSalvo===item.id && <div style={{color:C.accent,fontSize:'10px',marginTop:'3px',fontWeight:600}}>✅ Guardado agora</div>}
              </div>
              <div style={{display:'flex',gap:'4px',flexShrink:0,marginTop:'2px'}}>
                <button onClick={e=>{e.stopPropagation();abrirItem(item.id).then(()=>{if(textoAberto)setEditando({pageId:item.id})})}}
                  style={{background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'4px',padding:'4px 8px',cursor:'pointer',fontSize:'11px'}}>✏️</button>
                <button onClick={e=>{e.stopPropagation();setConfirmApagar(item.id)}}
                  style={{background:'transparent',border:'1px solid #F8514944',color:C.danger,borderRadius:'4px',padding:'4px 8px',cursor:'pointer',fontSize:'11px'}}>🗑</button>
                <span style={{color:C.muted,fontSize:'12px',padding:'4px'}}>{aberto===item.id?'▲':'▼'}</span>
              </div>
            </div>
            {aberto === item.id && (
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'14px',marginBottom:'10px',marginTop:'4px'}}>
                {carregandoTexto && !textoAberto ? (
                  <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'12px'}}>A carregar…</div>
                ) : textoAberto ? (
                  <>
                    <div style={{display:'flex',justifyContent:'flex-end',gap:'6px',marginBottom:'8px'}}>
                      <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(item.title+'\n\n'+textoAberto.texto)}`,'_blank')}
                        style={{background:'#25D366',border:'none',color:'#fff',borderRadius:'4px',padding:'4px 10px',cursor:'pointer',fontSize:'11px',fontWeight:600}}>📤 WhatsApp</button>
                      <button onClick={()=>{setEditTemp(textoAberto.texto);setEditando({pageId:item.id})}}
                        style={{background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'4px',padding:'4px 10px',cursor:'pointer',fontSize:'11px'}}>✏️ Editar</button>
                    </div>
                    <pre style={{color:C.text,fontSize:'13px',lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0,fontFamily:'inherit'}}>{textoAberto.texto}</pre>
                  </>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
// ── ABA PONTO ────────────────────────────────────────────────
function TabPonto() {
  const [rootId, setRootId] = useState(() => { try { return localStorage.getItem('ponto_root_id') || null } catch { return null } })
  const [meses, setMeses] = useState([])
  const [mesSel, setMesSel] = useState(null)
  const [registos, setRegistos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [carregandoMeses, setCarregandoMeses] = useState(true)

  useEffect(() => {
    const loadRoot = async () => {
      let rid = rootId
      if (!rid) {
        try {
          const ch = await nGet(`blocks/${PAGE_IDS.rotaRoot}/children`, { page_size: 100 })
          const ex = ch.results?.find(b => b.type === 'child_page' && b.child_page?.title === '⏱️ Ponto — Rota 606')
          if (ex) { rid = ex.id; setRootId(rid); try { localStorage.setItem('ponto_root_id', rid) } catch {} }
        } catch {}
      }
      if (!rid) { setCarregandoMeses(false); return }
      try {
        const ch = await nGet(`blocks/${rid}/children`, { page_size: 50 })
        const ms = (ch.results || []).filter(b => b.type === 'child_page')
          .map(b => ({ id: b.id, titulo: b.child_page?.title || '' })).reverse()
        setMeses(ms)
        if (ms.length > 0) { setMesSel(ms[0]); loadMes(ms[0].id) }
      } catch {}
      setCarregandoMeses(false)
    }
    loadRoot()
  }, [])

  const loadMes = async (mesId) => {
    setCarregando(true)
    setRegistos([])
    try {
      const ch = await nGet(`blocks/${mesId}/children`, { page_size: 50 })
      const pages = (ch.results || []).filter(b => b.type === 'child_page')
      const items = await Promise.all(pages.map(async (b) => {
        const titulo = b.child_page?.title || ''
        const dateMatch = titulo.match(/(\d{2}\/\d{2}\/\d{4})/)
        const dateFmt = dateMatch?.[1] || ''
        try {
          const blocks = await nGet(`blocks/${b.id}/children`, { page_size: 10 })
          const text = (blocks.results || []).filter(bl => bl.type === 'paragraph')
            .map(bl => bl.paragraph?.rich_text?.map(t => t.plain_text).join('') || '').join('\n')
          const parse = (label) => { const m = text.match(new RegExp(label+':\\s*(.+)')); return m?.[1]?.trim() || '' }
          const hmToMin = (hm) => { const m = hm.match(/(\d+)h(\d+)m/); return m ? parseInt(m[1])*60+parseInt(m[2]) : 0 }
          const entrada = parse('Entrada') || '05:00'
          const saida = parse('Saída') || ''
          const total = parse('Total') || ''
          const normais = parse('Horas Normais') || ''
          const extra = parse('Horas Extra') || ''
          return { id:b.id, dateFmt, entrada, saida, total, normais, extra, totalMin:hmToMin(total), normalMin:hmToMin(normais), extraMin:hmToMin(extra) }
        } catch { return { id:b.id, dateFmt, entrada:'05:00', saida:'', total:'', normais:'', extra:'', totalMin:0, normalMin:0, extraMin:0 } }
      }))
      items.sort((a,b) => { const f=d=>d.split('/').reverse().join('-'); return f(b.dateFmt||'00/00/0000').localeCompare(f(a.dateFmt||'00/00/0000')) })
      setRegistos(items)
    } catch {}
    setCarregando(false)
  }

  const totais = registos.reduce((a,r) => ({ totalMin:a.totalMin+r.totalMin, normalMin:a.normalMin+r.normalMin, extraMin:a.extraMin+r.extraMin }), {totalMin:0,normalMin:0,extraMin:0})

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>⏱️ Registo de Ponto</div>
        {carregandoMeses ? (
          <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'12px'}}>A carregar…</div>
        ) : meses.length === 0 ? (
          <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'20px'}}>Sem registos ainda.<br/>Regista a saída na tab <strong style={{color:C.accent}}>Início</strong>.</div>
        ) : (
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
            {meses.map(m => (
              <button key={m.id} onClick={() => { setMesSel(m); loadMes(m.id) }}
                style={{...S.btnSm, borderColor:mesSel?.id===m.id?C.accent:C.border, color:mesSel?.id===m.id?C.accent:C.muted, fontWeight:mesSel?.id===m.id?700:400}}>
                {m.titulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {registos.length > 0 && (
        <div style={{...S.card,border:`1px solid ${C.accent}44`,background:`${C.accent}08`}}>
          <div style={{...S.cardTitle,color:C.accent,marginBottom:'10px'}}>📊 Totais — {mesSel?.titulo}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'8px'}}>
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
              <div style={{color:C.muted,fontSize:'10px',fontWeight:600,marginBottom:'4px'}}>TOTAL</div>
              <div style={{color:C.text,fontSize:'15px',fontWeight:700}}>{minutesToHM(totais.totalMin)}</div>
            </div>
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
              <div style={{color:C.muted,fontSize:'10px',fontWeight:600,marginBottom:'4px'}}>NORMAIS</div>
              <div style={{color:C.text,fontSize:'15px',fontWeight:700}}>{minutesToHM(totais.normalMin)}</div>
            </div>
            <div style={{background:totais.extraMin>0?`${C.warning}11`:C.bg,border:`1px solid ${totais.extraMin>0?C.warning+'44':C.border}`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
              <div style={{color:C.muted,fontSize:'10px',fontWeight:600,marginBottom:'4px'}}>EXTRA</div>
              <div style={{color:totais.extraMin>0?C.warning:C.muted,fontSize:'15px',fontWeight:700}}>{minutesToHM(totais.extraMin)}</div>
            </div>
          </div>
          <div style={{color:C.muted,fontSize:'12px',textAlign:'center'}}>{registos.length} dia{registos.length!==1?'s':''} registado{registos.length!==1?'s':''}</div>
        </div>
      )}

      {carregando ? (
        <div style={{...S.card,textAlign:'center',color:C.muted,padding:'24px'}}>A carregar registos…</div>
      ) : registos.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>📋 Dias Registados</div>
          <div style={{overflowX:'auto'}}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Data</th>
                  <th style={S.th}>Entrada</th>
                  <th style={S.th}>Saída</th>
                  <th style={S.th}>Normal</th>
                  <th style={{...S.th,color:C.warning}}>Extra</th>
                  <th style={S.th}>Total</th>
                </tr>
              </thead>
              <tbody>
                {registos.map((r,i) => (
                  <tr key={i}>
                    <td style={{...S.td,fontWeight:600,color:C.accent}}>{r.dateFmt}</td>
                    <td style={S.td}>{r.entrada}</td>
                    <td style={{...S.td,fontWeight:600}}>{r.saida}</td>
                    <td style={S.td}>{r.normais||'—'}</td>
                    <td style={{...S.td,color:r.extraMin>0?C.warning:C.muted,fontWeight:r.extraMin>0?600:400}}>{r.extra||'00h00m'}</td>
                    <td style={{...S.td,fontWeight:700,color:C.text}}>{r.total||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const TABS = ['🏠','📋','📦','🥐','🛒','🗺️','📋','📊','⏱️','🚨']
const TAB_LABELS = ['Início','A.T.','BA Vidros','Config. Frescos','Frescos','Rota','Inventário','Gestão Rota','Ponto','Piquete']

function Dashboard() {
  const [tab,setTab] = useState(0)
  const [lastSync,setLastSync] = useState(null)
  const [syncing,setSyncing] = useState(false)
  const [syncOk,setSyncOk] = useState(true)
  const [pdvYoung,setPdvYoung] = useState('')
  const [pdv1050,setPdv1050] = useState('')
  const [pdvYoungEdit,setPdvYoungEdit] = useState('') // YYYY-MM-DD
  const [pdv1050Edit,setPdv1050Edit] = useState('') // YYYY-MM-DD
  const [chamados,setChamados] = useState([])
  const [loading,setLoading] = useState(true)
  const [frescoAtivo,setFrescoAtivo] = useState(null)

  // Busca texto + data de última edição da página (para calcular dia de supply)
  const fetchPdv = async (pageId) => {
    const blocks = await nGet(`blocks/${pageId}/children`, {page_size:'50'})
    const text = blocks.results ? extractText(blocks.results) : ''
    // Buscar metadados separadamente — não falhar o sync se der erro
    let editDate = ''
    try {
      const page = await nGet(`pages/${pageId}`)
      editDate = page.last_edited_time ? page.last_edited_time.split('T')[0] : ''
    } catch {}
    return { text, editDate }
  }

  const fetchChamados = async () => {
    try {
      const now = new Date()
      const mesAbrev = MESES_PT[now.getMonth()]
      const ano = now.getFullYear()

      // Buscar subpastas da pasta AT
      const folders = await nGet(`blocks/${PAGE_IDS.assistenciaTecnica}/children`, { page_size: '20' })
      if (!folders.results) return []

      // Encontrar subpasta do mês atual pelo título (ex: "Jun/2026")
      const subpasta = folders.results.find(b => {
        if (b.type !== 'child_page') return false
        const t = (b.child_page?.title || '').toLowerCase()
        return t.includes(mesAbrev) && t.includes(String(ano))
      })

      if (!subpasta) return []

      // Buscar chamados dentro da subpasta
      const chamadosData = await nGet(`blocks/${subpasta.id}/children`, { page_size: '50' })
      if (!chamadosData.results) return []

      return chamadosData.results
        .filter(b => b.type === 'child_page')
        .map(b => {
          const titulo = b.child_page?.title || ''
          const matchCliente = titulo.match(/–\s*(.+?)\s*[|]/)
          const matchMaq = titulo.match(/Máq\.?\s*([\w]+)/)
          const matchDesc = titulo.match(/Máq\.?\s*[\w]+\s*–\s*(.+)$/)
          const dataISO = (b.created_time || '').split('T')[0]
          const dataFmt = dataISO ? dataISO.split('-').reverse().join('/') : '–'
          return {
            pageId: b.id,
            titulo: titulo.replace(/🔧\s*Chamado Técnico\s*–\s*/,'').replace(/\\|/g,'|'),
            cliente: matchCliente?.[1]?.trim() || '–',
            maquina: matchMaq?.[1]?.trim() || '–',
            problema: matchDesc?.[1]?.trim() || '',
            data: dataFmt,
            dataISO,
          }
        }).sort((a,b) => b.dataISO.localeCompare(a.dataISO))
    } catch(e) {
      console.error('fetchChamados error:', e)
      return []
    }
  }

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const [youngData, milData, ch] = await Promise.all([
        fetchPdv(PAGE_IDS.pdv806477),
        fetchPdv(PAGE_IDS.pdv807542),
        fetchChamados(),
      ])
      setPdvYoung(youngData.text); setPdvYoungEdit(youngData.editDate)
      setPdv1050(milData.text); setPdv1050Edit(milData.editDate)
      setChamados(ch)
      setSyncOk(true)
      setLastSync(new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}))
    } catch { setSyncOk(false) }
    finally { setSyncing(false); setLoading(false) }
  },[])

  useEffect(()=>{
    sync()
    const t = setInterval(sync,10*60*1000)
    return ()=>clearInterval(t)
  },[sync])

  const savePdv = async (pdv, text) => {
    const pageId = pdv === 'young' ? PAGE_IDS.pdv806477 : PAGE_IDS.pdv807542

    // 1. Apagar blocos existentes (arquivo via PATCH)
    try {
      const existing = await nGet(`blocks/${pageId}/children`, { page_size: '50' })
      if (existing.results && existing.results.length > 0) {
        for (const b of existing.results) {
          await nPatch(`blocks/${b.id}`, { archived: true })
        }
      }
    } catch(e) { console.error('Erro ao apagar blocos:', e) }

    // 2. Criar novos blocos (PATCH é o método correto na API Notion)
    if (text && text.trim()) {
      const linhas = text.split('\n').filter(Boolean)
      const children = linhas.map(l => ({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: l } }] }
      }))
      try {
        await nPatch(`blocks/${pageId}/children`, { children })
      } catch(e) { console.error('Erro ao guardar blocos:', e) }
    }

    // 3. Atualizar estado local
    const nowEdit = new Date().toISOString().split('T')[0]
    if (pdv === 'young') { setPdvYoung(text); setPdvYoungEdit(nowEdit) }
    else { setPdv1050(text); setPdv1050Edit(nowEdit) }
  }


  // Se estiver a ver detalhe de fresco
  if(frescoAtivo) {
    return (
      <div style={S.app}>
        <header style={S.header}>
          <div style={S.logo}>
            <div style={S.logoMain}>ROTA 606 · MYBREAK DELTA CAFÉS</div>
            <div style={S.logoSub}>by Leonardo Silva</div>
          </div>
          <SyncBar lastSync={lastSync} syncing={syncing} ok={syncOk} onSync={() => window.location.reload()}/>
        </header>
        <main style={S.main}>
          <FrescoDetalhe fresco={frescoAtivo} onBack={()=>setFrescoAtivo(null)}/>
        </main>
      </div>
    )
  }

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.logo}>
          <div style={S.logoMain}>ROTA 606 · MYBREAK DELTA CAFÉS</div>
          <div style={S.logoSub}>by Leonardo Silva</div>
        </div>
        <SyncBar lastSync={lastSync} syncing={syncing} ok={syncOk} onSync={() => window.location.reload()}/>
      </header>

      <div style={{position:'relative',background:'#161B22',borderBottom:'1px solid #21262D'}}>
        <nav style={S.nav}>
          {TABS.map((t,i)=>(
            <button key={i} style={S.navBtn(tab===i)} onClick={()=>setTab(i)}>
              <span>{t}</span>
              <span style={{display:'block',fontSize:'10px'}}>{TAB_LABELS[i]}</span>
            </button>
          ))}
        </nav>
        {/* Gradiente direita — indica scroll */}
        <div style={{position:'absolute',right:0,top:0,bottom:0,width:'32px',background:'linear-gradient(to right, transparent, #161B22)',pointerEvents:'none'}}/>
        {/* Gradiente esquerda */}
        <div style={{position:'absolute',left:0,top:0,bottom:0,width:'16px',background:'linear-gradient(to left, transparent, #161B22)',pointerEvents:'none'}}/>
        {/* Barra de scroll indicator */}
        <div style={{display:'flex',justifyContent:'center',gap:'4px',padding:'3px 0',background:'#161B22'}}>
          {TABS.map((_,i) => (
            <div key={i} onClick={()=>setTab(i)} style={{width: tab===i ? '16px' : '4px',height:'3px',borderRadius:'2px',background: tab===i ? '#10D9A0' : '#30363D',transition:'all 0.2s',cursor:'pointer'}}/>
          ))}
        </div>
      </div>

      <main style={S.main}>
        {tab===0 && <TabInicio chamados={chamados} loading={loading} onVerFresco={setFrescoAtivo} onVerAT={()=>setTab(1)} pdvYoung={pdvYoung} pdv1050={pdv1050} pdvYoungEdit={pdvYoungEdit} pdv1050Edit={pdv1050Edit}/>}
        {tab===1 && <TabChamados chamados={chamados} loading={loading}/>}
        {tab===2 && <TabBAVidros pdvYoung={pdvYoung} pdv1050={pdv1050} onSave={savePdv}/>}
        {tab===3 && <TabFrescos onVerFresco={setFrescoAtivo}/>}
        {tab===4 && <TabProdutos/>}
        {tab===5 && <TabRota onVerFresco={setFrescoAtivo}/>}
        {tab===6 && <TabInventario/>}
        {tab===7 && <TabGestaoRota/>}
        {tab===8 && <TabPonto/>}
        {tab===9 && <TabPiquete/>}
      </main>
    </div>
  )
}

// ── ABA GESTÃO DA ROTA ────────────────────────────────────────
function TabGestaoRota() {
  const [folderId, setFolderId] = useState(() => { try { return localStorage.getItem('gestao_folder_id') || null } catch { return null } })
  const [history, setHistory] = useState([])
  const [aberto, setAberto] = useState(null)
  const [textoAberto, setTextoAberto] = useState(null)
  const [carregandoHist, setCarregandoHist] = useState(false)
  const [carregandoTexto, setCarregandoTexto] = useState(false)
  const [textoRelatorio, setTextoRelatorio] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [editTemp, setEditTemp] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [confirmApagar, setConfirmApagar] = useState(null)
  const [tituloRelatorio, setTituloRelatorio] = useState('')
  const [ultimoSalvo, setUltimoSalvo] = useState(null)

  const getFolder = useCallback(async () => {
    let fid = folderId
    if (!fid) {
      try {
        const ch = await nGet(`blocks/${PAGE_IDS.rotaRoot}/children`, { page_size: 100 })
        const ex = ch.results?.find(b => b.type === 'child_page' && b.child_page?.title === '📊 Gestão da Rota — Rota 606')
        fid = ex ? ex.id : (await nPost('pages', {
          parent: { page_id: PAGE_IDS.rotaRoot },
          icon: { type: 'emoji', emoji: '📊' },
          properties: { title: { title: [{ type: 'text', text: { content: '📊 Gestão da Rota — Rota 606' } }] } }
        })).id
        localStorage.setItem('gestao_folder_id', fid)
        setFolderId(fid)
      } catch { return null }
    }
    return fid
  }, [folderId])

  const loadHistory = useCallback(async (fid) => {
    if (!fid) return
    setCarregandoHist(true)
    try {
      const res = await nGet(`blocks/${fid}/children`, { page_size: 50 })
      setHistory((res.results || []).filter(b => b.type === 'child_page').map(b => ({ id: b.id, title: b.child_page?.title || 'Análise' })).reverse())
    } finally { setCarregandoHist(false) }
  }, [])

  useEffect(() => { getFolder().then(f => loadHistory(f)) }, [])

  const salvarNoNotion = async () => {
    if (!textoRelatorio.trim()) return
    setGuardando(true)
    try {
      const fid = await getFolder()
      if (!fid) throw new Error('Pasta não encontrada')
      const agora = new Date().toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
      const titulo = tituloRelatorio.trim() || `📊 Gestão Rota — ${agora}`
      const linhas = textoRelatorio.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n')
      const children = linhas.map(l => ({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: l.slice(0, 1900) } }] }
      }))
      const novaPagina = await nPost('pages', {
        parent: { page_id: fid },
        icon: { type: 'emoji', emoji: '📊' },
        properties: { title: { title: [{ type: 'text', text: { content: titulo } }] } },
        children: children.slice(0, 100)
      })
      await loadHistory(fid)
      if (novaPagina?.id) { setUltimoSalvo(novaPagina.id); setAberto(novaPagina.id) }
      setTextoRelatorio('')
      setTituloRelatorio('')
    } catch(err) { alert('Erro ao guardar: ' + err.message) }
    finally { setGuardando(false) }
  }

  const abrirItem = async (pageId) => {
    if (aberto === pageId) { setAberto(null); setTextoAberto(null); return }
    setAberto(pageId)
    setCarregandoTexto(true)
    setTextoAberto(null)
    try {
      const res = await nGet(`blocks/${pageId}/children`, { page_size: 100 })
      const blocks = res.results || []
      const texto = blocks.filter(b => b.type === 'paragraph').map(b => b.paragraph?.rich_text?.map(t=>t.plain_text).join('') || '').join('\n')
      setTextoAberto({ texto })
    } catch { setTextoAberto({ texto: 'Erro ao carregar conteúdo.' }) }
    finally { setCarregandoTexto(false) }
  }

  const guardarEdit = async () => {
    if (!editando) return
    setGuardandoEdit(true)
    try {
      const res = await nGet(`blocks/${editando.pageId}/children`, { page_size: 100 })
      const blocks = (res.results || []).filter(b => b.type === 'paragraph')
      for (const b of blocks) { await nPatch(`blocks/${b.id}`, { archived: true }) }
      const linhas = editTemp.split('\n')
      const children = linhas.map(l => ({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: l.slice(0, 1900) } }] }
      }))
      await nPatch(`blocks/${editando.pageId}/children`, { children: children.slice(0, 100) })
      setTextoAberto(prev => ({ ...prev, texto: editTemp }))
      setEditando(null)
    } finally { setGuardandoEdit(false) }
  }

  const apagarItem = async (pageId) => {
    try { await nPatch(`pages/${pageId}`, { archived: true }) } catch {}
    setHistory(prev => prev.filter(h => h.id !== pageId))
    if (aberto === pageId) { setAberto(null); setTextoAberto(null) }
    setConfirmApagar(null)
  }

  return (
    <div>
      {editando && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',padding:'20px',maxWidth:'500px',width:'100%'}}>
            <div style={{fontWeight:600,color:C.text,marginBottom:'10px'}}>✏️ Editar Análise</div>
            <textarea value={editTemp} onChange={e=>setEditTemp(e.target.value)} rows={10}
              style={{width:'100%',background:C.bg,border:'1px solid #30363D',borderRadius:'6px',color:C.text,padding:'10px',fontSize:'13px',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit',marginBottom:'10px'}}/>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setEditando(null)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={guardarEdit} disabled={guardandoEdit} style={{flex:1,background:C.accent,color:'#0D1117',border:'none',borderRadius:'6px',padding:'10px',fontWeight:700,cursor:'pointer',fontSize:'13px'}}>
                {guardandoEdit ? 'A guardar…' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmApagar && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:C.card,border:'1px solid #F8514944',borderRadius:'12px',padding:'20px',maxWidth:'300px',width:'100%',textAlign:'center'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>🗑️</div>
            <div style={{fontWeight:600,color:C.text,marginBottom:'6px'}}>Apagar análise?</div>
            <div style={{color:C.muted,fontSize:'13px',marginBottom:'16px'}}>Esta análise será apagada do Notion e do dashboard.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setConfirmApagar(null)} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'10px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={()=>apagarItem(confirmApagar)} style={{flex:1,background:C.danger,color:'#fff',border:'none',borderRadius:'6px',padding:'10px',fontWeight:700,cursor:'pointer',fontSize:'13px'}}>Apagar</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <div style={S.cardTitle}>📊 Gestão da Rota 606</div>
        <div style={{color:C.muted,fontSize:'13px',marginBottom:'12px'}}>Cole aqui o relatório de gestão de rota gerado pelo Claude e guarde no Notion.</div>
        <textarea value={tituloRelatorio} onChange={e=>setTituloRelatorio(e.target.value)} rows={3}
          placeholder="Título (ex: Gestão Rota — Semana 26)"
          style={{...S.input,resize:'none',fontFamily:'inherit',lineHeight:1.5,marginBottom:'8px'}}/>
        <textarea value={textoRelatorio} onChange={e=>setTextoRelatorio(e.target.value)} rows={8}
          placeholder="Cole aqui o relatório de gestão de rota…"
          style={{...S.input,resize:'vertical',fontFamily:'inherit',lineHeight:1.6,marginBottom:'10px'}}/>
        <button onClick={salvarNoNotion} disabled={!textoRelatorio.trim() || guardando}
          style={{...S.btn,width:'100%',opacity:(!textoRelatorio.trim()||guardando)?0.5:1}}>
          {guardando ? 'A guardar no Notion…' : '💾 Salvar no Notion'}
        </button>
      </div>
      <div style={{...S.card,border:`1px solid ${C.accent}44`,background:`${C.accent}08`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <div style={{...S.cardTitle,marginBottom:0,color:C.accent}}>🗂️ Análises Guardadas no Notion</div>
          {history.length > 0 && <span style={S.badge(C.accent)}>{history.length}</span>}
        </div>
        {carregandoHist ? (
          <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'20px'}}>A carregar…</div>
        ) : history.length === 0 ? (
          <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'20px'}}>Sem análises guardadas ainda.<br/>Cole um relatório acima e clique em Salvar.</div>
        ) : history.map(item => (
          <div key={item.id} style={{borderBottom:`1px solid ${C.border}`,background:ultimoSalvo===item.id?`${C.accent}0a`:'transparent',borderRadius:'6px',marginBottom:'2px',transition:'background 0.3s'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'8px',padding:'10px 6px',cursor:'pointer'}} onClick={()=>abrirItem(item.id)}>
              <div style={{flex:1}}>
                <div style={{fontWeight:aberto===item.id?700:500,color:aberto===item.id?C.accent:C.text,fontSize:'13px',lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{item.title}</div>
                {ultimoSalvo===item.id && <div style={{color:C.accent,fontSize:'10px',marginTop:'3px',fontWeight:600}}>✅ Guardado agora</div>}
              </div>
              <div style={{display:'flex',gap:'4px',flexShrink:0,marginTop:'2px'}}>
                <button onClick={e=>{e.stopPropagation();abrirItem(item.id).then(()=>{if(textoAberto)setEditando({pageId:item.id})})}}
                  style={{background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'4px',padding:'4px 8px',cursor:'pointer',fontSize:'11px'}}>✏️</button>
                <button onClick={e=>{e.stopPropagation();setConfirmApagar(item.id)}}
                  style={{background:'transparent',border:'1px solid #F8514944',color:C.danger,borderRadius:'4px',padding:'4px 8px',cursor:'pointer',fontSize:'11px'}}>🗑</button>
                <span style={{color:C.muted,fontSize:'12px',padding:'4px'}}>{aberto===item.id?'▲':'▼'}</span>
              </div>
            </div>
            {aberto === item.id && (
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'14px',marginBottom:'10px',marginTop:'4px'}}>
                {carregandoTexto && !textoAberto ? (
                  <div style={{color:C.muted,fontSize:'13px',textAlign:'center',padding:'12px'}}>A carregar…</div>
                ) : textoAberto ? (
                  <>
                    <div style={{display:'flex',justifyContent:'flex-end',gap:'6px',marginBottom:'8px'}}>
                      <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(item.title+'\n\n'+textoAberto.texto)}`,'_blank')}
                        style={{background:'#25D366',border:'none',color:'#fff',borderRadius:'4px',padding:'4px 10px',cursor:'pointer',fontSize:'11px',fontWeight:600}}>📤 WhatsApp</button>
                      <button onClick={()=>{setEditTemp(textoAberto.texto);setEditando({pageId:item.id})}}
                        style={{background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'4px',padding:'4px 10px',cursor:'pointer',fontSize:'11px'}}>✏️ Editar</button>
                    </div>
                    <pre style={{color:C.text,fontSize:'13px',lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0,fontFamily:'inherit'}}>{textoAberto.texto}</pre>
                  </>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
// ── ABA PIQUETE ───────────────────────────────────────────────
function TabPiquete() {
  const [pageId, setPageId] = useState(() => { try { return localStorage.getItem('piquete_page_id') || null } catch { return null } })
  const [carregando, setCarregando] = useState(true)
  const [rota, setRota] = useState('')
  const [rotaBlockId, setRotaBlockId] = useState(null)
  const [editandoRota, setEditandoRota] = useState(false)
  const [rotaTemp, setRotaTemp] = useState('')
  const [confirmExcluir, setConfirmExcluir] = useState(false)
  const [data, setData] = useState('')
  const [horas, setHoras] = useState('')
  const [registos, setRegistos] = useState([])
  const [confirmExcluirHora, setConfirmExcluirHora] = useState(null)
  const [copiado, setCopiado] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const getPage = useCallback(async () => {
    let pid = pageId
    if (!pid) {
      try {
        const ch = await nGet(`blocks/${PAGE_IDS.rotaRoot}/children`, { page_size: 100 })
        const ex = ch.results?.find(b => b.type === 'child_page' && b.child_page?.title === '🚨 Piquete — Rota 606')
        if (ex) {
          pid = ex.id
        } else {
          const cr = await nPost('pages', {
            parent: { page_id: PAGE_IDS.rotaRoot },
            icon: { type: 'emoji', emoji: '🚨' },
            properties: { title: { title: [{ type: 'text', text: { content: '🚨 Piquete — Rota 606' } }] } },
            children: [
              { object:'block', type:'heading_2', heading_2:{ rich_text:[{ type:'text', text:{ content:'🗺️ Rota do Piquete' } }] } },
              { object:'block', type:'paragraph', paragraph:{ rich_text:[] } },
              { object:'block', type:'divider', divider:{} },
              { object:'block', type:'heading_2', heading_2:{ rich_text:[{ type:'text', text:{ content:'⏱️ Horas Trabalhadas' } }] } },
            ]
          })
          pid = cr.id
        }
        localStorage.setItem('piquete_page_id', pid)
        setPageId(pid)
      } catch { return null }
    }
    return pid
  }, [pageId])

  const carregarDados = useCallback(async (pid) => {
    if (!pid) return
    setCarregando(true)
    try {
      const res = await nGet(`blocks/${pid}/children`, { page_size: 100 })
      const blocks = res.results || []
      let rotaTxt = '', rotaBid = null, horasArr = []
      let modoRota = false, modoHoras = false, aguardaRota = false
      for (const b of blocks) {
        if (b.type === 'heading_2') {
          const txt = b.heading_2?.rich_text?.map(t=>t.plain_text).join('') || ''
          modoRota = txt.includes('Rota do Piquete')
          modoHoras = txt.includes('Horas Trabalhadas')
          aguardaRota = modoRota
          continue
        }
        if (b.type === 'divider') { modoRota = false; aguardaRota = false; continue }
        if (b.type === 'paragraph') {
          const txt = b.paragraph?.rich_text?.map(t=>t.plain_text).join('') || ''
          if (aguardaRota) { rotaTxt = txt; rotaBid = b.id; aguardaRota = false }
          else if (modoHoras && txt) {
            const parts = txt.split('|')
            if (parts.length >= 3) horasArr.push({ data: parts[0], horas: parts[1], id: parts[2], blockId: b.id })
          }
        }
      }
      setRota(rotaTxt)
      setRotaBlockId(rotaBid)
      setRegistos(horasArr)
    } finally { setCarregando(false) }
  }, [])

  useEffect(() => { getPage().then(pid => carregarDados(pid)) }, [])

  const guardarRota = async () => {
    if (!rotaBlockId) return
    setGuardando(true)
    try {
      await nPatch(`blocks/${rotaBlockId}`, { paragraph: { rich_text: rotaTemp ? [{ type:'text', text:{ content: rotaTemp } }] : [] } })
      setRota(rotaTemp)
      setEditandoRota(false)
    } finally { setGuardando(false) }
  }

  const excluirRota = async () => {
    if (!rotaBlockId) return
    setGuardando(true)
    try {
      await nPatch(`blocks/${rotaBlockId}`, { paragraph: { rich_text: [] } })
      setRota('')
      setConfirmExcluir(false)
    } finally { setGuardando(false) }
  }

  const adicionarHora = async () => {
    if (!data || !horas) return
    const pid = await getPage()
    if (!pid) return
    setGuardando(true)
    const id = Date.now().toString()
    const txt = `${data}|${horas}|${id}`
    try {
      await nPatch(`blocks/${pid}/children`, {
        children: [{ object:'block', type:'paragraph', paragraph:{ rich_text:[{ type:'text', text:{ content: txt } }] } }]
      })
      await carregarDados(pid)
      setData(''); setHoras('')
    } finally { setGuardando(false) }
  }

  const excluirHora = async (blockId) => {
    setGuardando(true)
    try {
      await nDelete(`blocks/${blockId}`)
      setRegistos(prev => prev.filter(r => r.blockId !== blockId))
      setConfirmExcluirHora(null)
    } finally { setGuardando(false) }
  }

  const textoWhatsApp = (r) => {
    const diaSemana = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long' })
    return `Horas trabalhadas no piquete de ${diaSemana}, Rota 606.\nData: ${r.data.split('-').reverse().join('/')}\nHoras: ${r.horas}`
  }

  const copiarTexto = (r) => {
    navigator.clipboard.writeText(textoWhatsApp(r))
    setCopiado(r.id)
    setTimeout(() => setCopiado(null), 2000)
  }

  const partilharWhatsApp = (r) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(textoWhatsApp(r))}`, '_blank')
  }

  const S2 = {
    section: { background:'#161B22', border:'1px solid #21262D', borderRadius:'10px', padding:'16px', marginBottom:'12px' },
    title: { fontWeight:600, fontSize:'14px', marginBottom:'12px', color:'#E6EDF3', display:'flex', alignItems:'center', gap:'8px' },
    rotaBox: { background:'#0D1117', borderRadius:'8px', padding:'14px', color:'#E6EDF3', fontSize:'13px', lineHeight:1.7, whiteSpace:'pre-wrap', minHeight:'60px', border:'1px solid #21262D' },
    row: { display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' },
    input: { background:'#0D1117', border:'1px solid #30363D', borderRadius:'6px', color:'#E6EDF3', padding:'8px 12px', fontSize:'13px', outline:'none' },
    btn: { background:'#10D9A0', color:'#0D1117', border:'none', borderRadius:'6px', padding:'8px 14px', fontWeight:600, cursor:'pointer', fontSize:'13px' },
    btnSm: { background:'transparent', border:'1px solid #30363D', color:'#8B949E', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'12px' },
    btnDanger: { background:'transparent', color:'#F85149', border:'1px solid #F8514944', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'12px' },
    btnWA: { background:'#25D366', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'12px', fontWeight:600 },
    tag: { background:'#21262D', borderRadius:'4px', padding:'2px 8px', fontSize:'11px', color:'#8B949E', display:'inline-block' },
  }

  if (carregando) {
    return (
      <div style={{...S2.section,textAlign:'center',padding:'40px'}}>
        <div style={{fontSize:'28px',marginBottom:'10px'}}>🔄</div>
        <div style={{color:'#8B949E',fontSize:'13px'}}>A sincronizar com o Notion…</div>
      </div>
    )
  }

  return (
    <div>
      {/* Popup excluir rota */}
      {confirmExcluir && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000aa',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:'#161B22',border:'1px solid #F8514944',borderRadius:'12px',padding:'24px',maxWidth:'300px',width:'100%'}}>
            <div style={{fontSize:'24px',textAlign:'center',marginBottom:'10px'}}>⚠️</div>
            <div style={{fontWeight:600,textAlign:'center',color:'#E6EDF3',marginBottom:'6px'}}>Excluir anotação?</div>
            <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',marginBottom:'18px'}}>A rota do piquete será apagada do Notion.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setConfirmExcluir(false)} style={{...S2.btnSm,flex:1,padding:'10px'}}>Cancelar</button>
              <button onClick={excluirRota} disabled={guardando} style={{...S2.btnDanger,flex:1,padding:'10px',fontWeight:600}}>{guardando?'…':'Excluir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup excluir hora */}
      {confirmExcluirHora && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000aa',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:'#161B22',border:'1px solid #F8514944',borderRadius:'12px',padding:'24px',maxWidth:'300px',width:'100%'}}>
            <div style={{fontSize:'24px',textAlign:'center',marginBottom:'10px'}}>⚠️</div>
            <div style={{fontWeight:600,textAlign:'center',color:'#E6EDF3',marginBottom:'6px'}}>Excluir registo?</div>
            <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',marginBottom:'18px'}}>O registo de horas será apagado do Notion.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setConfirmExcluirHora(null)} style={{...S2.btnSm,flex:1,padding:'10px'}}>Cancelar</button>
              <button onClick={() => excluirHora(confirmExcluirHora)} disabled={guardando} style={{...S2.btnDanger,flex:1,padding:'10px',fontWeight:600}}>{guardando?'…':'Excluir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Rota do Piquete */}
      <div style={S2.section}>
        <div style={S2.title}>🚨 Rota do Piquete</div>
        {editandoRota ? (
          <>
            <textarea value={rotaTemp} onChange={e => setRotaTemp(e.target.value)} rows={6}
              style={{...S2.input, width:'100%', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'10px'}}
              placeholder="Escreve aqui a rota do piquete…"/>
            <div style={S2.row}>
              <button style={S2.btn} onClick={guardarRota} disabled={guardando}>{guardando?'A guardar…':'💾 Guardar'}</button>
              <button style={S2.btnSm} onClick={() => setEditandoRota(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            {rota ? <div style={S2.rotaBox}>{rota}</div> : (
              <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',padding:'24px 0'}}>Sem rota definida — clica em editar para adicionar</div>
            )}
            <div style={{...S2.row, marginTop:'12px'}}>
              <button style={S2.btnSm} onClick={() => { setRotaTemp(rota); setEditandoRota(true) }}>✏️ Editar</button>
              {rota && <button style={S2.btnDanger} onClick={() => setConfirmExcluir(true)}>🗑 Excluir</button>}
            </div>
          </>
        )}
      </div>

      {/* Horas Trabalhadas */}
      <div style={S2.section}>
        <div style={S2.title}>⏱️ Horas Trabalhadas</div>
        <div style={{background:'#0D1117',borderRadius:'8px',padding:'12px',marginBottom:'14px',border:'1px solid #21262D'}}>
          <div style={{color:'#8B949E',fontSize:'11px',fontWeight:600,marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Novo registo</div>
          <div style={{...S2.row, marginBottom:'8px'}}>
            <input type="date" value={data} onChange={e => setData(e.target.value)} style={{...S2.input, flex:1, minWidth:'130px'}}/>
            <input type="text" value={horas} onChange={e => setHoras(e.target.value)} placeholder="Ex: 8h30"
              style={{...S2.input, width:'90px'}} onKeyDown={e => e.key === 'Enter' && adicionarHora()}/>
            <button style={S2.btn} onClick={adicionarHora} disabled={!data || !horas || guardando}>
              {guardando ? '…' : '+ Adicionar'}
            </button>
          </div>
        </div>

        {registos.length === 0 ? (
          <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',padding:'16px 0'}}>Sem registos de horas</div>
        ) : (
          registos.map((r) => {
            const diaSemana = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long' })
            const dataFmt = r.data.split('-').reverse().join('/')
            return (
              <div key={r.blockId} style={{background:'#0D1117',borderRadius:'8px',padding:'12px',marginBottom:'8px',border:'1px solid #21262D'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <div>
                    <span style={{fontWeight:600,color:'#E6EDF3',fontSize:'13px',textTransform:'capitalize'}}>{diaSemana}</span>
                    <span style={{...S2.tag,marginLeft:'8px'}}>{dataFmt}</span>
                    <span style={{...S2.tag,marginLeft:'4px',color:'#10D9A0',background:'#10D9A022'}}>{r.horas}</span>
                  </div>
                  <button style={S2.btnDanger} onClick={() => setConfirmExcluirHora(r.blockId)}>🗑</button>
                </div>
                <div style={{background:'#161B22',borderRadius:'6px',padding:'10px',fontSize:'12px',color:'#8B949E',lineHeight:1.7,marginBottom:'10px',fontFamily:'monospace'}}>
                  Horas trabalhadas no piquete de {diaSemana}, Rota 606.<br/>
                  Data: {dataFmt}<br/>
                  Horas: {r.horas}
                </div>
                <div style={S2.row}>
                  <button style={S2.btnSm} onClick={() => copiarTexto(r)}>
                    {copiado === r.id ? '✅ Copiado!' : '📋 Copiar'}
                  </button>
                  <button style={S2.btnWA} onClick={() => partilharWhatsApp(r)}>📲 Partilhar no WhatsApp</button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function App() {
  return <Dashboard />
}
