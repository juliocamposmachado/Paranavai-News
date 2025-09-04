-- ============================================
-- Script para criação da tabela Newsletter
-- Portal Paranavaí News
-- ============================================

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela newsletter
CREATE TABLE IF NOT EXISTS public.newsletter (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    whatsapp VARCHAR(20) NULL,
    ativo BOOLEAN DEFAULT true NOT NULL,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ip_cadastro INET NULL,
    user_agent TEXT NULL,
    fonte_cadastro VARCHAR(100) DEFAULT 'portal_site' NOT NULL,
    confirmado BOOLEAN DEFAULT false NOT NULL,
    token_confirmacao UUID DEFAULT uuid_generate_v4() NULL,
    data_confirmacao TIMESTAMP WITH TIME ZONE NULL,
    data_ultimo_email TIMESTAMP WITH TIME ZONE NULL,
    tentativas_envio INTEGER DEFAULT 0 NOT NULL,
    status_envio VARCHAR(50) DEFAULT 'ativo' NOT NULL
);

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_ativo ON public.newsletter(ativo);
CREATE INDEX IF NOT EXISTS idx_newsletter_data_cadastro ON public.newsletter(data_cadastro DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmado ON public.newsletter(confirmado);
CREATE INDEX IF NOT EXISTS idx_newsletter_status_envio ON public.newsletter(status_envio);
CREATE INDEX IF NOT EXISTS idx_newsletter_whatsapp ON public.newsletter(whatsapp) WHERE whatsapp IS NOT NULL;

-- Criar função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION public.update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar data_atualizacao
DROP TRIGGER IF EXISTS trigger_update_newsletter_updated_at ON public.newsletter;
CREATE TRIGGER trigger_update_newsletter_updated_at
    BEFORE UPDATE ON public.newsletter
    FOR EACH ROW
    EXECUTE FUNCTION public.update_newsletter_updated_at();

-- Adicionar comentários na tabela e campos
COMMENT ON TABLE public.newsletter IS 'Tabela para armazenar inscritos na newsletter do Portal Paranavaí News';
COMMENT ON COLUMN public.newsletter.id IS 'ID único do inscrito (UUID)';
COMMENT ON COLUMN public.newsletter.nome IS 'Nome completo do inscrito';
COMMENT ON COLUMN public.newsletter.email IS 'Email do inscrito (único)';
COMMENT ON COLUMN public.newsletter.whatsapp IS 'Número do WhatsApp (opcional)';
COMMENT ON COLUMN public.newsletter.ativo IS 'Se o inscrito está ativo para receber emails';
COMMENT ON COLUMN public.newsletter.data_cadastro IS 'Data e hora do cadastro';
COMMENT ON COLUMN public.newsletter.data_atualizacao IS 'Data e hora da última atualização';
COMMENT ON COLUMN public.newsletter.ip_cadastro IS 'IP de origem do cadastro';
COMMENT ON COLUMN public.newsletter.user_agent IS 'User Agent do navegador no cadastro';
COMMENT ON COLUMN public.newsletter.fonte_cadastro IS 'Fonte do cadastro (portal_site, admin, api)';
COMMENT ON COLUMN public.newsletter.confirmado IS 'Se o email foi confirmado (double opt-in)';
COMMENT ON COLUMN public.newsletter.token_confirmacao IS 'Token único para confirmação de email';
COMMENT ON COLUMN public.newsletter.data_confirmacao IS 'Data da confirmação do email';
COMMENT ON COLUMN public.newsletter.data_ultimo_email IS 'Data do último email enviado';
COMMENT ON COLUMN public.newsletter.tentativas_envio IS 'Contador de tentativas de envio';
COMMENT ON COLUMN public.newsletter.status_envio IS 'Status para controle de envios (ativo, pausado, bloqueado)';

-- Adicionar constraints de validação
ALTER TABLE public.newsletter 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.newsletter 
ADD CONSTRAINT check_nome_not_empty 
CHECK (LENGTH(TRIM(nome)) > 0);

ALTER TABLE public.newsletter 
ADD CONSTRAINT check_whatsapp_format 
CHECK (whatsapp IS NULL OR whatsapp ~* '^[0-9+\-\(\)\s]{8,20}$');

ALTER TABLE public.newsletter 
ADD CONSTRAINT check_status_envio_valid 
CHECK (status_envio IN ('ativo', 'pausado', 'bloqueado', 'bounced', 'complained'));

-- Habilitar RLS (Row Level Security) se necessário
-- ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;

-- Política para acesso público (ajustar conforme necessidade)
-- CREATE POLICY "Permitir inserção pública" ON public.newsletter
-- FOR INSERT TO anon, authenticated
-- WITH CHECK (true);

-- CREATE POLICY "Permitir leitura para authenticated" ON public.newsletter
-- FOR SELECT TO authenticated
-- USING (true);

-- Inserir registros de exemplo para teste (opcional)
INSERT INTO public.newsletter (nome, email, whatsapp, confirmado, fonte_cadastro) VALUES
('Admin Sistema', 'admin@paranavainews.com.br', '5544999999999', true, 'admin'),
('Teste Newsletter', 'teste@paranavainews.com.br', '5544988888888', true, 'portal_site')
ON CONFLICT (email) DO NOTHING;

-- Criar view para estatísticas básicas
CREATE OR REPLACE VIEW public.newsletter_stats AS
SELECT
    COUNT(*) as total_inscritos,
    COUNT(*) FILTER (WHERE ativo = true) as ativos,
    COUNT(*) FILTER (WHERE ativo = false) as inativos,
    COUNT(*) FILTER (WHERE confirmado = true) as confirmados,
    COUNT(*) FILTER (WHERE confirmado = false) as nao_confirmados,
    COUNT(*) FILTER (WHERE whatsapp IS NOT NULL) as com_whatsapp,
    COUNT(*) FILTER (WHERE data_cadastro::date = CURRENT_DATE) as cadastros_hoje,
    COUNT(*) FILTER (WHERE data_cadastro >= CURRENT_DATE - INTERVAL '7 days') as cadastros_semana,
    COUNT(*) FILTER (WHERE data_cadastro >= CURRENT_DATE - INTERVAL '30 days') as cadastros_mes
FROM public.newsletter;

COMMENT ON VIEW public.newsletter_stats IS 'View com estatísticas básicas da newsletter';

-- Exibir resultado
SELECT 'Tabela newsletter criada com sucesso!' as status;
SELECT * FROM public.newsletter_stats;
