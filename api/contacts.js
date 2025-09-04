/**
 * API Handler para Gerenciamento de Contatos
 * Compatível com Vercel Serverless Functions
 */

const ContactsScraper = require('../backend/contacts_scraper');
const fs = require('fs').promises;
const path = require('path');

// Simula base de dados local para contatos
let contactsData = [];
const CONTACTS_FILE = '/tmp/contacts.json';

// Carrega contatos do arquivo temporário (Vercel)
async function loadContacts() {
    try {
        const data = await fs.readFile(CONTACTS_FILE, 'utf8');
        contactsData = JSON.parse(data);
    } catch (error) {
        // Se não existir, inicia com dados padrão
        contactsData = await getDefaultContacts();
        await saveContacts();
    }
    return contactsData;
}

// Salva contatos no arquivo temporário
async function saveContacts() {
    try {
        await fs.writeFile(CONTACTS_FILE, JSON.stringify(contactsData, null, 2));
    } catch (error) {
        console.error('Erro ao salvar contatos:', error);
    }
}

// Dados padrão de contatos
async function getDefaultContacts() {
    return [
        {
            id: 'dr-leonidas',
            name: 'Dr. Leônidas',
            position: 'prefeito',
            party: '',
            city: 'Paranavaí',
            phone: '(44) 3482-8600',
            mobile: '',
            email: 'gabinete@paranavai.pr.gov.br',
            office: 'Av. Getúlio Vargas, 102 - Centro, Paranavaí - PR',
            notes: 'Prefeito de Paranavaí',
            source: 'manual',
            verified: true,
            lastUpdate: new Date().toISOString()
        },
        {
            id: 'rafael-greca',
            name: 'Rafael Greca',
            position: 'prefeito',
            party: 'PMN',
            city: 'Curitiba',
            phone: '(41) 3350-8000',
            mobile: '',
            email: 'gabinete@curitiba.pr.gov.br',
            office: 'Av. Cândido de Abreu, 817 - Centro Cívico, Curitiba - PR',
            notes: 'Prefeito de Curitiba',
            source: 'manual',
            verified: true,
            lastUpdate: new Date().toISOString()
        },
        {
            id: 'ulisses-maia',
            name: 'Ulisses Maia',
            position: 'prefeito',
            party: 'MDB',
            city: 'Maringá',
            phone: '(44) 3901-1000',
            mobile: '',
            email: 'prefeito@maringa.pr.gov.br',
            office: 'Av. Cerro Azul, 1306 - Centro, Maringá - PR',
            notes: 'Prefeito de Maringá',
            source: 'manual',
            verified: true,
            lastUpdate: new Date().toISOString()
        },
        {
            id: 'flavio-arns',
            name: 'Flávio Arns',
            position: 'senador',
            party: 'PODEMOS',
            city: 'Curitiba',
            phone: '(41) 3330-1500',
            mobile: '',
            email: 'sen.flavioarns@senado.leg.br',
            office: 'Senado Federal - Anexo II - Ala Senador Alexandre Costa',
            notes: 'Senador pelo Paraná',
            source: 'manual',
            verified: true,
            lastUpdate: new Date().toISOString()
        }
    ];
}

// Handler principal da API
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { method } = req;
        const url = new URL(req.url, `http://${req.headers.host}`);
        const action = url.searchParams.get('action') || url.pathname.split('/').pop();

        // Carrega contatos
        await loadContacts();

        switch (method) {
            case 'GET':
                return handleGet(req, res, action);
            case 'POST':
                return handlePost(req, res, action);
            case 'PUT':
                return handlePut(req, res, action);
            case 'DELETE':
                return handleDelete(req, res, action);
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

// Handle GET requests
async function handleGet(req, res, action) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');
    const search = url.searchParams.get('search');
    const city = url.searchParams.get('city');
    const position = url.searchParams.get('position');

    switch (action) {
        case 'list':
        case 'contacts':
            let filteredContacts = contactsData;

            // Filtros
            if (search) {
                const searchLower = search.toLowerCase();
                filteredContacts = filteredContacts.filter(contact =>
                    contact.name.toLowerCase().includes(searchLower) ||
                    contact.city.toLowerCase().includes(searchLower) ||
                    contact.position.toLowerCase().includes(searchLower)
                );
            }

            if (city && city !== 'all') {
                filteredContacts = filteredContacts.filter(contact =>
                    contact.city.toLowerCase() === city.toLowerCase()
                );
            }

            if (position && position !== 'all') {
                filteredContacts = filteredContacts.filter(contact =>
                    contact.position.toLowerCase() === position.toLowerCase()
                );
            }

            return res.json({
                success: true,
                data: filteredContacts,
                total: filteredContacts.length
            });

        case 'get':
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }
            const contact = contactsData.find(c => c.id === id);
            if (!contact) {
                return res.status(404).json({ error: 'Contact not found' });
            }
            return res.json({ success: true, data: contact });

        case 'sync':
            try {
                const scraper = new ContactsScraper();
                const syncedContacts = await scraper.syncAll();
                
                // Mescla com contatos existentes
                const existingIds = contactsData.map(c => c.id);
                const newContacts = syncedContacts.filter(c => !existingIds.includes(c.id));
                
                contactsData = [...contactsData, ...newContacts];
                await saveContacts();

                return res.json({
                    success: true,
                    message: `${newContacts.length} novos contatos sincronizados`,
                    total: contactsData.length
                });
            } catch (error) {
                return res.status(500).json({
                    error: 'Sync failed',
                    message: error.message
                });
            }

        case 'stats':
            const stats = {
                total: contactsData.length,
                byPosition: {},
                byCity: {},
                verified: contactsData.filter(c => c.verified).length,
                unverified: contactsData.filter(c => !c.verified).length
            };

            contactsData.forEach(contact => {
                stats.byPosition[contact.position] = (stats.byPosition[contact.position] || 0) + 1;
                stats.byCity[contact.city] = (stats.byCity[contact.city] || 0) + 1;
            });

            return res.json({ success: true, data: stats });

        default:
            return res.status(400).json({ error: 'Invalid action' });
    }
}

// Handle POST requests (create)
async function handlePost(req, res, action) {
    if (action !== 'create' && action !== 'contacts') {
        return res.status(400).json({ error: 'Invalid action for POST' });
    }

    const body = req.body;
    if (!body || !body.name || !body.position || !body.city) {
        return res.status(400).json({ error: 'Name, position, and city are required' });
    }

    const newContact = {
        id: generateId(body.name),
        name: body.name.trim(),
        position: body.position,
        party: body.party || '',
        city: body.city.trim(),
        phone: body.phone || '',
        mobile: body.mobile || '',
        email: body.email || '',
        office: body.office || '',
        notes: body.notes || '',
        source: 'manual',
        verified: false,
        lastUpdate: new Date().toISOString()
    };

    // Verifica duplicatas
    if (contactsData.find(c => c.id === newContact.id)) {
        return res.status(409).json({ error: 'Contact already exists' });
    }

    contactsData.push(newContact);
    await saveContacts();

    return res.status(201).json({
        success: true,
        message: 'Contact created successfully',
        data: newContact
    });
}

// Handle PUT requests (update)
async function handlePut(req, res, action) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }

    const contactIndex = contactsData.findIndex(c => c.id === id);
    if (contactIndex === -1) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const body = req.body;
    const updatedContact = {
        ...contactsData[contactIndex],
        ...body,
        lastUpdate: new Date().toISOString()
    };

    contactsData[contactIndex] = updatedContact;
    await saveContacts();

    return res.json({
        success: true,
        message: 'Contact updated successfully',
        data: updatedContact
    });
}

// Handle DELETE requests
async function handleDelete(req, res, action) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }

    const contactIndex = contactsData.findIndex(c => c.id === id);
    if (contactIndex === -1) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const deletedContact = contactsData.splice(contactIndex, 1)[0];
    await saveContacts();

    return res.json({
        success: true,
        message: 'Contact deleted successfully',
        data: deletedContact
    });
}

// Utility functions
function generateId(name) {
    return name.toLowerCase()
               .replace(/\s+/g, '-')
               .replace(/[^\w-]/g, '')
               .substring(0, 50);
}
