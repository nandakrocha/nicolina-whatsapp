// Script de Teste da API Nicolina
// Execute este código no console do navegador para verificar se a API está funcionando

(async function testarAPI() {
  console.log('🧪 Iniciando testes da API Nicolina...\n');
  
  const projectId = 'lpmrmynicfwrzrczggbm';
  const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbXJteW5pY2Z3cnpyY3pnZ2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0ODk5NTYsImV4cCI6MjA4ODA2NTk1Nn0.ZakCbhQR6nYd9jjYvmloTa4hhlDmlKfUdylBeLeS9Sk';
  
  const baseURL = `https://${projectId}.supabase.co/functions/v1/server`;
  
  console.log(`🌐 Testando endpoint: ${baseURL}\n`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`
  };
  
  const testes = [
    {
      nome: '1. Health Check',
      url: `${baseURL}/health`,
      metodo: 'GET'
    },
    {
      nome: '2. Root Endpoint',
      url: `${baseURL}/`,
      metodo: 'GET'
    },
    {
      nome: '3. Listar Produtos',
      url: `${baseURL}/produtos`,
      metodo: 'GET'
    },
    {
      nome: '4. Listar Encomendas',
      url: `${baseURL}/encomendas`,
      metodo: 'GET'
    },
    {
      nome: '5. Listar Clientes',
      url: `${baseURL}/clientes`,
      metodo: 'GET'
    },
    {
      nome: '6. Listar Backups',
      url: `${baseURL}/backups`,
      metodo: 'GET'
    }
  ];
  
  let sucessos = 0;
  let falhas = 0;
  
  for (const teste of testes) {
    try {
      console.log(`\n📝 Testando: ${teste.nome}`);
      console.log(`   URL: ${teste.url}`);
      
      const response = await fetch(teste.url, {
        method: teste.metodo,
        headers: headers
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCESSO`);
        console.log(`   Resposta:`, data);
        sucessos++;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ ERRO`);
        console.log(`   Resposta:`, errorText);
        falhas++;
      }
    } catch (error) {
      console.log(`   ❌ ERRO DE REDE`);
      console.log(`   Erro:`, error.message);
      falhas++;
    }
  }
  
  console.log(`\n\n📊 RESULTADO DOS TESTES:`);
  console.log(`✅ Sucessos: ${sucessos}/${testes.length}`);
  console.log(`❌ Falhas: ${falhas}/${testes.length}`);
  
  if (falhas === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! A API está funcionando perfeitamente.');
  } else if (sucessos > 0) {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM. Verifique os erros acima.');
  } else {
    console.log('\n🚨 TODOS OS TESTES FALHARAM. O servidor pode estar offline ou as credenciais estão incorretas.');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Verifique se o Project ID está correto');
    console.log('   2. Verifique se a Public Anon Key está correta');
    console.log('   3. Acesse o Supabase Dashboard e reinicie a Edge Function');
    console.log('   4. Verifique os logs da Edge Function no Supabase');
  }
})();