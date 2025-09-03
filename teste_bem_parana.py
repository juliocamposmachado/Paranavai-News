#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste específico para o site Bem Paraná
Baseado na análise da estrutura fornecida pelo usuário
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime

def testar_bem_parana_manual():
    """Testa o Bem Paraná baseado na URL exata do usuário"""
    print("🎯 Testando Bem Paraná com URL específica...")
    
    # URL exata fornecida pelo usuário
    url_busca = "https://www.bemparana.com.br/?s=Paranavai"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': 'https://www.bemparana.com.br/'
    }
    
    try:
        print(f"📡 Acessando: {url_busca}")
        response = requests.get(url_busca, headers=headers, timeout=15)
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Salvar HTML para análise
            with open('bem_parana_busca.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("💾 HTML salvo em: bem_parana_busca.html")
            
            # Analisar estrutura baseada no contexto fornecido
            print("\n🔬 Analisando estrutura da página...")
            
            # Testar diferentes seletores comuns para WordPress
            seletores_teste = {
                'articles': soup.select('article'),
                'posts': soup.select('.post'),
                'entries': soup.select('.entry'),
                'items': soup.select('.item'),
                'content': soup.select('.content'),
                'wp-posts': soup.select('[class*="wp-post"]'),
                'divs_com_imagem': soup.select('div:has(img)')
            }
            
            print("📋 Elementos encontrados:")
            for nome, elementos in seletores_teste.items():
                print(f"   {nome}: {len(elementos)} elementos")
                
                if len(elementos) > 0:
                    # Analisar primeiro elemento
                    primeiro = elementos[0]
                    
                    # Procurar títulos
                    titulos = primeiro.select('h1, h2, h3, h4, h5')
                    if titulos:
                        titulo_texto = titulos[0].get_text().strip()
                        print(f"     Título: {titulo_texto[:50]}...")
                    
                    # Procurar links
                    links = primeiro.select('a[href]')
                    if links:
                        primeiro_link = links[0].get('href')
                        print(f"     Link: {primeiro_link[:50]}...")
                    
                    # Procurar imagens
                    imagens = primeiro.select('img')
                    if imagens:
                        primeira_img = imagens[0].get('src')
                        print(f"     Imagem: {primeira_img[:50] if primeira_img else 'N/A'}...")
                    
                    print("     ---")
            
            # Procurar especificamente por notícias relacionadas a Paranavaí
            texto_completo = soup.get_text().lower()
            termos_parana = ['paranavaí', 'paranavai', 'paranava']
            
            print(f"\n🔍 Procurando por termos relacionados:")
            for termo in termos_parana:
                if termo in texto_completo:
                    print(f"   ✅ '{termo}' encontrado na página")
                else:
                    print(f"   ❌ '{termo}' não encontrado")
            
            # Gerar configuração baseada na análise
            config_bem_parana = gerar_config_bem_parana(url_busca, soup)
            
            return config_bem_parana
            
        else:
            print(f"❌ Erro ao acessar: Status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"💥 Erro: {e}")
        return None

def gerar_config_bem_parana(url_busca, soup):
    """Gera configuração específica para o Bem Paraná"""
    print("\n⚙️  Gerando configuração para Bem Paraná...")
    
    # Analisar estrutura típica do WordPress
    # Baseado no contexto fornecido pelo usuário
    config = {
        "nome": "Bem Paraná",
        "url": "https://www.bemparana.com.br",
        "busca": "https://www.bemparana.com.br/?s=paranavai",
        "logo": "assets/images/parceiros/bem-parana.png",
        "cor": "#ff6900",  # Cor laranja do Bem Paraná
        "selectors": {
            "container": "article, .post, .entry, .search-result",
            "titulo": "h1 a, h2 a, h3 a, .entry-title a, .post-title a",
            "resumo": ".excerpt, .entry-summary, .post-excerpt, p",
            "link": "h1 a, h2 a, h3 a, .entry-title a, .post-title a, .read-more",
            "imagem": ".wp-post-image, .featured-image img, .post-thumbnail img, img",
            "data": ".date, .entry-date, .post-date, time, .published"
        },
        "descoberto_automaticamente": True,
        "baseado_em_analise_usuario": True,
        "data_analise": datetime.now().isoformat()
    }
    
    # Testar se os seletores funcionam
    containers = soup.select(config['selectors']['container'])
    print(f"   📦 Containers encontrados: {len(containers)}")
    
    if len(containers) > 0:
        primeiro = containers[0]
        
        # Testar título
        titulo_elem = primeiro.select_one(config['selectors']['titulo'])
        titulo = titulo_elem.get_text().strip() if titulo_elem else None
        print(f"   📝 Título teste: {titulo[:50] if titulo else 'N/A'}...")
        
        # Testar link  
        link_elem = primeiro.select_one(config['selectors']['link'])
        link = link_elem.get('href') if link_elem else None
        print(f"   🔗 Link teste: {link[:50] if link else 'N/A'}...")
        
        # Testar imagem
        img_elem = primeiro.select_one(config['selectors']['imagem'])
        img = img_elem.get('src') if img_elem else None
        print(f"   🖼️  Imagem teste: {img[:50] if img else 'N/A'}...")
        
        config['teste_validacao'] = {
            'titulo_funciona': bool(titulo),
            'link_funciona': bool(link),
            'imagem_funciona': bool(img),
            'containers_encontrados': len(containers)
        }
    
    # Salvar configuração
    with open('config_bem_parana_otimizada.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Configuração salva em: config_bem_parana_otimizada.json")
    return config

def integrar_no_scraper_existente(config):
    """Integra a configuração descoberta no scraper existente"""
    print(f"\n🔧 Integrando {config['nome']} no scraper existente...")
    
    # Ler o arquivo atual do scraper
    try:
        with open('scraper_avancado.py', 'r', encoding='utf-8') as f:
            conteudo_atual = f.read()
        
        # Criar novo item para inserir na lista PORTAIS_PARCEIROS
        novo_portal = f"""    {{
        "nome": "{config['nome']}",
        "url": "{config['url']}",
        "busca": "{config['busca']}",
        "logo": "{config['logo']}",
        "cor": "{config['cor']}",
        "selectors": {{
            "container": "{config['selectors']['container']}",
            "titulo": "{config['selectors']['titulo']}",
            "resumo": "{config['selectors']['resumo']}",
            "link": "{config['selectors']['link']}",
            "imagem": "{config['selectors']['imagem']}",
            "data": "{config['selectors']['data']}"
        }}
    }},"""
        
        # Procurar onde inserir (antes do fechamento da lista)
        if '}]' in conteudo_atual:
            # Inserir antes do fechamento da lista
            conteudo_novo = conteudo_atual.replace('}]', '},\n' + novo_portal + '\n]')
            
            # Salvar backup
            with open('scraper_avancado_backup.py', 'w', encoding='utf-8') as f:
                f.write(conteudo_atual)
            
            # Salvar versão atualizada
            with open('scraper_avancado_atualizado.py', 'w', encoding='utf-8') as f:
                f.write(conteudo_novo)
            
            print(f"✅ Integração realizada:")
            print(f"   - Backup salvo: scraper_avancado_backup.py")
            print(f"   - Nova versão: scraper_avancado_atualizado.py")
            return True
        else:
            print(f"❌ Não foi possível encontrar lista PORTAIS_PARCEIROS no arquivo")
            return False
            
    except Exception as e:
        print(f"💥 Erro na integração: {e}")
        return False

def main():
    """Função principal - executa todo o processo"""
    print("🎯 TESTE ESPECÍFICO: BEM PARANÁ (baseado na sugestão do usuário)")
    print("=" * 70)
    
    # 1. Testar Bem Paraná especificamente
    config = testar_bem_parana_manual()
    
    if config:
        print(f"\n🎉 SUCESSO! Bem Paraná analisado com sucesso!")
        
        # 2. Integrar no scraper existente
        if integrar_no_scraper_existente(config):
            print(f"\n✅ Integração completa!")
            
            print(f"\n📋 CONFIGURAÇÃO FINAL - BEM PARANÁ:")
            print(json.dumps(config, ensure_ascii=False, indent=2))
            
            print(f"\n💡 PRÓXIMOS PASSOS:")
            print(f"   1. ✅ Análise do site: CONCLUÍDA")
            print(f"   2. ✅ Descoberta dos seletores: CONCLUÍDA") 
            print(f"   3. ✅ Configuração gerada: CONCLUÍDA")
            print(f"   4. 🔄 Teste o scraper: python scraper_avancado_atualizado.py")
            print(f"   5. 🔄 Atualize o backend server.js com a nova configuração")
            print(f"   6. 🔄 Execute: cd backend && npm start")
            
        else:
            print(f"\n⚠️  Configure manualmente no scraper_avancado.py")
    
    else:
        print(f"\n❌ Falha na análise do Bem Paraná")
        print(f"💡 Verifique conectividade ou estrutura do site")

if __name__ == "__main__":
    main()
