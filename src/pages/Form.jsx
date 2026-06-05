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
      <div style={styles.page}>
        <div style={{ textAlign: 'center', maxWidth: 480, width: '100%', padding: '0 24px' }}>
          <div style={styles.successIcon}>
            <svg width="52" height="52" fill="none" stroke="#34d399" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p style={styles.successTitle}>Cadastro realizado!</p>
          <p style={styles.successSub}>Obrigado pela participação.</p>
          <p style={{ ...styles.successSub, opacity: 0.5, fontSize: 16, marginTop: 8, marginBottom: 48 }}>
            Em breve você receberá novidades exclusivas da BYD.
          </p>
          <div style={styles.countdown}>{countdown}</div>
          <p style={{ color: 'rgba(147,197,253,0.5)', fontSize: 14, marginTop: 12 }}>
            Próximo visitante em {countdown}s
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Logo + título */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={{ color: '#1e3a8a', fontWeight: 900, fontSize: 14 }}>BYD</span>
          </div>
          <div>
            <p style={styles.title}>Cadastro de Visitante</p>
            <p style={styles.subtitle}>Preencha seus dados e receba conteúdos exclusivos da BYD</p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.field}>
            <label style={styles.label}>Nome completo <span style={{ color: '#f87171' }}>*</span></label>
            <input
              type="text" name="nome" value={form.nome}
              onChange={handleChange} placeholder="Nome e sobrenome"
              autoComplete="off" autoCapitalize="words"
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Telefone / WhatsApp <span style={{ color: '#f87171' }}>*</span></label>
            <input
              type="tel" name="telefone" value={form.telefone}
              onChange={handlePhone} placeholder="(61) 99999-9999"
              autoComplete="off" inputMode="numeric"
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>E-mail</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="seu@email.com"
              autoComplete="off" inputMode="email" autoCapitalize="none"
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Atividade profissional</label>
            <input
              type="text" name="atividade_profissional" value={form.atividade_profissional}
              onChange={handleChange} placeholder="Ex: Médico, Empresário, Engenheiro..."
              autoComplete="off" autoCapitalize="words"
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
            />
          </div>

          {/* Opt-in WhatsApp */}
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, aceita_whatsapp: !p.aceita_whatsapp }))}
            style={{
              ...styles.optIn,
              background: form.aceita_whatsapp ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${form.aceita_whatsapp ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            <div style={{
              ...styles.checkbox,
              background: form.aceita_whatsapp ? '#2563eb' : 'transparent',
              border: `2px solid ${form.aceita_whatsapp ? '#2563eb' : 'rgba(255,255,255,0.3)'}`,
            }}>
              {form.aceita_whatsapp && (
                <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span style={styles.optInText}>
              Aceito receber novidades e convites da BYD via WhatsApp
            </span>
          </button>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            ...styles.submit,
            opacity: loading ? 0.6 : 1,
            background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
          }}>
            {loading ? 'Salvando...' : 'Confirmar Cadastro →'}
          </button>

        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg,#0a1628 0%,#0f2057 60%,#001a5e 100%)',
    padding: '24px 16px',
    boxSizing: 'border-box',
  },
  container: {
    width: '100%',
    maxWidth: 560,
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 900,
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    color: 'rgba(147,197,253,0.6)',
    fontSize: 14,
    margin: '4px 0 0',
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    color: 'rgba(147,197,253,0.7)',
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    paddingLeft: 4,
  },
  input: {
    width: '100%',
    padding: '20px 20px',
    borderRadius: 16,
    border: '2px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.07)',
    color: 'white',
    fontSize: 18,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
    WebkitAppearance: 'none',
    fontFamily: 'inherit',
  },
  inputFocus: {
    borderColor: 'rgba(59,130,246,0.7)',
    background: 'rgba(255,255,255,0.1)',
  },
  inputBlur: {
    borderColor: 'rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.07)',
  },
  optIn: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 20px',
    borderRadius: 16,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  optInText: {
    color: 'rgba(219,234,254,0.8)',
    fontSize: 15,
    lineHeight: 1.4,
    fontFamily: 'inherit',
  },
  submit: {
    width: '100%',
    padding: '22px',
    borderRadius: 16,
    border: 'none',
    color: 'white',
    fontSize: 18,
    fontWeight: 900,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
    marginTop: 6,
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  },
  error: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 12,
    padding: '12px 16px',
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: 'rgba(52,211,153,0.12)',
    border: '2px solid rgba(52,211,153,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 32px',
  },
  successTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 900,
    margin: '0 0 12px',
  },
  successSub: {
    color: '#93c5fd',
    fontSize: 18,
    margin: 0,
  },
  countdown: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    color: 'white',
    fontSize: 32,
    fontWeight: 900,
  },
}
