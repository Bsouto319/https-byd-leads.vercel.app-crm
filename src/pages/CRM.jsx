import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { exportToCSV } from '../utils/export'

const PASSWORD = import.meta.env.VITE_CRM_PASSWORD || 'byd@saga2026'

const COLUMNS = [
  { id: 'novo',       label: 'Novo',        color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { id: 'qualificado',label: 'Qualificado', color: '#0891b2', bg: 'rgba(8,145,178,0.15)'  },
  { id: 'em_contato', label: 'Em Contato',  color: '#d97706', bg: 'rgba(217,119,6,0.15)'  },
  { id: 'convertido', label: 'Convertido',  color: '#16a34a', bg: 'rgba(22,163,74,0.15)'  },
  { id: 'descartado', label: 'Descartado',  color: '#6b7280', bg: 'rgba(107,114,128,0.15)'},
]

const SEG = {
  saude:'Saúde', tecnologia:'Tecnologia', educacao:'Educação', juridico:'Jurídico',
  financas:'Finanças', construcao:'Construção', agronegocio:'Agronegócio',
  transporte:'Transporte', comercio:'Comércio', industria:'Indústria', outros:'Outros',
}

export default function CRM() {
  const [auth, setAuth]       = useState(false)
  const [password, setPassword] = useState('')
  const [leads, setLeads]     = useState([])
  const [selected, setSelected] = useState(null)
  const [notas, setNotas]     = useState('')
  const [filter, setFilter]   = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('byd_crm_auth') === '1') setAuth(true)
  }, [])

  useEffect(() => { if (auth) fetchLeads() }, [auth])

  async function fetchLeads() {
    setLoading(true)
    const { data } = await supabase.from('byd_leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  function login(e) {
    e.preventDefault()
    if (password === PASSWORD) { sessionStorage.setItem('byd_crm_auth', '1'); setAuth(true) }
    else alert('Senha incorreta')
  }

  async function moveStatus(lead, newStatus, e) {
    e?.stopPropagation()
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l))
    await supabase.from('byd_leads').update({ status: newStatus }).eq('id', lead.id)
    if (selected?.id === lead.id) setSelected(prev => ({ ...prev, status: newStatus }))
  }

  async function saveNotas() {
    if (!selected) return
    setSaving(true)
    await supabase.from('byd_leads').update({ notas }).eq('id', selected.id)
    setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, notas } : l))
    setSaving(false)
    setSelected(null)
  }

  function openLead(lead) { setSelected(lead); setNotas(lead.notas || '') }

  const filtered = leads.filter(l =>
    !filter ||
    l.nome.toLowerCase().includes(filter.toLowerCase()) ||
    (l.telefone || '').includes(filter) ||
    (l.segmento || '').includes(filter.toLowerCase())
  )

  if (!auth) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: 'linear-gradient(160deg,#0a1628 0%,#0f2057 100%)' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-blue-900 font-black text-lg">BYD</span>
            </div>
            <h2 className="text-white font-black text-2xl">CRM Fredy</h2>
            <p className="text-blue-200/50 text-sm mt-1">Acesso restrito</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              autoFocus
              className="w-full px-5 py-4 sm:py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 text-base sm:text-lg"
            />
            <button type="submit" className="w-full py-4 sm:py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-black text-base sm:text-lg transition shadow-lg shadow-blue-900/40">
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  const total       = leads.length
  const whats       = leads.filter(l => l.aceita_whatsapp).length
  const corporativo = leads.filter(l => l.tipo_cliente === 'potencial_corporativo').length
  const frota       = leads.filter(l => l.potencial_frota).length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#0a1628 0%,#0f2057 100%)' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center gap-3 bg-black/20">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <span className="text-blue-900 font-black text-xs">BYD</span>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">CRM Fredy</p>
            <p className="text-blue-300/50 text-[10px]">BYD Exposição</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 md:gap-5 text-center">
          <Stat label="Total"    value={total}       color="text-white" />
          <Stat label="WhatsApp" value={whats}       color="text-emerald-400" />
          <Stat label="Corp"     value={corporativo} color="text-amber-400" />
          <Stat label="Frota"    value={frota}       color="text-violet-400" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 md:w-44 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
          <button onClick={() => exportToCSV(leads)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition shrink-0">
            ↓ CSV
          </button>
          <button onClick={fetchLeads} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs transition shrink-0">
            ↻
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 text-blue-300/50 text-sm">Carregando leads...</div>
      ) : (
        <>
          {/* Mobile: lista por status */}
          <div className="md:hidden flex-1 overflow-y-auto">
            {COLUMNS.map(col => {
              const colLeads = filtered.filter(l => l.status === col.id)
              if (colLeads.length === 0) return null
              return (
                <div key={col.id} className="mb-2">
                  <div className="flex items-center gap-2 px-4 py-3 sticky top-0 bg-[#0a1628]/95 backdrop-blur-sm border-b border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                    <span className="text-sm font-black text-white/70 uppercase tracking-wider">{col.label}</span>
                    <span className="ml-auto text-sm font-black text-white/40">{colLeads.length}</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {colLeads.map(lead => (
                      <MobileCard key={lead.id} lead={lead} columns={COLUMNS} onMove={moveStatus} onOpen={openLead} />
                    ))}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center text-white/20 py-20 text-sm">Nenhum lead encontrado</div>
            )}
          </div>

          {/* Tablet/Notebook: Kanban */}
          <div className="hidden md:block flex-1 overflow-x-auto p-4">
            <div className="flex gap-3 min-w-max h-full">
              {COLUMNS.map(col => {
                const colLeads = filtered.filter(l => l.status === col.id)
                return (
                  <div key={col.id} className="w-64 lg:w-72 flex-shrink-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                      <span className="font-black text-white/80 text-xs uppercase tracking-wider">{col.label}</span>
                      <span className="ml-auto text-xs font-black text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{colLeads.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 min-h-16 rounded-xl p-2.5" style={{ background: col.bg }}>
                      {colLeads.map(lead => (
                        <KanbanCard key={lead.id} lead={lead} columns={COLUMNS} onMove={moveStatus} onOpen={openLead} />
                      ))}
                      {colLeads.length === 0 && (
                        <div className="text-center text-white/20 text-xs py-6">Nenhum lead</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-[#0f1e40] border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-lg p-6 md:p-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg md:text-xl font-black text-white">{selected.nome}</h3>
                <p className="text-blue-300/50 text-sm mt-1">{new Date(selected.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white text-3xl leading-none ml-4 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">×</button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <Info label="Telefone"  value={selected.telefone} />
              <Info label="E-mail"    value={selected.email || '—'} />
              <Info label="Atividade" value={selected.atividade_profissional || '—'} />
              <Info label="Segmento"  value={SEG[selected.segmento] || selected.segmento} />
              <Info label="Tipo"      value={selected.tipo_cliente === 'potencial_corporativo' ? '🏢 Corporativo' : '👤 Pessoa Física'} />
              <Info label="Score"     value={`${selected.score || 5}/10`} />
              <Info label="Frota"     value={selected.potencial_frota ? '✅ Sim' : '—'} />
              <Info label="WhatsApp"  value={selected.aceita_whatsapp ? '✅ Aceita' : '❌ Não'} />
            </div>

            <div className="mb-4">
              <p className="text-blue-200/60 text-xs font-bold uppercase tracking-wide mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {COLUMNS.map(col => (
                  <button
                    key={col.id}
                    onClick={() => moveStatus(selected, col.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all"
                    style={selected.status === col.id
                      ? { background: col.color, color: '#fff', borderColor: col.color }
                      : { background: 'transparent', color: col.color, borderColor: col.color }}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-blue-200/60 text-xs font-bold uppercase tracking-wide mb-2">Notas</p>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Anotações sobre o lead..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-white/20 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={saveNotas} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-2xl py-4 font-black text-base transition disabled:opacity-50 shadow-lg shadow-blue-900/40">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setSelected(null)} className="px-6 bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white rounded-2xl py-4 text-base font-medium transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="text-center">
      <div className={`text-lg md:text-2xl font-black leading-none ${color}`}>{value}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-xl p-2.5 md:p-3">
      <div className="text-[10px] text-blue-300/50 font-bold uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs md:text-sm font-semibold text-white truncate">{value}</div>
    </div>
  )
}

function Tag({ color, bg, children }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black" style={{ color, background: bg }}>
      {children}
    </span>
  )
}

function MobileCard({ lead, columns, onMove, onOpen }) {
  const col = columns.find(c => c.id === lead.status)
  return (
    <button
      onClick={() => onOpen(lead)}
      className="w-full text-left bg-white/5 border border-white/8 active:bg-white/10 rounded-2xl p-4 transition-all"
      style={{ borderLeftWidth: 4, borderLeftColor: col?.color }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="font-black text-white text-base leading-tight">{lead.nome}</span>
        <span className={`text-sm font-black shrink-0 ${lead.score >= 8 ? 'text-emerald-400' : lead.score >= 6 ? 'text-amber-400' : 'text-white/40'}`}>{lead.score}/10</span>
      </div>
      <p className="text-blue-300/60 text-sm mb-3">{lead.telefone}</p>
      <div className="flex flex-wrap gap-2">
        {lead.tipo_cliente === 'potencial_corporativo' && <Tag color="#60a5fa" bg="rgba(96,165,250,0.15)">🏢 Corp</Tag>}
        {lead.potencial_frota && <Tag color="#a78bfa" bg="rgba(167,139,250,0.15)">🚗 Frota</Tag>}
        {lead.aceita_whatsapp && <Tag color="#34d399" bg="rgba(52,211,153,0.15)">💬 WA</Tag>}
        {lead.segmento && lead.segmento !== 'outros' && <Tag color="#94a3b8" bg="rgba(148,163,184,0.12)">{SEG[lead.segmento]}</Tag>}
      </div>
    </button>
  )
}

function KanbanCard({ lead, columns, onMove, onOpen }) {
  const nextCols = columns.filter(c => c.id !== lead.status)
  return (
    <div
      className="bg-[#0a1628]/80 border border-white/8 hover:border-white/20 rounded-xl p-3 cursor-pointer transition-all"
      onClick={() => onOpen(lead)}
    >
      <div className="flex items-start justify-between mb-1">
        <span className="font-black text-white text-xs leading-tight">{lead.nome}</span>
        <span className={`text-xs font-black shrink-0 ml-1 ${lead.score >= 8 ? 'text-emerald-400' : lead.score >= 6 ? 'text-amber-400' : 'text-white/40'}`}>{lead.score}/10</span>
      </div>
      <p className="text-blue-300/50 text-[10px] mb-2">{lead.telefone}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {lead.tipo_cliente === 'potencial_corporativo' && <Tag color="#60a5fa" bg="rgba(96,165,250,0.15)">🏢</Tag>}
        {lead.potencial_frota && <Tag color="#a78bfa" bg="rgba(167,139,250,0.15)">🚗</Tag>}
        {lead.aceita_whatsapp && <Tag color="#34d399" bg="rgba(52,211,153,0.15)">💬</Tag>}
        {lead.segmento && lead.segmento !== 'outros' && <Tag color="#94a3b8" bg="rgba(148,163,184,0.12)">{SEG[lead.segmento]}</Tag>}
      </div>
      <div className="flex gap-1 pt-2 border-t border-white/8" onClick={e => e.stopPropagation()}>
        {nextCols.slice(0, 3).map(col => (
          <button key={col.id} onClick={e => onMove(lead, col.id, e)}
            className="text-[9px] px-1.5 py-0.5 rounded-full border font-black transition-opacity hover:opacity-80"
            style={{ borderColor: col.color, color: col.color }}>
            {col.label}
          </button>
        ))}
      </div>
    </div>
  )
}
