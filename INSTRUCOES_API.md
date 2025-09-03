# 🚀 Portal Paranavaí News - Sistema de APIs e Web Scraping

## 📋 Visão Geral

O Portal Paranavaí News agora conta com um sistema avançado de coleta automática de notícias dos principais portais da região de Paranavaí e Paraná. O sistema funciona de duas formas:

1. **API Backend Node.js** - Para coleta em tempo real
2. **Script Python** - Para coleta offline/agendada

## 🎯 Portais Parceiros Configurados

Com base no site https://www.paranaportal.com/?s=Paranavai, identificamos e configuramos os seguintes portais:

### ✅ Já Configurados:
- **Paraná Portal** - https://www.paranaportal.com
- **Portal da Cidade Paranavaí** - https://paranavai.portaldacidade.com
- **Folha de Paranavaí Online** - https://www.folhadeparanavai.com.br
- **Noroeste Online** - https://www.noroesteonline.com.br
- **Bem Paraná** - https://www.bemparana.com.br

### 📍 Outros Portais da Região (para futuras adições):
- Portal Umuarama
- Folha do Noroeste
- Cidade Portal Maringá
- Portal T1 Notícias
- RPC - Globo Maringá

## 🛠️ Como Configurar

### Opção A: API Backend Node.js (Recomendado)

#### 1. Instalar Node.js
```bash
# Baixe e instale Node.js 16+ em: https://nodejs.org
node --version  # Verificar se instalou
npm --version   # Verificar npm
```

#### 2. Configurar Backend
```bash
cd Portal-Noticias-Parana/backend
npm install     # Instalar dependências
npm start       # Iniciar servidor
```

#### 3. Verificar API
- Abra: http://localhost:3000/api/noticias
- Deve retornar JSON com notícias coletadas

#### 4. Endpoints Disponíveis
```
GET  /api/noticias     - Obter notícias (cache 30min)
POST /api/atualizar    - Forçar atualização
GET  /api/portais      - Listar portais parceiros
GET  /api/estatisticas - Estatísticas do sistema
```

---

### Opção B: Script Python (Alternativo)

#### 1. Instalar Python
```bash
# Baixe Python 3.8+ em: https://python.org
python --version
pip --version
```

#### 2. Instalar Dependências
```bash
cd Portal-Noticias-Parana
pip install requests beautifulsoup4
```

#### 3. Executar Scraper
```bash
python scraper_avancado.py
```

#### 4. Arquivos Gerados
- `cache/noticias_parceiros.json` - Dados das notícias
- `cache/noticias_html.html` - HTML para inserir no site
- `assets/js/noticias-parceiros.js` - JavaScript atualizado

---

## 🎮 Como Usar

### 1. Abrir o Portal
- Abra `index.html` no navegador
- A seção "Notícias dos Portais Parceiros" aparece após "Notícias em Destaque"

### 2. Funcionalidades
- ✅ **Carregamento automático** ao abrir a página
- ✅ **Cache local** (30 minutos)
- ✅ **Atualização automática** (15 minutos)
- ✅ **Botão de atualização manual**
- ✅ **Fallback offline** se API não estiver disponível

### 3. Sistema de Fallback
Se a API não estiver rodando, o portal automaticamente:
- Exibe notícias de exemplo do Paraná Portal
- Mostra aviso para configurar a API
- Funciona offline mantendo a experiência do usuário

## 📊 Monitoramento

### Logs do Backend
```bash
cd backend
npm start

# Logs mostrarão:
# 🔍 Buscando notícias de: Paraná Portal
# ✅ 3 notícias coletadas de Paraná Portal
# 🚀 Portal Paranavaí News API rodando em http://localhost:3000
```

### Console do Navegador
Abra F12 → Console para ver:
```
📂 Usando notícias do cache local
🌐 Buscando notícias da API...
✅ 12 notícias carregadas de 5 portais
```

### Verificar Status
```bash
# Status da API
curl http://localhost:3000/api/estatisticas

# Forçar atualização
curl -X POST http://localhost:3000/api/atualizar
```

## 🎨 Personalização

### Adicionar Novos Portais

1. **Edite** `backend/server.js` ou `scraper_avancado.py`
2. **Adicione** novo objeto na lista `PORTAIS_PARCEIROS`:

```javascript
{
    nome: "Novo Portal",
    url: "https://novoportal.com.br",
    busca: "https://novoportal.com.br/noticias/paranavai",
    logo: "assets/images/parceiros/novo-portal.png",
    cor: "#ff5722",
    selector: {
        artigos: "article, .post",
        titulo: "h2 a, h3 a",
        resumo: ".excerpt, .summary",
        link: "h2 a, h3 a",
        imagem: ".featured-image img",
        data: ".post-date"
    }
}
```

### Modificar Cores por Portal
Cada portal tem sua cor específica definida no campo `cor`. As cores atuais são:
- Paraná Portal: `#1e4a73` (azul escuro)
- Portal da Cidade: `#2c5f8a` (azul médio)
- Folha de Paranavaí: `#ff9800` (laranja)
- Noroeste Online: `#2e7d32` (verde)
- Bem Paraná: `#9c27b0` (roxo)

## ⚙️ Configurações Avançadas

### Intervalo de Atualização
**Backend (server.js):**
```javascript
// Mudar de 30 para 15 minutos
setInterval(async () => {
    await coletarTodasNoticias();
}, 15 * 60 * 1000); // 15 minutos
```

**Frontend (noticias-parceiros.js):**
```javascript
// Mudar cache de 30 para 60 minutos
this.tempoCache = 60 * 60 * 1000; // 60 minutos
```

### Número de Notícias por Portal
**Editar seletores:**
```javascript
// De 3 para 5 notícias por portal
$(portal.selector.artigos).slice(0, 5).each(...)
```

### Timeout de Requests
```javascript
// Aumentar timeout para sites lentos
const response = await axios.get(portal.busca, {
    timeout: 20000, // 20 segundos
    ...
});
```

## 🛠️ Solução de Problemas

### Problema: "API não configurada"
**Solução:**
```bash
cd backend
npm install
npm start
```

### Problema: "Nenhuma notícia coletada"
**Causa:** Site mudou estrutura HTML
**Solução:** Atualizar seletores CSS no código

### Problema: CORS Error
**Solução:** API já configurada com CORS. Se persistir:
```javascript
// Em server.js, verificar:
app.use(cors());
```

### Problema: Imagens não carregam
**Causa:** URLs relativas ou CORS de imagens
**Solução:** Sistema usa placeholder automático

## 📈 Melhorias Futuras

### Planejadas:
- [ ] Interface administrativa web
- [ ] Sistema de categorização automática
- [ ] Detecção de notícias duplicadas
- [ ] RSS feeds dos portais
- [ ] Sistema de alertas por palavra-chave
- [ ] Analytics de cliques nas notícias
- [ ] Cache em banco de dados
- [ ] API de busca por texto

### Sugestões de Funcionalidades:
- **Sistema de moderação** - Revisar notícias antes de publicar
- **Integração com redes sociais** - Compartilhamento automático
- **Sistema de favoritos** - Usuários salvarem notícias
- **Modo escuro** - Interface alternativa
- **PWA** - App instalável no celular

## 📞 Contato e Suporte

**Gerente de Projetos:** Matheus Lima
- 📱 WhatsApp: (44) 99982-3193
- 📧 Email: matheus@paranavainews.com.br
- 🌐 Portfólio: https://matheuslima29mx.46graus.com

**Apoio Institucional:** Deputado Leônidas Fávero Neto
- 🌐 Site: https://doutorleonidaspr.com.br/

---

## 🎉 Conclusão

O sistema está pronto para uso! Com essa implementação, o Portal Paranavaí News se torna um verdadeiro agregador de notícias regionais, oferecendo aos usuários uma visão completa do que acontece na região.

### ✅ O que foi implementado:
- ✅ Sistema completo de web scraping
- ✅ API backend robusta
- ✅ Interface frontend integrada
- ✅ Cache inteligente
- ✅ Fallback para funcionamento offline
- ✅ Design responsivo
- ✅ Animações e interações
- ✅ 5 portais parceiros configurados

### 🚀 Próximos passos recomendados:
1. **Execute o backend** (`npm start`)
2. **Teste o portal** (abra index.html)
3. **Configure hospedagem** (quando necessário)
4. **Adicione mais portais** conforme demanda
5. **Monitore performance** dos scrapers

**Sucesso! O Portal Paranavaí News está pronto para operar! 🎊**
