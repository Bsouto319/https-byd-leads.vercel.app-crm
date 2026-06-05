export function exportToCSV(leads) {
  const headers = [
    'ID', 'Nome', 'Telefone', 'Email', 'Atividade Profissional',
    'Aceita WhatsApp', 'Segmento', 'Tipo Cliente', 'Potencial Frota',
    'Score', 'Status', 'Notas', 'Data Cadastro'
  ]

  const rows = leads.map(l => [
    l.id,
    l.nome,
    l.telefone,
    l.email || '',
    l.atividade_profissional || '',
    l.aceita_whatsapp ? 'Sim' : 'Não',
    l.segmento || '',
    l.tipo_cliente === 'potencial_corporativo' ? 'Corporativo' : 'Pessoa Física',
    l.potencial_frota ? 'Sim' : 'Não',
    l.score || '',
    l.status || '',
    l.notas || '',
    new Date(l.created_at).toLocaleString('pt-BR'),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `byd-leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
