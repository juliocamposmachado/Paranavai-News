# 🔧 Configuração de Variáveis de Ambiente - Vercel

## 📋 Como Importar as Variáveis no Vercel

### **Método 1: Importar arquivo .env (RECOMENDADO)**

1. **Acesse o Dashboard do Vercel**:
   - Vá para: https://vercel.com/dashboard
   - Selecione seu projeto: `Portal-Noticias-Parana`

2. **Vá para Settings**:
   - Clique na aba **"Settings"** no topo
   - No menu lateral, clique em **"Environment Variables"**

3. **Importar arquivo .env.vercel**:
   - Clique no botão **"Import .env File"** 
   - Selecione o arquivo **`.env.vercel`** (criado no projeto)
   - Clique **"Import"**

### **Método 2: Adicionar manualmente (ALTERNATIVO)**

Se preferir adicionar uma por uma:

1. **Clique em "Add New"** na seção Environment Variables
2. **Adicione cada variável**:

#### 🔑 **Variáveis OBRIGATÓRIAS:**
```
Name: SUPABASE_URL
Value: https://abqffaiekwfificwtbam.supabase.co
Environment: Production, Preview, Development
```

```
Name: SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicWZmYWlla3dmaWZpY3d0YmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTY0MDcsImV4cCI6MjA3MjUzMjQwN30.-o3o4t4Tq0QceqvkXk-IxPwlpJjTVatUAXKAgM1H8NA
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://abqffaiekwfificwtbam.supabase.co
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicWZmYWlla3dmaWZpY3d0YmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTY0MDcsImV4cCI6MjA3MjUzMjQwN30.-o3o4t4Tq0QceqvkXk-IxPwlpJjTVatUAXKAgM1H8NA
Environment: Production, Preview, Development
```

#### 🎛️ **Variáveis OPCIONAIS (para melhor performance):**
```
Name: NODE_ENV
Value: production
Environment: Production
```

```
Name: CACHE_TTL
Value: 1800
Environment: Production, Preview, Development
```

```
Name: MAX_NEWS_ITEMS
Value: 20
Environment: Production, Preview, Development
```

---

## ✅ **Após Configurar as Variáveis**

### **1. Redeploy Obrigatório:**
- Após adicionar as variáveis, faça um **redeploy**
- Vá para **"Deployments"** > clique nos **3 pontinhos** > **"Redeploy"**

### **2. Verificação:**
Teste as seguintes URLs após o deploy:

- **Site**: `https://seu-dominio.vercel.app`
- **API**: `https://seu-dominio.vercel.app/api/noticias`
- **API Supabase**: `https://seu-dominio.vercel.app/api/noticias-supabase`
- **Admin**: `https://seu-dominio.vercel.app/admin`

---

## 🚨 **Troubleshooting**

### **Problema: Deploy falha**
**Solução**:
1. Verifique se todas as 4 variáveis obrigatórias foram adicionadas
2. Confirme que foram aplicadas para **Production, Preview, Development**
3. Force um redeploy

### **Problema: APIs retornam erro 500**
**Solução**:
1. Verifique os logs no Vercel: **Functions** > **View Function Logs**
2. Confirme que as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretas
3. Teste a conexão no Supabase Dashboard

### **Problema: Notícias não carregam**
**Solução**:
1. Teste a API diretamente: `/api/noticias-supabase`
2. Verifique se as tabelas foram criadas no Supabase
3. Confirme que o RLS está configurado corretamente

---

## 📊 **Variáveis por Ambiente**

### **Production (Produção)**
✅ Todas as variáveis (obrigatórias + opcionais)

### **Preview (Staging)**  
✅ Todas as variáveis (para testes)

### **Development (Local)**
✅ Mesmas variáveis (para desenvolvimento local)

---

## 🎯 **Checklist Final**

Após configurar as variáveis:

- [ ] ✅ 4 variáveis obrigatórias adicionadas
- [ ] ✅ Aplicadas para todos os ambientes
- [ ] ✅ Redeploy executado
- [ ] ✅ Site funcionando
- [ ] ✅ APIs respondendo
- [ ] ✅ Admin acessível
- [ ] ✅ Coleta de notícias ativa

---

**🚀 Com as variáveis configuradas, seu Portal Paranavaí News terá acesso completo ao Supabase e todas as funcionalidades avançadas estarão ativas!**
