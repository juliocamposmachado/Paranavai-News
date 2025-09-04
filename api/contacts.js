const { supabase } = require('../utils/supabase');

// Função para validar dados do contato
function validarContato(dados) {
  const erros = [];
  
  if (!dados.nome || dados.nome.trim().length < 2) {
    erros.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
  }
  
  if (!dados.email || !isValidEmail(dados.email)) {
    erros.push('Email é obrigatório e deve ser válido');
  }
  
  if (!dados.mensagem || dados.mensagem.trim().length < 10) {
    erros.push('Mensagem é obrigatória e deve ter pelo menos 10 caracteres');
  }
  
  return erros;
}

// Função para validar email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Função para salvar contato no banco
async function salvarContato(dadosContato, req) {
  try {
    const { data, error } = await supabase
      .from('contatos')
      .insert([{
        nome: dadosContato.nome.trim(),
        email: dadosContato.email.toLowerCase().trim(),
        telefone: dadosContato.telefone ? dadosContato.telefone.trim() : null,
        assunto: dadosContato.assunto ? dadosContato.assunto.trim() : 'Contato Geral',
        mensagem: dadosContato.mensagem.trim(),
        status: 'novo',
        ip_address: req.ip || req.connection.remoteAddress || 'unknown',
        user_agent: req.get('User-Agent') || 'unknown'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao salvar contato:', error);
      throw new Error('Erro interno ao salvar contato');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao salvar contato:', error);
    throw error;
  }
}

// Função para buscar contatos (para admin)
async function buscarContatos(filtros = {}) {
  try {
    let query = supabase
      .from('contatos')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Aplicar filtros se fornecidos
    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }
    
    if (filtros.limit) {
      query = query.limit(filtros.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar contatos:', error);
      throw new Error('Erro interno ao buscar contatos');
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    throw error;
  }
}

// Função para atualizar status do contato
async function atualizarStatusContato(id, novoStatus) {
  try {
    const { data, error } = await supabase
      .from('contatos')
      .update({
        status: novoStatus,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar contato:', error);
      throw new Error('Erro interno ao atualizar contato');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    throw error;
  }
}

// Função para obter estatísticas de contatos
async function obterEstatisticasContatos() {
  try {
    // Contar total de contatos
    const { count: total, error: totalError } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // Contar contatos novos
    const { count: novos, error: novosError } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'novo');
    
    if (novosError) throw novosError;
    
    // Contar contatos de hoje
    const hoje = new Date().toISOString().split('T')[0];
    const { count: hoje_count, error: hojeError } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoje);
    
    if (hojeError) throw hojeError;
    
    return {
      total: total || 0,
      novos: novos || 0,
      hoje: hoje_count || 0,
      respondidos: (total || 0) - (novos || 0)
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      total: 0,
      novos: 0,
      hoje: 0,
      respondidos: 0
    };
  }
}

// Função principal da API
module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    switch (req.method) {
      case 'POST':
        // Criar novo contato
        const dadosContato = req.body;
        
        // Validar dados
        const errosValidacao = validarContato(dadosContato);
        if (errosValidacao.length > 0) {
          return res.status(400).json({
            success: false,
            errors: errosValidacao
          });
        }
        
        // Salvar contato
        const novoContato = await salvarContato(dadosContato, req);
        
        return res.status(201).json({
          success: true,
          message: 'Contato enviado com sucesso! Responderemos em breve.',
          contato: {
            id: novoContato.id,
            nome: novoContato.nome,
            email: novoContato.email,
            created_at: novoContato.created_at
          }
        });
      
      case 'GET':
        // Buscar contatos (admin)
        const { status, limit, stats } = req.query;
        
        // Se solicitar apenas estatísticas
        if (stats === 'true') {
          const estatisticas = await obterEstatisticasContatos();
          return res.status(200).json({
            success: true,
            estatisticas
          });
        }
        
        // Buscar contatos com filtros
        const contatos = await buscarContatos({
          status: status || undefined,
          limit: limit ? parseInt(limit) : 50
        });
        
        return res.status(200).json({
          success: true,
          contatos: contatos.map(contato => ({
            id: contato.id,
            nome: contato.nome,
            email: contato.email,
            telefone: contato.telefone,
            assunto: contato.assunto,
            mensagem: contato.mensagem,
            status: contato.status,
            created_at: contato.created_at,
            updated_at: contato.updated_at
          })),
          total: contatos.length
        });
      
      case 'PUT':
        // Atualizar status do contato (admin)
        const { id, novoStatus } = req.body;
        
        if (!id || !novoStatus) {
          return res.status(400).json({
            success: false,
            error: 'ID e novo status são obrigatórios'
          });
        }
        
        const contatoAtualizado = await atualizarStatusContato(id, novoStatus);
        
        return res.status(200).json({
          success: true,
          message: 'Status atualizado com sucesso',
          contato: contatoAtualizado
        });
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Método não permitido'
        });
    }
    
  } catch (error) {
    console.error('Erro na API de contatos:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
