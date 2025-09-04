#!/usr/bin/env node

/**
 * Script de Validação do Vercel
 * Valida a configuração e estrutura do projeto antes do deploy
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando validação do projeto para deploy no Vercel...\n');

// Cores para terminal
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        log(`✅ ${description}: ${filePath}`, colors.green);
        return true;
    } else {
        log(`❌ ${description}: ${filePath}`, colors.red);
        return false;
    }
}

function validateJSON(filePath, description) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        log(`✅ ${description}: JSON válido`, colors.green);
        return true;
    } catch (error) {
        log(`❌ ${description}: JSON inválido - ${error.message}`, colors.red);
        return false;
    }
}

function validateHTML(filePath, description) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('<!DOCTYPE html>') && content.includes('<html') && content.includes('</html>')) {
            log(`✅ ${description}: HTML válido`, colors.green);
            return true;
        } else {
            log(`❌ ${description}: HTML incompleto`, colors.red);
            return false;
        }
    } catch (error) {
        log(`❌ ${description}: Erro ao ler arquivo - ${error.message}`, colors.red);
        return false;
    }
}

let allValid = true;

// Validar arquivos principais
log('📁 Validando arquivos principais...', colors.blue);
allValid &= checkFile('package.json', 'Package.json');
allValid &= checkFile('vercel.json', 'Vercel.json');
allValid &= checkFile('index.html', 'Página principal');

// Validar JSONs
log('\n📋 Validando arquivos JSON...', colors.blue);
allValid &= validateJSON('package.json', 'Package.json');
allValid &= validateJSON('vercel.json', 'Vercel.json');

// Validar estrutura admin
log('\n🔐 Validando dashboard administrativa...', colors.blue);
allValid &= checkFile('admin/index.html', 'Dashboard principal');
allValid &= checkFile('admin/css/admin.css', 'CSS da dashboard');
allValid &= checkFile('admin/js/admin.js', 'JavaScript da dashboard');
allValid &= checkFile('admin/aprovacao-direta.html', 'Página de aprovação');
allValid &= checkFile('admin/login-simples.html', 'Página de login simples');
allValid &= checkFile('admin/bypass.html', 'Página de bypass');

// Validar APIs
log('\n🔌 Validando APIs...', colors.blue);
allValid &= checkFile('api/admin-handler.js', 'API de administração');
allValid &= checkFile('api/noticias.js', 'API de notícias');
allValid &= checkFile('api/portais.js', 'API de portais');
allValid &= checkFile('api/contacts.js', 'API de contatos');
allValid &= checkFile('api/estatisticas.js', 'API de estatísticas');

// Validar APIs do Supabase
log('\n🚀 Validando APIs do Supabase...', colors.blue);
allValid &= checkFile('api/noticias-supabase.js', 'API de notícias (Supabase)');
allValid &= checkFile('api/contacts-supabase.js', 'API de contatos (Supabase)');
allValid &= checkFile('utils/supabase.js', 'Cliente Supabase');

// Verificar se .env existe (localmente)
if (fs.existsSync('.env')) {
    log('✅ Arquivo .env encontrado (local)', colors.green);
} else {
    log('⚠️ Arquivo .env não encontrado (OK em produção)', colors.yellow);
}

// Validar HTMLs principais
log('\n📄 Validando estrutura HTML...', colors.blue);
allValid &= validateHTML('index.html', 'Página principal');
allValid &= validateHTML('admin/index.html', 'Dashboard admin');
allValid &= validateHTML('admin/aprovacao-direta.html', 'Página de aprovação');

// Validar assets
log('\n🎨 Validando recursos estáticos...', colors.blue);
allValid &= checkFile('assets/css/style.css', 'CSS principal');
allValid &= checkFile('assets/js/script.js', 'JavaScript principal');

// Verificar configuração do Vercel
log('\n⚙️ Validando configuração do Vercel...', colors.blue);
try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    if (vercelConfig.functions) {
        log('✅ Configuração de Functions definida', colors.green);
    }
    
    if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
        log('✅ Regras de rewrite configuradas', colors.green);
    }
    
    if (vercelConfig.headers && vercelConfig.headers.length > 0) {
        log('✅ Headers de segurança configurados', colors.green);
    }
    
} catch (error) {
    log(`❌ Erro ao validar vercel.json: ${error.message}`, colors.red);
    allValid = false;
}

// Verificar package.json
log('\n📦 Validando package.json...', colors.blue);
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (pkg.scripts && pkg.scripts.build) {
        log('✅ Script de build definido', colors.green);
    } else {
        log('❌ Script de build não encontrado', colors.red);
        allValid = false;
    }
    
    if (pkg.engines && pkg.engines.node) {
        log('✅ Versão do Node.js especificada', colors.green);
    } else {
        log('⚠️ Versão do Node.js não especificada', colors.yellow);
    }
    
} catch (error) {
    log(`❌ Erro ao validar package.json: ${error.message}`, colors.red);
    allValid = false;
}

// Resultado final
log('\n' + '='.repeat(50), colors.blue);
if (allValid) {
    log('🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!', colors.green);
    log('✅ O projeto está pronto para deploy no Vercel', colors.green);
    process.exit(0);
} else {
    log('❌ VALIDAÇÃO FALHOU!', colors.red);
    log('⚠️ Corrija os erros antes de fazer o deploy', colors.yellow);
    process.exit(1);
}
