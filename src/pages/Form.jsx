import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { classifyLead } from '../utils/classify'
import { sendWebhook } from '../utils/webhook'

const INITIAL = { nome: '', telefone: '', email: '', atividade_profissional: '', aceita_whatsapp: false }

export default function Form() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(5)

  const progress = [form.nome.trim(), form.telefone.trim()].filter(Boolean).length * 50

  useEffect(() => {
    if (!success) return
    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setSuccess(false); setForm(INITIAL); return 5 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [success])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handlePhone(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    let v = digits
    if (digits.length > 2) v = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length > 7) v = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    setForm(prev => ({ ...prev, telefone: v }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.nome.trim() || !form.telefone.trim()) {
      setError('Nome e telefone são obrigatórios.')
      return
    }
    setLoading(true)
    const classification = classifyLead(form.atividade_profissional)
    const lead = {
      nome: form.nome.trim(), telefone: form.telefone.trim(),
      email: form.email.trim() || null,
      atividade_profissional: form.atividade_profissional.trim() || null,
      aceita_whatsapp: form.aceita_whatsapp, status: 'novo', ...classification,
    }
    const { data, error: dbError } = await supabase.from('byd_leads').insert([lead]).select().single()
    if (dbError) { setError('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    sendWebhook(data)
    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div style={s.page}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <div style={s.successCircle}>
            <svg width="52" height="52" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p style={{ color: 'white', fontSize: 28, fontWeight: 800, fontFamily: 'Sora, sans-serif', margin: '0 0 10px' }}>Cadastro realizado!</p>
          <p style={{ color: 'rgba(147,197,253,0.8)', fontSize: 16, margin: '0 0 8px', fontFamily: 'DM Sans, sans-serif' }}>Obrigado pela participação.</p>
          <p style={{ color: 'rgba(147,197,253,0.5)', fontSize: 14, margin: '0 0 48px', fontFamily: 'DM Sans, sans-serif' }}>Em breve você receberá novidades exclusivas da BYD.</p>
          <div style={s.countdown}>{countdown}</div>
          <p style={{ color: 'rgba(147,197,253,0.4)', fontSize: 13, marginTop: 12, fontFamily: 'DM Sans, sans-serif' }}>Próximo visitante em {countdown}s</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Barra de progresso */}
        <div style={s.progressTrack}>
          <div style={{ ...s.progressBar, width: `${progress}%` }} />
        </div>

        {/* Header do card */}
        <div style={s.cardHeader}>
          <div style={s.logoBox}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 13, fontFamily: 'Sora, sans-serif' }}>BYD</span>
          </div>
          <div>
            <p style={{ color: 'white', fontSize: 19, fontWeight: 800, margin: 0, fontFamily: 'Sora, sans-serif', lineHeight: 1.2 }}>Cadastro de Visitante</p>
            <p style={{ color: 'rgba(191,219,254,0.8)', fontSize: 13, margin: '4px 0 0', lineHeight: 1.4, fontFamily: 'DM Sans, sans-serif' }}>Preencha seus dados e receba conteúdos exclusivos</p>
          </div>
        </div>

        {/* Corpo do card */}
        <div style={s.cardBody}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={s.field}>
              <label style={s.label}>Nome completo <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" name="nome" value={form.nome} onChange={handleChange}
                placeholder="Nome e sobrenome" autoComplete="off" autoCapitalize="words"
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Telefone / WhatsApp <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="tel" name="telefone" value={form.telefone} onChange={handlePhone}
                placeholder="(61) 99999-9999" autoComplete="off" inputMode="numeric"
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div style={s.field}>
              <label style={s.label}>E-mail</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="seu@email.com" autoComplete="off" inputMode="email" autoCapitalize="none"
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Atividade profissional</label>
              <input type="text" name="atividade_profissional" value={form.atividade_profissional} onChange={handleChange}
                placeholder="Ex: Médico, Empresário, Engenheiro..."
                autoComplete="off" autoCapitalize="words"
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <button type="button"
              onClick={() => setForm(p => ({ ...p, aceita_whatsapp: !p.aceita_whatsapp }))}
              style={{ ...s.optIn, background: form.aceita_whatsapp ? '#eff6ff' : '#f8fafc', borderColor: form.aceita_whatsapp ? '#2563eb' : '#e2e8f0' }}>
              <div style={{ ...s.checkbox, background: form.aceita_whatsapp ? '#2563eb' : 'transparent', borderColor: form.aceita_whatsapp ? '#2563eb' : '#cbd5e1' }}>
                {form.aceita_whatsapp && (
                  <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span style={{ color: '#475569', fontSize: 14, lineHeight: 1.4, fontFamily: 'DM Sans, sans-serif' }}>
                Aceito receber novidades e convites da BYD via WhatsApp
              </span>
            </button>

            {error && <div style={s.error}>{error}</div>}

            <button type="submit" disabled={loading} style={{ ...s.submit, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Salvando...' : 'Confirmar Cadastro →'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100dvh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(160deg, #0d2d5e 0%, #1a4a8a 40%, #0f3460 100%)',
    padding: '24px 16px', boxSizing: 'border-box',
    fontFamily: 'DM Sans, sans-serif',
  },
  card: {
    width: '100%', maxWidth: 540,
    background: 'white', borderRadius: 20,
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  progressTrack: { height: 4, background: '#e2e8f0' },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #1a4a8a, #2563eb)',
    transition: 'width 0.4s ease',
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #1a4a8a, #0d2d5e)',
    padding: '22px 28px',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  logoBox: {
    width: 46, height: 46, borderRadius: 12,
    background: 'rgba(255,255,255,0.15)',
    border: '1.5px solid rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardBody: { padding: '24px 28px 28px' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: '#475569', fontSize: 13, fontWeight: 600 },
  input: {
    width: '100%', padding: '13px 16px',
    borderRadius: 10, border: '1.5px solid #e2e8f0',
    background: '#f8fafc', color: '#0f172a',
    fontSize: 16, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
    WebkitAppearance: 'none',
  },
  optIn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 10,
    border: '1.5px solid', cursor: 'pointer',
    textAlign: 'left', width: '100%', boxSizing: 'border-box',
    transition: 'all 0.2s',
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    border: '1.5px solid', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  },
  submit: {
    width: '100%', padding: '16px',
    borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #1a4a8a, #2563eb)',
    color: 'white', fontSize: 16, fontWeight: 800,
    fontFamily: 'Sora, sans-serif',
    cursor: 'pointer', transition: 'opacity 0.2s',
    boxShadow: '0 8px 24px rgba(37,99,235,0.35)', marginTop: 4,
  },
  error: {
    color: '#dc2626', fontSize: 13, textAlign: 'center',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 10, padding: '10px 14px',
  },
  successCircle: {
    width: 96, height: 96, borderRadius: '50%',
    background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 28px',
  },
  countdown: {
    width: 72, height: 72, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto', color: 'white', fontSize: 28, fontWeight: 900,
    fontFamily: 'Sora, sans-serif',
  },
}
