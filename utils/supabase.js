const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Credenciais do Supabase não encontradas. Verifique o arquivo .env');
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar conexão
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('_health')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Erro na conexão (esperado se tabela não existe):', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error.message);
    return false;
  }
}

// Função para verificar tabelas existentes
async function checkTables() {
  try {
    const { data, error } = await supabase
      .rpc('get_table_names');
    
    if (error) {
      console.log('Erro ao verificar tabelas:', error.message);
    } else {
      console.log('Tabelas disponíveis:', data);
    }
  } catch (error) {
    console.log('Verificação de tabelas não disponível:', error.message);
  }
}

module.exports = {
  supabase,
  testConnection,
  checkTables
};
