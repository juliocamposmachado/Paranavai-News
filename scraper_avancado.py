#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Web Scraper Avançado para Portal Paranavaí News
Coleta notícias de portais parceiros da região
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
import os
import re

# Lista de portais parceiros da região
PORTAIS_PARCEIROS = [
    {
        "nome": "Paraná Portal",
        "url": "https://www.paranaportal.com",
        "busca": "https://www.paranaportal.com/?s=Paranavai",
        "logo": "https://www.paranaportal.com/wp-content/uploads/2023/01/logo-parana-portal.png",
        "cor": "#1e4a73",
        "selectors": {
            "container": "article, .post",
            "titulo": "h2 a, h3 a, .entry-title a",
            "resumo": ".excerpt, .entry-summary, p",
            "link": "h2 a, h3 a, .entry-title a",
            "imagem": ".post-thumbnail img, .featured-image img, img",
            "data": ".date, .entry-date, time"
        }
    },
    {
        "nome": "Portal da Cidade Paranavaí",
        "url": "https://paranavai.portaldacidade.com",
        "busca": "https://paranavai.portaldacidade.com/noticias",
        "logo": "assets/images/parceiros/portal-cidade.png",
        "cor": "#2c5f8a",
        "selectors": {
            "container": ".news-item, article, .post",
            "titulo": ".news-title a, h2 a, h3 a",
            "resumo": ".news-summary, .excerpt, .summary",
            "link": ".news-title a, h2 a, h3 a",
            "imagem": ".news-image img, .post-thumbnail img",
            "data": ".news-date, .date"
        }
    },
    {
        "nome": "Folha de Paranavaí Online",
        "url": "https://www.folhadeparanavai.com.br",
        "busca": "https://www.folhadeparanavai.com.br/categoria/noticias",
        "logo": "assets/images/parceiros/folha-paranavai.png",
        "cor": "#ff9800",
        "selectors": {
            "container": ".post, article, .noticia",
            "titulo": ".post-title a, h2 a, .title a",
            "resumo": ".post-excerpt, .excerpt, .resumo",
            "link": ".post-title a, h2 a, .title a",
            "imagem": ".post-image img, .featured-image img",
            "data": ".post-date, .date"
        }
    },
    {
        "nome": "Noroeste Online",
        "url": "https://www.noroesteonline.com",
        "busca": "https://www.noroesteonline.com/",
        "logo": "assets/images/parceiros/noroeste-online.png",
        "cor": "#2e7d32",
        "selectors": {
            "container": ".post-item, article, .news",
            "titulo": ".post-title a, h2 a, .headline a",
            "resumo": ".post-excerpt, .excerpt, .lead",
            "link": ".post-title a, h2 a, .headline a",
            "imagem": ".post-thumb img, .thumbnail img",
            "data": ".post-date, .timestamp"
        }
    },
    {
        "nome": "Bem Paraná",
        "url": "https://www.bemparana.com.br",
        "busca": "https://www.bemparana.com.br/?s=paranavai",
        "logo": "assets/images/parceiros/bem-parana.png",
        "cor": "#9c27b0",
        "selectors": {
            "container": "article, .post, .news-item",
            "titulo": "h2 a, h3 a, .title a",
            "resumo": ".excerpt, .summary, .lead",
            "link": "h2 a, h3 a, .title a",
            "imagem": ".featured-image img, .post-image img",
            "data": ".date, .time"
        }
    },
    {
        "nome": "Bing News Paraná",
        "url": "https://www.bing.com",
        "busca": "https://www.bing.com/news/search?q=portal+noticias+parana+paranavaí&qpvt=portal+noticias+parana&FORM=EWRE",
        "logo": "https://www.bing.com/sa/simg/favicon-trans-bg-blue-mg.ico",
        "cor": "#0078d4",
        "selectors": {
            "container": ".news-card, .newsitem, [data-module='NewsArticle']",
            "titulo": "[data-module='NewsArticle'] h3 a, .title a, h4 a",
            "resumo": ".snippet, .caption, .description",
            "link": "[data-module='NewsArticle'] h3 a, .title a, h4 a",
            "imagem": ".newsimg img, .img img, .media img",
            "data": ".source .timestamp, .published, time"
        },
        "tipo": "bing_news"
    },
    {
        "nome": "Portal Tri Notícias",
        "url": "https://www.portaltrinoticias.com.br",
        "busca": "https://www.portaltrinoticias.com.br/?s=paranavai",
        "logo": "assets/images/parceiros/portal-tri.png",
        "cor": "#e74c3c",
        "selectors": {
            "container": "article, .post, .news-item",
            "titulo": "h2 a, h3 a, .entry-title a",
            "resumo": ".excerpt, .entry-summary",
            "link": "h2 a, h3 a, .entry-title a",
            "imagem": ".post-thumbnail img, .featured-img img",
            "data": ".post-date, .entry-date"
        }
    }
]

def criar_sessao():
    """Cria uma sessão HTTP com headers apropriados"""
    sessao = requests.Session()
    sessao.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.8,en;q=0.5,en-US;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    })
    return sessao

def limpar_texto(texto):
    """Remove caracteres especiais e limpa o texto"""
    if not texto:
        return ""
    
    # Remove espaços extras e quebras de linha
    texto = re.sub(r'\s+', ' ', texto.strip())
    
    # Remove caracteres especiais problemáticos
    texto = texto.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    
    return texto

def extrair_noticias_bing(portal, sessao):
    """Extrai notícias específicamente do Bing News"""
    try:
        print(f"🔍 Coletando de: {portal['nome']} (Bing News)")
        
        # Headers específicos para Bing
        headers_bing = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.bing.com/'
        }
        
        response = requests.get(portal['busca'], headers=headers_bing, timeout=20)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        noticias = []
        
        # Seletores específicos do Bing News
        news_cards = soup.select('.news-card, .newsitem, [aria-label*="notícia"], [data-module="NewsArticle"]')[:5]
        
        if not news_cards:
            # Fallback para outros seletores do Bing
            news_cards = soup.select('article, .b_algo, .news')[:5]
        
        for card in news_cards:
            try:
                # Título (múltiplas tentativas)
                titulo_elem = (
                    card.select_one('h3 a') or 
                    card.select_one('h4 a') or
                    card.select_one('.title a') or
                    card.select_one('a[href*="http"]')
                )
                titulo = limpar_texto(titulo_elem.get_text()) if titulo_elem else None
                
                # Link
                link = titulo_elem.get('href') if titulo_elem else None
                
                # Resumo
                resumo_elem = (
                    card.select_one('.snippet') or
                    card.select_one('.caption') or
                    card.select_one('.description') or
                    card.select_one('p')
                )
                resumo = limpar_texto(resumo_elem.get_text()) if resumo_elem else None
                
                # Imagem
                imagem_elem = (
                    card.select_one('.newsimg img') or
                    card.select_one('.img img') or
                    card.select_one('img')
                )
                imagem = None
                if imagem_elem:
                    imagem = imagem_elem.get('src') or imagem_elem.get('data-src')
                    # Validar se é uma imagem real
                    if imagem and any(ext in imagem.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                        if imagem.startswith('//'):
                            imagem = 'https:' + imagem
                        elif imagem.startswith('/'):
                            imagem = 'https://www.bing.com' + imagem
                
                # Data/fonte
                data_elem = (
                    card.select_one('.source .timestamp') or
                    card.select_one('.published') or
                    card.select_one('time') or
                    card.select_one('.cite')
                )
                data = limpar_texto(data_elem.get_text()) if data_elem else "Recente"
                
                # Validar notícia
                if titulo and link and len(titulo) > 10:
                    # Normalizar link
                    if link.startswith('//'):
                        link = 'https:' + link
                    elif not link.startswith('http'):
                        link = 'https://www.bing.com' + link
                    
                    # Filtrar notícias relevantes para Paraná/Paranavaí
                    titulo_lower = titulo.lower()
                    resumo_lower = (resumo or '').lower()
                    
                    if any(termo in titulo_lower or termo in resumo_lower for termo in 
                           ['paraná', 'parana', 'paranavaí', 'paranavai', 'noroeste', 'maringá', 'londrina']):
                        
                        noticia = {
                            "titulo": titulo,
                            "resumo": resumo or titulo[:150] + "...",
                            "link": link,
                            "imagem": imagem or f"https://via.placeholder.com/400x300/{portal['cor'][1:]}/ffffff?text=Bing+News",
                            "data": data,
                            "fonte": portal['nome'],
                            "corFonte": portal['cor'],
                            "logoFonte": portal['logo'],
                            "coletadoEm": datetime.now().isoformat(),
                            "tipoFonte": "bing_news"
                        }
                        
                        noticias.append(noticia)
                        
            except Exception as e:
                print(f"   ⚠️  Erro ao processar card Bing: {e}")
                continue
        
        print(f"   ✅ {len(noticias)} notícias relevantes coletadas do Bing News")
        return noticias
        
    except Exception as e:
        print(f"   ❌ Erro ao acessar Bing News: {e}")
        return []

def extrair_noticias_portal(portal, sessao):
    """Extrai notícias de um portal específico"""
    try:
        # Verificar se é Bing News (tratamento especial)
        if portal.get('tipo') == 'bing_news':
            return extrair_noticias_bing(portal, sessao)
        
        print(f"🔍 Coletando de: {portal['nome']}")
        
        response = sessao.get(portal['busca'], timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        noticias = []
        
        # Buscar artigos
        containers = soup.select(portal['selectors']['container'])[:5]  # Máximo 5 por portal
        
        for container in containers:
            try:
                # Extrair dados
                titulo_elem = container.select_one(portal['selectors']['titulo'])
                titulo = limpar_texto(titulo_elem.get_text()) if titulo_elem else None
                
                link_elem = container.select_one(portal['selectors']['link'])
                link = link_elem.get('href') if link_elem else None
                
                resumo_elem = container.select_one(portal['selectors']['resumo'])
                resumo = limpar_texto(resumo_elem.get_text()) if resumo_elem else titulo
                
                imagem_elem = container.select_one(portal['selectors']['imagem'])
                imagem = imagem_elem.get('src') or imagem_elem.get('data-src') if imagem_elem else None
                
                data_elem = container.select_one(portal['selectors']['data'])
                data = limpar_texto(data_elem.get_text()) if data_elem else "Hoje"
                
                # Validar dados essenciais
                if titulo and link:
                    # Normalizar URLs para garantir links completos
                    if link and not link.startswith('http'):
                        if link.startswith('/'):
                            link = portal['url'] + link
                        else:
                            link = portal['url'] + '/' + link
                    
                    # Garantir que o link seja válido e acessível
                    try:
                        from urllib.parse import urljoin
                        link = urljoin(portal['url'], link)
                    except:
                        link = portal['url']  # Fallback para URL do portal
                    
                    if imagem and not imagem.startswith('http'):
                        if imagem.startswith('/'):
                            imagem = portal['url'] + imagem
                        else:
                            imagem = portal['url'] + '/' + imagem
                    
                    # Limitar tamanho do resumo
                    if resumo and len(resumo) > 250:
                        resumo = resumo[:250] + "..."
                    
                    noticia = {
                        "titulo": titulo,
                        "resumo": resumo or titulo[:150] + "...",
                        "link": link,  # Link específico da notícia do portal parceiro
                        "imagem": imagem or f"https://via.placeholder.com/400x300/{portal['cor'][1:]}/ffffff?text={portal['nome'].replace(' ', '+')}",
                        "data": data,
                        "fonte": portal['nome'],
                        "corFonte": portal['cor'],
                        "logoFonte": portal['logo'],
                        "coletadoEm": datetime.now().isoformat(),
                        "urlOriginal": link  # Para garantir que temos o link original
                    }
                    
                    noticias.append(noticia)
                    
            except Exception as e:
                print(f"   ⚠️  Erro ao processar container: {e}")
                continue
        
        print(f"   ✅ {len(noticias)} notícias coletadas de {portal['nome']}")
        return noticias
        
    except Exception as e:
        print(f"   ❌ Erro ao acessar {portal['nome']}: {e}")
        return []

def coletar_todas_noticias():
    """Coleta notícias de todos os portais"""
    print("🚀 Iniciando coleta de notícias dos portais parceiros...")
    
    sessao = criar_sessao()
    todas_noticias = []
    
    for portal in PORTAIS_PARCEIROS:
        noticias = extrair_noticias_portal(portal, sessao)
        todas_noticias.extend(noticias)
        
        # Pausa entre requests
        time.sleep(2)
    
    # Embaralhar notícias para variedade
    import random
    random.shuffle(todas_noticias)
    
    # Limitar a 15 notícias
    todas_noticias = todas_noticias[:15]
    
    print(f"\n✅ Total coletado: {len(todas_noticias)} notícias")
    return todas_noticias

def salvar_noticias(noticias):
    """Salva notícias em arquivo JSON"""
    data_coleta = {
        "ultimaAtualizacao": datetime.now().isoformat(),
        "totalNoticias": len(noticias),
        "portaisConsultados": len(PORTAIS_PARCEIROS),
        "noticias": noticias
    }
    
    # Criar diretório se não existir
    os.makedirs('cache', exist_ok=True)
    
    # Salvar em JSON
    with open('cache/noticias_parceiros.json', 'w', encoding='utf-8') as f:
        json.dump(data_coleta, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Notícias salvas em: cache/noticias_parceiros.json")
    
    return data_coleta

def gerar_html_noticias(noticias):
    """Gera HTML para inserir nas notícias em destaque"""
    html_cards = []
    
    for noticia in noticias:
        card_html = f'''
        <article class="news-card parceiro-card" data-fonte="{noticia['fonte']}">
            <div class="news-image">
                <img src="{noticia['imagem']}" alt="{noticia['titulo']}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300/1e4a73/ffffff?text=Sem+Imagem'">
                <span class="category" style="background: {noticia['corFonte']}">{noticia['fonte']}</span>
                <div class="fonte-logo">
                    <img src="{noticia['logoFonte']}" alt="{noticia['fonte']}" class="logo-parceiro">
                </div>
            </div>
            <div class="news-content">
                <h3><a href="{noticia['link']}" target="_blank" rel="noopener">{noticia['titulo']}</a></h3>
                <p>{noticia['resumo']}</p>
                <div class="news-meta">
                    <span class="date"><i class="fas fa-calendar"></i> {noticia['data']}</span>
                    <span class="source"><i class="fas fa-external-link-alt"></i> {noticia['fonte']}</span>
                </div>
            </div>
        </article>'''
        
        html_cards.append(card_html)
    
    return '\n'.join(html_cards)

def criar_javascript_integracao():
    """Cria JavaScript para integração com o frontend"""
    js_code = '''
// Integração com API de Notícias Parceiras
class NoticiasParcerias {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.cacheLocal = 'noticias_parceiros';
        this.tempoCache = 30 * 60 * 1000; // 30 minutos
    }

    async carregarNoticias() {
        try {
            // Verificar cache local primeiro
            const cache = this.obterCache();
            if (cache && this.cacheValido(cache)) {
                console.log('📂 Usando notícias do cache local');
                this.exibirNoticias(cache.noticias);
                return cache.noticias;
            }

            // Buscar da API
            console.log('🌐 Buscando notícias da API...');
            const response = await fetch(`${this.apiUrl}/noticias`);
            const data = await response.json();

            if (data.success) {
                this.salvarCache(data);
                this.exibirNoticias(data.noticias);
                return data.noticias;
            } else {
                throw new Error(data.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar notícias:', error);
            this.exibirNoticiasOffline();
            return [];
        }
    }

    obterCache() {
        try {
            const cache = localStorage.getItem(this.cacheLocal);
            return cache ? JSON.parse(cache) : null;
        } catch {
            return null;
        }
    }

    cacheValido(cache) {
        if (!cache || !cache.timestamp) return false;
        const agora = Date.now();
        return (agora - cache.timestamp) < this.tempoCache;
    }

    salvarCache(data) {
        const cache = {
            ...data,
            timestamp: Date.now()
        };
        localStorage.setItem(this.cacheLocal, JSON.stringify(cache));
    }

    exibirNoticias(noticias) {
        const container = document.getElementById('noticias-parceiros');
        if (!container) {
            console.warn('Container de notícias parceiros não encontrado');
            return;
        }

        container.innerHTML = '';

        noticias.forEach(noticia => {
            const card = this.criarCardNoticia(noticia);
            container.appendChild(card);
        });

        // Adicionar contador de fontes
        this.adicionarContadorFontes(noticias);
        
        // Animar entrada dos cards
        this.animarCards();
    }

    criarCardNoticia(noticia) {
        const card = document.createElement('article');
        card.className = 'news-card parceiro-card';
        card.setAttribute('data-fonte', noticia.fonte);

        card.innerHTML = `
            <div class="news-image">
                <img src="${noticia.imagem}" alt="${noticia.titulo}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/400x300/1e4a73/ffffff?text=Sem+Imagem'">
                <span class="category" style="background: ${noticia.corFonte || '#1e4a73'}">${noticia.fonte}</span>
                <div class="fonte-logo">
                    <img src="${noticia.logoFonte}" alt="${noticia.fonte}" class="logo-parceiro" 
                         onerror="this.style.display='none'">
                </div>
            </div>
            <div class="news-content">
                <h3><a href="${noticia.link}" target="_blank" rel="noopener noreferrer">${noticia.titulo}</a></h3>
                <p>${noticia.resumo}</p>
                <div class="news-meta">
                    <span class="date"><i class="fas fa-calendar"></i> ${noticia.data}</span>
                    <span class="source"><i class="fas fa-external-link-alt"></i> ${noticia.fonte}</span>
                </div>
            </div>
        `;

        return card;
    }

    adicionarContadorFontes(noticias) {
        const fontes = [...new Set(noticias.map(n => n.fonte))];
        const contador = document.createElement('div');
        contador.className = 'fontes-contador';
        contador.innerHTML = `
            <div class="contador-info">
                <i class="fas fa-globe"></i>
                <span>Notícias de ${fontes.length} portais parceiros</span>
                <small>Atualizado há poucos minutos</small>
            </div>
        `;
        
        const container = document.getElementById('noticias-parceiros');
        if (container) {
            container.insertAdjacentElement('beforebegin', contador);
        }
    }

    animarCards() {
        const cards = document.querySelectorAll('.parceiro-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    exibirNoticiasOffline() {
        const container = document.getElementById('noticias-parceiros');
        if (container) {
            container.innerHTML = `
                <div class="offline-message">
                    <i class="fas fa-wifi"></i>
                    <h3>Notícias Indisponíveis</h3>
                    <p>Não foi possível carregar as notícias dos portais parceiros. Tente novamente em alguns minutos.</p>
                    <button onclick="noticiasParcerias.carregarNoticias()" class="btn-retry">
                        <i class="fas fa-refresh"></i> Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    async forcarAtualizacao() {
        try {
            console.log('🔄 Forçando atualização das notícias...');
            const response = await fetch(`${this.apiUrl}/atualizar`, { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Notícias atualizadas com sucesso');
                // Limpar cache local e recarregar
                localStorage.removeItem(this.cacheLocal);
                await this.carregarNoticias();
            }
        } catch (error) {
            console.error('❌ Erro ao forçar atualização:', error);
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.noticiasParcerias = new NoticiasParcerias();
    
    // Carregar notícias automaticamente
    window.noticiasParcerias.carregarNoticias();
    
    // Atualizar a cada 15 minutos
    setInterval(() => {
        window.noticiasParcerias.carregarNoticias();
    }, 15 * 60 * 1000);
});
'''
    
    # Salvar JavaScript
    with open('assets/js/noticias-parceiros.js', 'w', encoding='utf-8') as f:
        f.write(js_code)
    
    print("📄 JavaScript de integração criado: assets/js/noticias-parceiros.js")

def main():
    """Função principal"""
    try:
        # Coletar notícias
        noticias = coletar_todas_noticias()
        
        if noticias:
            # Salvar dados
            dados = salvar_noticias(noticias)
            
            # Gerar HTML
            html = gerar_html_noticias(noticias)
            with open('cache/noticias_html.html', 'w', encoding='utf-8') as f:
                f.write(html)
            
            # Criar JavaScript
            criar_javascript_integracao()
            
            print(f"\n🎉 Coleta finalizada com sucesso!")
            print(f"📊 Estatísticas:")
            print(f"   - Total de notícias: {len(noticias)}")
            print(f"   - Portais consultados: {len(PORTAIS_PARCEIROS)}")
            print(f"   - Última atualização: {dados['ultimaAtualizacao']}")
            print(f"   - Arquivo JSON: cache/noticias_parceiros.json")
            print(f"   - Arquivo HTML: cache/noticias_html.html")
            print(f"   - JavaScript: assets/js/noticias-parceiros.js")
            
            # Exibir resumo das fontes
            fontes = {}
            for noticia in noticias:
                fonte = noticia['fonte']
                if fonte not in fontes:
                    fontes[fonte] = 0
                fontes[fonte] += 1
            
            print(f"\n📰 Notícias por fonte:")
            for fonte, count in fontes.items():
                print(f"   - {fonte}: {count} notícias")
                
        else:
            print("❌ Nenhuma notícia foi coletada")
            
    except Exception as e:
        print(f"💥 Erro crítico: {e}")
        return False
    
    return True

if __name__ == "__main__":
    # Instalar dependências se necessário
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError:
        print("📦 Instalando dependências...")
        os.system("pip install requests beautifulsoup4")
        import requests
        from bs4 import BeautifulSoup
    
    main()
