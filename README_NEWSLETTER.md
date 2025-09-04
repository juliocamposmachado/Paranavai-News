# 📧 Sistema de Newsletter - Portal Paranavaí News

Sistema completo de newsletter para coleta de emails, nomes e WhatsApp dos visitantes do portal, com integração ao Supabase.

## ✨ Funcionalidades

- ✅ Formulário responsivo com validações em tempo real
- ✅ Coleta de nome, email e WhatsApp (opcional)
- ✅ Validação de email e formatação automática do WhatsApp
- ✅ Feedback visual com mensagens de sucesso/erro
- ✅ Estados de loading durante o envio
- ✅ Proteção contra spam e duplicatas
- ✅ Armazenamento seguro no Supabase
- ✅ API RESTful para integração
- ✅ Analytics/tracking integrado
- ✅ Design moderno com animações

## 🗂️ Arquivos Criados

### 1. Frontend
- `assets/js/newsletter.js` - JavaScript principal do formulário
- `assets/css/newsletter.css` - Estilos visuais e animações
- `index.html` - Formulário já integrado (seção newsletter)

### 2. Backend
- `api/newsletter.js` - API endpoint para cadastro
- `utils/supabase-client.js` - Cliente Supabase (ES6 modules)

### 3. Banco de Dados
- `sql/create_newsletter_table.sql` - Script para criar tabela no Supabase

## 🚀 Configuração

### 1. Configurar Supabase

1. Acesse [Supabase](https://supabase.com) e crie um projeto
2. No dashboard, vá para **Settings** → **API**
3. Copie as credenciais necessárias:
   - `Project URL`
   - `anon key`

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 3. Criar Tabela no Supabase

1. No dashboard do Supabase, vá para **SQL Editor**
2. Execute o script `sql/create_newsletter_table.sql`
3. Verifique se a tabela foi criada com sucesso

### 4. Configurar Políticas RLS (Opcional)

Para maior segurança, configure as políticas de Row Level Security:

```sql
-- Habilitar RLS
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública
CREATE POLICY "Permitir inserção pública" 
ON public.newsletter FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Política para leitura restrita a usuários autenticados
CREATE POLICY "Permitir leitura para authenticated" 
ON public.newsletter FOR SELECT 
TO authenticated 
USING (true);
```

## 📝 Uso da API

### Cadastrar Newsletter

**POST** `/api/newsletter`

```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "whatsapp": "(44) 99999-9999"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Cadastro realizado com sucesso! Você receberá nossas notícias no seu email.",
  "data": {
    "id": "uuid-aqui",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "whatsapp": "5544999999999",
    "data_cadastro": "2025-01-04T15:30:00.000Z"
  }
}
```

**Resposta de Erro:**
```json
{
  "success": false,
  "error": "Este email já está cadastrado na nossa newsletter"
}
```

### Listar Inscritos

**GET** `/api/newsletter`

```json
{
  "success": true,
  "total": 156,
  "inscritos": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "whatsapp": "5544999999999",
      "ativo": true,
      "data_cadastro": "2025-01-04T15:30:00.000Z"
    }
  ],
  "estatisticas": {
    "total_ativos": 156,
    "cadastros_hoje": 12
  }
}
```

## 🎨 Personalização

### Modificar Estilos

Edite `assets/css/newsletter.css` para personalizar:
- Cores do tema
- Animações
- Responsividade
- Estados visuais

### Configurar Validações

No arquivo `assets/js/newsletter.js`, você pode modificar:
- Regras de validação de email
- Formato do WhatsApp
- Mensagens de erro
- Comportamentos de submit

### Integrar Analytics

O sistema já possui integração com:
- Google Analytics 4
- Facebook Pixel

Para ativar, inclua os scripts correspondentes no HTML.

## 📊 Monitoramento

### Estatísticas Disponíveis

A view `newsletter_stats` fornece:
- Total de inscritos
- Inscritos ativos/inativos
- Emails confirmados/não confirmados
- Inscritos com WhatsApp
- Cadastros por período (hoje, semana, mês)

### Consulta de Estatísticas

```sql
SELECT * FROM public.newsletter_stats;
```

## 🔧 Manutenção

### Backup dos Dados

```sql
-- Export completo
SELECT * FROM public.newsletter 
ORDER BY data_cadastro DESC;

-- Export apenas ativos
SELECT nome, email, whatsapp, data_cadastro 
FROM public.newsletter 
WHERE ativo = true 
ORDER BY data_cadastro DESC;
```

### Limpeza de Dados

```sql
-- Remover emails inválidos (exemplo)
DELETE FROM public.newsletter 
WHERE email NOT LIKE '%@%' 
OR email NOT LIKE '%.%';

-- Desativar ao invés de deletar
UPDATE public.newsletter 
SET ativo = false 
WHERE /* condições */;
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   - Verifique se o endpoint da API está configurado corretamente
   - Confirme as configurações de CORS na API

2. **Credenciais Supabase**
   - Verifique se as variáveis de ambiente estão corretas
   - Confirme se as chaves não expiraram

3. **Tabela não encontrada**
   - Execute o script SQL para criar a tabela
   - Verifique se a tabela está na schema `public`

4. **Formulário não envia**
   - Abra o console do navegador para ver erros
   - Verifique se o JavaScript está carregando

### Logs e Debug

O sistema registra logs no console:
- ✅ `Newsletter: Formulário inicializado`
- 📊 `Newsletter: Conversão registrada`
- ❌ `Newsletter: Erro no envio`

## 📈 Próximos Passos

### Funcionalidades Futuras

- [ ] Sistema de confirmação por email (double opt-in)
- [ ] Template de emails personalizável
- [ ] Segmentação de usuários
- [ ] Dashboard administrativo
- [ ] Export/import de dados
- [ ] API de disparo de newsletters
- [ ] Métricas de engagement

### Integrações Recomendadas

- **Serviços de Email**: SendGrid, Mailgun, AWS SES
- **Analytics**: Google Analytics, Hotjar
- **CRM**: HubSpot, Pipedrive
- **Automação**: Zapier, n8n

## 📝 Licença

Este sistema foi desenvolvido para o Portal Paranavaí News e está disponível sob licença MIT.

---

**Desenvolvido por:** Assistente AI  
**Data:** Janeiro 2025  
**Versão:** 1.0.0

Para suporte ou dúvidas, consulte a documentação ou entre em contato com a equipe de desenvolvimento.
