#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste específico para verificar se o Bing News está funcionando
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime

def testar_bing_news():
    """Testa especificamente a coleta do Bing News"""
    print("🧪 Testando integração com Bing News...")
    
    portal_bing = {
        "nome": "Bing News Paraná",
        "url": "https://www.bing.com",
        "busca": "https://www.bing.com/news/search?q=portal+noticias+parana+paranavaí&qpvt=portal+noticias+parana&FORM=EWRE",
        "logo": "https://www.bing.com/sa/simg/favicon-trans-bg-blue-mg.ico",
        "cor": "#0078d4",
    }
    
    try:
        print(f"🔍 Acessando: {portal_bing['busca']}")
        
        # Headers específicos para Bing
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.bing.com/'
        }
        
        response = requests.get(portal_bing['busca'], headers=headers, timeout=20)
        print(f"📡 Status da resposta: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Acesso ao Bing News bem-sucedido!")
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Testar diferentes seletores
            seletores_teste = [
                ".news-card",
                ".newsitem", 
                "[data-module='NewsArticle']",
                "article",
                ".b_algo",
                ".news"
            ]
            
            print("\n🔎 Testando seletores:")
            for seletor in seletores_teste:
                elementos = soup.select(seletor)
                print(f"   {seletor}: {len(elementos)} elementos encontrados")
                
                if len(elementos) > 0:
                    print(f"     Primeiro elemento: {elementos[0].name if hasattr(elementos[0], 'name') else 'N/A'}")
                    
                    # Testar extração de título
                    primeiro = elementos[0]
                    titulos_possiveis = primeiro.select('h3 a, h4 a, .title a, a[href*="http"]')
                    if titulos_possiveis:
                        titulo = titulos_possiveis[0].get_text().strip()
                        link = titulos_possiveis[0].get('href')
                        print(f"     Título encontrado: {titulo[:50]}...")
                        print(f"     Link encontrado: {link[:50] if link else 'N/A'}...")
            
            # Salvar HTML para análise
            with open('debug_bing_news.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
            print(f"\n💾 HTML salvo em debug_bing_news.html para análise")
            
            # Testar busca de notícias relacionadas ao Paraná
            print(f"\n🔍 Procurando notícias sobre Paraná/Paranavaí...")
            texto_completo = soup.get_text().lower()
            
            termos_relevantes = ['paraná', 'parana', 'paranavaí', 'paranavai', 'noroeste', 'maringá', 'londrina']
            for termo in termos_relevantes:
                if termo in texto_completo:
                    print(f"   ✅ Termo '{termo}' encontrado na página")
                else:
                    print(f"   ❌ Termo '{termo}' não encontrado")
            
            return True
            
        else:
            print(f"❌ Erro no acesso: Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"💥 Erro ao testar Bing News: {e}")
        return False

def testar_url_alternativa():
    """Testa URLs alternativas do Bing News"""
    print("\n🔄 Testando URLs alternativas...")
    
    urls_teste = [
        "https://www.bing.com/news/search?q=paraná+notícias",
        "https://www.bing.com/news/search?q=paranavaí+cidade",
        "https://www.bing.com/news/search?q=paraná+portal+notícias",
        "https://www.bing.com/news/search?q=noroeste+paraná"
    ]
    
    for i, url in enumerate(urls_teste, 1):
        print(f"\n📡 Teste {i}: {url}")
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=15)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                news_cards = soup.select('.news-card, .newsitem, article, .b_algo')
                print(f"   Cards encontrados: {len(news_cards)}")
                
                if len(news_cards) > 0:
                    titulo_elem = news_cards[0].select_one('h3 a, h4 a, .title a')
                    if titulo_elem:
                        titulo = titulo_elem.get_text().strip()
                        print(f"   Primeira notícia: {titulo[:50]}...")
            
            time.sleep(2)  # Pausa entre requests
            
        except Exception as e:
            print(f"   ❌ Erro: {e}")

def gerar_configuracao_otimizada():
    """Gera uma configuração otimizada baseada nos testes"""
    print("\n⚙️  Gerando configuração otimizada...")
    
    config_otimizada = {
        "nome": "Bing News Paraná",
        "url": "https://www.bing.com",
        "busca": "https://www.bing.com/news/search?q=paraná+notícias&FORM=HDRSC6",
        "logo": "https://www.bing.com/sa/simg/favicon-trans-bg-blue-mg.ico",
        "cor": "#0078d4",
        "selectors": {
            "container": ".news-card, .newsitem, .b_algo, article",
            "titulo": "h3 a, h4 a, .title a, a[href*='http']",
            "resumo": ".snippet, .caption, .description, p",
            "link": "h3 a, h4 a, .title a, a[href*='http']",
            "imagem": ".newsimg img, .img img, img",
            "data": ".source .timestamp, .published, time, .cite"
        },
        "tipo": "bing_news",
        "filtros": ["paraná", "parana", "paranavaí", "paranavai", "noroeste", "maringá", "londrina"]
    }
    
    with open('config_bing_otimizada.json', 'w', encoding='utf-8') as f:
        json.dump(config_otimizada, f, ensure_ascii=False, indent=2)
    
    print("📄 Configuração salva em: config_bing_otimizada.json")
    return config_otimizada

if __name__ == "__main__":
    print("🚀 Iniciando testes do Bing News...\n")
    
    # Teste principal
    sucesso = testar_bing_news()
    
    # Testes alternativos
    testar_url_alternativa()
    
    # Gerar configuração otimizada
    config = gerar_configuracao_otimizada()
    
    print(f"\n🎯 Resultado final:")
    print(f"   Teste principal: {'✅ Sucesso' if sucesso else '❌ Falha'}")
    print(f"   Configuração: ✅ Gerada")
    print(f"\n💡 Próximos passos:")
    print(f"   1. Analisar o arquivo debug_bing_news.html")
    print(f"   2. Ajustar seletores conforme necessário")
    print(f"   3. Executar o backend: cd backend && npm start")
    print(f"   4. Testar a API: http://localhost:3000/api/noticias")
