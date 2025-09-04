-- Script para criar tabela newsletter no Supabase
-- Portal Paranavaí News - Sistema de Newsletter

-- Criar tabela newsletter
CREATE TABLE IF NOT EXISTS newsletter (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    whatsapp VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_descadastro TIMESTAMP WITH TIME ZONE,
    ip_cadastro INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_ativo ON newsletter(ativo);
CREATE INDEX IF NOT EXISTS idx_newsletter_data_cadastro ON newsletter(data_cadastro DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_whatsapp ON newsletter(whatsapp) WHERE whatsapp IS NOT NULL;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_newsletter_updated_at ON newsletter;
CREATE TRIGGER trigger_newsletter_updated_at
    BEFORE UPDATE ON newsletter
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();

-- RLS (Row Level Security) para proteger dados
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (cadastros)
CREATE POLICY "Permitir inserção pública na newsletter" ON newsletter
    FOR INSERT WITH CHECK (true);

-- Política para permitir leitura apenas para administradores
CREATE POLICY "Permitir leitura para administradores" ON newsletter
    FOR SELECT USING (auth.role() = 'authenticated');

-- Comentários na tabela
COMMENT ON TABLE newsletter IS 'Cadastros da newsletter do Portal Paranavaí News';
COMMENT ON COLUMN newsletter.id IS 'ID único do cadastro';
COMMENT ON COLUMN newsletter.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN newsletter.email IS 'Email do usuário (único)';
COMMENT ON COLUMN newsletter.whatsapp IS 'WhatsApp com código do país';
COMMENT ON COLUMN newsletter.ativo IS 'Status ativo/inativo do cadastro';
COMMENT ON COLUMN newsletter.data_cadastro IS 'Data do cadastro na newsletter';
COMMENT ON COLUMN newsletter.data_descadastro IS 'Data do descadastro (se houver)';
COMMENT ON COLUMN newsletter.ip_cadastro IS 'IP do usuário no momento do cadastro';
COMMENT ON COLUMN newsletter.user_agent IS 'User Agent do browser no cadastro';

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO newsletter (nome, email, whatsapp, ativo) VALUES 
    ('João Silva', 'joao@exemplo.com', '5544999887766', true),
    ('Maria Santos', 'maria@exemplo.com', '5544988776655', true),
    ('Pedro Oliveira', 'pedro@exemplo.com', NULL, true)
ON CONFLICT (email) DO NOTHING;
