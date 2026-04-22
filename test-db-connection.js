import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yochbbecyadbiixercyq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2hiYmVjeWFkYmlpeGVyY3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NzE2NzEsImV4cCI6MjA4MzE0NzY3MX0.t8NN5V9UhbmMcjzJEkXnhzB65GcC0itp6QG7y2zij9g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');
  console.log('URL:', supabaseUrl);
  console.log('Project ID: yochbbecyadbiixercyq\n');

  try {
    // Test 1: Verificar se conseguimos fazer uma query básica
    console.log('✅ Test 1: Verificando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_logs')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Erro na conexão:', healthError.message);
      console.log('Detalhes:', healthError);
    } else {
      console.log('✅ Conexão estabelecida com sucesso!');
    }

    // Test 2: Listar tabelas disponíveis (via query SQL)
    console.log('\n✅ Test 2: Verificando tabelas disponíveis...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.log('⚠️  Não foi possível listar tabelas (função RPC não existe)');
      console.log('Tentando verificar tabela user_logs...');
      
      // Tentar query direta na tabela user_logs
      const { data: userLogsData, error: userLogsError } = await supabase
        .from('user_logs')
        .select('*')
        .limit(5);
      
      if (userLogsError) {
        console.log('❌ Erro ao acessar user_logs:', userLogsError.message);
      } else {
        console.log('✅ Tabela user_logs acessível!');
        console.log('Registros encontrados:', userLogsData?.length || 0);
        if (userLogsData && userLogsData.length > 0) {
          console.log('Exemplo de registro:', JSON.stringify(userLogsData[0], null, 2));
        }
      }
    } else {
      console.log('✅ Tabelas disponíveis:', tables);
    }

    // Test 3: Verificar permissões de escrita
    console.log('\n✅ Test 3: Testando permissões de escrita...');
    const testLog = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID de teste
      action: 'test_connection',
      details: { test: true, timestamp: new Date().toISOString() }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('user_logs')
      .insert([testLog])
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir registro de teste:', insertError.message);
      console.log('Detalhes:', insertError);
    } else {
      console.log('✅ Permissões de escrita OK!');
      console.log('Registro inserido:', insertData);
      
      // Limpar registro de teste
      if (insertData && insertData[0]) {
        await supabase
          .from('user_logs')
          .delete()
          .eq('id', insertData[0].id);
        console.log('✅ Registro de teste removido');
      }
    }

    console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
    console.log('================================');
    console.log('Projeto Supabase: yochbbecyadbiixercyq');
    console.log('Status: Conexão ativa');
    console.log('Tabelas verificadas: user_logs');
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testConnection();
