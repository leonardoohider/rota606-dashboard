import { useState, useEffect, useCallback } from 'react'

const PAGE_IDS = {
  chamadosDB: 'e23c2dda18c547d6b023b09165eef552',
  frescos:    '38893fb1601f81ebbd7ac56637d8e95a',
  pdv806477:  '37493fb1601f80649eeeffcd6d4c3772',
  pdv807542:  '37493fb1601f818ca971d90764e2752c',
}

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
function TabInicio({chamados,loading,onVerFresco}) {
  const diaIdx = new Date().getDay()
  const dias = ['','2ª Feira','3ª Feira','4ª Feira','5ª Feira','6ª Feira']
  const diaAtual = dias[diaIdx] || '2ª Feira'
  const rotaHoje = ROTA[diaAtual] || []

  // Detectar PDVs com frescos na rota de hoje
  const clientesComFrescos = rotaHoje.map(c => {
    const pdvsFrescos = c.maquinas.filter(m => FRESCOS_PDVS.includes(m))
    return {...c, pdvsFrescos}
  }).filter(c => c.pdvsFrescos.length > 0)

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
          <div style={S.cardTitle}>🔧 Chamados este mês ({chamados.length})</div>
          {chamados.slice(0,3).map((c,i) => (
            <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontWeight:600,fontSize:'13px'}}>{c.cliente} — Máq. {c.maquina}</div>
              {c.problema && <div style={{color:C.muted,fontSize:'12px',marginTop:'2px'}}>{c.problema}</div>}
            </div>
          ))}
          {chamados.length > 3 && <div style={{color:C.muted,fontSize:'12px',marginTop:'8px'}}>+{chamados.length-3} mais — ver aba Chamados</div>}
        </div>
      )}
    </div>
  )
}

// ── ABA CHAMADOS ─────────────────────────────────────────────
function TabChamados({chamados,loading}) {
  return (
    <div>
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={S.cardTitle}>🔧 Assistência Técnica — {getMesLabel()}</div>
          <span style={S.badge(C.accent)}>{chamados.length} chamado{chamados.length!==1?'s':''}</span>
        </div>
        {loading
          ? <span style={{color:C.muted}}>A carregar…</span>
          : chamados.length === 0
            ? <div style={{color:C.muted,padding:'24px 0',textAlign:'center'}}>
                <div style={{fontSize:'24px',marginBottom:'8px'}}>📋</div>
                <div>Sem chamados registados este mês</div>
              </div>
            : chamados.map((c,i) => (
              <div key={i} style={{padding:'12px 0',borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px'}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:'13px',color:C.text,marginBottom:'4px'}}>
                      🔧 {c.cliente} — Máq. {c.maquina}
                    </div>
                    {c.problema && (
                      <div style={{color:C.text,fontSize:'12px',background:C.bg,padding:'6px 8px',borderRadius:'6px',marginTop:'4px'}}>
                        {c.problema}
                      </div>
                    )}
                  </div>
                  <a href={c.url} target="_blank" rel="noreferrer" style={{...S.link,marginTop:0,flexShrink:0}}>
                    Ver ↗
                  </a>
                </div>
              </div>
            ))
        }
      </div>
      <div style={{...S.card,background:'transparent',border:`1px dashed ${C.border}`,textAlign:'center',padding:'12px'}}>
        <div style={{color:C.muted,fontSize:'12px'}}>
          Histórico completo e detalhes disponíveis no Notion
        </div>
        <a href="https://app.notion.com/p/38793fb1601f81c4b22adee0f464d232" target="_blank" rel="noreferrer" style={S.link}>
          Abrir Assistência Técnica no Notion ↗
        </a>
      </div>
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

  function amanha() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('pt-PT', {day:'2-digit',month:'2-digit',year:'numeric'})
  }

  const adicionar = async () => {
    if (!qtd.trim() || !produto.trim()) return
    const novoItem = `${qtd.trim()} ${produto.trim()}`
    const novosItens = [...itens, novoItem]
    setSaving(true)
    await onSave(id, novosItens)
    setSaving(false)
    setQtd(''); setProduto('')
  }

  const limpar = async () => {
    setSaving(true)
    await onSave(id, [])
    setSaving(false)
    setConfirmClear(false)
  }

  return (
    <>
      {confirmClear && (
        <ConfirmPopup
          mensagem={`Apagar toda a lista de reposição do ${label}?`}
          onConfirm={limpar}
          onCancel={() => setConfirmClear(false)}
        />
      )}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={S.cardTitle}>📦 {label}</div>
          {itens.length > 0 && (
            <button style={S.btnDanger} onClick={() => setConfirmClear(true)} disabled={saving}>🗑 Limpar</button>
          )}
        </div>

        {/* Lista de produtos — leitura */}
        {itens.length > 0 ? (
          <div style={{marginBottom:'16px'}}>
            <div style={{color:C.muted,fontSize:'11px',fontWeight:600,marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              📋 Para amanhã, {amanha()}
            </div>
            <div style={{background:C.bg,borderRadius:'8px',padding:'12px',border:`1px solid ${C.border}`}}>
              {itens.map((item, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom: i < itens.length-1 ? `1px solid ${C.border}` : 'none'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',background:C.accent,flexShrink:0}}/>
                  <div style={{color:C.text,fontSize:'14px'}}>{item}</div>
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
              onKeyDown={e => e.key==='Enter' && adicionar()}
            />
            <button style={{...S.btn,flexShrink:0}} onClick={adicionar} disabled={saving||!qtd||!produto}>
              {saving ? '…' : '+ Adicionar'}
            </button>
          </div>
        </div>

        <a href={`https://notion.so/${pageId}`} target="_blank" rel="noreferrer" style={S.link}>
          Abrir no Notion ↗
        </a>
      </div>
    </>
  )
}

// ── ABA BA VIDROS REFEITÓRIO ──────────────────────────────────
function TabBAVidros({pdvYoung, pdv1050, onSave}) {
  // Converter texto do Notion em array de itens
  function parseItens(texto) {
    if (!texto) return []
    return texto.split('\n').map(l => l.replace(/^[•·\-]\s*/, '').trim()).filter(Boolean)
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

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 }
              },
              {
                type: 'text',
                text: `És um assistente de gestão de rota de máquinas vending.

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
              }
            ]
          }]
        })
      })

      const data = await response.json()
      const texto = data.content?.[0]?.text || ''
      const clean = texto.replace(/\`\`\`json|\`\`\`/g, '').trim()
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

// ── APP PRINCIPAL ─────────────────────────────────────────────
const TABS = ['🏠','📋','📦','🥐','🛒','🗺️','📋','📊','🚨']
const TAB_LABELS = ['Início','A.T.','BA Vidros','Config. Frescos','Frescos','Rota','Inventário','Gestão Rota','Piquete']

export default function App() {
  const [tab,setTab] = useState(0)
  const [lastSync,setLastSync] = useState(null)
  const [syncing,setSyncing] = useState(false)
  const [syncOk,setSyncOk] = useState(true)
  const [pdvYoung,setPdvYoung] = useState('')
  const [pdv1050,setPdv1050] = useState('')
  const [chamados,setChamados] = useState([])
  const [loading,setLoading] = useState(true)
  const [frescoAtivo,setFrescoAtivo] = useState(null)

  const fetchPdv = async (pageId) => {
    const data = await nGet(`blocks/${pageId}/children`,{page_size:'50'})
    return data.results ? extractText(data.results) : ''
  }

  const fetchChamados = async () => {
    const { inicio, fim } = getMesRange()
    const data = await nPost(`databases/${PAGE_IDS.chamadosDB}/query`, {
      filter: {
        and: [
          { property: 'Data do Chamado', date: { on_or_after: inicio } },
          { property: 'Data do Chamado', date: { on_or_before: fim } },
        ]
      },
      sorts: [{ property: 'Data do Chamado', direction: 'descending' }]
    })
    if (!data.results) return []
    return data.results.map(r => ({
      pageId: r.id,
      cliente: r.properties?.Cliente?.rich_text?.[0]?.plain_text || '–',
      maquina: r.properties?.['Máquina PDV']?.rich_text?.[0]?.plain_text || '–',
      problema: r.properties?.Problema?.rich_text?.[0]?.plain_text || '',
      data: r.properties?.['Data do Chamado']?.date?.start || '–',
      url: `https://notion.so/${r.id.replace(/-/g,'')}`,
    }))
  }

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const [young,mil,ch] = await Promise.all([
        fetchPdv(PAGE_IDS.pdv806477),
        fetchPdv(PAGE_IDS.pdv807542),
        fetchChamados(),
      ])
      setPdvYoung(young); setPdv1050(mil); setChamados(ch)
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

  const savePdv = async (pdv,text) => {
    const pageId = pdv==='young'?PAGE_IDS.pdv806477:PAGE_IDS.pdv807542
    const existing = await nGet(`blocks/${pageId}/children`,{page_size:'50'})
    if(existing.results) for(const b of existing.results) await nDelete(`blocks/${b.id}`)
    if(text.trim()) {
      const children = text.split('\n').filter(Boolean).map(l=>({
        object:'block',type:'paragraph',
        paragraph:{rich_text:[{type:'text',text:{content:l}}]}
      }))
      await nPost(`blocks/${pageId}/children`,{children})
    }
    if(pdv==='young') setPdvYoung(text)
    else setPdv1050(text)
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

      <nav style={S.nav}>
        {TABS.map((t,i)=>(
          <button key={i} style={S.navBtn(tab===i)} onClick={()=>setTab(i)}>
            <span>{t}</span>
            <span style={{display:'block',fontSize:'10px'}}>{TAB_LABELS[i]}</span>
          </button>
        ))}
      </nav>

      <main style={S.main}>
        {tab===0 && <TabInicio chamados={chamados} loading={loading} onVerFresco={setFrescoAtivo}/>}
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

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
              {
                type: 'text',
                text: `És um analista de gestão de rota de máquinas vending especializado. Analisa este ficheiro PDF da Rota 606.

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
              }
            ]
          }]
        })
      })

      const data = await response.json()
      const texto = data.content?.[0]?.text || ''
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
