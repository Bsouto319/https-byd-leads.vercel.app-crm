const SEGMENTOS = {
  saude: ['médico', 'medico', 'dentista', 'enfermeiro', 'farmacêutico', 'farmaceutico', 'fisioterapeuta', 'nutricionista', 'psicólogo', 'psicologo', 'veterinário', 'veterinario', 'saúde', 'saude', 'hospital', 'clínica', 'clinica'],
  tecnologia: ['ti', 'tecnologia', 'desenvolvedor', 'programador', 'analista', 'engenheiro de software', 'sistemas', 'dados', 'cybersegurança', 'cyber', 'nuvem', 'cloud', 'startup'],
  educacao: ['professor', 'educador', 'pedagogo', 'diretor escolar', 'coordenador pedagógico', 'escola', 'universidade', 'faculdade', 'ensino'],
  juridico: ['advogado', 'jurídico', 'juridico', 'direito', 'promotor', 'juiz', 'defensor', 'notário', 'notario'],
  financas: ['contador', 'financeiro', 'auditor', 'economista', 'bancário', 'bancario', 'banco', 'investimento', 'financeira', 'seguro', 'corretor'],
  construcao: ['engenheiro civil', 'arquiteto', 'construção', 'construcao', 'obra', 'construtora', 'imobiliária', 'imobiliaria', 'incorporador', 'pedreiro', 'engenheiro'],
  agronegocio: ['agricultor', 'fazendeiro', 'agrônomo', 'agronomo', 'agro', 'pecuarista', 'produtor rural', 'soja', 'fazenda'],
  transporte: ['motorista', 'transportador', 'logística', 'logistica', 'frete', 'frota', 'caminhoneiro', 'entrega', 'uber', 'motoboy'],
  comercio: ['comerciante', 'lojista', 'varejista', 'atacadista', 'vendedor', 'representante', 'distribuidor'],
  industria: ['industrial', 'indústria', 'industria', 'manufatura', 'operador', 'técnico industrial', 'produção', 'qualidade'],
}

const CORPORATIVO_KEYWORDS = ['diretor', 'ceo', 'cto', 'coo', 'gerente', 'coordenador', 'supervisor', 'gestor', 'presidente', 'sócio', 'socio', 'empresário', 'empresario', 'dono', 'proprietário', 'proprietario', 'fundador', 'empresa', 's/a', 'ltda', 'eireli', 'me ', 'mei']

const FROTA_KEYWORDS = ['frota', 'transporte', 'logística', 'logistica', 'motorista', 'caminhão', 'caminhao', 'veículos', 'veiculos', 'empresa de ônibus', 'ônibus', 'onibus', 'táxi', 'taxi', 'van', 'distribuição', 'distribuicao', 'entrega']

export function classifyLead(atividadeProfissional) {
  const text = (atividadeProfissional || '').toLowerCase()

  let segmento = 'outros'
  for (const [seg, keywords] of Object.entries(SEGMENTOS)) {
    if (keywords.some(k => text.includes(k))) {
      segmento = seg
      break
    }
  }

  const tipo_cliente = CORPORATIVO_KEYWORDS.some(k => text.includes(k))
    ? 'potencial_corporativo'
    : 'pessoa_fisica'

  const potencial_frota = FROTA_KEYWORDS.some(k => text.includes(k))

  const score = calcScore(segmento, tipo_cliente, potencial_frota)

  return { segmento, tipo_cliente, potencial_frota, score }
}

function calcScore(segmento, tipo_cliente, potencial_frota) {
  let score = 5
  if (tipo_cliente === 'potencial_corporativo') score += 2
  if (potencial_frota) score += 2
  if (['tecnologia', 'industria', 'comercio', 'transporte'].includes(segmento)) score += 1
  return Math.min(score, 10)
}
