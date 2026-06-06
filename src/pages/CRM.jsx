import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { exportToCSV } from '../utils/export'

const PASSWORD = import.meta.env.VITE_CRM_PASSWORD || 'byd@saga2026'

const COLUMNS = [
  { id: 'novo',        label: 'Novo',        color: '#64748b', bg: '#f1f5f9', header: '#e2e8f0' },
  { id: 'qualificado', label: 'Qualificado', color: '#2563eb', bg: '#eff6ff', header: '#dbeafe' },
  { id: 'em_contato',  label: 'Em Contato',  color: '#d97706', bg: '#fffbeb', header: '#fef3c7' },
  { id: 'convertido',  label: 'Convertido',  color: '#16a34a', bg: '#f0fdf4', header: '#dcfce7' },
  { id: 'descartado',  label: 'Descartado',  color: '#9ca3af', bg: '#f9fafb', header: '#f3f4f6' },
]

const SEG = {
  saude:'Saúde', tecnologia:'Tecnologia', educacao:'Educação', juridico:'Jurídico',
  financas:'Finanças', construcao:'Construção', agronegocio:'Agronegócio',
  transporte:'Transporte', comercio:'Comércio', industria:'Indústria', outros:'Outros',
}

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4','#84cc16']

function initials(nome) {
  const parts = (nome || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
}

function avatarColor(nome) {
  const sum = (nome || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function whatsappUrl(telefone) {
  const digits = (telefone || '').replace(/\D/g, '')
  const num = digits.length === 11 ? `55${digits}` : digits.length === 13 ? digits : `55${digits}`
  return `https://wa.me/${num}`
}

export default function CRM() {
  const [auth, setAuth]         = useState(false)
  const [password, setPassword] = useState('')
  const [leads, setLeads]       = useState([])
  const [selected, setSelected] = useState(null)
  const [notas, setNotas]       = useState('')
  const [filter, setFilter]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('byd_crm_auth') === '1') setAuth(true)
  }, [])

  useEffect(() => { if (auth) fetchLeads() }, [auth])

  useEffect(() => {
    if (!auth) return
    const channel = supabase
      .channel('byd_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'byd_leads' }, payload => {
        if (payload.eventType === 'INSERT') {
          setLeads(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l))
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [auth])

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

  async function deleteLead() {
    if (!selected) return
    if (!confirm(`Excluir lead "${selected.nome}"?`)) return
    setDeleting(true)
    const { error } = await supabase.from('byd_leads').delete().eq('id', selected.id)
    setDeleting(false)
    if (error) { alert(`Erro ao excluir: ${error.message}`); return }
    setLeads(prev => prev.filter(l => l.id !== selected.id))
    setSelected(null)
  }

  function openLead(lead) { setSelected(lead); setNotas(lead.notas || '') }

  const filtered = leads.filter(l =>
    !filter ||
    l.nome.toLowerCase().includes(filter.toLowerCase()) ||
    (l.telefone || '').includes(filter) ||
    (l.segmento || '').includes(filter.toLowerCase())
  )

  // ── Login ───────────────────────────────────────────────────
  if (!auth) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'linear-gradient(160deg,#0d2d5e 0%,#1a4a8a 100%)', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <span style={{ color: '#1e3a8a', fontWeight: 900, fontSize: 16, fontFamily: 'Sora, sans-serif' }}>BYD</span>
            </div>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: '0 0 4px', fontFamily: 'Sora, sans-serif' }}>CRM Fredy</h2>
            <p style={{ color: 'rgba(147,197,253,0.5)', fontSize: 14, margin: 0 }}>Acesso restrito</p>
          </div>
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Senha" autoFocus
              style={{ padding: '16px 20px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 16, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            <button type="submit" style={{ padding: '16px', borderRadius: 14, border: 'none', background: '#2563eb', color: 'white', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'Sora, sans-serif', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
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

  // ── CRM principal ───────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#f0f5fb', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Topbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1a4a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 11, fontFamily: 'Sora, sans-serif' }}>BYD</span>
          </div>
          <div>
            <p style={{ color: '#0f172a', fontWeight: 800, fontSize: 15, margin: 0, lineHeight: 1.2, fontFamily: 'Sora, sans-serif' }}>CRM Fredy</p>
            <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>BYD Exposição</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <StatBox label="Total"    value={total}       color="#0f172a" />
          <StatBox label="WhatsApp" value={whats}       color="#16a34a" />
          <StatBox label="Conv."    value={corporativo} color="#d97706" />
          <StatBox label="Frota"    value={frota}       color="#7c3aed" />
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 340 }}>
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Buscar nome, telefone..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
          <button onClick={() => exportToCSV(leads)}
            style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ↓ CSV
          </button>
          <button onClick={fetchLeads}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>
            ↻
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>Carregando leads...</div>
      ) : (
        <>
          {/* Mobile: lista */}
          <div style={{ display: 'block' }} className="md-hide">
            <MobileList filtered={filtered} columns={COLUMNS} onMove={moveStatus} onOpen={openLead} />
          </div>

          {/* Desktop: Kanban */}
          <div style={{ flex: 1, overflowX: 'auto', padding: '20px 16px' }}>
            <div style={{ display: 'flex', gap: 12, minWidth: 'max-content', height: '100%', alignItems: 'flex-start' }}>
              {COLUMNS.map(col => {
                const colLeads = filtered.filter(l => l.status === col.id)
                return (
                  <div key={col.id} style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden', background: col.bg, border: `1px solid ${col.header}` }}>
                    {/* Cabeçalho da coluna */}
                    <div style={{ padding: '10px 14px', background: col.header, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 800, fontSize: 12, color: col.color, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Sora, sans-serif' }}>{col.label}</span>
                      <span style={{ marginLeft: 'auto', background: 'white', color: col.color, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>{colLeads.length}</span>
                    </div>
                    {/* Cards */}
                    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
                      {colLeads.map(lead => (
                        <KanbanCard key={lead.id} lead={lead} columns={COLUMNS} onMove={moveStatus} onOpen={openLead} col={col} />
                      ))}
                      {colLeads.length === 0 && (
                        <div style={{ color: '#cbd5e1', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Nenhum lead</div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, padding: '0' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 520, padding: '28px 24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>

            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarColor(selected.nome), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 18, fontFamily: 'Sora, sans-serif' }}>{initials(selected.nome)}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Sora, sans-serif' }}>{selected.nome}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>{new Date(selected.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
            </div>

            {/* Infos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <InfoBox label="Telefone"  value={selected.telefone} />
              <InfoBox label="E-mail"    value={selected.email || '—'} />
              <InfoBox label="Atividade" value={selected.atividade_profissional || '—'} />
              <InfoBox label="Segmento"  value={SEG[selected.segmento] || selected.segmento || '—'} />
              <InfoBox label="Tipo"      value={selected.tipo_cliente === 'potencial_corporativo' ? '🏢 Corporativo' : '👤 Pessoa Física'} />
              <InfoBox label="Score"     value={`${selected.score || 5}/10`} />
              <InfoBox label="Frota"     value={selected.potencial_frota ? '✅ Sim' : '—'} />
              <InfoBox label="WhatsApp"  value={selected.aceita_whatsapp ? '✅ Aceita' : '❌ Não'} />
            </div>

            {/* Status */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Mover para</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COLUMNS.map(col => (
                  <button key={col.id} onClick={() => moveStatus(selected, col.id)}
                    style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `2px solid ${col.color}`, transition: 'all 0.15s',
                      background: selected.status === col.id ? col.color : 'transparent',
                      color: selected.status === col.id ? 'white' : col.color }}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Notas</p>
              <textarea value={notas} onChange={e => setNotas(e.target.value)}
                placeholder="Anotações sobre o lead..."
                rows={3}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }} />
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={whatsappUrl(selected.telefone)} target="_blank" rel="noreferrer"
                style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#22c55e', color: 'white', fontSize: 14, fontWeight: 800, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Sora, sans-serif' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <button onClick={saveNotas} disabled={saving}
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: '#2563eb', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'Sora, sans-serif' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={deleteLead} disabled={deleting}
                style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}>
                🗑
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

function Tag({ color, bg, children }) {
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700, color, background: bg }}>
      {children}
    </span>
  )
}

function KanbanCard({ lead, columns, onMove, onOpen, col }) {
  const nextCols = columns.filter(c => c.id !== lead.status)
  return (
    <div onClick={() => onOpen(lead)}
      style={{ background: 'white', border: `1px solid ${col.header}`, borderRadius: 10, padding: '12px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      {/* Avatar + nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor(lead.nome), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 11, fontFamily: 'Sora, sans-serif' }}>{initials(lead.nome)}</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.nome}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{lead.telefone}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: lead.score >= 8 ? '#16a34a' : lead.score >= 6 ? '#d97706' : '#94a3b8', flexShrink: 0 }}>{lead.score}/10</span>
      </div>
      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {lead.tipo_cliente === 'potencial_corporativo' && <Tag color="#2563eb" bg="#eff6ff">🏢 Corp</Tag>}
        {lead.potencial_frota && <Tag color="#7c3aed" bg="#f5f3ff">🚗 Frota</Tag>}
        {lead.aceita_whatsapp && <Tag color="#16a34a" bg="#f0fdf4">💬 WA</Tag>}
        {lead.segmento && lead.segmento !== 'outros' && <Tag color="#64748b" bg="#f1f5f9">{SEG[lead.segmento]}</Tag>}
      </div>
      {/* Mover */}
      <div style={{ display: 'flex', gap: 4, borderTop: '1px solid #f1f5f9', paddingTop: 8 }} onClick={e => e.stopPropagation()}>
        {nextCols.slice(0, 3).map(c => (
          <button key={c.id} onClick={e => onMove(lead, c.id, e)}
            style={{ fontSize: 9, padding: '3px 7px', borderRadius: 20, border: `1.5px solid ${c.color}`, color: c.color, background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function MobileList({ filtered, columns, onMove, onOpen }) {
  return (
    <div>
      {columns.map(col => {
        const colLeads = filtered.filter(l => l.status === col.id)
        if (colLeads.length === 0) return null
        return (
          <div key={col.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: col.header, borderBottom: `2px solid ${col.header}`, position: 'sticky', top: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: col.color, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Sora, sans-serif' }}>{col.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: col.color }}>{colLeads.length}</span>
            </div>
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colLeads.map(lead => (
                <button key={lead.id} onClick={() => onOpen(lead)}
                  style={{ width: '100%', textAlign: 'left', background: 'white', border: `1px solid ${col.header}`, borderLeft: `4px solid ${col.color}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(lead.nome), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontWeight: 800, fontSize: 12, fontFamily: 'Sora, sans-serif' }}>{initials(lead.nome)}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{lead.nome}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{lead.telefone}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: lead.score >= 8 ? '#16a34a' : lead.score >= 6 ? '#d97706' : '#94a3b8' }}>{lead.score}/10</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {lead.tipo_cliente === 'potencial_corporativo' && <Tag color="#2563eb" bg="#eff6ff">🏢 Corp</Tag>}
                    {lead.potencial_frota && <Tag color="#7c3aed" bg="#f5f3ff">🚗 Frota</Tag>}
                    {lead.aceita_whatsapp && <Tag color="#16a34a" bg="#f0fdf4">💬 WA</Tag>}
                    {lead.segmento && lead.segmento !== 'outros' && <Tag color="#64748b" bg="#f1f5f9">{SEG[lead.segmento]}</Tag>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: 14 }}>Nenhum lead encontrado</div>
      )}
    </div>
  )
}
