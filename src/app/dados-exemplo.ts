/**
 * NICOLINA - GESTÃO DE ENCOMENDAS
 * Arquivo de Dados de Exemplo
 * 
 * Este arquivo contém dados de exemplo para demonstrar o sistema
 * incluindo a nova funcionalidade de códigos de produtos e clientes
 */

import { Cliente, Produto } from "./services/api";

// ============= CLIENTES DE EXEMPLO COM CÓDIGOS =============

export const clientesExemplo: Omit<Cliente, "id">[] = [
  {
    codigo: "CLI001",
    nome: "Maria Silva",
    telefone: "(11) 98765-4321",
    endereco: "Rua das Flores, 123 - Centro",
    email: "maria.silva@email.com",
  },
  {
    codigo: "CLI002",
    nome: "Padaria São José",
    telefone: "(11) 3456-7890",
    endereco: "Av. Principal, 456 - Jardim América",
    cnpj: "12.345.678/0001-90",
    email: "contato@padariasaojose.com.br",
  },
  {
    codigo: "CLI003",
    nome: "João Santos",
    telefone: "(11) 91234-5678",
    endereco: "Rua das Palmeiras, 789 - Vila Nova",
    email: "joao.santos@email.com",
  },
  {
    codigo: "CLI004",
    nome: "Restaurante Bom Sabor",
    telefone: "(11) 3789-4561",
    endereco: "Av. Comercial, 1001 - Centro",
    cnpj: "98.765.432/0001-10",
    email: "pedidos@bomsabor.com.br",
  },
  {
    codigo: "CLI005",
    nome: "Ana Costa",
    telefone: "(11) 99876-5432",
    endereco: "Rua do Sol, 234 - Jardim Primavera",
    email: "ana.costa@email.com",
  },
];

// ============= PRODUTOS DE EXEMPLO COM CÓDIGOS =============

export const produtosExemplo: Omit<Produto, "id">[] = [
  // Pães
  {
    codigo: "P001",
    nome: "Pão Francês",
    categoria: "Pães",
    pesoPorUnidadeKg: 0.05,
    preco: 0.80,
    descricao: "Pão francês tradicional, crocante por fora e macio por dentro",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Padeiro",
  },
  {
    codigo: "P002",
    nome: "Pão de Forma Integral",
    categoria: "Pães",
    pesoPorUnidadeKg: 0.5,
    preco: 8.50,
    descricao: "Pão de forma integral 100%, embalagem com 500g",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Padeiro",
  },
  {
    codigo: "P003",
    nome: "Pão Italiano",
    categoria: "Pães",
    pesoPorUnidadeKg: 0.4,
    preco: 12.00,
    descricao: "Pão italiano artesanal com fermentação natural",
    diasAntecedenciaProducao: 2,
    responsavelProducao: "Padeiro",
  },
  {
    codigo: "P004",
    nome: "Brioche",
    categoria: "Pães",
    pesoPorUnidadeKg: 0.3,
    preco: 15.00,
    descricao: "Brioche tradicional francês, macio e amanteigado",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Padeiro",
  },
  
  // Bolos
  {
    codigo: "B001",
    nome: "Bolo de Chocolate",
    categoria: "Bolos",
    pesoPorUnidadeKg: 1.5,
    preco: 45.00,
    descricao: "Bolo de chocolate com cobertura de brigadeiro",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Confeiteiro",
  },
  {
    codigo: "B002",
    nome: "Bolo de Cenoura",
    categoria: "Bolos",
    pesoPorUnidadeKg: 1.2,
    preco: 38.00,
    descricao: "Bolo de cenoura com cobertura de chocolate",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Confeiteiro",
  },
  {
    codigo: "B003",
    nome: "Bolo Red Velvet",
    categoria: "Bolos",
    pesoPorUnidadeKg: 2.0,
    preco: 85.00,
    descricao: "Bolo Red Velvet com cobertura cream cheese",
    diasAntecedenciaProducao: 2,
    responsavelProducao: "Confeiteiro",
  },
  {
    codigo: "B004",
    nome: "Bolo de Aniversário Personalizado",
    categoria: "Bolos",
    pesoPorUnidadeKg: 3.0,
    preco: 150.00,
    descricao: "Bolo de aniversário com decoração personalizada",
    diasAntecedenciaProducao: 3,
    responsavelProducao: "Confeiteiro",
  },
  
  // Doces
  {
    codigo: "D001",
    nome: "Brigadeiro Gourmet",
    categoria: "Doces",
    pesoPorUnidadeKg: 0.025,
    preco: 3.50,
    descricao: "Brigadeiro gourmet de chocolate belga (25g)",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Confeiteiro",
  },
  {
    codigo: "D002",
    nome: "Bem Casado",
    categoria: "Doces",
    pesoPorUnidadeKg: 0.03,
    preco: 4.00,
    descricao: "Bem casado tradicional com doce de leite (30g)",
    diasAntecedenciaProducao: 2,
    responsavelProducao: "Confeiteiro",
  },
  {
    codigo: "D003",
    nome: "Brownie",
    categoria: "Doces",
    pesoPorUnidadeKg: 0.1,
    preco: 8.00,
    descricao: "Brownie de chocolate com nozes (100g)",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Confeiteiro",
  },
  
  // Salgados
  {
    codigo: "S001",
    nome: "Coxinha de Frango",
    categoria: "Salgados",
    pesoPorUnidadeKg: 0.08,
    preco: 5.50,
    descricao: "Coxinha de frango com catupiry (80g)",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Padeiro",
  },
  {
    codigo: "S002",
    nome: "Pastel de Carne",
    categoria: "Salgados",
    pesoPorUnidadeKg: 0.12,
    preco: 6.00,
    descricao: "Pastel assado recheado com carne moída temperada (120g)",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Padeiro",
  },
  {
    codigo: "S003",
    nome: "Empada de Palmito",
    categoria: "Salgados",
    pesoPorUnidadeKg: 0.1,
    preco: 7.00,
    descricao: "Empada de palmito com requeijão (100g)",
    diasAntecedenciaProducao: 1,
    responsavelProducao: "Padeiro",
  },
];

// ============= EXEMPLO DE ENCOMENDA =============

export const encomendaExemplo = {
  // Cliente: Maria Silva (CLI001)
  clienteCodigo: "CLI001",
  clienteNome: "Maria Silva",
  clienteTelefone: "(11) 98765-4321",
  
  // Data e hora da entrega
  data: "2026-03-15", // 15/03/2026
  hora: "10:00",
  
  // Produtos encomendados
  produtos: [
    {
      produtoCodigo: "B001", // Bolo de Chocolate
      produtoNome: "Bolo de Chocolate",
      quantidade: 2,
      pesoPorUnidadeKg: 1.5,
      pesoTotalKg: 3.0,
      observacao: "1 bolo com 'Parabéns João' e 1 bolo sem escrita",
    },
    {
      produtoCodigo: "D001", // Brigadeiro Gourmet
      produtoNome: "Brigadeiro Gourmet",
      quantidade: 50,
      pesoPorUnidadeKg: 0.025,
      pesoTotalKg: 1.25,
      observacao: "Metade tradicional, metade meio-amargo",
    },
    {
      produtoCodigo: "S001", // Coxinha de Frango
      produtoNome: "Coxinha de Frango",
      quantidade: 30,
      pesoPorUnidadeKg: 0.08,
      pesoTotalKg: 2.4,
      observacao: "Bem crocantes",
    },
  ],
  
  // Totais
  quantidadeTotal: 82, // 2 + 50 + 30
  pesoTotalGeral: 6.65, // 3.0 + 1.25 + 2.4 kg
};

// ============= INSTRUÇÕES DE USO =============

export const INSTRUCOES_EXEMPLO = `
📋 COMO USAR OS DADOS DE EXEMPLO:

1️⃣ CADASTRAR CLIENTES:
   • Vá em "Clientes" no menu lateral
   • Use o botão "Novo Cliente"
   • Digite o CÓDIGO do cliente (ex: CLI001)
   • Preencha os dados conforme os exemplos acima
   • Salve cada cliente

2️⃣ CADASTRAR PRODUTOS:
   • Vá em "Produtos" no menu lateral
   • Use o botão "Novo Produto"
   • Digite o CÓDIGO do produto (ex: P001, B001, D001, S001)
   • Preencha os dados conforme os exemplos acima
   • Salve cada produto

3️⃣ CRIAR ENCOMENDA COM CÓDIGOS:
   • Vá em "Encomendas" no menu lateral
   • Clique em "Nova Encomenda"
   • No campo "Código Cliente", digite: CLI001
   • O sistema buscará automaticamente "Maria Silva"
   • Selecione a data: 15/03/2026
   • Selecione a hora: 10:00
   • Adicione os produtos:
     
     PRODUTO 1:
     • Código Produto: B001
     • O sistema preencherá automaticamente "Bolo de Chocolate"
     • Quantidade: 2
     • Observação: "1 bolo com 'Parabéns João' e 1 bolo sem escrita"
     • Clique em "Adicionar Produto"
     
     PRODUTO 2:
     • Código Produto: D001
     • O sistema preencherá automaticamente "Brigadeiro Gourmet"
     • Quantidade: 50
     • Observação: "Metade tradicional, metade meio-amargo"
     • Clique em "Adicionar Produto"
     
     PRODUTO 3:
     • Código Produto: S001
     • O sistema preencherá automaticamente "Coxinha de Frango"
     • Quantidade: 30
     • Observação: "Bem crocantes"
     • Clique em "Adicionar Produto"
   
   • Revise os totais:
     - Quantidade Total: 82 unidades
     - Peso Total: 6.65 kg
   
   • Clique em "Salvar Encomenda"

✨ VANTAGENS DO SISTEMA COM CÓDIGOS:

✅ Cadastro RÁPIDO: Digite apenas o código e os dados são preenchidos
✅ SEM ERROS: Nomes padronizados, sem variações de digitação
✅ PRODUÇÃO: Lista mostra "Código - Nome" facilitando identificação
✅ BUSCA: Filtre por código OU nome em relatórios
✅ PROFISSIONAL: Sistema organizado como software de gestão

💡 DICA: Comece cadastrando alguns clientes e produtos frequentes
         com códigos simples (CLI001, P001, etc) para testar!
`;

// Exportar tudo
export default {
  clientesExemplo,
  produtosExemplo,
  encomendaExemplo,
  INSTRUCOES_EXEMPLO,
};
