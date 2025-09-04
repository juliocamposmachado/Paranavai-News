# Portal Paranavaí News v2.0 🆕

Portal de notícias oficial da região de Paranavaí e Paraná, desenvolvido sob a gerência de projetos de **Matheus Lima** e com apoio do **Deputado Leônidas Fávero Neto**.

🆕 **NOVA VERSÃO 2.0**: Agora com **Dashboard Administrativa** completa para gestão de conteúdo!

## 🔗 Acesso Rápido

| Área | URL | Credenciais |
|------|-----|-------------|
| 🏠 **Site Principal** | https://paranavai-news.vercel.app | Acesso público |
| 🔧 **Dashboard Admin** | https://paranavai-news.vercel.app/admin | **Usuário**: `Matheus`<br>**Senha**: `Admin78451200` |
| 📊 **API Pública** | https://paranavai-news.vercel.app/api/noticias | Acesso público |
| ⚙️ **API Admin** | https://paranavai-news.vercel.app/api/admin | Token necessário |

## 🎯 Sobre o Projeto

O Portal Paranavaí News é uma plataforma digital dedicada a cobrir notícias locais e regionais, com foco em:

- **Política**: Acompanhamento das ações do Deputado Leônidas e desenvolvimento regional
- **Saúde**: Notícias sobre SUS, hospitais e políticas públicas de saúde
- **Agronegócio**: Informações sobre agricultura, pecuária e desenvolvimento rural
- **Turismo**: Promoção do potencial turístico da região
- **Desenvolvimento Regional**: Cobertura de projetos e investimentos locais

## 👥 Equipe

### Dr. Leônidas Fávero Neto
- **Deputado Estadual do Paraná**
- Cirurgião Geral e Bariátrico
- Ex-vereador de Paranavaí (2017-2024)
- Defensor do SUS
- 🌐 [doutorleonidaspr.com.br](https://doutorleonidaspr.com.br/)

### Matheus Lima
- **Gerente de Projetos**
- **Assessor Parlamentar**
- **Fotógrafo Profissional** (desde 2018)
- Especialista em Fotografia Sensual/Casual Feminina, Alimentos e Eventos
- 🌐 [matheuslima29mx.46graus.com](https://matheuslima29mx.46graus.com)
- 📸 [@matheuslimafotografias](https://www.instagram.com/matheuslimafotografias/)
- 📞 (44) 99982-3193

## 📁 Estrutura do Projeto

```
Portal-Noticias-Parana/
│
├── index.html                 # Página principal
├── server_admin.js            # Servidor Node.js integrado 🆕
├── README.md                  # Documentação
├── DASHBOARD_ADMIN.md         # Manual da Dashboard 🆕
│
├── admin/                     # Dashboard Administrativa 🆕
│   ├── index.html             # Interface da dashboard
│   ├── css/
│   │   └── admin.css          # Estilos da dashboard
│   └── js/
│       └── admin.js           # Lógica da dashboard
│
├── api/                       # APIs do sistema 🆕
│   ├── admin.js               # API administrativa
│   ├── noticias.js            # API pública
│   └── ...
│
├── backend/                   # Sistema backend 🆕
│   ├── content_processor.js   # Processador automático
│   └── cache/                 # Cache de dados
│
├── assets/
│   ├── css/
│   │   └── style.css         # Estilos principais
│   ├── js/
│   │   └── script.js         # Funcionalidades JavaScript
│   └── images/               # Imagens do site
│
└── pages/
    ├── leonidas.html         # Página do Deputado Leônidas
    ├── matheus.html          # Página do Matheus Lima
    ├── politica.html         # Notícias de Política
    └── ...
```

## 🚀 Funcionalidades

### ✅ Site Público (Implementadas)
- ✅ Design responsivo para todos os dispositivos
- ✅ Sistema de navegação intuitivo
- ✅ Seções organizadas por categoria
- ✅ Páginas detalhadas da equipe
- ✅ Formulários de contato funcionais
- ✅ Integração com redes sociais
- ✅ Sistema de notificações
- ✅ Modo de leitura
- ✅ Botão "voltar ao topo"
- ✅ Animações e transições suaves

### 🆕 Dashboard Administrativa (NOVO v2.0)
- ✅ **Login Seguro**: Autenticação para Matheus Lima
- ✅ **Gestão de Conteúdo**: Aprovar/reprovar notícias antes da publicação
- ✅ **Visualização Detalhada**: Modal para revisar conteúdo completo
- ✅ **Estatísticas**: Métricas de aprovação em tempo real
- ✅ **Interface Responsiva**: Funciona em desktop, tablet e mobile
- ✅ **Processamento Automático**: Coleta e organiza conteúdo automaticamente
- ✅ **Sistema de Cache**: Armazenamento eficiente de dados

### 🔌 APIs Disponíveis
- ✅ **API Pública**: `/api/noticias` - Acesso público às notícias aprovadas
- ✅ **API Administrativa**: `/api/admin` - Gestão de conteúdo
- ✅ **Autenticação**: Sistema de tokens seguros
- ✅ **CORS**: Configurado para acesso externo

### 🔧 Melhorias Avançadas
- ✅ Sistema de busca em tempo real
- ✅ Filtros por categoria e data
- ✅ Compartilhamento social
- ✅ Contador de visitantes
- ✅ Modo claro/escuro
- ✅ Lazy loading de imagens
- ✅ Analytics integrado

## 🎨 Design

### Cores do Projeto
- **Azul Paraná**: `#1e4a73` (cor principal)
- **Azul Claro**: `#2c5f8a` (gradientes)
- **Amarelo**: `#ffeb3b` (destaques)
- **Verde Paraná**: `#2e7d32` (elementos de sucesso)
- **Cinza Claro**: `#f8f9fa` (backgrounds)

### Tipografia
- **Títulos**: Roboto (300, 400, 500, 700)
- **Texto**: Open Sans (300, 400, 600, 700)

## 📱 Responsividade

O portal é totalmente responsivo e otimizado para:
- 📱 **Mobile**: 320px - 768px
- 📟 **Tablet**: 768px - 1024px
- 💻 **Desktop**: 1024px+

## 🛠️ Como Usar

### 🏠 Site Público
1. **Acesso**: https://paranavai-news.vercel.app
2. **Navegação**: Use o menu principal para acessar diferentes seções
3. **Contato**: Utilize os formulários ou informações de contato disponíveis
4. **Newsletter**: Cadastre-se para receber notícias por email

### 🔧 Dashboard Administrativa (NOVO) 🆕
1. **Acesso**: https://paranavai-news.vercel.app/admin
2. **Login**: 
   - **Usuário**: `Matheus`
   - **Senha**: `Admin78451200`
3. **Gestão**:
   - Visualizar conteúdo pendente
   - Aprovar/rejeitar notícias
   - Acompanhar estatísticas
   - Gerenciar publicações

### 🛠️ Para Desenvolvedores
```bash
# Clonar repositório
git clone https://github.com/juliocamposmachado/Paranavai-News.git

# Instalar dependências
npm install

# Executar localmente
npm start
# Dashboard disponível em: http://localhost:3000/admin

# Build para produção
npm run build
```

## 📧 Contatos

### Portal Paranavaí News
- **Email**: contato@paranavainews.com.br
- **Telefone**: (44) 99982-3193
- **Localização**: Paranavaí - PR

### Contatos Específicos
- **Redação**: redacao@paranavainews.com.br
- **Comercial**: comercial@paranavainews.com.br
- **Denúncias**: denuncia@paranavainews.com.br

## 🌐 Links Importantes

- [Site Oficial Deputado Leônidas](https://doutorleonidaspr.com.br/)
- [Portfólio Matheus Lima](https://matheuslima29mx.46graus.com)
- [Instagram Matheus Lima](https://www.instagram.com/matheuslimafotografias/)
- [Facebook Matheus Lima](https://www.facebook.com/theus2lima/)

## 🔧 Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos, Flexbox, Grid
- **JavaScript**: Interatividade e funcionalidades
- **Font Awesome**: Ícones
- **Google Fonts**: Tipografia

### Backend (NOVO v2.0) 🆕
- **Node.js**: Servidor backend
- **Express.js**: Framework web
- **Cheerio**: Web scraping
- **Axios**: Requisições HTTP
- **Crypto**: Segurança e autenticação

### Deploy e DevOps
- **Vercel**: Hospedagem e deploy automático
- **Git**: Controle de versão
- **npm**: Gerenciamento de dependências

## 📝 Categorias de Conteúdo

### Política
- Ações do Deputado Leônidas
- Projetos de lei em tramitação
- Recursos conquistados para a região
- Assembleia Legislativa do Paraná

### Saúde
- Defesa do SUS
- Infraestrutura hospitalar
- Programas de saúde pública
- Especialidades médicas

### Agronegócio
- Agricultura regional
- Pecuária
- Tecnologia rural
- Sustentabilidade

### Turismo
- Atrativos regionais
- Eventos culturais
- Infraestrutura turística
- Promoção regional

## 🎯 Objetivos do Portal

1. **Informar** a população sobre políticas públicas e desenvolvimento regional
2. **Promover** transparência nas ações governamentais
3. **Conectar** cidadãos com seus representantes
4. **Desenvolver** o turismo e economia local
5. **Fortalecer** a democracia através da informação

## 📊 Métricas de Sucesso

- Número de visitantes únicos
- Tempo de permanência no site
- Engajamento em redes sociais
- Formulários de contato preenchidos
- Newsletter subscriptions

## 🔒 Política de Privacidade

O portal respeita a privacidade dos usuários e segue as diretrizes da LGPD (Lei Geral de Proteção de Dados). Todos os dados coletados são utilizados exclusivamente para:

- Responder contatos e solicitações
- Envio de newsletter (quando autorizado)
- Melhoramento dos serviços oferecidos

## 📄 Licença

Este projeto foi desenvolvido para uso do Portal Paranavaí News. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para a região de Paranavaí - PR**

*Gerência de Projetos: Matheus Lima*  
*Apoio Institucional: Deputado Leônidas Fávero Neto*
