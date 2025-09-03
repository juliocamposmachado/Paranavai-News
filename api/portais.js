// Lista de portais parceiros
const PORTAIS_PARCEIROS = [
    {
        nome: "Paraná Portal",
        url: "https://www.paranaportal.com",
        logo: "https://www.paranaportal.com/wp-content/uploads/2023/01/logo-parana-portal.png",
        cor: "#1e4a73"
    },
    {
        nome: "Portal Paranavaí",
        url: "https://www.portalparanavai.com.br",
        logo: "https://via.placeholder.com/150x50/2c5f8a/ffffff?text=Portal+Paranavai",
        cor: "#2c5f8a"
    },
    {
        nome: "Bing News Paraná",
        url: "https://www.bing.com",
        logo: "https://www.bing.com/sa/simg/favicon-trans-bg-blue-mg.ico",
        cor: "#0078d4"
    },
    {
        nome: "Bem Paraná",
        url: "https://www.bemparana.com.br",
        logo: "https://www.bemparana.com.br/wp-content/themes/bemparana/assets/images/logo.png",
        cor: "#ff6900"
    }
];

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        return res.status(200).json({
            success: true,
            portais: PORTAIS_PARCEIROS
        });
    } catch (error) {
        console.error('Erro na API de portais:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
