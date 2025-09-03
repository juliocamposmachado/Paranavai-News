/**
 * Teste da API de Notícias
 * Simula o funcionamento da coleta do Bem Paraná e outros portais
 */

const axios = require('axios');

async function testarAPI() {
    console.log("🧪 Testando API de Notícias...\n");
    
    const endpoints = [
        { nome: "Notícias", url: "http://localhost:3000/api/noticias" },
        { nome: "Portais", url: "http://localhost:3000/api/portais" },
        { nome: "Estatísticas", url: "http://localhost:3000/api/estatisticas" }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testando ${endpoint.nome}: ${endpoint.url}`);
            
            const response = await axios.get(endpoint.url, { timeout: 10000 });
            
            console.log(`✅ Status: ${response.status}`);
            console.log(`📄 Resposta:`, JSON.stringify(response.data, null, 2));
            console.log("─".repeat(60));
            
        } catch (error) {
            console.log(`❌ Erro no ${endpoint.nome}: ${error.message}`);
            console.log("─".repeat(60));
        }
    }
}

async function forcarAtualizacao() {
    console.log("\n🔄 Forçando atualização das notícias...");
    
    try {
        const response = await axios.post("http://localhost:3000/api/atualizar");
        console.log("✅ Atualização forçada:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(`❌ Erro na atualização: ${error.message}`);
    }
}

async function demonstrarFuncionamento() {
    console.log("🎯 DEMONSTRAÇÃO DO FUNCIONAMENTO DA API");
    console.log("=" * 50);
    
    // 1. Testar endpoints básicos
    console.log("\n1️⃣  Testando endpoints básicos...");
    await testarAPI();
    
    // 2. Forçar atualização
    console.log("\n2️⃣  Forçando atualização das notícias...");
    await forcarAtualizacao();
    
    // 3. Testar novamente após atualização
    console.log("\n3️⃣  Testando novamente após atualização...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
    await testarAPI();
    
    console.log("\n🎉 Demonstração concluída!");
    console.log("💡 Agora você pode abrir o site index.html para ver as notícias!");
}

// Executar demonstração
if (require.main === module) {
    demonstrarFuncionamento().catch(console.error);
}

module.exports = { testarAPI, forcarAtualizacao };
