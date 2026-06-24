import { useState, useEffect, useCallback } from 'react'

const PAGE_IDS = {
  chamadosJun: '38793fb1601f8137b406efc68d97b49e',
  chamadosDB:  'e23c2dda18c547d6b023b09165eef552',
  frescos:     '38893fb1601f81ebbd7ac56637d8e95a',
  pdv806477:   '37493fb1601f80649eeeffcd6d4c3772',
  pdv807542:   '37493fb1601f818ca971d90764e2752c',
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
  header:{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'56px',position:'sticky',top:0,zIndex:100},
  logo:{display:'flex',flexDirection:'column',lineHeight:1.2},
  logoMain:{fontWeight:700,fontSize:'15px',color:C.accent},
  logoSub:{fontSize:'10px',color:C.muted},
  syncBar:{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:C.muted},
  syncDot:(ok)=>({width:'8px',height:'8px',borderRadius:'50%',background:ok?C.accent:C.danger,flexShrink:0}),
  syncBtn:{background:'none',border:`1px solid ${C.border}`,color:C.muted,borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'11px'},
  nav:{display:'flex',borderBottom:`1px solid ${C.border}`,background:C.card,padding:'0 8px',gap:'2px',overflowX:'auto',WebkitOverflowScrolling:'touch'},
  navBtn:(a)=>({padding:'12px 10px',background:'none',border:'none',color:a?C.accent:C.muted,borderBottom:a?`2px solid ${C.accent}`:'2px solid transparent',cursor:'pointer',fontWeight:a?600:400,fontSize:'13px',whiteSpace:'nowrap'}),
  main:{padding:'16px',maxWidth:'900px',margin:'0 auto'},
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

  const chamadosAtivos = chamados.filter(c => c.status !== '✅ Resolvido')

  return (
    <div>
      {/* Cabeçalho do dia */}
      <div style={{...S.card,borderColor:`${C.accent}44`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontWeight:700,fontSize:'16px',color:C.accent}}>🗓️ {diaAtual}</div>
            <div style={{color:C.muted,fontSize:'12px',marginTop:'2px'}}>{today()} · {rotaHoje.length} clientes · {rotaHoje.reduce((a,c)=>a+c.maquinas.length,0)} máquinas</div>
          </div>
          {chamadosAtivos.length > 0 && (
            <div style={S.badge(C.danger)}>{chamadosAtivos.length} chamado{chamadosAtivos.length>1?'s':''}</div>
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

      {/* Chamados ativos */}
      {chamadosAtivos.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>⚠️ Chamados em Aberto</div>
          {loading ? <span style={{color:C.muted}}>A carregar…</span> : chamadosAtivos.map((c,i) => (
            <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:600,fontSize:'13px'}}>{c.cliente} · Máq. {c.maquina}</div>
                <div style={S.badge(STATUS_COLOR[c.status]||C.muted)}>{c.status}</div>
              </div>
              <div style={{color:C.muted,fontSize:'12px',marginTop:'2px'}}>{c.problema}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ABA CHAMADOS ─────────────────────────────────────────────
function TabChamados({chamados,loading,onStatusChange}) {
  const ativos = chamados.filter(c => c.status !== '✅ Resolvido')
  const resolvidos = chamados.filter(c => c.status === '✅ Resolvido')

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>🔧 Chamados Ativos ({ativos.length})</div>
        {loading ? <span style={{color:C.muted}}>A carregar…</span> :
          ativos.length === 0 ? <div style={{color:C.muted,padding:'16px 0',textAlign:'center'}}>✅ Sem chamados em aberto</div> :
          ativos.map((c,i) => (
            <div key={i} style={{...S.card,marginBottom:'8px',padding:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:'13px',color:C.text,marginBottom:'4px'}}>{c.titulo}</div>
                  <div style={{color:C.muted,fontSize:'12px'}}>📍 {c.cliente} · Máq. {c.maquina}</div>
                  <div style={{color:C.muted,fontSize:'12px'}}>📅 {c.data}</div>
                  {c.problema && <div style={{color:C.text,fontSize:'12px',marginTop:'6px',padding:'6px 8px',background:C.bg,borderRadius:'6px'}}>{c.problema}</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'6px',alignItems:'flex-end'}}>
                  <select
                    value={c.status}
                    onChange={e => onStatusChange(c.pageId, e.target.value)}
                    style={{...S.select,color:STATUS_COLOR[c.status]||C.text}}
                  >
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <a href={c.url} target="_blank" rel="noreferrer" style={S.link}>Abrir no Notion ↗</a>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {resolvidos.length > 0 && (
        <div style={S.card}>
          <div style={{...S.cardTitle,color:C.muted}}>✅ Resolvidos ({resolvidos.length})</div>
          {resolvidos.map((c,i) => (
            <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'13px',color:C.muted}}>{c.cliente} · {c.data}</div>
                <div style={{fontSize:'12px',color:C.muted}}>{c.titulo}</div>
              </div>
              <a href={c.url} target="_blank" rel="noreferrer" style={S.link}>↗</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ABA BA VIDROS REFEITÓRIO ──────────────────────────────────
function TabBAVidros({pdvYoung,pdv1050,onSave}) {
  const [youngText,setYoungText] = useState(pdvYoung||'')
  const [text1050,setText1050] = useState(pdv1050||'')
  const [saving,setSaving] = useState(null)
  const [saved,setSaved] = useState(null)

  useEffect(()=>{setYoungText(pdvYoung||'')},[pdvYoung])
  useEffect(()=>{setText1050(pdv1050||'')},[pdv1050])

  const save = async (pdv,text) => {
    setSaving(pdv)
    await onSave(pdv,text)
    setSaving(null); setSaved(pdv)
    setTimeout(()=>setSaved(null),2000)
  }

  return (
    <div>
      {[
        {id:'young',label:'PDV 806477 — Refeitório Young',text:youngText,set:setYoungText,pageId:PAGE_IDS.pdv806477},
        {id:'1050',label:'PDV 807542 — Refeitório 1050',text:text1050,set:setText1050,pageId:PAGE_IDS.pdv807542},
      ].map(p => (
        <div key={p.id} style={S.card}>
          <div style={S.cardTitle}>📦 {p.label}</div>
          <label style={{color:C.muted,fontSize:'12px',display:'block',marginBottom:'4px'}}>Reposição pendente</label>
          <textarea
            value={p.text}
            onChange={e=>p.set(e.target.value)}
            rows={5}
            style={{...S.input,resize:'vertical',fontFamily:'inherit'}}
            placeholder="Ex: 6 água com gás&#10;15 Sumol laranja"
          />
          <div style={{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap'}}>
            <button style={S.btn} onClick={()=>save(p.id,p.text)} disabled={saving===p.id}>
              {saving===p.id?'A guardar…':saved===p.id?'✅ Guardado!':'💾 Guardar no Notion'}
            </button>
            <button style={S.btnDanger} onClick={()=>save(p.id,'')} disabled={saving===p.id}>🗑 Limpar</button>
          </div>
          <a href={`https://notion.so/${p.pageId}`} target="_blank" rel="noreferrer" style={S.link}>Abrir no Notion ↗</a>
        </div>
      ))}
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

// ── APP PRINCIPAL ─────────────────────────────────────────────
const TABS = ['🏠','🔧','📦','🥐','📊','🗺️']
const TAB_LABELS = ['Início','Chamados','BA Vidros','Frescos','Produtos','Rota']

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
    const data = await nPost(`databases/${PAGE_IDS.chamadosDB}/query`,{
      filter:{property:'Status',select:{does_not_equal:''}},
      sorts:[{property:'Data do Chamado',direction:'descending'}]
    })
    if(!data.results) return []
    return data.results.map(r => ({
      pageId: r.id,
      titulo: r.properties?.Chamado?.title?.[0]?.plain_text || 'Sem título',
      cliente: r.properties?.Cliente?.rich_text?.[0]?.plain_text || '–',
      maquina: r.properties?.['Máquina PDV']?.rich_text?.[0]?.plain_text || '–',
      problema: r.properties?.Problema?.rich_text?.[0]?.plain_text || '',
      data: r.properties?.['Data do Chamado']?.date?.start || '–',
      status: r.properties?.Status?.select?.name || '🔴 Aguardando Assistência',
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

  const updateStatus = async (pageId,status) => {
    await nPatch(`pages/${pageId}`,{
      properties:{Status:{select:{name:status}}}
    })
    setChamados(prev=>prev.map(c=>c.pageId===pageId?{...c,status}:c))
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
        {tab===1 && <TabChamados chamados={chamados} loading={loading} onStatusChange={updateStatus}/>}
        {tab===2 && <TabBAVidros pdvYoung={pdvYoung} pdv1050={pdv1050} onSave={savePdv}/>}
        {tab===3 && <TabFrescos onVerFresco={setFrescoAtivo}/>}
        {tab===4 && <TabProdutos/>}
        {tab===5 && <TabRota onVerFresco={setFrescoAtivo}/>}
      </main>
    </div>
  )
}
