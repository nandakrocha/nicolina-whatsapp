// Dados iniciais para demonstração
// Este arquivo popula o localStorage com dados de exemplo quando o Supabase não está configurado

export function inicializarDadosDeExemplo() {
  // Verificar se já existem dados
  const temClientes = localStorage.getItem("nicolina_clientes");
  const temProdutos = localStorage.getItem("nicolina_produtos");
  const temEncomendas = localStorage.getItem("nicolina_encomendas");

  // Se já tem dados, não sobrescrever
  if (temClientes && temProdutos && temEncomendas) {
    return;
  }

  // Clientes de exemplo
  const clientes = [
    {
      id: crypto.randomUUID(),
      nome: "Maria Silva",
      endereco: "Rua das Flores, 123",
      cnpj: "12.345.678/0001-90",
      telefone: "(11) 98765-4321",
      email: "maria@email.com",
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      nome: "João Santos",
      endereco: "Av. Principal, 456",
      cnpj: "98.765.432/0001-10",
      telefone: "(11) 91234-5678",
      email: "joao@email.com",
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      nome: "Ana Costa",
      endereco: "Rua do Comércio, 789",
      cnpj: "11.222.333/0001-44",
      telefone: "(11) 99876-5432",
      email: "ana@email.com",
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Produtos de exemplo
  const produtos = [
    {
      id: crypto.randomUUID(),
      codigo: "P001",
      nome: "Pão de Sal Francês",
      descricao: "Pão francês tradicional",
      categoria: "Pães Salgados",
      unidade: "un",
      pesoKg: 0.05,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      codigo: "P002",
      nome: "Pão de Sal Italiano",
      descricao: "Pão italiano crocante",
      categoria: "Pães Salgados",
      unidade: "un",
      pesoKg: 0.4,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      codigo: "P003",
      nome: "Pão Doce Recheado",
      descricao: "Pão doce com recheio",
      categoria: "Pães Doces",
      unidade: "un",
      pesoKg: 0.08,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      codigo: "P004",
      nome: "Pão Doce Simples",
      descricao: "Pão doce tradicional",
      categoria: "Pães Doces",
      unidade: "un",
      pesoKg: 0.06,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      codigo: "P005",
      nome: "Mini Pão Sal",
      descricao: "Mini pão salgado",
      categoria: "Mini Pães Salgados",
      unidade: "un",
      pesoKg: 0.025,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      codigo: "P006",
      nome: "Mini Pão Doce",
      descricao: "Mini pão doce",
      categoria: "Mini Pães Doces",
      unidade: "un",
      pesoKg: 0.03,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      codigo: "P007",
      nome: "Baguete",
      descricao: "Baguete francesa",
      categoria: "Pães Salgados",
      unidade: "un",
      pesoKg: 0.25,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      codigo: "P008",
      nome: "Croissant",
      descricao: "Croissant folhado",
      categoria: "Pães Doces",
      unidade: "un",
      pesoKg: 0.07,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Salvar no localStorage
  if (!temClientes) {
    localStorage.setItem("nicolina_clientes", JSON.stringify(clientes));
    console.log("✅ Clientes de exemplo criados");
  }

  if (!temProdutos) {
    localStorage.setItem("nicolina_produtos", JSON.stringify(produtos));
    console.log("✅ Produtos de exemplo criados");
  }

  if (!temEncomendas) {
    // Criar encomendas de exemplo com horários de 06:00 às 21:00 (de 1 em 1 hora)
    const encomendas = [];
    const horariosExemplo = [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", 
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00"
    ];

    const statusPossiveis = ["pendente", "em_producao", "pronto", "entregue"];
    const hoje = new Date();

    horariosExemplo.forEach((horario, index) => {
      // Distribuir encomendas entre hoje, amanhã e depois de amanhã
      const diasParaAdicionar = index % 3;
      const dataEntrega = new Date(hoje);
      dataEntrega.setDate(dataEntrega.getDate() + diasParaAdicionar);
      
      // Selecionar cliente (rotacionar entre os 3 clientes)
      const clienteSelecionado = clientes[index % clientes.length];
      
      // Selecionar alguns produtos aleatórios
      const produtosSelecionados = [];
      const numProdutos = (index % 3) + 1; // 1 a 3 produtos por encomenda
      
      for (let i = 0; i < numProdutos; i++) {
        const produtoIndex = (index + i) % produtos.length;
        const produto = produtos[produtoIndex];
        const quantidade = ((index + i) % 10) + 1; // 1 a 10 unidades
        
        produtosSelecionados.push({
          produtoId: produto.id,
          produtoNome: produto.nome,
          quantidade: quantidade,
          pesoPorUnidadeKg: produto.pesoKg,
          pesoTotalKg: quantidade * produto.pesoKg,
        });
      }

      // Calcular peso total e quantidade total
      const pesoTotal = produtosSelecionados.reduce(
        (acc, item) => acc + item.pesoTotalKg,
        0
      );
      
      const quantidadeTotal = produtosSelecionados.reduce(
        (acc, item) => acc + item.quantidade,
        0
      );

      // Determinar status baseado na data e horário
      let status = "pendente";
      if (diasParaAdicionar === 0 && parseInt(horario) < new Date().getHours()) {
        status = statusPossiveis[index % statusPossiveis.length];
      } else if (diasParaAdicionar === 0) {
        status = index % 2 === 0 ? "em_producao" : "pendente";
      }

      encomendas.push({
        id: crypto.randomUUID(),
        clienteId: clienteSelecionado.id,
        clienteNome: clienteSelecionado.nome,
        clienteTelefone: clienteSelecionado.telefone,
        data: dataEntrega.toISOString().split("T")[0],
        hora: horario,
        observacao: `Encomenda de exemplo - Entrega às ${horario}`,
        status: status,
        pesoTotalKg: pesoTotal,
        pesoTotalGramas: Math.round(pesoTotal * 1000),
        quantidadeTotal: quantidadeTotal,
        produtos: produtosSelecionados,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    localStorage.setItem("nicolina_encomendas", JSON.stringify(encomendas));
    console.log(`✅ ${encomendas.length} encomendas de exemplo criadas (06:00 às 21:00)`);
  }
}