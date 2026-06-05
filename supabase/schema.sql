-- Tabela de leads BYD Exposição
CREATE TABLE IF NOT EXISTS byd_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  atividade_profissional TEXT,
  aceita_whatsapp BOOLEAN DEFAULT false,

  -- Classificação automática
  segmento TEXT DEFAULT 'outros',
  tipo_cliente TEXT DEFAULT 'pessoa_fisica', -- 'pessoa_fisica' | 'potencial_corporativo'
  potencial_frota BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 5,

  -- CRM
  status TEXT DEFAULT 'novo', -- 'novo' | 'qualificado' | 'em_contato' | 'convertido' | 'descartado'
  notas TEXT,

  -- Controle
  webhook_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: leitura e escrita públicas (exposição — sem login)
ALTER TABLE byd_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert" ON byd_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anon select" ON byd_leads
  FOR SELECT USING (true);

CREATE POLICY "anon update" ON byd_leads
  FOR UPDATE USING (true);
