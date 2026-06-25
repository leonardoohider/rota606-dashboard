import { useState, useEffect, useCallback } from 'react'

const PAGE_IDS = {
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
          {listaFiltrada.length > 0 && <span style={S.badge(C.accent)}>{listaFiltrada.length}</span>}
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
  const [estado, setEstado] = useState('idle') // idle | loading | resultado | erro
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [nomeFile, setNomeFile] = useState('')

  const processarPDF = async (file) => {
    setEstado('loading')
    setNomeFile(file.name)
    setResultado(null)
    setErro('')

    try {
      // Converter PDF para base64
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.onerror = () => rej(new Error('Erro ao ler ficheiro'))
        reader.readAsDataURL(file)
      })

      const listaMaquinas = TODAS_MAQUINAS.map(m => `${m.pdv} (${m.cliente} — ${m.modelo})`).join('\n')

      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64,
          maxTokens: 2000,
          prompt: `És um assistente de gestão de rota de máquinas vending.

Esta é a lista COMPLETA de máquinas da Rota 606:
${listaMaquinas}

Analisa o ficheiro PDF enviado (relatório de inventário/levantamento) e identifica quais máquinas JÁ foram feitas/registadas no PDF.

Responde APENAS em JSON válido, sem texto antes ou depois, neste formato exato:
{
  "feitas": ["811865", "811866"],
  "em_falta": ["809403", "806066"],
  "total_feitas": 10,
  "total_em_falta": 30,
  "resumo": "Breve descrição do que encontraste no PDF"
}`
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Erro da API (${response.status}): ${errText.slice(0,200)}`)
      }
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      const texto = data.text || ''
      if (!texto) throw new Error('Resposta vazia da API.')
      const clean = texto.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      // Enriquecer com dados das máquinas
      const feitas = parsed.feitas.map(pdv => TODAS_MAQUINAS.find(m => m.pdv === pdv)).filter(Boolean)
      const emFalta = parsed.em_falta.map(pdv => TODAS_MAQUINAS.find(m => m.pdv === pdv)).filter(Boolean)

      setResultado({ ...parsed, feitasDetalhes: feitas, emFaltaDetalhes: emFalta })
      setEstado('resultado')
    } catch(err) {
      setErro('Erro ao processar o ficheiro: ' + err.message)
      setEstado('erro')
    }
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') processarPDF(file)
    else if (file) setErro('Por favor envia um ficheiro PDF.')
  }

  // Agrupar por cliente
  function agruparPorCliente(maquinas) {
    return maquinas.reduce((acc, m) => {
      if (!acc[m.cliente]) acc[m.cliente] = []
      acc[m.cliente].push(m)
      return acc
    }, {})
  }

  return (
    <div>
      {/* Upload */}
      <div style={S.card}>
        <div style={S.cardTitle}>📋 Inventário e Levantamento — Rota 606</div>
        <div style={{color:C.muted,fontSize:'13px',marginBottom:'16px'}}>
          Quais máquinas ainda faltam fazer levantamento?
        </div>

        <label style={{
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          border:`2px dashed ${C.accent}44`, borderRadius:'10px', padding:'32px 16px',
          cursor:'pointer', background:`${C.accent}08`, transition:'all 0.2s'
        }}>
          <input type="file" accept=".pdf" onChange={onFileChange} style={{display:'none'}}/>
          <div style={{fontSize:'32px',marginBottom:'8px'}}>📄</div>
          <div style={{fontWeight:600,color:C.accent,fontSize:'14px'}}>Clica para enviar o PDF</div>
          <div style={{color:C.muted,fontSize:'12px',marginTop:'4px'}}>Ficheiro de inventário / levantamento</div>
        </label>

        {nomeFile && estado !== 'idle' && (
          <div style={{color:C.muted,fontSize:'12px',marginTop:'8px',textAlign:'center'}}>📎 {nomeFile}</div>
        )}
      </div>

      {/* Loading */}
      {estado === 'loading' && (
        <div style={{...S.card,textAlign:'center',padding:'32px'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>🔍</div>
          <div style={{fontWeight:600,color:C.text,marginBottom:'8px'}}>A analisar o ficheiro…</div>
          <div style={{color:C.muted,fontSize:'13px'}}>A IA está a ler o PDF e a comparar com as máquinas da Rota 606</div>
        </div>
      )}

      {/* Erro */}
      {estado === 'erro' && (
        <div style={{...S.card,border:`1px solid ${C.danger}44`,background:`${C.danger}11`}}>
          <div style={{color:C.danger,fontWeight:600,marginBottom:'4px'}}>❌ Erro</div>
          <div style={{color:C.muted,fontSize:'13px'}}>{erro}</div>
        </div>
      )}

      {/* Resultado */}
      {estado === 'resultado' && resultado && (
        <>
          {/* Resumo */}
          <div style={{...S.card,borderColor:`${C.accent}44`}}>
            <div style={S.cardTitle}>📊 Resumo da Análise</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
              <div style={{background:`${C.accent}15`,borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:'28px',fontWeight:700,color:C.accent}}>{resultado.total_feitas}</div>
                <div style={{color:C.muted,fontSize:'12px'}}>✅ Feitas</div>
              </div>
              <div style={{background:`${C.danger}15`,borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:'28px',fontWeight:700,color:C.danger}}>{resultado.total_em_falta}</div>
                <div style={{color:C.muted,fontSize:'12px'}}>⏳ Em falta</div>
              </div>
            </div>
            {resultado.resumo && (
              <div style={{color:C.muted,fontSize:'13px',background:C.bg,padding:'10px',borderRadius:'6px'}}>{resultado.resumo}</div>
            )}
          </div>

          {/* Máquinas em falta */}
          {resultado.emFaltaDetalhes?.length > 0 && (
            <div style={S.card}>
              <div style={{...S.cardTitle,color:C.danger}}>⏳ Máquinas em Falta ({resultado.emFaltaDetalhes.length})</div>
              {Object.entries(agruparPorCliente(resultado.emFaltaDetalhes)).map(([cliente, maquinas]) => (
                <div key={cliente} style={{marginBottom:'12px'}}>
                  <div style={{color:C.accent,fontWeight:600,fontSize:'13px',marginBottom:'6px'}}>{cliente}</div>
                  {maquinas.map((m,i) => (
                    <div key={i} style={{display:'flex',gap:'8px',alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${C.border}`}}>
                      <span style={{...S.badge(C.danger)}}>{m.pdv}</span>
                      <span style={{color:C.text,fontSize:'13px'}}>{m.modelo}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Máquinas feitas */}
          {resultado.feitasDetalhes?.length > 0 && (
            <div style={S.card}>
              <div style={{...S.cardTitle,color:C.accent}}>✅ Já Feitas ({resultado.feitasDetalhes.length})</div>
              {Object.entries(agruparPorCliente(resultado.feitasDetalhes)).map(([cliente, maquinas]) => (
                <div key={cliente} style={{marginBottom:'10px'}}>
                  <div style={{color:C.muted,fontWeight:600,fontSize:'12px',marginBottom:'4px'}}>{cliente}</div>
                  <div>{maquinas.map((m,i) => (
                    <span key={i} style={{...S.tag,background:`${C.accent}15`,color:C.accent,margin:'2px'}}>{m.pdv} {m.modelo}</span>
                  ))}</div>
                </div>
              ))}
            </div>
          )}

          {/* Novo ficheiro */}
          <div style={{textAlign:'center',marginTop:'8px'}}>
            <button style={S.btnSm} onClick={() => { setEstado('idle'); setResultado(null); setNomeFile('') }}>
              📄 Enviar outro ficheiro
            </button>
          </div>
        </>
      )}
    </div>
  )
}


// ── LOGIN ─────────────────────────────────────────────────────
const LOGO_VDLE = 'data:image/png;base64,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'

// ── APP PRINCIPAL ─────────────────────────────────────────────
const TABS = ['🏠','📋','📦','🥐','🛒','🗺️','📋','📊','🚨']
const TAB_LABELS = ['Início','A.T.','BA Vidros','Config. Frescos','Frescos','Rota','Inventário','Gestão Rota','Piquete']

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
          <SyncBar lastSync={lastSync} syncing={syncing} ok={syncOk} onSync={sync}/>
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
        <SyncBar lastSync={lastSync} syncing={syncing} ok={syncOk} onSync={sync}/>
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
        {tab===8 && <TabPiquete/>}
      </main>
    </div>
  )
}

// ── ABA GESTÃO DA ROTA ────────────────────────────────────────
function TabGestaoRota() {
  const [estado, setEstado] = useState(() => {
    try { return localStorage.getItem('gestao_estado') || 'idle' } catch { return 'idle' }
  })
  const [analise, setAnalise] = useState(() => {
    try { const d = localStorage.getItem('gestao_analise'); return d ? JSON.parse(d) : null } catch { return null }
  })
  const [erro, setErro] = useState('')
  const [nomeFile, setNomeFile] = useState(() => {
    try { return localStorage.getItem('gestao_ficheiro') || '' } catch { return '' }
  })
  const [confirmApagar, setConfirmApagar] = useState(false)

  const apagarDados = () => {
    localStorage.removeItem('gestao_estado')
    localStorage.removeItem('gestao_analise')
    localStorage.removeItem('gestao_ficheiro')
    setEstado('idle'); setAnalise(null); setNomeFile(''); setConfirmApagar(false)
  }

  const processarPDF = async (file) => {
    setEstado('loading')
    setNomeFile(file.name)
    setAnalise(null)
    setErro('')

    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.onerror = () => rej(new Error('Erro ao ler ficheiro'))
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64,
          maxTokens: 4000,
          prompt: `És um analista de gestão de rota de máquinas vending especializado. Analisa este ficheiro PDF da Rota 606.

Extrai TODOS os dados de abastecimento, devoluções e danificados da Rota 606.

Responde APENAS em JSON válido sem texto antes ou depois:
{
  "periodo": "período do relatório ex: 01/06 a 07/06/2026",
  "resumo_geral": {
    "total_abastecido": 0,
    "total_devolvido": 0,
    "total_danificado": 0,
    "taxa_quebra_percent": 0.0,
    "valor_quebra_estimado": "€0"
  },
  "top_produtos": [
    {"nome": "Produto X", "vendas": 0, "devolucoes": 0, "danificados": 0, "quebra_percent": 0.0, "status": "AUMENTAR|OK|REDUZIR|REVER"}
  ],
  "por_cliente": [
    {"cliente": "Nome", "maquina": "PDV", "abastecido": 0, "devolvido": 0, "danificado": 0, "quebra_percent": 0.0}
  ],
  "categorias": [
    {"categoria": "Doces", "total": 0, "percentagem": 0.0},
    {"categoria": "Salgados", "total": 0, "percentagem": 0.0},
    {"categoria": "Bebidas", "total": 0, "percentagem": 0.0}
  ],
  "sugestoes_frescos": [
    {"produto": "Nome", "acao": "MANTER|AUMENTAR|REDUZIR|SUBSTITUIR", "motivo": "Explicação curta"}
  ],
  "alertas": ["Alerta 1", "Alerta 2"],
  "conclusao": "Análise resumida em 2-3 frases simples"
}`
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Erro da API (${response.status}): ${errText.slice(0,200)}`)
      }
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      const texto = data.text || ''
      if (!texto) throw new Error('Resposta vazia da API.')
      const clean = texto.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setAnalise(parsed)
      setEstado('resultado')
      try {
        localStorage.setItem('gestao_analise', JSON.stringify(parsed))
        localStorage.setItem('gestao_estado', 'resultado')
        localStorage.setItem('gestao_ficheiro', file.name)
      } catch {}
    } catch(err) {
      setErro('Erro ao processar: ' + err.message)
      setEstado('erro')
    }
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file?.type === 'application/pdf') processarPDF(file)
    else if (file) setErro('Por favor envia um ficheiro PDF.')
  }

  // ── Mini gráfico de barras SVG
  function GraficoBarras({dados, titulo}) {
    if (!dados?.length) return null
    const max = Math.max(...dados.map(d => d.valor))
    const cores = ['#10D9A0','#3FB950','#58A6FF','#E3A340','#F85149','#A371F7','#79C0FF','#56D364']
    return (
      <div style={{marginBottom:'16px'}}>
        <div style={{fontWeight:600,fontSize:'13px',color:'#E6EDF3',marginBottom:'10px'}}>{titulo}</div>
        {dados.slice(0,8).map((d,i) => (
          <div key={i} style={{marginBottom:'8px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
              <span style={{fontSize:'11px',color:'#8B949E',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.label}</span>
              <span style={{fontSize:'11px',color:'#E6EDF3',fontWeight:600}}>{d.valor}{d.sufixo||''}</span>
            </div>
            <div style={{background:'#21262D',borderRadius:'4px',height:'8px',overflow:'hidden'}}>
              <div style={{background:cores[i%cores.length],height:'100%',width:`${max>0?(d.valor/max*100):0}%`,transition:'width 0.4s'}}/>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Gráfico pizza SVG
  function GraficoPizza({dados, titulo}) {
    if (!dados?.length) return null
    const total = dados.reduce((a,d) => a + (d.percentagem||0), 0)
    const cores = ['#10D9A0','#58A6FF','#E3A340','#F85149','#A371F7','#56D364']
    let angulo = -90
    const raio = 60, cx = 80, cy = 80
    const segmentos = dados.map((d,i) => {
      const graus = (d.percentagem / (total||1)) * 360
      const rad1 = (angulo * Math.PI) / 180
      const rad2 = ((angulo + graus) * Math.PI) / 180
      const x1 = cx + raio * Math.cos(rad1)
      const y1 = cy + raio * Math.sin(rad1)
      const x2 = cx + raio * Math.cos(rad2)
      const y2 = cy + raio * Math.sin(rad2)
      const bigArc = graus > 180 ? 1 : 0
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${raio} ${raio} 0 ${bigArc} 1 ${x2} ${y2} Z`
      angulo += graus
      return { path, cor: cores[i%cores.length], label: d.categoria||d.label, pct: d.percentagem }
    })
    return (
      <div style={{marginBottom:'16px'}}>
        <div style={{fontWeight:600,fontSize:'13px',color:'#E6EDF3',marginBottom:'10px'}}>{titulo}</div>
        <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {segmentos.map((s,i) => <path key={i} d={s.path} fill={s.cor} stroke="#0D1117" strokeWidth="2"/>)}
          </svg>
          <div>
            {segmentos.map((s,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'5px'}}>
                <div style={{width:'10px',height:'10px',borderRadius:'2px',background:s.cor,flexShrink:0}}/>
                <span style={{fontSize:'12px',color:'#8B949E'}}>{s.label}</span>
                <span style={{fontSize:'12px',color:'#E6EDF3',fontWeight:600}}>{s.pct?.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statusCor = {'AUMENTAR':'#10D9A0','OK':'#3FB950','REDUZIR':'#E3A340','REVER':'#F85149','MANTER':'#58A6FF','SUBSTITUIR':'#F85149'}

  return (
    <div>
      {/* Upload */}
      <div style={{background:'#161B22',border:'1px solid #21262D',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
        <div style={{fontWeight:600,fontSize:'14px',marginBottom:'8px',color:'#E6EDF3',display:'flex',alignItems:'center',gap:'8px'}}>📊 Gestão da Rota 606</div>
        <div style={{color:'#8B949E',fontSize:'13px',marginBottom:'16px'}}>Envia o relatório semanal em PDF para análise completa de vendas, devoluções e quebras.</div>
        <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed #10D9A044',borderRadius:'10px',padding:'28px 16px',cursor:'pointer',background:'#10D9A008'}}>
          <input type="file" accept=".pdf" onChange={onFileChange} style={{display:'none'}}/>
          <div style={{fontSize:'28px',marginBottom:'6px'}}>📄</div>
          <div style={{fontWeight:600,color:'#10D9A0',fontSize:'13px'}}>Clica para enviar o PDF</div>
          {nomeFile && <div style={{color:'#8B949E',fontSize:'11px',marginTop:'4px'}}>📎 {nomeFile}</div>}
        </label>
      </div>

      {/* Loading */}
      {estado === 'loading' && (
        <div style={{background:'#161B22',border:'1px solid #21262D',borderRadius:'10px',padding:'32px',textAlign:'center',marginBottom:'12px'}}>
          <div style={{fontSize:'28px',marginBottom:'10px'}}>🔍</div>
          <div style={{fontWeight:600,color:'#E6EDF3',marginBottom:'6px'}}>A analisar o relatório…</div>
          <div style={{color:'#8B949E',fontSize:'13px'}}>A IA está a ler e a preparar a análise completa da Rota 606</div>
        </div>
      )}

      {/* Erro */}
      {estado === 'erro' && (
        <div style={{background:'#F8514911',border:'1px solid #F8514944',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
          <div style={{color:'#F85149',fontWeight:600,marginBottom:'4px'}}>❌ Erro</div>
          <div style={{color:'#8B949E',fontSize:'13px'}}>{erro}</div>
        </div>
      )}

      {/* Resultado */}
      {estado === 'resultado' && analise && (
        <>
          {/* Resumo geral */}
          <div style={{background:'#161B22',border:'1px solid #10D9A044',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
            <div style={{fontWeight:600,fontSize:'14px',marginBottom:'12px',color:'#E6EDF3'}}>📅 {analise.periodo}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
              {[
                {label:'Abastecido',valor:analise.resumo_geral?.total_abastecido,cor:'#10D9A0'},
                {label:'Devolvido',valor:analise.resumo_geral?.total_devolvido,cor:'#E3A340'},
                {label:'Danificado',valor:analise.resumo_geral?.total_danificado,cor:'#F85149'},
                {label:'Taxa quebra',valor:(analise.resumo_geral?.taxa_quebra_percent||0)+'%',cor:'#A371F7'},
              ].map((item,i) => (
                <div key={i} style={{background:'#0D1117',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:'20px',fontWeight:700,color:item.cor}}>{item.valor}</div>
                  <div style={{color:'#8B949E',fontSize:'11px',marginTop:'2px'}}>{item.label}</div>
                </div>
              ))}
            </div>
            {analise.conclusao && (
              <div style={{color:'#8B949E',fontSize:'13px',background:'#0D1117',padding:'10px',borderRadius:'6px',lineHeight:1.6}}>{analise.conclusao}</div>
            )}
          </div>

          {/* Gráfico categorias pizza */}
          {analise.categorias?.length > 0 && (
            <div style={{background:'#161B22',border:'1px solid #21262D',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
              <GraficoPizza dados={analise.categorias} titulo="🥧 Distribuição por Categoria"/>
            </div>
          )}

          {/* Gráfico top produtos barras */}
          {analise.top_produtos?.length > 0 && (
            <div style={{background:'#161B22',border:'1px solid #21262D',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
              <GraficoBarras
                dados={analise.top_produtos.slice(0,8).map(p=>({label:p.nome,valor:p.vendas||0}))}
                titulo="📦 Top Produtos — Vendas"
              />
              <GraficoBarras
                dados={analise.top_produtos.filter(p=>p.quebra_percent>0).sort((a,b)=>b.quebra_percent-a.quebra_percent).slice(0,6).map(p=>({label:p.nome,valor:parseFloat(p.quebra_percent)||0,sufixo:'%'}))}
                titulo="⚠️ Quebra por Produto (%)"
              />
              {/* Tabela de produtos */}
              <div style={{fontWeight:600,fontSize:'13px',color:'#E6EDF3',marginBottom:'8px',marginTop:'8px'}}>📋 Análise por Produto</div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                  <thead>
                    <tr>
                      {['Produto','Vendas','Devol.','Danif.','Quebra%','Estado'].map(h=>(
                        <th key={h} style={{textAlign:'left',padding:'6px 8px',background:'#0D1117',color:'#8B949E',fontSize:'11px',borderBottom:'1px solid #21262D'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analise.top_produtos.map((p,i)=>(
                      <tr key={i}>
                        <td style={{padding:'6px 8px',borderBottom:'1px solid #21262D',color:'#E6EDF3',maxWidth:'130px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</td>
                        <td style={{padding:'6px 8px',borderBottom:'1px solid #21262D',color:'#10D9A0',fontWeight:600}}>{p.vendas}</td>
                        <td style={{padding:'6px 8px',borderBottom:'1px solid #21262D',color:'#E3A340'}}>{p.devolucoes}</td>
                        <td style={{padding:'6px 8px',borderBottom:'1px solid #21262D',color:'#F85149'}}>{p.danificados}</td>
                        <td style={{padding:'6px 8px',borderBottom:'1px solid #21262D',color:'#8B949E'}}>{p.quebra_percent}%</td>
                        <td style={{padding:'6px 8px',borderBottom:'1px solid #21262D'}}>
                          <span style={{background:`${statusCor[p.status]||'#8B949E'}22`,color:statusCor[p.status]||'#8B949E',borderRadius:'4px',padding:'2px 6px',fontSize:'10px',fontWeight:600}}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Por cliente */}
          {analise.por_cliente?.length > 0 && (
            <div style={{background:'#161B22',border:'1px solid #21262D',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
              <div style={{fontWeight:600,fontSize:'13px',color:'#E6EDF3',marginBottom:'10px'}}>🏭 Análise por Cliente</div>
              <GraficoBarras
                dados={analise.por_cliente.map(c=>({label:`${c.cliente} (${c.maquina})`,valor:c.abastecido||0}))}
                titulo="Abastecido por Máquina"
              />
            </div>
          )}

          {/* Sugestões frescos */}
          {analise.sugestoes_frescos?.length > 0 && (
            <div style={{background:'#161B22',border:'1px solid #10D9A044',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
              <div style={{fontWeight:600,fontSize:'13px',color:'#10D9A0',marginBottom:'10px'}}>💡 Sugestões — Frescos</div>
              {analise.sugestoes_frescos.map((s,i)=>(
                <div key={i} style={{padding:'8px 0',borderBottom:'1px solid #21262D',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                  <span style={{background:`${statusCor[s.acao]||'#8B949E'}22`,color:statusCor[s.acao]||'#8B949E',borderRadius:'4px',padding:'2px 8px',fontSize:'11px',fontWeight:600,flexShrink:0,marginTop:'1px'}}>{s.acao}</span>
                  <div>
                    <div style={{color:'#E6EDF3',fontSize:'13px',fontWeight:500}}>{s.produto}</div>
                    <div style={{color:'#8B949E',fontSize:'12px',marginTop:'2px'}}>{s.motivo}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alertas */}
          {analise.alertas?.length > 0 && (
            <div style={{background:'#E3A34011',border:'1px solid #E3A34044',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
              <div style={{fontWeight:600,fontSize:'13px',color:'#E3A340',marginBottom:'8px'}}>⚠️ Alertas</div>
              {analise.alertas.map((a,i)=>(
                <div key={i} style={{color:'#E6EDF3',fontSize:'13px',padding:'4px 0',display:'flex',gap:'8px',alignItems:'flex-start'}}>
                  <span style={{color:'#E3A340',flexShrink:0}}>•</span>{a}
                </div>
              ))}
            </div>
          )}

          {/* Botão apagar dados */}
          <div style={{marginTop:'24px',paddingTop:'16px',borderTop:'1px solid #21262D'}}>
            <button onClick={() => setConfirmApagar(true)} style={{width:'100%',background:'#F8514911',border:'1px solid #F85149',color:'#F85149',borderRadius:'8px',padding:'14px',fontWeight:700,cursor:'pointer',fontSize:'14px',letterSpacing:'0.5px'}}>
              🗑️ APAGAR DADOS
            </button>
          </div>
        </>
      )}

      {/* Popup confirmação apagar */}
      {confirmApagar && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000bb',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:'#161B22',border:'1px solid #F8514944',borderRadius:'12px',padding:'24px',maxWidth:'320px',width:'100%'}}>
            <div style={{fontSize:'28px',textAlign:'center',marginBottom:'10px'}}>🗑️</div>
            <div style={{fontWeight:700,textAlign:'center',color:'#E6EDF3',marginBottom:'8px',fontSize:'15px'}}>Apagar todos os dados?</div>
            <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',marginBottom:'20px',lineHeight:1.6}}>A análise do relatório será eliminada. A página ficará pronta para receber um novo ficheiro.</div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={() => setConfirmApagar(false)} style={{flex:1,background:'transparent',border:'1px solid #30363D',color:'#8B949E',borderRadius:'6px',padding:'12px',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
              <button onClick={apagarDados} style={{flex:1,background:'#F85149',color:'#fff',border:'none',borderRadius:'6px',padding:'12px',fontWeight:700,cursor:'pointer',fontSize:'13px'}}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ABA PIQUETE ───────────────────────────────────────────────
function TabPiquete() {
  const [rota, setRota] = useState(() => {
    try { return localStorage.getItem('piquete_rota') || '' } catch { return '' }
  })
  const [editandoRota, setEditandoRota] = useState(false)
  const [rotaTemp, setRotaTemp] = useState('')
  const [confirmExcluir, setConfirmExcluir] = useState(false)

  const [data, setData] = useState('')
  const [horas, setHoras] = useState('')
  const [registos, setRegistos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('piquete_horas') || '[]') } catch { return [] }
  })
  const [confirmExcluirHora, setConfirmExcluirHora] = useState(null)
  const [copiado, setCopiado] = useState(null)

  const guardarRota = () => {
    localStorage.setItem('piquete_rota', rotaTemp)
    setRota(rotaTemp)
    setEditandoRota(false)
  }

  const excluirRota = () => {
    localStorage.removeItem('piquete_rota')
    setRota('')
    setConfirmExcluir(false)
  }

  const adicionarHora = () => {
    if (!data || !horas) return
    const novo = { id: Date.now(), data, horas }
    const novos = [...registos, novo]
    setRegistos(novos)
    localStorage.setItem('piquete_horas', JSON.stringify(novos))
    setData(''); setHoras('')
  }

  const excluirHora = (id) => {
    const novos = registos.filter(r => r.id !== id)
    setRegistos(novos)
    localStorage.setItem('piquete_horas', JSON.stringify(novos))
    setConfirmExcluirHora(null)
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
    const texto = encodeURIComponent(textoWhatsApp(r))
    window.open(`https://wa.me/?text=${texto}`, '_blank')
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

  return (
    <div>
      {/* Popup excluir rota */}
      {confirmExcluir && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#000000aa',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:'#161B22',border:'1px solid #F8514944',borderRadius:'12px',padding:'24px',maxWidth:'300px',width:'100%'}}>
            <div style={{fontSize:'24px',textAlign:'center',marginBottom:'10px'}}>⚠️</div>
            <div style={{fontWeight:600,textAlign:'center',color:'#E6EDF3',marginBottom:'6px'}}>Excluir anotação?</div>
            <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',marginBottom:'18px'}}>A rota do piquete será apagada permanentemente.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setConfirmExcluir(false)} style={{...S2.btnSm,flex:1,padding:'10px'}}>Cancelar</button>
              <button onClick={excluirRota} style={{...S2.btnDanger,flex:1,padding:'10px',fontWeight:600}}>Excluir</button>
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
            <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',marginBottom:'18px'}}>O registo de horas será apagado.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setConfirmExcluirHora(null)} style={{...S2.btnSm,flex:1,padding:'10px'}}>Cancelar</button>
              <button onClick={() => excluirHora(confirmExcluirHora)} style={{...S2.btnDanger,flex:1,padding:'10px',fontWeight:600}}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Rota do Piquete */}
      <div style={S2.section}>
        <div style={S2.title}>🚨 Rota do Piquete</div>

        {editandoRota ? (
          <>
            <textarea
              value={rotaTemp}
              onChange={e => setRotaTemp(e.target.value)}
              rows={6}
              style={{...S2.input, width:'100%', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'10px'}}
              placeholder="Escreve aqui a rota do piquete..."
            />
            <div style={S2.row}>
              <button style={S2.btn} onClick={guardarRota}>💾 Guardar</button>
              <button style={S2.btnSm} onClick={() => setEditandoRota(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            {rota ? (
              <div style={S2.rotaBox}>{rota}</div>
            ) : (
              <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',padding:'24px 0'}}>
                Sem rota definida — clica em editar para adicionar
              </div>
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

        {/* Adicionar registo */}
        <div style={{background:'#0D1117',borderRadius:'8px',padding:'12px',marginBottom:'14px',border:'1px solid #21262D'}}>
          <div style={{color:'#8B949E',fontSize:'11px',fontWeight:600,marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Novo registo</div>
          <div style={{...S2.row, marginBottom:'8px'}}>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              style={{...S2.input, flex:1, minWidth:'130px'}}/>
            <input type="text" value={horas} onChange={e => setHoras(e.target.value)}
              placeholder="Ex: 8h30" style={{...S2.input, width:'90px'}}
              onKeyDown={e => e.key === 'Enter' && adicionarHora()}/>
            <button style={S2.btn} onClick={adicionarHora} disabled={!data || !horas}>+ Adicionar</button>
          </div>
        </div>

        {/* Lista de registos */}
        {registos.length === 0 ? (
          <div style={{color:'#8B949E',fontSize:'13px',textAlign:'center',padding:'16px 0'}}>Sem registos de horas</div>
        ) : (
          registos.map((r,i) => {
            const diaSemana = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long' })
            const dataFmt = r.data.split('-').reverse().join('/')
            return (
              <div key={r.id} style={{background:'#0D1117',borderRadius:'8px',padding:'12px',marginBottom:'8px',border:'1px solid #21262D'}}>
                {/* Cabeçalho */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <div>
                    <span style={{fontWeight:600,color:'#E6EDF3',fontSize:'13px',textTransform:'capitalize'}}>{diaSemana}</span>
                    <span style={{...S2.tag,marginLeft:'8px'}}>{dataFmt}</span>
                    <span style={{...S2.tag,marginLeft:'4px',color:'#10D9A0',background:'#10D9A022'}}>{r.horas}</span>
                  </div>
                  <button style={S2.btnDanger} onClick={() => setConfirmExcluirHora(r.id)}>🗑</button>
                </div>

                {/* Texto de partilha */}
                <div style={{background:'#161B22',borderRadius:'6px',padding:'10px',fontSize:'12px',color:'#8B949E',lineHeight:1.7,marginBottom:'10px',fontFamily:'monospace'}}>
                  Horas trabalhadas no piquete de {diaSemana}, Rota 606.<br/>
                  Data: {dataFmt}<br/>
                  Horas: {r.horas}
                </div>

                {/* Botões */}
                <div style={S2.row}>
                  <button style={S2.btnSm} onClick={() => copiarTexto(r)}>
                    {copiado === r.id ? '✅ Copiado!' : '📋 Copiar'}
                  </button>
                  <button style={S2.btnWA} onClick={() => partilharWhatsApp(r)}>
                    📲 Partilhar no WhatsApp
                  </button>
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
