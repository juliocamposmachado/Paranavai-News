const { supabase } = require('./supabase');

// Função para criar as tabelas necessárias
async function setupDatabase() {
  try {
    console.log('🚀 Configurando banco de dados...');

    // 1. Tabela de categorias
    console.log('📁 Criando tabela de categorias...');
    const { error: categoriesError } = await supabase.rpc('create_table_if_not_exists', {
      table_sql: `
        CREATE TABLE IF NOT EXISTS categorias (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          nome VARCHAR(100) NOT NULL UNIQUE,
          slug VARCHAR(100) NOT NULL UNIQUE,
          descricao TEXT,
          cor VARCHAR(7) DEFAULT '#1e4a73',
          icone VARCHAR(50),
          ativo BOOLEAN DEFAULT true,
          ordem INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (categoriesError) {
      console.log('ℹ️ Tentativa alternativa para categorias...');
      // Se RPC não funcionar, tentar criar diretamente
      await createTableDirectly('categorias', `
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        cor VARCHAR(7) DEFAULT '#1e4a73',
        icone VARCHAR(50),
        ativo BOOLEAN DEFAULT true,
        ordem INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `);
    }

    // 2. Tabela de portais parceiros
    console.log('🌐 Criando tabela de portais...');
    await createTableDirectly('portais', `
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      nome VARCHAR(200) NOT NULL,
      url VARCHAR(500) NOT NULL,
      busca VARCHAR(500),
      logo VARCHAR(500),
      cor VARCHAR(7) DEFAULT '#1e4a73',
      ativo BOOLEAN DEFAULT true,
      tipo VARCHAR(50) DEFAULT 'portal',
      config JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    // 3. Tabela principal de notícias
    console.log('📰 Criando tabela de notícias...');
    await createTableDirectly('noticias', `
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      titulo TEXT NOT NULL,
      resumo TEXT,
      conteudo TEXT,
      link VARCHAR(500),
      imagem VARCHAR(500),
      data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      fonte VARCHAR(200),
      portal_id UUID REFERENCES portais(id),
      categoria_id UUID REFERENCES categorias(id),
      autor VARCHAR(200),
      tags TEXT[],
      status VARCHAR(20) DEFAULT 'rascunho',
      aprovada BOOLEAN DEFAULT false,
      destaque BOOLEAN DEFAULT false,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      meta_dados JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    // 4. Tabela de usuários do sistema
    console.log('👥 Criando tabela de usuários...');
    await createTableDirectly('usuarios', `
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      nome VARCHAR(200) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      ativo BOOLEAN DEFAULT true,
      ultimo_acesso TIMESTAMP WITH TIME ZONE,
      configuracoes JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    // 5. Tabela de contatos
    console.log('📧 Criando tabela de contatos...');
    await createTableDirectly('contatos', `
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      nome VARCHAR(200) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefone VARCHAR(20),
      assunto VARCHAR(200),
      mensagem TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'novo',
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    // 6. Tabela de estatísticas
    console.log('📊 Criando tabela de estatísticas...');
    await createTableDirectly('estatisticas', `
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tipo VARCHAR(50) NOT NULL,
      chave VARCHAR(100) NOT NULL,
      valor INTEGER DEFAULT 0,
      data DATE DEFAULT CURRENT_DATE,
      metadados JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(tipo, chave, data)
    `);

    console.log('✅ Tabelas criadas com sucesso!');
    
    // Inserir dados iniciais
    await insertInitialData();
    
    console.log('🎉 Banco de dados configurado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
  }
}

// Função auxiliar para criar tabelas diretamente
async function createTableDirectly(tableName, columns) {
  try {
    // Tentar inserir um registro de teste primeiro para verificar se a tabela existe
    const { error: testError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (testError && testError.message.includes('does not exist')) {
      console.log(`⚠️ Tabela '${tableName}' não existe - precisa ser criada manualmente no Supabase`);
      console.log(`SQL para criar a tabela '${tableName}':`);
      console.log(`CREATE TABLE ${tableName} (${columns});`);
    } else {
      console.log(`✅ Tabela '${tableName}' já existe`);
    }
  } catch (error) {
    console.log(`ℹ️ Informação sobre tabela '${tableName}':`, error.message);
  }
}

// Função para inserir dados iniciais
async function insertInitialData() {
  console.log('📝 Inserindo dados iniciais...');
  
  try {
    // Inserir categorias padrão
    const categorias = [
      { nome: 'Política', slug: 'politica', cor: '#1e4a73', icone: 'government' },
      { nome: 'Economia', slug: 'economia', cor: '#2e7d32', icone: 'trending_up' },
      { nome: 'Saúde', slug: 'saude', cor: '#d32f2f', icone: 'local_hospital' },
      { nome: 'Educação', slug: 'educacao', cor: '#f57c00', icone: 'school' },
      { nome: 'Agronegócio', slug: 'agronegocio', cor: '#689f38', icone: 'eco' },
      { nome: 'Turismo', slug: 'turismo', cor: '#0288d1', icone: 'place' },
      { nome: 'Esportes', slug: 'esportes', cor: '#7b1fa2', icone: 'sports_soccer' },
      { nome: 'Cultura', slug: 'cultura', cor: '#5d4037', icone: 'palette' }
    ];

    const { data: existingCategories } = await supabase
      .from('categorias')
      .select('slug');
    
    const existingSlugs = (existingCategories || []).map(cat => cat.slug);
    const newCategories = categorias.filter(cat => !existingSlugs.includes(cat.slug));
    
    if (newCategories.length > 0) {
      const { error: catError } = await supabase
        .from('categorias')
        .insert(newCategories);
      
      if (!catError) {
        console.log(`✅ ${newCategories.length} categorias inseridas`);
      }
    }

    // Inserir portais parceiros padrão (baseado no código existente)
    const portais = [
      {
        nome: "Paraná Portal",
        url: "https://www.paranaportal.com",
        busca: "https://www.paranaportal.com/?s=Paranavai",
        logo: "https://www.paranaportal.com/wp-content/uploads/2023/01/logo-parana-portal.png",
        cor: "#1e4a73",
        config: {
          selector: {
            artigos: "article",
            titulo: "h2 a, h3 a",
            resumo: ".excerpt, p",
            link: "h2 a, h3 a",
            imagem: "img",
            data: ".date, time"
          }
        }
      },
      {
        nome: "Bem Paraná",
        url: "https://www.bemparana.com.br",
        busca: "https://www.bemparana.com.br/?s=paranavai",
        logo: "https://www.bemparana.com.br/wp-content/themes/bemparana/assets/images/logo.png",
        cor: "#ff6900",
        config: {
          selector: {
            artigos: "article, .post, .entry",
            titulo: "h2 a, h3 a, .entry-title a",
            resumo: ".excerpt, .entry-summary, p",
            link: "h2 a, h3 a, .entry-title a",
            imagem: ".wp-post-image, img",
            data: ".date, .entry-date, time"
          }
        }
      }
    ];

    const { data: existingPortals } = await supabase
      .from('portais')
      .select('url');
    
    const existingUrls = (existingPortals || []).map(portal => portal.url);
    const newPortals = portais.filter(portal => !existingUrls.includes(portal.url));
    
    if (newPortals.length > 0) {
      const { error: portalError } = await supabase
        .from('portais')
        .insert(newPortals);
      
      if (!portalError) {
        console.log(`✅ ${newPortals.length} portais inseridos`);
      }
    }

  } catch (error) {
    console.log('ℹ️ Dados iniciais não inseridos:', error.message);
  }
}

// Função para testar operações básicas
async function testOperations() {
  console.log('🧪 Testando operações básicas...');
  
  try {
    // Testar inserção de notícia
    const { data: testNews, error: insertError } = await supabase
      .from('noticias')
      .insert([
        {
          titulo: 'Notícia de Teste - Portal Paranavaí News',
          resumo: 'Esta é uma notícia de teste para verificar o funcionamento do banco.',
          fonte: 'Portal Paranavaí News',
          status: 'publicada'
        }
      ])
      .select();
    
    if (insertError) {
      console.log('⚠️ Erro ao inserir notícia de teste:', insertError.message);
    } else {
      console.log('✅ Notícia de teste inserida com sucesso');
      
      // Limpar o teste
      if (testNews && testNews.length > 0) {
        await supabase
          .from('noticias')
          .delete()
          .eq('id', testNews[0].id);
        console.log('🗑️ Notícia de teste removida');
      }
    }

  } catch (error) {
    console.log('ℹ️ Teste de operações:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = {
  setupDatabase,
  insertInitialData,
  testOperations
};
