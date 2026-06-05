import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env before running this script.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const sql = `
CREATE TABLE IF NOT EXISTS byd_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  atividade_profissional TEXT,
  aceita_whatsapp BOOLEAN DEFAULT false,
  segmento TEXT DEFAULT 'outros',
  tipo_cliente TEXT DEFAULT 'pessoa_fisica',
  potencial_frota BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 5,
  status TEXT DEFAULT 'novo',
  notas TEXT,
  webhook_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE byd_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='byd_leads' AND policyname='anon insert byd') THEN
    CREATE POLICY "anon insert byd" ON byd_leads FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='byd_leads' AND policyname='anon select byd') THEN
    CREATE POLICY "anon select byd" ON byd_leads FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='byd_leads' AND policyname='anon update byd') THEN
    CREATE POLICY "anon update byd" ON byd_leads FOR UPDATE USING (true);
  END IF;
END $$;
`

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

if (res.ok) {
  console.log('Tabela byd_leads criada com sucesso!')
} else {
  const err = await res.text()
  console.log('Erro:', err)
}
