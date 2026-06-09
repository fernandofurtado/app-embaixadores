-- ═══════════════════════════════════════════════════════════════
-- Docker Init: Stubs para compatibilidade com Supabase
-- Cria schema auth + tabela users + função uid()
-- para que as migrations originais rodem em PostgreSQL vanilla
-- ═══════════════════════════════════════════════════════════════

-- Schema auth (simula Supabase Auth)
CREATE SCHEMA IF NOT EXISTS auth;

-- Tabela auth.users mínima (profiles referencia auth.users(id))
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    encrypted_password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função auth.uid() — retorna NULL em dev (RLS não é usado pelo backend)
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
BEGIN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
