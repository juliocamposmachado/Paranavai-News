#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisador Automático de Sites de Notícias
Descobre automaticamente seletores para busca e extração de notícias
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin, urlparse
import time

class AnalisadorSites:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.8,en;q=0.5,en-US;q=0.3',
        })
    
    def analisar_site(self, url_site):
        """Analisa um site completo e descobre seus seletores"""
        print(f"🔍 Analisando site: {url_site}")
        
        try:
            # 1. Acessar página principal
            print("📡 Acessando página principal...")
            response = self.session.get(url_site, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 2. Descobrir formulário de busca
            print("🔎 Procurando formulário de busca...")
            busca_info = self.descobrir_busca(soup, url_site)
            
            if not busca_info:
                print("❌ Formulário de busca não encontrado")
                return None
            
            print(f"✅ Busca encontrada: {busca_info['url']}")
            
            # 3. Testar busca por "Paranavaí"
            print("🧪 Testando busca por 'Paranavaí'...")
            resultados_busca = self.testar_busca(busca_info, "Paranavaí")
            
            if not resultados_busca:
                print("❌ Busca não retornou resultados")
                return None
            
            # 4. Analisar estrutura dos resultados
            print("🔬 Analisando estrutura dos resultados...")
            seletores = self.descobrir_seletores(resultados_busca['soup'])
            
            # 5. Gerar configuração final
            config = self.gerar_configuracao(url_site, busca_info, seletores)
            
            print("✅ Análise concluída com sucesso!")
            return config
            
        except Exception as e:
            print(f"💥 Erro na análise: {e}")
            return None
    
    def descobrir_busca(self, soup, base_url):
        """Descobre automaticamente o formulário de busca do site"""
        busca_patterns = [
            # Padrões comuns de formulários de busca
            {'selector': 'form[role="search"]', 'type': 'form'},
            {'selector': 'form.search-form', 'type': 'form'},
            {'selector': 'form[action*="search"]', 'type': 'form'},
            {'selector': 'form[action*="busca"]', 'type': 'form'},
            {'selector': 'form[action*="?s"]', 'type': 'form'},
            {'selector': 'input[name="s"]', 'type': 'input'},
            {'selector': 'input[name="search"]', 'type': 'input'},
            {'selector': 'input[name="q"]', 'type': 'input'},
            {'selector': 'input[placeholder*="buscar"]', 'type': 'input'},
            {'selector': 'input[placeholder*="search"]', 'type': 'input'},
            {'selector': '.search-box input', 'type': 'input'},
            {'selector': '#search input', 'type': 'input'},
        ]
        
        for pattern in busca_patterns:
            elementos = soup.select(pattern['selector'])
            if elementos:
                print(f"   🎯 Encontrado: {pattern['selector']}")
                
                elemento = elementos[0]
                
                if pattern['type'] == 'form':
                    # Analisar formulário
                    action = elemento.get('action', '')
                    method = elemento.get('method', 'GET').upper()
                    
                    # Procurar campo de input dentro do form
                    input_search = elemento.select_one('input[name="s"], input[name="search"], input[name="q"], input[type="search"]')
                    if input_search:
                        campo_nome = input_search.get('name', 's')
                        
                        # Construir URL de busca
                        if action:
                            if action.startswith('/'):
                                busca_url = urljoin(base_url, action)
                            elif action.startswith('http'):
                                busca_url = action
                            else:
                                busca_url = urljoin(base_url, action)
                        else:
                            busca_url = base_url
                        
                        return {
                            'url': busca_url,
                            'campo': campo_nome,
                            'method': method,
                            'tipo': 'form'
                        }
                
                elif pattern['type'] == 'input':
                    # Analisar input direto
                    form_parent = elemento.find_parent('form')
                    if form_parent:
                        action = form_parent.get('action', '')
                        method = form_parent.get('method', 'GET').upper()
                        campo_nome = elemento.get('name', 's')
                        
                        busca_url = urljoin(base_url, action) if action else base_url
                        
                        return {
                            'url': busca_url,
                            'campo': campo_nome,
                            'method': method,
                            'tipo': 'input'
                        }
        
        # Se não encontrou formulário, tentar URLs padrão
        print("   🔄 Tentando URLs padrão...")
        urls_padrao = [
            f"{base_url}?s=",
            f"{base_url}/search?q=", 
            f"{base_url}/busca?termo=",
            f"{base_url}/?search="
        ]
        
        for url_teste in urls_padrao:
            try:
                test_url = url_teste + "test"
                test_response = self.session.get(test_url, timeout=10)
                if test_response.status_code == 200:
                    print(f"   ✅ URL padrão funciona: {url_teste}")
                    return {
                        'url': url_teste,
                        'campo': 's',
                        'method': 'GET',
                        'tipo': 'url_padrao'
                    }
            except:
                continue
        
        return None
    
    def testar_busca(self, busca_info, termo="Paranavaí"):
        """Testa a busca com um termo específico"""
        try:
            if busca_info['method'] == 'GET':
                # Busca via GET
                url_busca = f"{busca_info['url']}{termo}"
                if '?' not in busca_info['url']:
                    url_busca = f"{busca_info['url']}?{busca_info['campo']}={termo}"
                
                print(f"   🌐 Testando: {url_busca}")
                response = self.session.get(url_busca, timeout=15)
                
            else:
                # Busca via POST
                data = {busca_info['campo']: termo}
                print(f"   🌐 POST para: {busca_info['url']}")
                response = self.session.post(busca_info['url'], data=data, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Verificar se há resultados
                texto_pagina = soup.get_text().lower()
                if termo.lower() in texto_pagina or 'result' in texto_pagina or 'notícia' in texto_pagina:
                    print(f"   ✅ Busca retornou resultados!")
                    return {
                        'soup': soup,
                        'url': url_busca if busca_info['method'] == 'GET' else busca_info['url'],
                        'termo_usado': termo
                    }
                else:
                    print(f"   ❌ Busca não retornou resultados relevantes")
                    return None
            else:
                print(f"   ❌ Erro na busca: Status {response.status_code}")
                return None
                
        except Exception as e:
            print(f"   💥 Erro ao testar busca: {e}")
            return None
    
    def descobrir_seletores(self, soup):
        """Descobre automaticamente os seletores para extrair notícias"""
        print("🔬 Analisando estrutura para descobrir seletores...")
        
        # Padrões comuns de estrutura de notícias
        container_patterns = [
            'article',
            '.post',
            '.news-item',
            '.noticia',
            '.content-item',
            '[class*="post"]',
            '[class*="news"]',
            '[class*="article"]',
            '.entry',
            '.item'
        ]
        
        melhor_container = None
        melhor_score = 0
        
        for pattern in container_patterns:
            containers = soup.select(pattern)
            if len(containers) >= 2:  # Pelo menos 2 itens
                score = len(containers)
                
                # Verificar se contém elementos típicos de notícia
                primeiro_container = containers[0]
                
                # Procurar títulos
                titulos = primeiro_container.select('h1, h2, h3, h4, h5, a')
                score += len(titulos) * 2
                
                # Procurar imagens
                imagens = primeiro_container.select('img')
                score += len(imagens)
                
                # Procurar links
                links = primeiro_container.select('a[href]')
                score += len(links)
                
                if score > melhor_score:
                    melhor_score = score
                    melhor_container = {
                        'pattern': pattern,
                        'elementos': containers,
                        'score': score
                    }
        
        if not melhor_container:
            print("   ❌ Não foi possível identificar container de notícias")
            return None
        
        print(f"   ✅ Melhor container: {melhor_container['pattern']} ({len(melhor_container['elementos'])} elementos, score: {melhor_container['score']})")
        
        # Analisar estrutura interna dos containers
        primeiro = melhor_container['elementos'][0]
        
        # Descobrir seletores de título
        titulo_patterns = ['h1 a', 'h2 a', 'h3 a', 'h4 a', '.title a', '.headline a', '.entry-title a', '.post-title a']
        titulo_selector = self.encontrar_melhor_seletor(primeiro, titulo_patterns, 'título')
        
        # Descobrir seletores de resumo/descrição
        resumo_patterns = ['.excerpt', '.summary', '.description', '.lead', 'p', '.entry-summary', '.post-excerpt']
        resumo_selector = self.encontrar_melhor_seletor(primeiro, resumo_patterns, 'resumo')
        
        # Descobrir seletores de link
        link_patterns = ['h1 a', 'h2 a', 'h3 a', 'h4 a', '.title a', '.headline a', '.more-link', '.read-more']
        link_selector = self.encontrar_melhor_seletor(primeiro, link_patterns, 'link')
        
        # Descobrir seletores de imagem
        imagem_patterns = ['.featured-image img', '.post-thumbnail img', '.news-image img', 'img', '.thumb img']
        imagem_selector = self.encontrar_melhor_seletor(primeiro, imagem_patterns, 'imagem')
        
        # Descobrir seletores de data
        data_patterns = ['.date', '.time', '.timestamp', '.published', '.post-date', 'time', '.meta-date']
        data_selector = self.encontrar_melhor_seletor(primeiro, data_patterns, 'data')
        
        seletores = {
            'container': melhor_container['pattern'],
            'titulo': titulo_selector,
            'resumo': resumo_selector,
            'link': link_selector,
            'imagem': imagem_selector,
            'data': data_selector
        }
        
        print(f"📋 Seletores descobertos:")
        for chave, valor in seletores.items():
            print(f"   {chave}: {valor or 'N/A'}")
        
        return seletores
    
    def encontrar_melhor_seletor(self, container, patterns, tipo):
        """Encontra o melhor seletor para um tipo específico"""
        for pattern in patterns:
            elementos = container.select(pattern)
            if elementos:
                elemento = elementos[0]
                texto = elemento.get_text().strip()
                
                # Validações específicas por tipo
                if tipo == 'título' and len(texto) > 10 and len(texto) < 200:
                    return pattern
                elif tipo == 'resumo' and len(texto) > 20:
                    return pattern
                elif tipo == 'link' and elemento.get('href'):
                    return pattern
                elif tipo == 'imagem' and elemento.get('src'):
                    return pattern
                elif tipo == 'data' and (re.search(r'\d{1,2}[/\-]\d{1,2}', texto) or any(mes in texto.lower() for mes in ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'])):
                    return pattern
                elif tipo != 'título' and tipo != 'resumo' and elementos:
                    return pattern
        
        return None
    
    def gerar_configuracao(self, url_site, busca_info, seletores):
        """Gera configuração final para o portal"""
        parsed_url = urlparse(url_site)
        nome_site = parsed_url.netloc.replace('www.', '').split('.')[0].title()
        
        # Criar URL de busca completa
        if busca_info['method'] == 'GET':
            busca_url = f"{busca_info['url']}paranavaí"
            if '?' not in busca_info['url']:
                busca_url = f"{busca_info['url']}?{busca_info['campo']}=paranavaí"
        else:
            busca_url = busca_info['url']
        
        config = {
            "nome": f"{nome_site} Portal",
            "url": url_site,
            "busca": busca_url,
            "logo": f"assets/images/parceiros/{nome_site.lower()}.png",
            "cor": self.gerar_cor_aleatoria(),
            "selectors": seletores,
            "descoberto_automaticamente": True,
            "data_analise": time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return config
    
    def gerar_cor_aleatoria(self):
        """Gera uma cor hexadecimal aleatória mas agradável"""
        cores_predefinidas = [
            "#1e4a73", "#2c5f8a", "#2e7d32", "#ff9800", 
            "#9c27b0", "#e74c3c", "#3f51b5", "#00bcd4",
            "#4caf50", "#ff5722", "#795548", "#607d8b"
        ]
        import random
        return random.choice(cores_predefinidas)
    
    def validar_configuracao(self, config):
        """Valida se a configuração descoberta funciona"""
        print(f"🧪 Validando configuração para {config['nome']}...")
        
        try:
            # Testar busca
            response = self.session.get(config['busca'], timeout=15)
            if response.status_code != 200:
                print(f"   ❌ Erro ao acessar URL de busca: {response.status_code}")
                return False
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Testar seletores
            containers = soup.select(config['selectors']['container'])
            if len(containers) == 0:
                print(f"   ❌ Seletor de container não funciona")
                return False
            
            print(f"   ✅ {len(containers)} containers encontrados")
            
            # Testar extração no primeiro container
            primeiro = containers[0]
            
            titulo = None
            if config['selectors']['titulo']:
                titulo_elem = primeiro.select_one(config['selectors']['titulo'])
                titulo = titulo_elem.get_text().strip() if titulo_elem else None
            
            link = None
            if config['selectors']['link']:
                link_elem = primeiro.select_one(config['selectors']['link'])
                link = link_elem.get('href') if link_elem else None
            
            print(f"   📝 Primeiro título: {titulo[:50] if titulo else 'N/A'}...")
            print(f"   🔗 Primeiro link: {link[:50] if link else 'N/A'}...")
            
            if titulo and link:
                print(f"   ✅ Configuração validada com sucesso!")
                return True
            else:
                print(f"   ❌ Configuração não consegue extrair dados essenciais")
                return False
                
        except Exception as e:
            print(f"   💥 Erro na validação: {e}")
            return False

def analisar_bem_parana():
    """Análise específica do Bem Paraná conforme sugerido"""
    print("🎯 === ANÁLISE ESPECÍFICA: BEM PARANÁ ===\n")
    
    analisador = AnalisadorSites()
    config = analisador.analisar_site("https://www.bemparana.com.br/")
    
    if config:
        # Salvar configuração
        with open('config_bem_parana.json', 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Configuração salva em: config_bem_parana.json")
        
        # Validar configuração
        if analisador.validar_configuracao(config):
            print(f"\n🎉 BEM PARANÁ CONFIGURADO COM SUCESSO!")
            print(f"📋 Configuração descoberta:")
            print(json.dumps(config, ensure_ascii=False, indent=2))
            return config
        else:
            print(f"\n⚠️  Configuração precisa de ajustes manuais")
            return config
    
    return None

def analisar_multiplos_sites():
    """Analisa múltiplos sites automaticamente"""
    print("🌐 === ANÁLISE DE MÚLTIPLOS SITES ===\n")
    
    sites_para_analisar = [
        "https://www.bemparana.com.br/",
        "https://www.paranaportal.com/",
        "https://www.noroesteonline.com.br/",
        # Adicione mais sites conforme necessário
    ]
    
    analisador = AnalisadorSites()
    configuracoes = []
    
    for site in sites_para_analisar:
        print(f"\n{'='*60}")
        config = analisador.analisar_site(site)
        
        if config:
            configuracoes.append(config)
            
            # Validar cada configuração
            if analisador.validar_configuracao(config):
                print(f"✅ {config['nome']}: SUCESSO")
            else:
                print(f"⚠️  {config['nome']}: PRECISA AJUSTES")
        else:
            print(f"❌ {site}: FALHA NA ANÁLISE")
        
        time.sleep(3)  # Pausa entre análises
    
    # Salvar todas as configurações
    if configuracoes:
        with open('configuracoes_descobertas.json', 'w', encoding='utf-8') as f:
            json.dump({
                'total_sites': len(configuracoes),
                'data_analise': time.strftime('%Y-%m-%d %H:%M:%S'),
                'configuracoes': configuracoes
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 {len(configuracoes)} configurações salvas em: configuracoes_descobertas.json")
    
    return configuracoes

def gerar_codigo_integracao(configuracoes):
    """Gera código pronto para integrar as configurações descobertas"""
    print("\n🛠️  Gerando código de integração...")
    
    # Gerar lista de portais para Python
    python_code = "# Portais descobertos automaticamente\nPORTAIS_PARCEIROS = [\n"
    
    for config in configuracoes:
        python_code += f"""    {{
        "nome": "{config['nome']}",
        "url": "{config['url']}",
        "busca": "{config['busca']}",
        "logo": "{config['logo']}",
        "cor": "{config['cor']}",
        "selectors": {{
            "container": "{config['selectors']['container']}",
            "titulo": "{config['selectors']['titulo'] or 'h2 a, h3 a'}",
            "resumo": "{config['selectors']['resumo'] or '.excerpt, p'}",
            "link": "{config['selectors']['link'] or 'h2 a, h3 a'}",
            "imagem": "{config['selectors']['imagem'] or 'img'}",
            "data": "{config['selectors']['data'] or '.date, time'}"
        }}
    }},
"""
    
    python_code += "]\n"
    
    # Salvar código Python
    with open('portais_descobertos.py', 'w', encoding='utf-8') as f:
        f.write(python_code)
    
    # Gerar código JavaScript/Node.js
    js_code = "// Portais descobertos automaticamente\nconst PORTAIS_PARCEIROS = [\n"
    
    for config in configuracoes:
        js_code += f"""    {{
        nome: "{config['nome']}",
        url: "{config['url']}",
        busca: "{config['busca']}",
        logo: "{config['logo']}",
        cor: "{config['cor']}",
        selector: {{
            artigos: "{config['selectors']['container']}",
            titulo: "{config['selectors']['titulo'] or 'h2 a, h3 a'}",
            resumo: "{config['selectors']['resumo'] or '.excerpt, p'}",
            link: "{config['selectors']['link'] or 'h2 a, h3 a'}",
            imagem: "{config['selectors']['imagem'] or 'img'}",
            data: "{config['selectors']['data'] or '.date, time'}"
        }}
    }},
"""
    
    js_code += "];\n\nmodule.exports = PORTAIS_PARCEIROS;"
    
    # Salvar código JavaScript
    with open('portais_descobertos.js', 'w', encoding='utf-8') as f:
        f.write(js_code)
    
    print("📄 Códigos gerados:")
    print("   - portais_descobertos.py (para Python)")
    print("   - portais_descobertos.js (para Node.js)")

if __name__ == "__main__":
    print("🚀 ANALISADOR AUTOMÁTICO DE SITES DE NOTÍCIAS")
    print("=" * 60)
    
    # Opção 1: Analisar apenas o Bem Paraná (conforme sugerido)
    print("\n1️⃣  Analisando Bem Paraná (sugestão do usuário)...")
    bem_parana_config = analisar_bem_parana()
    
    # Opção 2: Análise de múltiplos sites
    print("\n2️⃣  Analisando múltiplos sites...")
    todas_configs = analisar_multiplos_sites()
    
    # Gerar código de integração
    if todas_configs:
        gerar_codigo_integracao(todas_configs)
        
        print(f"\n🎉 ANÁLISE COMPLETA!")
        print(f"✅ {len(todas_configs)} sites analisados com sucesso")
        print(f"📁 Arquivos gerados:")
        print(f"   - configuracoes_descobertas.json")
        print(f"   - portais_descobertos.py") 
        print(f"   - portais_descobertos.js")
        print(f"   - config_bem_parana.json")
        
        print(f"\n💡 Próximos passos:")
        print(f"   1. Revisar as configurações geradas")
        print(f"   2. Integrar no scraper_avancado.py")
        print(f"   3. Atualizar o backend server.js")
        print(f"   4. Testar a coleta de notícias")
    
    else:
        print(f"\n❌ Nenhum site foi analisado com sucesso")
        print(f"💡 Verifique a conectividade e URLs dos sites")
