# 🔧 Dashboard Administrativa - Portal Paranavaí News

## 📋 Sobre a Dashboard

A Dashboard Administrativa foi criada para o **Matheus Lima** gerenciar o conteúdo do Portal Paranavaí News antes da publicação. Com esta ferramenta, é possível:

✅ **Visualizar** todos os links e notícias coletados automaticamente  
✅ **Aprovar** conteúdo para publicação no site  
✅ **Rejeitar** conteúdo inadequado ou irrelevante  
✅ **Monitorar** estatísticas de aprovação  
✅ **Gerenciar** o fluxo de publicação completo  

## 🚀 Como Acessar

### 1. Iniciar o Servidor
```bash
# No terminal, dentro da pasta do projeto:
node server_admin.js
```

### 2. Acessar a Dashboard
- **URL**: http://localhost:3000/admin
- **Usuário**: `Matheus`
- **Senha**: `Admin78451200`

### 3. URLs Úteis
- 🏠 **Site Principal**: http://localhost:3000
- 🔧 **Dashboard Admin**: http://localhost:3000/admin
- 📊 **API Pública**: http://localhost:3000/api/noticias
- ⚙️ **API Admin**: http://localhost:3000/api/admin

## 🎯 Funcionalidades da Dashboard

### 🕒 Conteúdo Pendente
- Lista todas as notícias coletadas automaticamente
- Mostra título, resumo, fonte e data
- Ações disponíveis:
  - **👁️ Visualizar**: Ver detalhes completos
  - **✅ Aprovar**: Publicar no site
  - **❌ Rejeitar**: Remover da fila

### ✅ Conteúdo Aprovado
- Histórico de todas as notícias aprovadas
- Filtros por período (hoje, semana, mês)
- Opção de despublicar se necessário

### ❌ Conteúdo Rejeitado
- Lista de notícias rejeitadas com motivos
- Possibilidade de reconsiderar itens rejeitados

### 📊 Estatísticas
- Total de notícias processadas
- Taxa de aprovação
- Gráfico de atividade dos últimos 7 dias
- Métricas de desempenho

## 🔄 Fluxo de Trabalho

### Processo Automático
1. **Coleta Automática**: Sistema busca notícias sobre Paranavaí
2. **Fila de Aprovação**: Conteúdo vai para "Pendentes"
3. **Notificação**: Dashboard mostra novos itens
4. **Aguarda Aprovação**: Matheus decide aprovar/rejeitar

### Processo Manual (Matheus)
1. **Login na Dashboard**: Acesso com credenciais
2. **Revisar Pendentes**: Analisar cada notícia
3. **Visualizar Detalhes**: Ver conteúdo completo
4. **Tomar Decisão**: Aprovar ou rejeitar
5. **Publicação**: Aprovados vão automaticamente para o site

## 📱 Interface da Dashboard

### Tela de Login
- Campo usuário e senha
- Validação de credenciais
- Mensagens de erro/sucesso

### Painel Principal
- **Header**: Informações do usuário logado
- **Menu Lateral**: Navegação entre seções
- **Contadores**: Números de cada categoria
- **Área Principal**: Conteúdo da seção ativa

### Modal de Visualização
- Título completo da notícia
- Imagem (se disponível)
- Resumo expandido
- Link para matéria original
- Botões de aprovar/rejeitar

## ⚡ Funcionalidades Avançadas

### Aprovação Rápida
- Botões diretos nos cartões de notícias
- Confirmação antes da ação
- Notificações de sucesso/erro

### Filtros e Busca
- Filtrar por data de aprovação
- Ordenar por relevância
- Buscar por palavra-chave

### Responsividade
- Funciona em desktop, tablet e mobile
- Layout adaptável
- Touch-friendly em dispositivos móveis

## 🔒 Segurança

### Autenticação
- Login obrigatório para acesso
- Sessão por navegador
- Logout automático por inatividade

### Validação
- Credenciais criptografadas
- Tokens de sessão seguros
- Verificação em cada ação

### Permissões
- Acesso apenas para Matheus
- Ações registradas com timestamp
- Log de todas as ações administrativas

## 📊 API Administrativa

### Endpoints Disponíveis
```
POST /api/admin/login          - Login
GET  /api/admin/pending        - Listar pendentes
POST /api/admin/approve/:id    - Aprovar item
POST /api/admin/reject/:id     - Rejeitar item
GET  /api/admin/approved       - Listar aprovados
GET  /api/admin/rejected       - Listar rejeitados
GET  /api/admin/stats          - Estatísticas
```

### Autenticação da API
- Token Bearer necessário
- Válido por sessão ativa
- Renovação automática

## 🛠️ Configuração Técnica

### Arquivos Criados
```
admin/
├── index.html          # Interface principal
├── css/
│   └── admin.css      # Estilos da dashboard
└── js/
    └── admin.js       # Funcionalidades JavaScript

api/
└── admin.js           # Endpoints da API administrativa

backend/
├── content_processor.js  # Processador automático
└── cache/
    ├── pending_content.json    # Fila de aprovação
    ├── approved_content.json   # Conteúdo aprovado
    └── rejected_content.json   # Conteúdo rejeitado

server_admin.js        # Servidor integrado
```

### Dependências
- Express.js (servidor web)
- Node.js File System (gerenciamento de arquivos)
- Crypto (geração de IDs únicos)

## 🎨 Personalização Visual

### Cores do Tema
- **Primária**: #1e4a73 (Azul Paraná)
- **Secundária**: #2c5f8a (Azul claro)
- **Destaque**: #ffeb3b (Amarelo)
- **Sucesso**: #2e7d32 (Verde)
- **Erro**: #d32f2f (Vermelho)

### Fontes
- **Títulos**: Roboto
- **Texto**: Open Sans
- **Ícones**: Font Awesome

## 🚨 Solução de Problemas

### Erro de Login
- Verificar usuário: `Matheus`
- Verificar senha: `Admin78451200`
- Limpar cache do navegador

### Dashboard não Carrega
- Verificar se servidor está rodando
- Acessar http://localhost:3000/admin
- Verificar console do navegador

### Notícias não Aparecem
- Aguardar processamento automático (5 min)
- Verificar arquivos na pasta `backend/cache/`
- Reiniciar Content Processor

### Performance Lenta
- Limpar cache de navegador
- Verificar conexão de internet
- Reiniciar servidor

## 📞 Suporte

Para dúvidas ou problemas:
- **Desenvolvedor**: Sistema criado especificamente para Matheus Lima
- **Documentação**: Este arquivo (DASHBOARD_ADMIN.md)
- **Logs**: Verificar console do terminal onde roda o servidor

---

## 🎉 Pronto para Usar!

A dashboard está completamente configurada e pronta para uso. Basta:

1. **Executar**: `node server_admin.js`
2. **Acessar**: http://localhost:3000/admin
3. **Login**: Matheus / Admin78451200
4. **Gerenciar**: Aprovar/reprovar conteúdo conforme necessário

**Bom trabalho! 🚀**
