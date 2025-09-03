const fs = require('fs');
const path = require('path');

// Remove diretório public se existir
if (fs.existsSync('public')) {
    fs.rmSync('public', { recursive: true, force: true });
}

// Cria diretório public
fs.mkdirSync('public', { recursive: true });

// Copia index.html da raiz
if (fs.existsSync('index.html')) {
    fs.copyFileSync('index.html', 'public/index.html');
    console.log('✓ Copiado: index.html');
}

// Lista de arquivos HTML para copiar do diretório pages
const pageFiles = [
    'politica.html',
    'saude.html', 
    'agronegocio.html',
    'turismo.html',
    'contato.html',
    'leonidas.html',
    'matheus.html'
];

// Copia arquivos HTML do diretório pages
pageFiles.forEach(file => {
    const sourcePath = `pages/${file}`;
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, `public/${file}`);
        console.log(`✓ Copiado: pages/${file}`);
    }
});

// Copia diretório assets
if (fs.existsSync('assets')) {
    fs.cpSync('assets', 'public/assets', { recursive: true });
    console.log('✓ Copiado: assets/');
}

// Copia diretório backend se existir
if (fs.existsSync('backend')) {
    fs.cpSync('backend', 'public/backend', { recursive: true });
    console.log('✓ Copiado: backend/');
}

console.log('\n🚀 Build completed - Static site ready for deployment');
console.log('📁 Output directory: public/');
