/**
 * Scraper de Contatos Políticos - Assembleia Legislativa do Paraná
 * Extrai informações de contato dos deputados e políticos do Paraná
 * Base URL: https://transparencia.assembleia.pr.leg.br/
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class ContactsScraper {
    constructor() {
        this.baseUrl = 'https://transparencia.assembleia.pr.leg.br';
        this.searchUrl = 'https://transparencia.assembleia.pr.leg.br/busca';
        this.cacheDir = path.join(__dirname, 'cache', 'contacts');
        this.contacts = [];
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    async init() {
        // Cria diretório de cache se não existir
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.log('Cache directory already exists or created');
        }
    }

    /**
     * Busca deputados por termo
     */
    async searchDeputados(searchTerm = '') {
        try {
            console.log(`🔍 Buscando deputados: ${searchTerm || 'todos'}`);
            
            const params = {
                termo: searchTerm,
                tipo: 'deputado'
            };

            const response = await axios.get(this.searchUrl, {
                params,
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
                },
                timeout: 30000
            });

            const $ = cheerio.load(response.data);
            const deputies = [];

            // Analisa a estrutura da página de resultados
            $('.resultado-item, .deputado-card, .card-deputado').each((index, element) => {
                const deputy = this.extractDeputyInfo($, element);
                if (deputy) {
                    deputies.push(deputy);
                }
            });

            console.log(`✅ Encontrados ${deputies.length} deputados`);
            return deputies;

        } catch (error) {
            console.error('❌ Erro ao buscar deputados:', error.message);
            return [];
        }
    }

    /**
     * Extrai informações do deputado do elemento HTML
     */
    extractDeputyInfo($, element) {
        try {
            const $el = $(element);
            
            const name = $el.find('.nome, .deputado-nome, h3, h4').first().text().trim();
            const party = $el.find('.partido, .deputado-partido').text().trim();
            const phone = $el.find('.telefone, .contato-telefone').text().trim();
            const email = $el.find('.email, .contato-email').text().trim();
            const gabinete = $el.find('.gabinete, .endereco').text().trim();
            
            // Link para página de detalhes
            const detailLink = $el.find('a').attr('href');
            
            if (name) {
                return {
                    id: this.generateId(name),
                    name: this.cleanText(name),
                    position: 'deputado',
                    party: this.cleanText(party),
                    city: 'Curitiba', // Sede da Assembleia
                    phone: this.cleanPhone(phone),
                    email: this.cleanEmail(email),
                    office: this.cleanText(gabinete),
                    detailUrl: detailLink ? this.baseUrl + detailLink : null,
                    source: 'assembleia_pr',
                    lastUpdate: new Date().toISOString(),
                    verified: true
                };
            }
        } catch (error) {
            console.error('Erro ao extrair info do deputado:', error.message);
        }
        return null;
    }

    /**
     * Busca detalhes completos de um deputado
     */
    async getDeputyDetails(deputyUrl) {
        try {
            const response = await axios.get(deputyUrl, {
                headers: {
                    'User-Agent': this.userAgent
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            
            const details = {
                phone: this.cleanPhone($('.telefone, .contato-telefone').text()),
                mobile: this.cleanPhone($('.celular, .contato-celular').text()),
                email: this.cleanEmail($('.email, .contato-email').text()),
                office: this.cleanText($('.gabinete, .endereco-gabinete').text()),
                photo: $('.foto-deputado img').attr('src'),
                biography: this.cleanText($('.biografia, .sobre').text()),
                committees: []
            };

            // Extrai comissões
            $('.comissao, .comissoes li').each((i, el) => {
                const commission = $(el).text().trim();
                if (commission) {
                    details.committees.push(commission);
                }
            });

            return details;

        } catch (error) {
            console.error('Erro ao buscar detalhes:', error.message);
            return {};
        }
    }

    /**
     * Carrega lista de políticos conhecidos do Paraná
     */
    async loadKnownPoliticians() {
        const politicians = [
            // Prefeitos principais
            { name: 'Dr. Leônidas', city: 'Paranavaí', position: 'prefeito' },
            { name: 'Rafael Greca', city: 'Curitiba', position: 'prefeito' },
            { name: 'Ulisses Maia', city: 'Maringá', position: 'prefeito' },
            { name: 'Marcelo Belinati', city: 'Londrina', position: 'prefeito' },
            
            // Senadores
            { name: 'Flávio Arns', city: 'Curitiba', position: 'senador', party: 'PODEMOS' },
            { name: 'Oriovisto Guimarães', city: 'Curitiba', position: 'senador', party: 'PODEMOS' },
            
            // Alguns deputados conhecidos
            { name: 'Luciana Rafagnin', city: 'Curitiba', position: 'deputado', party: 'PT' },
            { name: 'Sandro Alex', city: 'Curitiba', position: 'deputado', party: 'REPUBLICANOS' },
            { name: 'Filipe Barros', city: 'Curitiba', position: 'deputado', party: 'PSL' }
        ];

        return politicians.map(pol => ({
            id: this.generateId(pol.name),
            name: pol.name,
            position: pol.position,
            city: pol.city,
            party: pol.party || '',
            phone: '',
            email: '',
            office: '',
            mobile: '',
            notes: 'Contato a ser verificado',
            source: 'manual',
            verified: false,
            lastUpdate: new Date().toISOString()
        }));
    }

    /**
     * Salva contatos no cache local
     */
    async saveContacts(contacts) {
        try {
            const filePath = path.join(this.cacheDir, `contacts_${Date.now()}.json`);
            await fs.writeFile(filePath, JSON.stringify(contacts, null, 2));
            
            // Salva também uma versão "latest"
            const latestPath = path.join(this.cacheDir, 'latest_contacts.json');
            await fs.writeFile(latestPath, JSON.stringify(contacts, null, 2));
            
            console.log(`✅ ${contacts.length} contatos salvos em: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('❌ Erro ao salvar contatos:', error.message);
            throw error;
        }
    }

    /**
     * Carrega contatos do cache
     */
    async loadContacts() {
        try {
            const filePath = path.join(this.cacheDir, 'latest_contacts.json');
            const data = await fs.readFile(filePath, 'utf8');
            const contacts = JSON.parse(data);
            console.log(`📂 Carregados ${contacts.length} contatos do cache`);
            return contacts;
        } catch (error) {
            console.log('📂 Nenhum cache encontrado, retornando array vazio');
            return [];
        }
    }

    /**
     * Executa sincronização completa
     */
    async syncAll() {
        console.log('🚀 Iniciando sincronização de contatos...');
        
        try {
            await this.init();
            
            // 1. Busca deputados da assembleia
            const deputies = await this.searchDeputados();
            
            // 2. Carrega políticos conhecidos
            const knownPoliticians = await this.loadKnownPoliticians();
            
            // 3. Combina todos os contatos
            const allContacts = [...deputies, ...knownPoliticians];
            
            // 4. Remove duplicatas baseado no nome
            const uniqueContacts = this.removeDuplicates(allContacts);
            
            // 5. Salva no cache
            await this.saveContacts(uniqueContacts);
            
            console.log(`✅ Sincronização concluída: ${uniqueContacts.length} contatos únicos`);
            return uniqueContacts;
            
        } catch (error) {
            console.error('❌ Erro na sincronização:', error.message);
            throw error;
        }
    }

    /**
     * Utilitários
     */
    generateId(name) {
        return name.toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w-]/g, '')
                  .substring(0, 50);
    }

    cleanText(text) {
        return text ? text.trim().replace(/\s+/g, ' ') : '';
    }

    cleanPhone(phone) {
        return phone ? phone.replace(/\D/g, '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3') : '';
    }

    cleanEmail(email) {
        const emailMatch = email ? email.match(/[\w.-]+@[\w.-]+\.\w+/) : null;
        return emailMatch ? emailMatch[0] : '';
    }

    removeDuplicates(contacts) {
        const seen = new Set();
        return contacts.filter(contact => {
            const key = contact.name.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}

module.exports = ContactsScraper;

// Exemplo de uso
if (require.main === module) {
    const scraper = new ContactsScraper();
    scraper.syncAll()
        .then(contacts => {
            console.log('🎉 Sincronização completa!');
            console.log(`📊 Total: ${contacts.length} contatos`);
        })
        .catch(error => {
            console.error('💥 Erro:', error.message);
            process.exit(1);
        });
}
