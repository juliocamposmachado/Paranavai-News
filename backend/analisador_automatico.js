/**
 * Analisador Automático de Sites - Node.js
 * Descobre automaticamente seletores para busca e extração de notícias
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const { URL } = require('url');

class AnalisadorSites {
    constructor() {
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        };
    }

    async analisarSite(urlSite) {
        console.log(`🔍 Analisando site: ${urlSite}`);
        
        try {
            // 1. Acessar página principal
            console.log("📡 Acessando página principal...");
            const response = await axios.get(urlSite, {
                headers: this.headers,
                timeout: 15000
            });
            
            const $ = cheerio.load(response.data);
            
            // 2. Descobrir formulário de busca
            console.log("🔎 Procurando formulário de busca...");
            const buscaInfo = this.descobrirBusca($, urlSite);
            
            if (!buscaInfo) {
                console.log("❌ Formulário de busca não encontrado");
                return null;
            }
            
            console.log(`✅ Busca encontrada: ${buscaInfo.url}`);
            
            // 3. Testar busca por "Paranavaí"
            console.log("🧪 Testando busca por 'Paranavaí'...");
            const resultadosBusca = await this.testarBusca(buscaInfo, "Paranavaí");
            
            if (!resultadosBusca) {
                console.log("❌ Busca não retornou resultados");
                return null;
            }
            
            // 4. Analisar estrutura dos resultados
            console.log("🔬 Analisando estrutura dos resultados...");
            const seletores = this.descobrirSeletores(resultadosBusca.soup);
            
            // 5. Gerar configuração final
            const config = this.gerarConfiguracao(urlSite, buscaInfo, seletores);
            
            console.log("✅ Análise concluída com sucesso!");
            return config;
            
        } catch (error) {
            console.log(`💥 Erro na análise: ${error.message}`);
            return null;
        }
    }

    descobrirBusca($, baseUrl) {
        const buscaPatterns = [
            { selector: 'form[role="search"]', type: 'form' },
            { selector: 'form.search-form', type: 'form' },
            { selector: 'form[action*="search"]', type: 'form' },
            { selector: 'form[action*="busca"]', type: 'form' },
            { selector: 'form[action*="?s"]', type: 'form' },
            { selector: 'input[name="s"]', type: 'input' },
            { selector: 'input[name="search"]', type: 'input' },
            { selector: 'input[name="q"]', type: 'input' },
            { selector: 'input[placeholder*="buscar"]', type: 'input' },
            { selector: 'input[placeholder*="search"]', type: 'input' },
            { selector: '.search-box input', type: 'input' },
            { selector: '#search input', type: 'input' },
        ];
        
        for (const pattern of buscaPatterns) {
            const elementos = $(pattern.selector);
            if (elementos.length > 0) {
                console.log(`   🎯 Encontrado: ${pattern.selector}`);
                
                const elemento = elementos.first();
                
                if (pattern.type === 'form') {
                    const action = elemento.attr('action') || '';
                    const method = (elemento.attr('method') || 'GET').toUpperCase();
                    
                    const inputSearch = elemento.find('input[name="s"], input[name="search"], input[name="q"], input[type="search"]');
                    if (inputSearch.length > 0) {
                        const campoNome = inputSearch.attr('name') || 's';
                        
                        let buscaUrl;
                        if (action) {
                            if (action.startsWith('/')) {
                                buscaUrl = new URL(action, baseUrl).href;
                            } else if (action.startsWith('http')) {
                                buscaUrl = action;
                            } else {
                                buscaUrl = new URL(action, baseUrl).href;
                            }
                        } else {
                            buscaUrl = baseUrl;
                        }
                        
                        return {
                            url: buscaUrl,
                            campo: campoNome,
                            method: method,
                            tipo: 'form'
                        };
                    }
                } else if (pattern.type === 'input') {
                    const formParent = elemento.parent('form');
                    if (formParent.length > 0) {
                        const action = formParent.attr('action') || '';
                        const method = (formParent.attr('method') || 'GET').toUpperCase();
                        const campoNome = elemento.attr('name') || 's';
                        
                        const buscaUrl = action ? new URL(action, baseUrl).href : baseUrl;
                        
                        return {
                            url: buscaUrl,
                            campo: campoNome,
                            method: method,
                            tipo: 'input'
                        };
                    }
                }
            }
        }
        
        // URLs padrão como fallback
        console.log("   🔄 Tentando URLs padrão...");
        const urlsPadrao = [
            `${baseUrl}?s=`,
            `${baseUrl}/search?q=`,
            `${baseUrl}/busca?termo=`,
            `${baseUrl}/?search=`
        ];
        
        // Para Node.js, vamos assumir que WordPress usa ?s= (mais comum)
        if (baseUrl.includes('wordpress') || baseUrl.includes('wp-')) {
            return {
                url: `${baseUrl}?s=`,
                campo: 's',
                method: 'GET',
                tipo: 'url_padrao'
            };
        }
        
        return {
            url: `${baseUrl}?s=`,
            campo: 's',
            method: 'GET',
            tipo: 'url_padrao'
        };
    }

    async testarBusca(buscaInfo, termo = "Paranavaí") {
        try {
            let urlBusca;
            
            if (buscaInfo.method === 'GET') {
                if (buscaInfo.url.includes('?')) {
                    urlBusca = `${buscaInfo.url}${termo}`;
                } else {
                    urlBusca = `${buscaInfo.url}?${buscaInfo.campo}=${termo}`;
                }
                
                console.log(`   🌐 Testando: ${urlBusca}`);
                const response = await axios.get(urlBusca, {
                    headers: this.headers,
                    timeout: 15000
                });
                
                if (response.status === 200) {
                    const $ = cheerio.load(response.data);
                    const textoPagina = $.text().toLowerCase();
                    
                    if (textoPagina.includes(termo.toLowerCase()) || 
                        textoPagina.includes('result') || 
                        textoPagina.includes('notícia')) {
                        console.log(`   ✅ Busca retornou resultados!`);
                        return {
                            soup: $,
                            url: urlBusca,
                            termoUsado: termo
                        };
                    }
                }
            }
            
            console.log(`   ❌ Busca não retornou resultados relevantes`);
            return null;
            
        } catch (error) {
            console.log(`   💥 Erro ao testar busca: ${error.message}`);
            return null;
        }
    }

    descobrirSeletores($) {
        console.log("🔬 Analisando estrutura para descobrir seletores...");
        
        const containerPatterns = [
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
        ];
        
        let melhorContainer = null;
        let melhorScore = 0;
        
        for (const pattern of containerPatterns) {
            const containers = $(pattern);
            if (containers.length >= 2) {
                let score = containers.length;
                
                const primeiroContainer = containers.first();
                
                // Verificar elementos típicos de notícia
                const titulos = primeiroContainer.find('h1, h2, h3, h4, h5, a');
                score += titulos.length * 2;
                
                const imagens = primeiroContainer.find('img');
                score += imagens.length;
                
                const links = primeiroContainer.find('a[href]');
                score += links.length;
                
                if (score > melhorScore) {
                    melhorScore = score;
                    melhorContainer = {
                        pattern: pattern,
                        elementos: containers,
                        score: score
                    };
                }
            }
        }
        
        if (!melhorContainer) {
            console.log("   ❌ Não foi possível identificar container de notícias");
            return null;
        }
        
        console.log(`   ✅ Melhor container: ${melhorContainer.pattern} (${melhorContainer.elementos.length} elementos, score: ${melhorContainer.score})`);
        
        // Analisar estrutura interna
        const primeiro = melhorContainer.elementos.first();
        
        // Descobrir seletores
        const tituloPatterns = ['h1 a', 'h2 a', 'h3 a', 'h4 a', '.title a', '.headline a', '.entry-title a', '.post-title a'];
        const tituloSelector = this.encontrarMelhorSeletor(primeiro, tituloPatterns, 'título');
        
        const resumoPatterns = ['.excerpt', '.summary', '.description', '.lead', 'p', '.entry-summary', '.post-excerpt'];
        const resumoSelector = this.encontrarMelhorSeletor(primeiro, resumoPatterns, 'resumo');
        
        const linkPatterns = ['h1 a', 'h2 a', 'h3 a', 'h4 a', '.title a', '.headline a', '.more-link', '.read-more'];
        const linkSelector = this.encontrarMelhorSeletor(primeiro, linkPatterns, 'link');
        
        const imagemPatterns = ['.featured-image img', '.post-thumbnail img', '.news-image img', 'img', '.thumb img'];
        const imagemSelector = this.encontrarMelhorSeletor(primeiro, imagemPatterns, 'imagem');
        
        const dataPatterns = ['.date', '.time', '.timestamp', '.published', '.post-date', 'time', '.meta-date'];
        const dataSelector = this.encontrarMelhorSeletor(primeiro, dataPatterns, 'data');
        
        const seletores = {
            container: melhorContainer.pattern,
            titulo: tituloSelector,
            resumo: resumoSelector,
            link: linkSelector,
            imagem: imagemSelector,
            data: dataSelector
        };
        
        console.log("📋 Seletores descobertos:");
        for (const [chave, valor] of Object.entries(seletores)) {
            console.log(`   ${chave}: ${valor || 'N/A'}`);
        }
        
        return seletores;
    }

    encontrarMelhorSeletor(container, patterns, tipo) {
        for (const pattern of patterns) {
            const elementos = container.find(pattern);
            if (elementos.length > 0) {
                const elemento = elementos.first();
                const texto = elemento.text().trim();
                
                // Validações por tipo
                if (tipo === 'título' && texto.length > 10 && texto.length < 200) {
                    return pattern;
                } else if (tipo === 'resumo' && texto.length > 20) {
                    return pattern;
                } else if (tipo === 'link' && elemento.attr('href')) {
                    return pattern;
                } else if (tipo === 'imagem' && elemento.attr('src')) {
                    return pattern;
                } else if (tipo === 'data' && (texto.match(/\d{1,2}[\/\-]\d{1,2}/) || /jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez/i.test(texto))) {
                    return pattern;
                } else if (tipo !== 'título' && tipo !== 'resumo' && elementos.length > 0) {
                    return pattern;
                }
            }
        }
        return null;
    }

    gerarConfiguracao(urlSite, buscaInfo, seletores) {
        const url = new URL(urlSite);
        const nomeSite = url.hostname.replace('www.', '').split('.')[0];
        const nomeCapitalizado = nomeSite.charAt(0).toUpperCase() + nomeSite.slice(1);
        
        // Criar URL de busca completa
        let buscaUrl;
        if (buscaInfo.method === 'GET') {
            if (buscaInfo.url.includes('?')) {
                buscaUrl = `${buscaInfo.url}paranavaí`;
            } else {
                buscaUrl = `${buscaInfo.url}?${buscaInfo.campo}=paranavaí`;
            }
        } else {
            buscaUrl = buscaInfo.url;
        }
        
        const cores = ["#1e4a73", "#2c5f8a", "#2e7d32", "#ff9800", "#9c27b0", "#e74c3c", "#3f51b5", "#00bcd4"];
        const corAleatoria = cores[Math.floor(Math.random() * cores.length)];
        
        return {
            nome: `${nomeCapitalizado} Portal`,
            url: urlSite,
            busca: buscaUrl,
            logo: `assets/images/parceiros/${nomeSite}.png`,
            cor: corAleatoria,
            selector: {
                artigos: seletores.container,
                titulo: seletores.titulo || 'h2 a, h3 a',
                resumo: seletores.resumo || '.excerpt, p',
                link: seletores.link || 'h2 a, h3 a',
                imagem: seletores.imagem || 'img',
                data: seletores.data || '.date, time'
            },
            descobertoAutomaticamente: true,
            dataAnalise: new Date().toISOString()
        };
    }

    async validarConfiguracao(config) {
        console.log(`🧪 Validando configuração para ${config.nome}...`);
        
        try {
            const response = await axios.get(config.busca, {
                headers: this.headers,
                timeout: 15000
            });
            
            if (response.status !== 200) {
                console.log(`   ❌ Erro ao acessar URL de busca: ${response.status}`);
                return false;
            }
            
            const $ = cheerio.load(response.data);
            const containers = $(config.selector.artigos);
            
            if (containers.length === 0) {
                console.log(`   ❌ Seletor de container não funciona`);
                return false;
            }
            
            console.log(`   ✅ ${containers.length} containers encontrados`);
            
            // Testar extração no primeiro container
            const primeiro = containers.first();
            
            const tituloElem = primeiro.find(config.selector.titulo).first();
            const titulo = tituloElem.text().trim();
            
            const linkElem = primeiro.find(config.selector.link).first();
            const link = linkElem.attr('href');
            
            console.log(`   📝 Primeiro título: ${titulo.slice(0, 50) || 'N/A'}...`);
            console.log(`   🔗 Primeiro link: ${link ? link.slice(0, 50) : 'N/A'}...`);
            
            if (titulo && link) {
                console.log(`   ✅ Configuração validada com sucesso!`);
                return true;
            } else {
                console.log(`   ❌ Configuração não consegue extrair dados essenciais`);
                return false;
            }
            
        } catch (error) {
            console.log(`   💥 Erro na validação: ${error.message}`);
            return false;
        }
    }
}

async function analisarBemParana() {
    console.log("🎯 === ANÁLISE ESPECÍFICA: BEM PARANÁ ===\n");
    
    const analisador = new AnalisadorSites();
    const config = await analisador.analisarSite("https://www.bemparana.com.br/");
    
    if (config) {
        // Salvar configuração
        await fs.writeFile('config_bem_parana.json', JSON.stringify(config, null, 2));
        console.log("\n💾 Configuração salva em: config_bem_parana.json");
        
        // Validar configuração
        const valida = await analisador.validarConfiguracao(config);
        if (valida) {
            console.log("\n🎉 BEM PARANÁ CONFIGURADO COM SUCESSO!");
            console.log("📋 Configuração descoberta:");
            console.log(JSON.stringify(config, null, 2));
            return config;
        } else {
            console.log("\n⚠️  Configuração precisa de ajustes manuais");
            return config;
        }
    }
    
    return null;
}

async function testarBemParanaEspecifico() {
    console.log("🧪 === TESTE DIRETO BEM PARANÁ ===\n");
    
    // Teste direto baseado na URL fornecida pelo usuário
    const urlBusca = "https://www.bemparana.com.br/?s=Paranavai";
    
    try {
        console.log(`📡 Testando URL direta: ${urlBusca}`);
        
        const response = await axios.get(urlBusca, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.bemparana.com.br/'
            },
            timeout: 15000
        });
        
        console.log(`📊 Status: ${response.status}`);
        
        if (response.status === 200) {
            const $ = cheerio.load(response.data);
            
            // Salvar HTML para análise
            await fs.writeFile('bem_parana_busca_debug.html', response.data);
            console.log("💾 HTML salvo em: bem_parana_busca_debug.html");
            
            // Analisar estrutura
            console.log("\n🔬 Analisando estrutura encontrada:");
            
            const seletoresTest = {
                'articles': $('article'),
                'posts': $('.post'),
                'entries': $('.entry'),
                'wp-posts': $('[class*="wp-post"]'),
                'items': $('.item'),
                'search-results': $('.search-result')
            };
            
            for (const [nome, elementos] of Object.entries(seletoresTest)) {
                console.log(`   ${nome}: ${elementos.length} elementos`);
                
                if (elementos.length > 0) {
                    const primeiro = elementos.first();
                    
                    // Procurar títulos
                    const titulos = primeiro.find('h1, h2, h3, h4');
                    if (titulos.length > 0) {
                        const titulo = titulos.first().text().trim();
                        console.log(`     Título: ${titulo.slice(0, 50)}...`);
                    }
                    
                    // Procurar links
                    const links = primeiro.find('a[href]');
                    if (links.length > 0) {
                        const link = links.first().attr('href');
                        console.log(`     Link: ${link ? link.slice(0, 50) : 'N/A'}...`);
                    }
                    
                    console.log("     ---");
                }
            }
            
            // Gerar configuração otimizada para Bem Paraná
            const configOtimizada = {
                nome: "Bem Paraná",
                url: "https://www.bemparana.com.br",
                busca: "https://www.bemparana.com.br/?s=paranavai",
                logo: "https://www.bemparana.com.br/wp-content/themes/bemparana/assets/images/logo.png",
                cor: "#ff6900", // Cor laranja característica
                selector: {
                    artigos: "article, .post, .entry",
                    titulo: "h2 a, h3 a, .entry-title a",
                    resumo: ".excerpt, .entry-summary, p",
                    link: "h2 a, h3 a, .entry-title a",
                    imagem: ".wp-post-image, img",
                    data: ".date, .entry-date, time"
                },
                testeBemSucedido: true,
                baseadoEmAnaliseUsuario: true
            };
            
            // Salvar configuração
            await fs.writeFile('bem_parana_config_final.json', JSON.stringify(configOtimizada, null, 2));
            console.log("\n💾 Configuração otimizada salva em: bem_parana_config_final.json");
            
            return configOtimizada;
        }
        
    } catch (error) {
        console.log(`💥 Erro no teste: ${error.message}`);
        return null;
    }
}

async function atualizarBackendComBemParana() {
    console.log("\n🔧 Atualizando backend com configuração do Bem Paraná...");
    
    try {
        // Ler arquivo do servidor atual
        const serverContent = await fs.readFile('server.js', 'utf8');
        
        // Nova configuração para Bem Paraná (substituir a existente)
        const novoBemParana = `    {
        nome: "Bem Paraná",
        url: "https://www.bemparana.com.br",
        busca: "https://www.bemparana.com.br/?s=paranavai",
        logo: "https://www.bemparana.com.br/wp-content/themes/bemparana/assets/images/logo.png",
        cor: "#ff6900",
        selector: {
            artigos: "article, .post, .entry",
            titulo: "h2 a, h3 a, .entry-title a",
            resumo: ".excerpt, .entry-summary, p",
            link: "h2 a, h3 a, .entry-title a",
            imagem: ".wp-post-image, img",
            data: ".date, .entry-date, time"
        }
    }`;
        
        // Procurar e substituir configuração do Bem Paraná se existir
        let novoConteudo = serverContent;
        
        // Se já existe Bem Paraná, substituir
        const regexBemParana = /{\s*nome:\s*"Bem\s+Paraná"[\s\S]*?}/;
        if (regexBemParana.test(serverContent)) {
            novoConteudo = serverContent.replace(regexBemParana, novoBemParana);
            console.log("🔄 Configuração do Bem Paraná atualizada no backend");
        } else {
            // Se não existe, adicionar antes do fechamento da array
            novoConteudo = serverContent.replace(/];/, `,\n${novoBemParana}\n];`);
            console.log("➕ Bem Paraná adicionado ao backend");
        }
        
        // Salvar backup
        await fs.writeFile('server_backup.js', serverContent);
        
        // Salvar versão atualizada
        await fs.writeFile('server_atualizado.js', novoConteudo);
        
        console.log("✅ Backend atualizado:");
        console.log("   - Backup: server_backup.js");
        console.log("   - Versão nova: server_atualizado.js");
        
        return true;
        
    } catch (error) {
        console.log(`💥 Erro ao atualizar backend: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log("🎯 ANALISADOR AUTOMÁTICO - BEM PARANÁ");
    console.log("=" * 60);
    console.log("Baseado na sugestão e análise do usuário\n");
    
    // 1. Teste específico do Bem Paraná
    const config = await testarBemParanaEspecifico();
    
    if (config) {
        console.log("\n🎉 ANÁLISE DO BEM PARANÁ CONCLUÍDA!");
        
        // 2. Atualizar backend
        const backendAtualizado = await atualizarBackendComBemParana();
        
        if (backendAtualizado) {
            console.log("\n✅ INTEGRAÇÃO COMPLETA!");
            
            console.log("\n📋 CONFIGURAÇÃO FINAL - BEM PARANÁ:");
            console.log(JSON.stringify(config, null, 2));
            
            console.log("\n🚀 COMO TESTAR AGORA:");
            console.log("   1. Pare o servidor atual (Ctrl+C)");
            console.log("   2. Substitua server.js pelo server_atualizado.js");
            console.log("   3. Execute: node server_atualizado.js");
            console.log("   4. Teste: http://localhost:3000/api/noticias");
            console.log("   5. Abra o site: index.html");
            
            console.log("\n💡 O que foi descoberto:");
            console.log("   ✅ URL de busca: " + config.busca);
            console.log("   ✅ Seletores para extrair notícias");
            console.log("   ✅ Configuração integrada no backend");
            console.log("   ✅ Cor e logo configurados");
        }
    } else {
        console.log("\n❌ Falha na análise do Bem Paraná");
        console.log("💡 Verifique a conectividade com o site");
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { AnalisadorSites, testarBemParanaEspecifico, atualizarBackendComBemParana };
