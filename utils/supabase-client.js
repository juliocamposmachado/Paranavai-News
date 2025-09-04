/**
 * Cliente Supabase para ES6 modules
 * Portal Paranavaí News
 */

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas. Verifique o arquivo .env');
  console.error('Variáveis necessárias: SUPABASE_URL e SUPABASE_ANON_KEY');
  throw new Error('Credenciais do Supabase não encontradas');
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Para APIs server-side
  }
});

// Função para testar conexão
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('newsletter')
      .select('count')
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

// Função para verificar se tabela newsletter existe
export async function checkNewsletterTable() {
  try {
    const { data, error } = await supabase
      .from('newsletter')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('⚠️ Tabela newsletter não existe. Execute o script SQL para criá-la.');
      return false;
    }
    
    console.log('✅ Tabela newsletter encontrada');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar tabela newsletter:', error.message);
    return false;
  }
}

export default supabase;
