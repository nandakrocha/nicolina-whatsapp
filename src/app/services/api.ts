import { database, ref, set, get, update, remove, push, isFirebaseConfigured, isDatabaseAvailable, storage, storageRef, uploadBytes, getDownloadURL, isStorageAvailable, onValue } from "./firebase";
import emailjs from '@emailjs/browser';
import JSZip from 'jszip';
import { VERSAO_SISTEMA, NOME_SISTEMA } from "../version";

// Log informativo sobre o modo de armazenamento
if (isFirebaseConfigured() && isDatabaseAvailable()) {
  console.log("🔥 Sistema Nicolina - Usando Firebase Realtime Database (Nuvem)");
} else {
  console.log("💾 Sistema Nicolina - Usando LocalStorage (Navegador)");
  console.log("ℹ️ Configure o Firebase em ⚙️ Configurações para backup na nuvem");
}

// ============= SINCRONIZAÇÃO EM TEMPO REAL =============

/**
 * Registra listener para sincronização em tempo real de encomendas
 * Dispara evento customizado quando houver mudanças no Firebase
 */
export function iniciarSincronizacaoEncomendas() {
  if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
    console.log("⚠️ Sincronização em tempo real não disponível (Firebase não configurado)");
    return () => {}; // Retorna função vazia para cleanup
  }

  console.log("🔄 Iniciando sincronização em tempo real de encomendas...");
  
  const encomendasRef = ref(database, "nicolina/encomendas");
  const unsubscribe = onValue(encomendasRef, (snapshot) => {
    console.log("📡 Atualização recebida do Firebase (Encomendas)");
    // Disparar evento customizado para todas as páginas atualizarem
    window.dispatchEvent(new CustomEvent('encomenda-atualizada'));
  }, (error) => {
    console.error("❌ Erro na sincronização de encomendas:", error);
  });

  return unsubscribe;
}

/**
 * Registra listener para sincronização em tempo real de produtos
 */
export function iniciarSincronizacaoProdutos() {
  if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
    return () => {};
  }

  console.log("🔄 Iniciando sincronização em tempo real de produtos...");
  
  const produtosRef = ref(database, "nicolina/produtos");
  const unsubscribe = onValue(produtosRef, (snapshot) => {
    console.log("📡 Atualização recebida do Firebase (Produtos)");
    window.dispatchEvent(new CustomEvent('produtos-atualizados'));
  }, (error) => {
    console.error("❌ Erro na sincronização de produtos:", error);
  });

  return unsubscribe;
}

/**
 * Registra listener para sincronização em tempo real de clientes
 */
export function iniciarSincronizacaoClientes() {
  if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
    return () => {};
  }

  console.log("🔄 Iniciando sincronização em tempo real de clientes...");
  
  const clientesRef = ref(database, "nicolina/clientes");
  const unsubscribe = onValue(clientesRef, (snapshot) => {
    console.log("📡 Atualização recebida do Firebase (Clientes)");
    window.dispatchEvent(new CustomEvent('clientes-atualizados'));
  }, (error) => {
    console.error("❌ Erro na sincronização de clientes:", error);
  });

  return unsubscribe;
}

/**
 * Registra listener para sincronização em tempo real de usuários
 */
export function iniciarSincronizacaoUsuarios() {
  if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
    return () => {};
  }

  console.log("🔄 Iniciando sincronização em tempo real de usuários...");
  
  const usuariosRef = ref(database, "nicolina/usuarios");
  const unsubscribe = onValue(usuariosRef, (snapshot) => {
    console.log("📡 Atualização recebida do Firebase (Usuários)");
    window.dispatchEvent(new CustomEvent('usuarios-atualizados'));
  }, (error) => {
    console.error("❌ Erro na sincronização de usuários:", error);
  });

  return unsubscribe;
}

/**
 * Registra listener para sincronização em tempo real de orçamentos.
 * Dispara evento customizado quando houver mudanças no Firebase.
 */
export function iniciarSincronizacaoProdutosOrcamento() {
  if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
    return () => {};
  }
  const r = ref(database, "nicolina/produtos_orcamento");
  const unsubscribe = onValue(r, () => {
    window.dispatchEvent(new CustomEvent('produtos-orcamento-atualizados'));
  }, (error) => {
    console.error("❌ Erro na sincronização de produtos de orçamento:", error);
  });
  return unsubscribe;
}

export function iniciarSincronizacaoOrcamentos() {
  if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
    return () => {};
  }

  console.log("🔄 Iniciando sincronização em tempo real de orçamentos...");

  const orcamentosRef = ref(database, "nicolina/orcamentos");
  const unsubscribe = onValue(orcamentosRef, (snapshot) => {
    console.log("📡 Atualização recebida do Firebase (Orçamentos)");
    window.dispatchEvent(new CustomEvent('orcamento-atualizado'));
  }, (error) => {
    console.error("❌ Erro na sincronização de orçamentos:", error);
  });

  return unsubscribe;
}

// ============= TIPOS =============

export interface Cliente {
  id: string;
  codigo?: string;
  nome: string;
  nomeContato?: string; // Nome do contato/responsável
  telefone?: string;
  endereco?: string;
  cnpj?: string;
  email?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Produto {
  id: string;
  codigo?: string;
  nome: string;
  categoria?: string;
  pesoPorUnidadeKg: number;
  descricao?: string;
  preco?: number;
  diasAntecedenciaProducao?: number; // Quantos dias antes da entrega produzir (padrão: 1)
  responsavelProducao?: "Padeiro" | "Confeiteiro" | ""; // Responsável pela produção
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ProdutoEncomenda {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  pesoPorUnidadeKg: number;
  pesoTotalKg: number;
  observacao?: string;
}

export interface Encomenda {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone?: string;
  data: string;
  hora: string; // Mantido para compatibilidade com dados antigos
  horarios?: string[]; // Novo campo para múltiplos horários
  produtos: ProdutoEncomenda[];
  quantidadeTotal: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  codigo: string;
  senha: string;
  permissao: "Proprietário" | "Admin" | "Editor" | "Leitura";
  criadoEm?: string;
  atualizadoEm?: string;
}

// ============= PRODUTOS DE ORÇAMENTO =============

export interface ProdutoOrcamento {
  id: string;
  nome_produto: string;
  preco_unitario: number;
  unidade: "kg" | "un";
  referencia_abreviada: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

// ============= ORÇAMENTOS =============

export interface ItemOrcamento {
  id: string;
  produtoId: string;
  produtoNome: string;
  proporcao: number; // Percentual legacy (0-100)
  proporcaoKg?: number; // Proporção para distribuição por proporção (KG only)
  quantidade: number;
  precoUnitario: number;
  unidade: "kg" | "un";
  valorTotal: number;
  travado?: boolean; // Explicit lock flag
}

export interface Orcamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpj?: string;
  clienteEndereco?: string;
  dataInicial: string;
  dataFinal: string;
  valorTotal: number;
  metaFinanceira?: number;
  metaModo?: "valor" | "percentual";
  metaPercentual?: number;
  faturamentoPeriodo?: number;
  modoDist?: "automatico" | "proporcao";
  prioridadePaoDoce?: boolean;
  itens: ItemOrcamento[];
  alocacaoAtual: number;
  status: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

// ============= HELPERS LOCALSTORAGE (Fallback) =============

const localStorageAPI = {
  // Encomendas
  listarEncomendas: (): Encomenda[] => {
    const data = localStorage.getItem("nicolina_encomendas");
    return data ? JSON.parse(data) : [];
  },
  salvarEncomendas: (encomendas: Encomenda[]) => {
    localStorage.setItem("nicolina_encomendas", JSON.stringify(encomendas));
  },
  criarEncomenda: (encomenda: Omit<Encomenda, "id">): Encomenda => {
    const encomendas = localStorageAPI.listarEncomendas();
    const nova: Encomenda = {
      ...encomenda,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    encomendas.push(nova);
    localStorageAPI.salvarEncomendas(encomendas);
    return nova;
  },
  atualizarEncomenda: (id: string, dados: Partial<Encomenda>): Encomenda => {
    const encomendas = localStorageAPI.listarEncomendas();
    const index = encomendas.findIndex((e) => e.id === id);
    if (index === -1) throw new Error("Encomenda não encontrada");
    encomendas[index] = {
      ...encomendas[index],
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    localStorageAPI.salvarEncomendas(encomendas);
    return encomendas[index];
  },
  excluirEncomenda: (id: string) => {
    const encomendas = localStorageAPI.listarEncomendas();
    const filtradas = encomendas.filter((e) => e.id !== id);
    localStorageAPI.salvarEncomendas(filtradas);
  },

  // Produtos
  listarProdutos: (): Produto[] => {
    const data = localStorage.getItem("nicolina_produtos");
    return data ? JSON.parse(data) : [];
  },
  salvarProdutos: (produtos: Produto[]) => {
    localStorage.setItem("nicolina_produtos", JSON.stringify(produtos));
  },
  criarProduto: (produto: Omit<Produto, "id">): Produto => {
    const produtos = localStorageAPI.listarProdutos();
    const novo: Produto = {
      ...produto,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    produtos.push(novo);
    localStorageAPI.salvarProdutos(produtos);
    return novo;
  },
  atualizarProduto: (id: string, dados: Partial<Produto>): Produto => {
    const produtos = localStorageAPI.listarProdutos();
    const index = produtos.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Produto não encontrado");
    produtos[index] = {
      ...produtos[index],
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    localStorageAPI.salvarProdutos(produtos);
    return produtos[index];
  },
  excluirProduto: (id: string) => {
    const produtos = localStorageAPI.listarProdutos();
    const filtrados = produtos.filter((p) => p.id !== id);
    localStorageAPI.salvarProdutos(filtrados);
  },

  // Clientes
  listarClientes: (): Cliente[] => {
    const data = localStorage.getItem("nicolina_clientes");
    return data ? JSON.parse(data) : [];
  },
  salvarClientes: (clientes: Cliente[]) => {
    localStorage.setItem("nicolina_clientes", JSON.stringify(clientes));
  },
  criarCliente: (cliente: Omit<Cliente, "id">): Cliente => {
    const clientes = localStorageAPI.listarClientes();
    const novo: Cliente = {
      ...cliente,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    clientes.push(novo);
    localStorageAPI.salvarClientes(clientes);
    return novo;
  },
  atualizarCliente: (id: string, dados: Partial<Cliente>): Cliente => {
    const clientes = localStorageAPI.listarClientes();
    const index = clientes.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Cliente não encontrado");
    clientes[index] = {
      ...clientes[index],
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    localStorageAPI.salvarClientes(clientes);
    return clientes[index];
  },
  excluirCliente: (id: string) => {
    const clientes = localStorageAPI.listarClientes();
    const filtrados = clientes.filter((c) => c.id !== id);
    localStorageAPI.salvarClientes(filtrados);
  },

  // Usuários
  listarUsuarios: (): Usuario[] => {
    const data = localStorage.getItem("nicolina_usuarios");
    return data ? JSON.parse(data) : [];
  },
  salvarUsuarios: (usuarios: Usuario[]) => {
    localStorage.setItem("nicolina_usuarios", JSON.stringify(usuarios));
  },
  criarUsuario: (usuario: Omit<Usuario, "id">): Usuario => {
    const usuarios = localStorageAPI.listarUsuarios();
    const novo: Usuario = {
      ...usuario,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    usuarios.push(novo);
    localStorageAPI.salvarUsuarios(usuarios);
    return novo;
  },
  atualizarUsuario: (id: string, dados: Partial<Usuario>): Usuario => {
    const usuarios = localStorageAPI.listarUsuarios();
    const index = usuarios.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("Usuário não encontrado");
    usuarios[index] = {
      ...usuarios[index],
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    localStorageAPI.salvarUsuarios(usuarios);
    return usuarios[index];
  },
  excluirUsuario: (id: string) => {
    const usuarios = localStorageAPI.listarUsuarios();
    const filtrados = usuarios.filter((u) => u.id !== id);
    localStorageAPI.salvarUsuarios(filtrados);
  },

  // Produtos de Orçamento
  listarProdutosOrcamento: (): ProdutoOrcamento[] => {
    const data = localStorage.getItem("nicolina_produtos_orcamento");
    return data ? JSON.parse(data) : [];
  },
  salvarProdutosOrcamento: (produtos: ProdutoOrcamento[]) => {
    localStorage.setItem("nicolina_produtos_orcamento", JSON.stringify(produtos));
  },
  criarProdutoOrcamento: (produto: Omit<ProdutoOrcamento, "id">): ProdutoOrcamento => {
    const produtos = localStorageAPI.listarProdutosOrcamento();
    const novo: ProdutoOrcamento = {
      ...produto,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    produtos.push(novo);
    localStorageAPI.salvarProdutosOrcamento(produtos);
    return novo;
  },
  atualizarProdutoOrcamento: (id: string, dados: Partial<ProdutoOrcamento>): ProdutoOrcamento => {
    const produtos = localStorageAPI.listarProdutosOrcamento();
    const index = produtos.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Produto de orçamento não encontrado");
    produtos[index] = {
      ...produtos[index],
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    localStorageAPI.salvarProdutosOrcamento(produtos);
    return produtos[index];
  },
  excluirProdutoOrcamento: (id: string) => {
    const produtos = localStorageAPI.listarProdutosOrcamento();
    const filtrados = produtos.filter((p) => p.id !== id);
    localStorageAPI.salvarProdutosOrcamento(filtrados);
  },

  // Orçamentos
  listarOrcamentos: (): Orcamento[] => {
    const data = localStorage.getItem("nicolina_orcamentos");
    return data ? JSON.parse(data) : [];
  },
  salvarOrcamentos: (orcamentos: Orcamento[]) => {
    localStorage.setItem("nicolina_orcamentos", JSON.stringify(orcamentos));
  },
  criarOrcamento: (orcamento: Omit<Orcamento, "id">): Orcamento => {
    const orcamentos = localStorageAPI.listarOrcamentos();
    const novo: Orcamento = {
      ...orcamento,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    orcamentos.push(novo);
    localStorageAPI.salvarOrcamentos(orcamentos);
    return novo;
  },
  atualizarOrcamento: (id: string, dados: Partial<Orcamento>): Orcamento => {
    const orcamentos = localStorageAPI.listarOrcamentos();
    const index = orcamentos.findIndex((o) => o.id === id);
    if (index === -1) throw new Error("Orçamento não encontrado");
    orcamentos[index] = {
      ...orcamentos[index],
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    localStorageAPI.salvarOrcamentos(orcamentos);
    return orcamentos[index];
  },
  excluirOrcamento: (id: string) => {
    const orcamentos = localStorageAPI.listarOrcamentos();
    const filtrados = orcamentos.filter((o) => o.id !== id);
    localStorageAPI.salvarOrcamentos(filtrados);
  },
};

// ============= FIREBASE API =============

const firebaseAPI = {
  // Encomendas
  listarEncomendas: async (): Promise<Encomenda[]> => {
    const snapshot = await get(ref(database, "nicolina/encomendas"));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return (Object.values(data) as any[]).map((enc) => ({
      ...enc,
      // Firebase armazena arrays com chaves numéricas {0:{...},1:{...}}.
      // Normaliza para array real independentemente da origem da gravação.
      produtos: Array.isArray(enc.produtos)
        ? enc.produtos
        : enc.produtos
          ? Object.values(enc.produtos)
          : [],
    }));
  },

  criarEncomenda: async (encomenda: Omit<Encomenda, "id">): Promise<Encomenda> => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const nova: Encomenda = {
      ...encomenda,
      id,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await set(ref(database, `nicolina/encomendas/${id}`), nova);
    return nova;
  },

  atualizarEncomenda: async (id: string, dados: Partial<Encomenda>): Promise<Encomenda> => {
    const atualizada = {
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    await update(ref(database, `nicolina/encomendas/${id}`), atualizada);
    const snapshot = await get(ref(database, `nicolina/encomendas/${id}`));
    return snapshot.val();
  },

  excluirEncomenda: async (id: string): Promise<void> => {
    await remove(ref(database, `nicolina/encomendas/${id}`));
  },

  // Produtos
  listarProdutos: async (): Promise<Produto[]> => {
    const snapshot = await get(ref(database, "nicolina/produtos"));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.values(data);
  },

  criarProduto: async (produto: Omit<Produto, "id">): Promise<Produto> => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const novo: Produto = {
      ...produto,
      id,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await set(ref(database, `nicolina/produtos/${id}`), novo);
    return novo;
  },

  atualizarProduto: async (id: string, dados: Partial<Produto>): Promise<Produto> => {
    const atualizado = {
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    await update(ref(database, `nicolina/produtos/${id}`), atualizado);
    const snapshot = await get(ref(database, `nicolina/produtos/${id}`));
    return snapshot.val();
  },

  excluirProduto: async (id: string): Promise<void> => {
    await remove(ref(database, `nicolina/produtos/${id}`));
  },

  // Clientes
  listarClientes: async (): Promise<Cliente[]> => {
    const snapshot = await get(ref(database, "nicolina/clientes"));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.values(data);
  },

  criarCliente: async (cliente: Omit<Cliente, "id">): Promise<Cliente> => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const novo: Cliente = {
      ...cliente,
      id,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await set(ref(database, `nicolina/clientes/${id}`), novo);
    return novo;
  },

  atualizarCliente: async (id: string, dados: Partial<Cliente>): Promise<Cliente> => {
    const atualizado = {
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    await update(ref(database, `nicolina/clientes/${id}`), atualizado);
    const snapshot = await get(ref(database, `nicolina/clientes/${id}`));
    return snapshot.val();
  },

  excluirCliente: async (id: string): Promise<void> => {
    await remove(ref(database, `nicolina/clientes/${id}`));
  },

  // Usuários
  listarUsuarios: async (): Promise<Usuario[]> => {
    const snapshot = await get(ref(database, "nicolina/usuarios"));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.values(data);
  },

  criarUsuario: async (usuario: Omit<Usuario, "id">): Promise<Usuario> => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const novo: Usuario = {
      ...usuario,
      id,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await set(ref(database, `nicolina/usuarios/${id}`), novo);
    return novo;
  },

  atualizarUsuario: async (id: string, dados: Partial<Usuario>): Promise<Usuario> => {
    const atualizado = {
      ...dados,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    await update(ref(database, `nicolina/usuarios/${id}`), atualizado);
    const snapshot = await get(ref(database, `nicolina/usuarios/${id}`));
    return snapshot.val();
  },

  excluirUsuario: async (id: string): Promise<void> => {
    await remove(ref(database, `nicolina/usuarios/${id}`));
  },

  // Orçamentos
  listarOrcamentos: async (): Promise<Orcamento[]> => {
    const snapshot = await get(ref(database, "nicolina/orcamentos"));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val());
  },

  criarOrcamento: async (orcamento: Omit<Orcamento, "id">): Promise<Orcamento> => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const novo: Orcamento = {
      ...orcamento,
      id,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    // Firebase rejects undefined values — strip them before sending
    const novoLimpo = JSON.parse(JSON.stringify(novo));
    await set(ref(database, `nicolina/orcamentos/${id}`), novoLimpo);
    return novo;
  },

  atualizarOrcamento: async (id: string, dados: Partial<Orcamento>): Promise<Orcamento> => {
    const atualizado = { ...dados, id, atualizadoEm: new Date().toISOString() };
    // Firebase rejects undefined values — strip them before sending
    const atualizadoLimpo = JSON.parse(JSON.stringify(atualizado));
    await update(ref(database, `nicolina/orcamentos/${id}`), atualizadoLimpo);
    const snapshot = await get(ref(database, `nicolina/orcamentos/${id}`));
    return snapshot.val();
  },

  excluirOrcamento: async (id: string): Promise<void> => {
    await remove(ref(database, `nicolina/orcamentos/${id}`));
  },

  // Produtos de Orçamento
  listarProdutosOrcamento: async (): Promise<ProdutoOrcamento[]> => {
    const snapshot = await get(ref(database, "nicolina/produtos_orcamento"));
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val());
  },

  criarProdutoOrcamento: async (produto: Omit<ProdutoOrcamento, "id">): Promise<ProdutoOrcamento> => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const novo: ProdutoOrcamento = {
      ...produto,
      id,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await set(ref(database, `nicolina/produtos_orcamento/${id}`), novo);
    return novo;
  },

  atualizarProdutoOrcamento: async (id: string, dados: Partial<ProdutoOrcamento>): Promise<ProdutoOrcamento> => {
    const atualizado = { ...dados, id, atualizadoEm: new Date().toISOString() };
    await update(ref(database, `nicolina/produtos_orcamento/${id}`), atualizado);
    const snapshot = await get(ref(database, `nicolina/produtos_orcamento/${id}`));
    return snapshot.val();
  },

  excluirProdutoOrcamento: async (id: string): Promise<void> => {
    await remove(ref(database, `nicolina/produtos_orcamento/${id}`));
  },
};

// ============= ENCOMENDAS =============

// Garante que enc.produtos seja sempre um array real, independentemente
// de como foi gravado no Firebase (array nativo, objeto {0:{...}}, ou ausente).
function normalizarProdutosEncomendas(encomendas: any[]): Encomenda[] {
  return encomendas.map((enc) => ({
    ...enc,
    produtos: Array.isArray(enc.produtos)
      ? enc.produtos
      : enc.produtos && typeof enc.produtos === "object"
        ? Object.values(enc.produtos)
        : [],
  }));
}

export const encomendasAPI = {
  listar: async (): Promise<Encomenda[]> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return normalizarProdutosEncomendas(localStorageAPI.listarEncomendas());
    }

    try {
      return normalizarProdutosEncomendas(await firebaseAPI.listarEncomendas());
    } catch (error) {
      console.warn("⚠️ Falha ao acessar Firebase, usando dados locais:", error);
      return normalizarProdutosEncomendas(localStorageAPI.listarEncomendas());
    }
  },

  buscar: async (id: string): Promise<Encomenda> => {
    const encomendas = await encomendasAPI.listar();
    const encomenda = encomendas.find((e) => e.id === id);
    if (!encomenda) throw new Error("Encomenda não encontrada");
    return encomenda;
  },

  criar: async (encomenda: Omit<Encomenda, "id">): Promise<Encomenda> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.criarEncomenda(encomenda);
    }

    try {
      return await firebaseAPI.criarEncomenda(encomenda);
    } catch (error) {
      console.error("❌ Erro ao criar encomenda no Firebase:", error);
      return localStorageAPI.criarEncomenda(encomenda);
    }
  },

  atualizar: async (id: string, encomenda: Partial<Encomenda>): Promise<Encomenda> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.atualizarEncomenda(id, encomenda);
    }

    try {
      return await firebaseAPI.atualizarEncomenda(id, encomenda);
    } catch (error) {
      console.error("❌ Erro ao atualizar encomenda no Firebase:", error);
      return localStorageAPI.atualizarEncomenda(id, encomenda);
    }
  },

  excluir: async (id: string): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      localStorageAPI.excluirEncomenda(id);
      return;
    }

    try {
      await firebaseAPI.excluirEncomenda(id);
    } catch (error) {
      console.error("❌ Erro ao excluir encomenda no Firebase:", error);
      localStorageAPI.excluirEncomenda(id);
    }
  },

  observar: (callback: (encomendas: Encomenda[]) => void): (() => void) => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      // Se Firebase não configurado, carrega uma vez do localStorage
      console.log("⚠️ Sincronização em tempo real não disponível (Firebase não configurado)");
      const encomendas = localStorageAPI.listarEncomendas();
      callback(encomendas);
      
      // Retorna função vazia para cleanup
      return () => {};
    }

    console.log("🔄 Iniciando observação em tempo real de encomendas...");
    
    const encomendasRef = ref(database, "nicolina/encomendas");
    const unsubscribe = onValue(
      encomendasRef,
      (snapshot) => {
        console.log("📡 Atualização recebida do Firebase (Encomendas)");
        if (!snapshot.exists()) {
          callback([]);
          return;
        }
        const data = snapshot.val();
        const encomendas: Encomenda[] = Object.values(data);
        callback(encomendas);
      },
      (error) => {
        console.error("❌ Erro na sincronização de encomendas:", error);
        // Em caso de erro, tenta carregar do localStorage
        const encomendas = localStorageAPI.listarEncomendas();
        callback(encomendas);
      }
    );

    return unsubscribe;
  },
};

// ============= PRODUTOS =============

export const produtosAPI = {
  listar: async (): Promise<Produto[]> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.listarProdutos();
    }

    try {
      return await firebaseAPI.listarProdutos();
    } catch (error) {
      console.error("❌ Erro ao listar produtos no Firebase:", error);
      return localStorageAPI.listarProdutos();
    }
  },

  buscar: async (id: string): Promise<Produto> => {
    const produtos = await produtosAPI.listar();
    const produto = produtos.find((p) => p.id === id);
    if (!produto) throw new Error("Produto não encontrado");
    return produto;
  },

  criar: async (produto: Omit<Produto, "id">): Promise<Produto> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.criarProduto(produto);
    }

    try {
      return await firebaseAPI.criarProduto(produto);
    } catch (error) {
      console.error("❌ Erro ao criar produto no Firebase:", error);
      return localStorageAPI.criarProduto(produto);
    }
  },

  atualizar: async (id: string, produto: Partial<Produto>): Promise<Produto> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.atualizarProduto(id, produto);
    }

    try {
      return await firebaseAPI.atualizarProduto(id, produto);
    } catch (error) {
      console.error("❌ Erro ao atualizar produto no Firebase:", error);
      return localStorageAPI.atualizarProduto(id, produto);
    }
  },

  excluir: async (id: string): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      localStorageAPI.excluirProduto(id);
      return;
    }

    try {
      await firebaseAPI.excluirProduto(id);
    } catch (error) {
      console.error("❌ Erro ao excluir produto no Firebase:", error);
      localStorageAPI.excluirProduto(id);
    }
  },
};

// ============= CLIENTES =============

export const clientesAPI = {
  listar: async (): Promise<Cliente[]> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.listarClientes();
    }

    try {
      return await firebaseAPI.listarClientes();
    } catch (error) {
      console.error("❌ Erro ao listar clientes no Firebase:", error);
      return localStorageAPI.listarClientes();
    }
  },

  buscar: async (id: string): Promise<Cliente> => {
    const clientes = await clientesAPI.listar();
    const cliente = clientes.find((c) => c.id === id);
    if (!cliente) throw new Error("Cliente não encontrado");
    return cliente;
  },

  criar: async (cliente: Omit<Cliente, "id">): Promise<Cliente> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.criarCliente(cliente);
    }

    try {
      return await firebaseAPI.criarCliente(cliente);
    } catch (error) {
      console.error("❌ Erro ao criar cliente no Firebase:", error);
      return localStorageAPI.criarCliente(cliente);
    }
  },

  atualizar: async (id: string, cliente: Partial<Cliente>): Promise<Cliente> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.atualizarCliente(id, cliente);
    }

    try {
      return await firebaseAPI.atualizarCliente(id, cliente);
    } catch (error) {
      console.error("❌ Erro ao atualizar cliente no Firebase:", error);
      return localStorageAPI.atualizarCliente(id, cliente);
    }
  },

  excluir: async (id: string): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      localStorageAPI.excluirCliente(id);
      return;
    }

    try {
      await firebaseAPI.excluirCliente(id);
    } catch (error) {
      console.error("❌ Erro ao excluir cliente no Firebase:", error);
      localStorageAPI.excluirCliente(id);
    }
  },
};

// ============= USUÁRIOS =============

export const usuariosAPI = {
  listar: async (): Promise<Usuario[]> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.listarUsuarios();
    }

    try {
      return await firebaseAPI.listarUsuarios();
    } catch (error) {
      console.error("❌ Erro ao listar usuários no Firebase:", error);
      return localStorageAPI.listarUsuarios();
    }
  },

  buscar: async (id: string): Promise<Usuario> => {
    const usuarios = await usuariosAPI.listar();
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) throw new Error("Usuário não encontrado");
    return usuario;
  },

  criar: async (usuario: Omit<Usuario, "id">): Promise<Usuario> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.criarUsuario(usuario);
    }

    try {
      return await firebaseAPI.criarUsuario(usuario);
    } catch (error) {
      console.error("❌ Erro ao criar usuário no Firebase:", error);
      return localStorageAPI.criarUsuario(usuario);
    }
  },

  atualizar: async (id: string, usuario: Partial<Usuario>): Promise<Usuario> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.atualizarUsuario(id, usuario);
    }

    try {
      return await firebaseAPI.atualizarUsuario(id, usuario);
    } catch (error) {
      console.error("❌ Erro ao atualizar usuário no Firebase:", error);
      return localStorageAPI.atualizarUsuario(id, usuario);
    }
  },

  excluir: async (id: string): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      localStorageAPI.excluirUsuario(id);
      return;
    }

    try {
      await firebaseAPI.excluirUsuario(id);
    } catch (error) {
      console.error("❌ Erro ao excluir usuário no Firebase:", error);
      localStorageAPI.excluirUsuario(id);
    }
  },
};

// ============= PRODUTOS DE ORÇAMENTO =============

export const produtosOrcamentoAPI = {
  listar: async (): Promise<ProdutoOrcamento[]> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.listarProdutosOrcamento();
    }
    try {
      return await firebaseAPI.listarProdutosOrcamento();
    } catch (error) {
      console.error("❌ Erro ao listar produtos de orçamento no Firebase:", error);
      return localStorageAPI.listarProdutosOrcamento();
    }
  },

  buscar: async (id: string): Promise<ProdutoOrcamento> => {
    const produtos = await produtosOrcamentoAPI.listar();
    const produto = produtos.find((p) => p.id === id);
    if (!produto) throw new Error("Produto de orçamento não encontrado");
    return produto;
  },

  criar: async (produto: Omit<ProdutoOrcamento, "id">): Promise<ProdutoOrcamento> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.criarProdutoOrcamento(produto);
    }
    try {
      const result = await firebaseAPI.criarProdutoOrcamento(produto);
      // Firebase onValue listener will dispatch 'produtos-orcamento-atualizados' for remote peers.
      // Dispatch locally too so the current computer updates immediately.
      window.dispatchEvent(new CustomEvent('produtos-orcamento-atualizados'));
      return result;
    } catch (error) {
      console.error("❌ Erro ao criar produto de orçamento no Firebase:", error);
      return localStorageAPI.criarProdutoOrcamento(produto);
    }
  },

  atualizar: async (id: string, produto: Partial<ProdutoOrcamento>): Promise<ProdutoOrcamento> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.atualizarProdutoOrcamento(id, produto);
    }
    try {
      const result = await firebaseAPI.atualizarProdutoOrcamento(id, produto);
      window.dispatchEvent(new CustomEvent('produtos-orcamento-atualizados'));
      return result;
    } catch (error) {
      console.error("❌ Erro ao atualizar produto de orçamento no Firebase:", error);
      return localStorageAPI.atualizarProdutoOrcamento(id, produto);
    }
  },

  excluir: async (id: string): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      localStorageAPI.excluirProdutoOrcamento(id);
      return;
    }
    try {
      await firebaseAPI.excluirProdutoOrcamento(id);
      window.dispatchEvent(new CustomEvent('produtos-orcamento-atualizados'));
    } catch (error) {
      console.error("❌ Erro ao excluir produto de orçamento no Firebase:", error);
      localStorageAPI.excluirProdutoOrcamento(id);
    }
  },
};

// ============= ORÇAMENTOS =============

export const orcamentosAPI = {
  listar: async (): Promise<Orcamento[]> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.listarOrcamentos();
    }

    try {
      const [firebaseData, localData] = await Promise.all([
        firebaseAPI.listarOrcamentos(),
        Promise.resolve(localStorageAPI.listarOrcamentos()),
      ]);

      // Build a set of IDs already in Firebase
      const firebaseIds = new Set(firebaseData.map((o) => o.id));

      // Find orçamentos that exist only in localStorage (created before Firebase migration)
      const localOnly = localData.filter((o) => !firebaseIds.has(o.id));

      // Migrate each local-only record to Firebase so it's never lost again
      if (localOnly.length > 0) {
        console.log(`🔄 Migrando ${localOnly.length} orçamento(s) do localStorage para o Firebase...`);
        await Promise.all(
          localOnly.map((o) =>
            set(ref(database, `nicolina/orcamentos/${o.id}`), o).catch((err) =>
              console.warn(`⚠️ Falha ao migrar orçamento ${o.id}:`, err)
            )
          )
        );
        console.log("✅ Migração de orçamentos concluída.");
      }

      // Return the complete merged list (Firebase + migrated local-only)
      return [...firebaseData, ...localOnly];
    } catch (error) {
      console.error("❌ Erro ao listar orçamentos no Firebase:", error);
      return localStorageAPI.listarOrcamentos();
    }
  },

  buscar: async (id: string): Promise<Orcamento> => {
    const orcamentos = await orcamentosAPI.listar();
    const orcamento = orcamentos.find((o) => o.id === id);
    if (!orcamento) throw new Error("Orçamento não encontrado");
    return orcamento;
  },

  criar: async (orcamento: Omit<Orcamento, "id">): Promise<Orcamento> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.criarOrcamento(orcamento);
    }

    try {
      return await firebaseAPI.criarOrcamento(orcamento);
    } catch (error) {
      console.error("❌ Erro ao criar orçamento no Firebase:", error);
      return localStorageAPI.criarOrcamento(orcamento);
    }
  },

  atualizar: async (id: string, orcamento: Partial<Orcamento>): Promise<Orcamento> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return localStorageAPI.atualizarOrcamento(id, orcamento);
    }

    try {
      return await firebaseAPI.atualizarOrcamento(id, orcamento);
    } catch (error) {
      console.error("❌ Erro ao atualizar orçamento no Firebase:", error);
      // Safe upsert to localStorage: update if exists, insert if not (record may only exist in Firebase)
      const lista = localStorageAPI.listarOrcamentos();
      const idx = lista.findIndex((o) => o.id === id);
      const atualizado = { ...orcamento, id, atualizadoEm: new Date().toISOString() } as Orcamento;
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], ...atualizado };
      } else {
        lista.push(atualizado);
      }
      localStorageAPI.salvarOrcamentos(lista);
      return idx >= 0 ? lista[idx] : lista[lista.length - 1];
    }
  },

  excluir: async (id: string): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      localStorageAPI.excluirOrcamento(id);
      return;
    }

    try {
      await firebaseAPI.excluirOrcamento(id);
    } catch (error) {
      console.error("❌ Erro ao excluir orçamento no Firebase:", error);
      localStorageAPI.excluirOrcamento(id);
    }
  },

  // Real-time listener — mirrors encomendasAPI.observar exactly
  observar: (callback: (orcamentos: Orcamento[]) => void): (() => void) => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      console.log("⚠️ Sincronização em tempo real de orçamentos não disponível (Firebase não configurado)");
      callback(localStorageAPI.listarOrcamentos());
      return () => {};
    }

    console.log("🔄 Iniciando observação em tempo real de orçamentos...");

    const orcamentosRef = ref(database, "nicolina/orcamentos");
    const unsubscribe = onValue(
      orcamentosRef,
      async (snapshot) => {
        console.log("📡 Atualização recebida do Firebase (Orçamentos)");

        const firebaseOrcamentos: Orcamento[] = snapshot.exists()
          ? Object.values(snapshot.val())
          : [];

        // Merge with localStorage: include any records that were saved before
        // the Firebase migration (they exist in localStorage but not in Firebase).
        const local = localStorageAPI.listarOrcamentos();
        const firebaseIds = new Set(firebaseOrcamentos.map((o) => o.id));
        const localOnly = local.filter((o) => !firebaseIds.has(o.id));

        // Auto-migrate local-only records to Firebase so they appear on all computers
        if (localOnly.length > 0) {
          console.log(`🔄 observar: migrando ${localOnly.length} orçamento(s) local para Firebase...`);
          await Promise.all(
            localOnly.map((o) =>
              set(ref(database, `nicolina/orcamentos/${o.id}`), o).catch((err) =>
                console.warn(`⚠️ Falha ao migrar orçamento ${o.id}:`, err)
              )
            )
          );
        }

        callback([...firebaseOrcamentos, ...localOnly]);
      },
      (error) => {
        console.error("❌ Erro na sincronização de orçamentos:", error);
        callback(localStorageAPI.listarOrcamentos());
      }
    );

    return unsubscribe;
  },
};

// ============= DELIVERY =============

export interface Motoboy {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface EntregaDelivery {
  id: string;
  motoboyId: string;
  motoboyNome: string;
  data: string;
  numeroPedido: string;
  dinheiro: number;
  cartao: number;
  taxaPedido: number;
  observacoes: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

const deliveryLocalStorage = {
  listarMotoboys: (): Motoboy[] => {
    const data = localStorage.getItem("nicolina_motoboys");
    return data ? JSON.parse(data) : [];
  },
  salvarMotoboys: (motoboys: Motoboy[]) => {
    localStorage.setItem("nicolina_motoboys", JSON.stringify(motoboys));
  },
  listarEntregas: (): EntregaDelivery[] => {
    const data = localStorage.getItem("nicolina_entregas_delivery");
    return data ? JSON.parse(data) : [];
  },
  salvarEntregas: (entregas: EntregaDelivery[]) => {
    localStorage.setItem("nicolina_entregas_delivery", JSON.stringify(entregas));
  },
  obterTaxaFixa: (): number => {
    return parseFloat(localStorage.getItem("nicolina_delivery_taxa_fixa") || "5");
  },
  salvarTaxaFixa: (taxa: number) => {
    localStorage.setItem("nicolina_delivery_taxa_fixa", taxa.toString());
  },
};

const gerarId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const motoboyAPI = {
  listar: async (): Promise<Motoboy[]> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try {
        const snapshot = await get(ref(database, "nicolina/motoboys"));
        if (snapshot.exists()) return Object.values(snapshot.val());
      } catch (e) {}
    }
    return deliveryLocalStorage.listarMotoboys();
  },
  criar: async (motoboy: Omit<Motoboy, "id">): Promise<Motoboy> => {
    const novo: Motoboy = { ...motoboy, id: gerarId(), criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() };
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try { await set(ref(database, `nicolina/motoboys/${novo.id}`), novo); return novo; } catch (e) {}
    }
    const lista = deliveryLocalStorage.listarMotoboys();
    lista.push(novo);
    deliveryLocalStorage.salvarMotoboys(lista);
    return novo;
  },
  atualizar: async (id: string, dados: Partial<Motoboy>): Promise<Motoboy> => {
    const lista = await motoboyAPI.listar();
    const idx = lista.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Motoboy não encontrado");
    const atualizado = { ...lista[idx], ...dados, id, atualizadoEm: new Date().toISOString() };
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try { await update(ref(database, `nicolina/motoboys/${id}`), atualizado); return atualizado; } catch (e) {}
    }
    lista[idx] = atualizado;
    deliveryLocalStorage.salvarMotoboys(lista);
    return atualizado;
  },
  excluir: async (id: string): Promise<void> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try { await remove(ref(database, `nicolina/motoboys/${id}`)); return; } catch (e) {}
    }
    deliveryLocalStorage.salvarMotoboys(deliveryLocalStorage.listarMotoboys().filter((m) => m.id !== id));
  },
};

export const entregasDeliveryAPI = {
  listar: async (): Promise<EntregaDelivery[]> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try {
        const snapshot = await get(ref(database, "nicolina/entregas_delivery"));
        if (snapshot.exists()) return Object.values(snapshot.val());
        return [];
      } catch (e) {}
    }
    return deliveryLocalStorage.listarEntregas();
  },
  criar: async (entrega: Omit<EntregaDelivery, "id">): Promise<EntregaDelivery> => {
    const nova: EntregaDelivery = { ...entrega, id: gerarId(), criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() };
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try { await set(ref(database, `nicolina/entregas_delivery/${nova.id}`), nova); return nova; } catch (e) {}
    }
    const lista = deliveryLocalStorage.listarEntregas();
    lista.push(nova);
    deliveryLocalStorage.salvarEntregas(lista);
    return nova;
  },
  atualizar: async (id: string, dados: Partial<EntregaDelivery>): Promise<EntregaDelivery> => {
    const lista = await entregasDeliveryAPI.listar();
    const idx = lista.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Entrega não encontrada");
    const atualizada = { ...lista[idx], ...dados, id, atualizadoEm: new Date().toISOString() };
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try { await update(ref(database, `nicolina/entregas_delivery/${id}`), atualizada); return atualizada; } catch (e) {}
    }
    lista[idx] = atualizada;
    deliveryLocalStorage.salvarEntregas(lista);
    return atualizada;
  },
  excluir: async (id: string): Promise<void> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try { await remove(ref(database, `nicolina/entregas_delivery/${id}`)); return; } catch (e) {}
    }
    deliveryLocalStorage.salvarEntregas(deliveryLocalStorage.listarEntregas().filter((e) => e.id !== id));
  },
};

export const deliveryConfigAPI = {
  obterTaxaFixa: (): number => deliveryLocalStorage.obterTaxaFixa(),
  salvarTaxaFixa: (taxa: number): void => deliveryLocalStorage.salvarTaxaFixa(taxa),
};

// ============= FECHAMENTO DIÁRIO =============

export interface FuncionarioFechamento {
  id: string;
  nome: string;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface MotoboyFechamento {
  id: string;
  nome: string;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface LinhaDeliveryFechamento {
  id: string;
  comanda: string;
  dinheiro: number;
  cartao: number;
  taxa: number;
}

export interface LinhaPagamentoFechamento {
  id: string;
  descricao: string;
  valor: number;
}

export interface DadosFechamentoDiario {
  id: string;
  data: string;
  funcionarioId: string;
  funcionarioNome: string;
  motoboyId: string;
  motoboyNome: string;
  caixa: {
    notas: number[];
    moedas: number[];
    moedasVariadas: number;
    observacao: string;
  };
  pagamentos: LinhaPagamentoFechamento[];
  sangrias: LinhaPagamentoFechamento[];
  observacaoPagamentos: string;
  delivery: {
    motoboyId: string;
    motoboyNome: string;
    linhas: LinhaDeliveryFechamento[];
    taxaFixa: number;
    observacao: string;
  };
  status: "em_andamento" | "finalizado";
  conferido?: boolean;
  criadoEm: string;
  atualizadoEm: string;
  finalizadoEm?: string;
  ultimoUsuario?: string;
}

const _gerarIdFech = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const _chave = (data: string) => data.replace(/-/g, "_");

export const funcionarioFechamentoAPI = {
  listar: async (): Promise<FuncionarioFechamento[]> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try {
        const snapshot = await get(ref(database, "nicolina/funcionarios_fechamento"));
        if (snapshot.exists()) return Object.values(snapshot.val() as Record<string, FuncionarioFechamento>);
        return [];
      } catch (e) {}
    }
    return [];
  },
  criar: async (dados: Omit<FuncionarioFechamento, "id">): Promise<FuncionarioFechamento> => {
    const novo: FuncionarioFechamento = { ...dados, id: _gerarIdFech(), criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() };
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      await set(ref(database, `nicolina/funcionarios_fechamento/${novo.id}`), novo);
    }
    return novo;
  },
  atualizar: async (id: string, dados: Partial<FuncionarioFechamento>): Promise<void> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      await update(ref(database, `nicolina/funcionarios_fechamento/${id}`), { ...dados, atualizadoEm: new Date().toISOString() });
    }
  },
  excluir: async (id: string): Promise<void> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      await remove(ref(database, `nicolina/funcionarios_fechamento/${id}`));
    }
  },
  observar: (callback: (lista: FuncionarioFechamento[]) => void): (() => void) => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return () => {};
    return onValue(ref(database, "nicolina/funcionarios_fechamento"), (snap) => {
      callback(snap.exists() ? Object.values(snap.val() as Record<string, FuncionarioFechamento>) : []);
    });
  },
};

export const motoboyFechamentoAPI = {
  listar: async (): Promise<MotoboyFechamento[]> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      try {
        const snapshot = await get(ref(database, "nicolina/motoboys_fechamento"));
        if (snapshot.exists()) return Object.values(snapshot.val() as Record<string, MotoboyFechamento>);
        return [];
      } catch (e) {}
    }
    return [];
  },
  criar: async (dados: Omit<MotoboyFechamento, "id">): Promise<MotoboyFechamento> => {
    const novo: MotoboyFechamento = { ...dados, id: _gerarIdFech(), criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() };
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      await set(ref(database, `nicolina/motoboys_fechamento/${novo.id}`), novo);
    }
    return novo;
  },
  atualizar: async (id: string, dados: Partial<MotoboyFechamento>): Promise<void> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      await update(ref(database, `nicolina/motoboys_fechamento/${id}`), { ...dados, atualizadoEm: new Date().toISOString() });
    }
  },
  excluir: async (id: string): Promise<void> => {
    if (isFirebaseConfigured() && isDatabaseAvailable()) {
      await remove(ref(database, `nicolina/motoboys_fechamento/${id}`));
    }
  },
  observar: (callback: (lista: MotoboyFechamento[]) => void): (() => void) => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return () => {};
    return onValue(ref(database, "nicolina/motoboys_fechamento"), (snap) => {
      callback(snap.exists() ? Object.values(snap.val() as Record<string, MotoboyFechamento>) : []);
    });
  },
};

export const fechamentoDiarioAPI = {
  carregar: async (data: string): Promise<DadosFechamentoDiario | null> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return null;
    try {
      const snapshot = await get(ref(database, `nicolina/fechamentos_diarios/${_chave(data)}`));
      return snapshot.exists() ? (snapshot.val() as DadosFechamentoDiario) : null;
    } catch (e) {
      return null;
    }
  },
  salvar: async (dados: DadosFechamentoDiario): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return;
    // IDs com traço = formato antigo (id === data "2026-07-21") → converter para underscores
    // IDs sem traço = formato novo ("2026_07_21_abc123") → usar diretamente
    const pathKey = dados.id.includes('-') ? _chave(dados.id) : dados.id;
    const clean = JSON.parse(JSON.stringify({ ...dados, atualizadoEm: new Date().toISOString() }));
    await set(ref(database, `nicolina/fechamentos_diarios/${pathKey}`), clean);
  },
  observar: (data: string, callback: (dados: DadosFechamentoDiario | null) => void): (() => void) => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return () => {};
    return onValue(ref(database, `nicolina/fechamentos_diarios/${_chave(data)}`), (snap) => {
      callback(snap.exists() ? (snap.val() as DadosFechamentoDiario) : null);
    });
  },
  listarTodos: async (): Promise<DadosFechamentoDiario[]> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return [];
    try {
      const snapshot = await get(ref(database, "nicolina/fechamentos_diarios"));
      if (!snapshot.exists()) return [];
      const todos = Object.values(snapshot.val() as Record<string, DadosFechamentoDiario>);
      return todos.sort((a, b) => b.data.localeCompare(a.data));
    } catch (e) {
      return [];
    }
  },
  observarTodos: (callback: (lista: DadosFechamentoDiario[]) => void): (() => void) => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return () => {};
    return onValue(ref(database, "nicolina/fechamentos_diarios"), (snap) => {
      if (!snap.exists()) { callback([]); return; }
      const todos = Object.values(snap.val() as Record<string, DadosFechamentoDiario>);
      callback(todos.sort((a, b) => b.data.localeCompare(a.data)));
    });
  },
  excluir: async (data: string): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return;
    await remove(ref(database, `nicolina/fechamentos_diarios/${_chave(data)}`));
  },
  observarPorId: (id: string, callback: (dados: DadosFechamentoDiario | null) => void): (() => void) => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return () => {};
    const pathKey = id.includes('-') ? _chave(id) : id;
    return onValue(ref(database, `nicolina/fechamentos_diarios/${pathKey}`), (snap) => {
      callback(snap.exists() ? (snap.val() as DadosFechamentoDiario) : null);
    });
  },
  excluirPorId: async (id: string): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return;
    const pathKey = id.includes('-') ? _chave(id) : id;
    await remove(ref(database, `nicolina/fechamentos_diarios/${pathKey}`));
  },
  // Atualiza SOMENTE o campo conferido — não toca em nenhum dado do fechamento
  marcarConferido: async (id: string, conferido: boolean): Promise<void> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return;
    const pathKey = id.includes('-') ? _chave(id) : id;
    await update(ref(database, `nicolina/fechamentos_diarios/${pathKey}`), { conferido });
  },
};

// ============= BACKUP =============

export interface Backup {
  timestamp: number;
  data: string;
  encomendas: Encomenda[];
  produtos: Produto[];
  clientes: Cliente[];
}

export const backupAPI = {
  criar: async (): Promise<Backup> => {
    const encomendas = await encomendasAPI.listar();
    const produtos = await produtosAPI.listar();
    const clientes = await clientesAPI.listar();

    const backup: Backup = {
      timestamp: Date.now(),
      data: new Date().toISOString(),
      encomendas,
      produtos,
      clientes,
    };

    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      const backups = JSON.parse(localStorage.getItem("nicolina_backups") || "[]");
      backups.push(backup);
      localStorage.setItem("nicolina_backups", JSON.stringify(backups));
      return backup;
    }

    try {
      await set(ref(database, `nicolina/backups/${backup.timestamp}`), backup);
      return backup;
    } catch (error) {
      console.error("❌ Erro ao criar backup no Firebase:", error);
      const backups = JSON.parse(localStorage.getItem("nicolina_backups") || "[]");
      backups.push(backup);
      localStorage.setItem("nicolina_backups", JSON.stringify(backups));
      return backup;
    }
  },

  listar: async (): Promise<Backup[]> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return JSON.parse(localStorage.getItem("nicolina_backups") || "[]");
    }

    try {
      const snapshot = await get(ref(database, "nicolina/backups"));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.values(data);
    } catch (error) {
      console.error("❌ Erro ao listar backups no Firebase:", error);
      return JSON.parse(localStorage.getItem("nicolina_backups") || "[]");
    }
  },

  buscar: async (timestamp: string): Promise<Backup> => {
    const backups = await backupAPI.listar();
    const backup = backups.find((b) => b.timestamp.toString() === timestamp);
    if (!backup) throw new Error("Backup não encontrado");
    return backup;
  },

  restaurar: async (timestamp: string, backupData?: Backup): Promise<void> => {
    // Se backupData foi fornecido, usar ele; caso contrário, buscar do Firebase
    const backup = backupData || await backupAPI.buscar(timestamp);

    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      localStorageAPI.salvarEncomendas(backup.encomendas);
      localStorageAPI.salvarProdutos(backup.produtos);
      localStorageAPI.salvarClientes(backup.clientes);
      return;
    }

    try {
      // Restaurar no Firebase
      for (const encomenda of backup.encomendas) {
        await set(ref(database, `nicolina/encomendas/${encomenda.id}`), encomenda);
      }
      for (const produto of backup.produtos) {
        await set(ref(database, `nicolina/produtos/${produto.id}`), produto);
      }
      for (const cliente of backup.clientes) {
        await set(ref(database, `nicolina/clientes/${cliente.id}`), cliente);
      }
    } catch (error) {
      console.error("❌ Erro ao restaurar backup no Firebase:", error);
      localStorageAPI.salvarEncomendas(backup.encomendas);
      localStorageAPI.salvarProdutos(backup.produtos);
      localStorageAPI.salvarClientes(backup.clientes);
    }
  },

  enviarPorEmail: async (email: string, backupData?: Backup): Promise<void> => {
    const startTime = Date.now();
    console.log(`📧 [BACKUP ZIP ANEXO] Iniciando envio com ANEXO ZIP para: ${email}`);
    
    try {
      // ✅ Tudo em PARALELO (máxima velocidade!)
      const [emailjsConfig, dados] = await Promise.all([
        get(ref(database, "nicolina/configuracoes/emailjs")),
        backupData ? Promise.resolve(backupData) : backupAPI.criar()
      ]);
      
      if (!emailjsConfig.exists()) {
        throw new Error(
          "EmailJS não configurado. Configure as credenciais em: Backup → Ver Passo a Passo EmailJS"
        );
      }
      
      const config = emailjsConfig.val();
      
      if (!config.publicKey || !config.serviceId || !config.templateId) {
        throw new Error(
          "Configuração do EmailJS incompleta. Verifique todas as credenciais."
        );
      }
      
      console.log(`✅ [DADOS] ${dados.encomendas.length} encomendas, ${dados.produtos.length} produtos, ${dados.clientes.length} clientes`);
      
      // Preparar backup
      const dataFormatada = new Date(dados.timestamp).toLocaleDateString("pt-BR");
      const horaFormatada = new Date(dados.timestamp).toLocaleTimeString("pt-BR");
      const backupJson = JSON.stringify(dados, null, 2);
      const txtFilename = `backup_nicolina_${dataFormatada.replace(/\//g, '-')}_${dados.timestamp}.txt`;
      const zipFilename = `backup_nicolina_${dataFormatada.replace(/\//g, '-')}_${dados.timestamp}.zip`;
      const backupSizeKB = (backupJson.length / 1024).toFixed(2);
      
      console.log(`📦 [BACKUP] ${backupSizeKB} KB - Criando ZIP...`);
      
      // ✅ Criar ZIP
      const zipStart = Date.now();
      const zip = new JSZip();
      zip.file(txtFilename, backupJson);
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 } // Máxima compressão
      });
      
      const zipTime = ((Date.now() - zipStart) / 1000).toFixed(1);
      const zipSizeKB = (zipBlob.size / 1024).toFixed(2);
      const compressaoPercent = (((backupJson.length - zipBlob.size) / backupJson.length) * 100).toFixed(0);
      
      console.log(`✅ [ZIP] Criado em ${zipTime}s: ${zipSizeKB} KB (economizou ${compressaoPercent}%)`);
      
      // ✅ Converter ZIP Blob para Base64 para anexar ao email
      console.log(`🔄 [CONVERSÃO] Convertendo ZIP para Base64 para anexo no email...`);
      const convertStart = Date.now();
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove o prefixo "data:application/zip;base64,"
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(zipBlob);
      const base64Zip = await base64Promise;
      
      const convertTime = ((Date.now() - convertStart) / 1000).toFixed(1);
      console.log(`✅ [CONVERSÃO] Concluída em ${convertTime}s!`);
      
      // ✅ Inicializar EmailJS
      emailjs.init(config.publicKey);
      
      // ✅ HTML do email com informação sobre o ANEXO
      const mensagemHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:700px;margin:20px auto;background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
    
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#084d6e;margin:0;font-size:32px;">🍞</h1>
      <h2 style="color:#084d6e;margin:10px 0 0 0;font-size:24px;">Backup Nicolina</h2>
    </div>
    
    <div style="background:#f0f8ff;padding:20px;border-radius:8px;margin-bottom:30px;">
      <p style="margin:0 0 10px 0;font-size:16px;color:#333;">
        <strong>📅 Data:</strong> ${dataFormatada}
      </p>
      <p style="margin:0;font-size:16px;color:#333;">
        <strong>🕐 Hora:</strong> ${horaFormatada}
      </p>
    </div>
    
    <table style="width:100%;border-collapse:collapse;margin:30px 0;background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#084d6e;color:white;">
          <th style="padding:15px;text-align:left;font-weight:600;">Item</th>
          <th style="padding:15px;text-align:right;font-weight:600;">Quantidade</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #e0e0e0;">
          <td style="padding:15px;"><strong>📦 Encomendas</strong></td>
          <td style="padding:15px;text-align:right;color:#084d6e;font-weight:bold;">${dados.encomendas.length}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0;">
          <td style="padding:15px;"><strong>🍞 Produtos</strong></td>
          <td style="padding:15px;text-align:right;color:#084d6e;font-weight:bold;">${dados.produtos.length}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0;">
          <td style="padding:15px;"><strong>👥 Clientes</strong></td>
          <td style="padding:15px;text-align:right;color:#084d6e;font-weight:bold;">${dados.clientes.length}</td>
        </tr>
        <tr>
          <td style="padding:15px;"><strong>📦 Tamanho ZIP</strong></td>
          <td style="padding:15px;text-align:right;">
            <span style="color:#28a745;font-weight:bold;">${zipSizeKB} KB</span>
            <br>
            <small style="color:#666;">(${compressaoPercent}% menor que ${backupSizeKB} KB)</small>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div style="background:#d4edda;padding:25px;border-left:5px solid #28a745;margin:30px 0;border-radius:5px;">
      <h4 style="margin:0 0 15px 0;color:#155724;font-size:16px;">📎 Arquivo Anexado</h4>
      <p style="margin:0;font-size:14px;color:#155724;line-height:1.8;">
        O backup está <strong>anexado neste email</strong> no formato ZIP.<br>
        Procure pelo arquivo <code style="background:#f5f5f5;padding:4px 10px;border-radius:4px;font-size:12px;">${zipFilename}</code> nos anexos deste email.
      </p>
    </div>
    
    <div style="background:#fff9e6;padding:25px;border-left:5px solid #ffc107;margin:30px 0;border-radius:5px;">
      <h3 style="margin:0 0 15px 0;color:#e65100;font-size:18px;">📥 Como Restaurar o Backup</h3>
      <ol style="margin:0;padding-left:20px;line-height:2;font-size:15px;color:#555;">
        <li><strong>Baixe o anexo ZIP</strong> deste email</li>
        <li>Salve o arquivo <code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;">${zipFilename}</code></li>
        <li><strong>Extraia o arquivo ZIP</strong> (clique com botão direito → Extrair)</li>
        <li>Dentro do ZIP você encontrará: <code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;">${txtFilename}</code></li>
        <li>Acesse o <strong>Sistema Nicolina</strong></li>
        <li>Vá em <strong>Menu → Backup → Restaurar</strong></li>
        <li>Selecione o arquivo <code>.txt</code> extraído</li>
        <li>Confirme a restauração ✅</li>
      </ol>
    </div>
    
    <div style="background:#e3f2fd;padding:25px;border-left:5px solid #2196f3;margin:30px 0;border-radius:5px;">
      <h4 style="margin:0 0 15px 0;color:#1565c0;font-size:16px;">💡 Vantagens do Backup ZIP</h4>
      <ul style="margin:0;padding-left:20px;line-height:2;font-size:15px;color:#555;">
        <li><strong>Compactado:</strong> Arquivo ${compressaoPercent}% menor!</li>
        <li><strong>Completo:</strong> Todos os dados (encomendas, produtos, clientes)</li>
        <li><strong>Anexo Direto:</strong> Arquivo ZIP anexado neste email</li>
        <li><strong>Fácil:</strong> Baixe e extraia quando precisar</li>
      </ul>
    </div>
    
    <div style="margin-top:40px;padding-top:25px;border-top:2px solid #e0e0e0;text-align:center;">
      <p style="color:#084d6e;font-size:14px;margin:5px 0;font-weight:600;">🍞 Sistema Nicolina</p>
      <p style="color:#999;font-size:12px;margin:5px 0;">Gestão de Encomendas</p>
      <p style="color:#999;font-size:11px;margin:15px 0 5px 0;">${email}</p>
      <p style="color:#ccc;font-size:11px;margin:5px 0;">${new Date().toLocaleString("pt-BR")}</p>
    </div>
    
  </div>
</body>
</html>`;
      
      // ✅ Enviar email com ANEXO ZIP
      console.log(`📧 [EMAIL] Enviando com anexo ZIP de ${zipSizeKB} KB...`);
      const emailStart = Date.now();
      
      await emailjs.send(
        config.serviceId,
        config.templateId,
        {
          to_name: "Nicolina",
          to_email: email,
          reply_to: email,
          user_email: email,
          subject: `🍞 Backup Nicolina (${zipSizeKB} KB ZIP Anexado) - ${dataFormatada}`,
          message: `Backup ZIP anexado neste email. Procure o arquivo ${zipFilename} nos anexos.`,
          html_message: mensagemHTML,
          data_backup: dataFormatada,
          hora_backup: horaFormatada,
          total_encomendas: dados.encomendas.length,
          total_produtos: dados.produtos.length,
          total_clientes: dados.clientes.length,
          filename: zipFilename,
          backup_size: `${zipSizeKB} KB (${compressaoPercent}% compactado)`,
          // ✅ ANEXO DO ARQUIVO ZIP
          attachment: {
            name: zipFilename,
            data: base64Zip,
            type: 'application/zip'
          }
        }
      );
      
      const emailTime = ((Date.now() - emailStart) / 1000).toFixed(1);
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(`✅ [EMAIL] Enviado em ${emailTime}s com anexo ZIP`);
      console.log(`✅ [SUCESSO TOTAL] ${totalTime}s`);
      console.log(`\n📊 RESUMO DO BACKUP:`);
      console.log(`   📦 ${dados.encomendas.length} encomendas`);
      console.log(`   🍞 ${dados.produtos.length} produtos`);
      console.log(`   👥 ${dados.clientes.length} clientes`);
      console.log(`   💾 Original: ${backupSizeKB} KB`);
      console.log(`   📦 ZIP Anexado: ${zipSizeKB} KB (${compressaoPercent}% menor)`);
      console.log(`   ⏱️  Tempo total: ${totalTime}s`);
      
    } catch (error) {
      console.error("❌ [BACKUP] Erro:", error);
      
      let errorMessage = "Erro desconhecido";
      if (error && typeof error === 'object') {
        if ((error as any).text) {
          errorMessage = (error as any).text;
        } else if ((error as any).message) {
          errorMessage = (error as any).message;
        }
      }
      
      throw new Error(errorMessage);
    }
  },
};

// ============= MIGRAÇÃO =============

export const migracaoAPI = {
  /**
   * Verifica se existem dados no localStorage que precisam ser migrados
   */
  verificarDadosLocalStorage: (): boolean => {
    const encomendas = localStorageAPI.listarEncomendas();
    const produtos = localStorageAPI.listarProdutos();
    const clientes = localStorageAPI.listarClientes();
    
    return encomendas.length > 0 || produtos.length > 0 || clientes.length > 0;
  },

  /**
   * Migra todos os dados do localStorage para o Firebase
   */
  migrarParaFirebase: async (): Promise<{ 
    sucesso: boolean; 
    encomendas: number; 
    produtos: number; 
    clientes: number;
    erro?: string;
  }> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      return {
        sucesso: false,
        encomendas: 0,
        produtos: 0,
        clientes: 0,
        erro: "Firebase não configurado. Configure as credenciais primeiro.",
      };
    }

    try {
      const encomendas = localStorageAPI.listarEncomendas();
      const produtos = localStorageAPI.listarProdutos();
      const clientes = localStorageAPI.listarClientes();

      console.log(`🔄 Iniciando migração: ${encomendas.length} encomendas, ${produtos.length} produtos, ${clientes.length} clientes`);

      // Migrar encomendas
      for (const encomenda of encomendas) {
        await set(ref(database, `nicolina/encomendas/${encomenda.id}`), encomenda);
      }

      // Migrar produtos
      for (const produto of produtos) {
        await set(ref(database, `nicolina/produtos/${produto.id}`), produto);
      }

      // Migrar clientes
      for (const cliente of clientes) {
        await set(ref(database, `nicolina/clientes/${cliente.id}`), cliente);
      }

      console.log("✅ Migraço concluída com sucesso!");

      return {
        sucesso: true,
        encomendas: encomendas.length,
        produtos: produtos.length,
        clientes: clientes.length,
      };
    } catch (error) {
      console.error("❌ Erro na migração:", error);
      return {
        sucesso: false,
        encomendas: 0,
        produtos: 0,
        clientes: 0,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  },

  /**
   * Exporta dados para arquivo JSON
   */
  exportarParaJSON: async (): Promise<string> => {
    const encomendas = await encomendasAPI.listar();
    const produtos = await produtosAPI.listar();
    const clientes = await clientesAPI.listar();

    const exportacao = {
      timestamp: Date.now(),
      data: new Date().toISOString(),
      sistema: `${NOME_SISTEMA} - Gestão de Encomendas`,
      versao: VERSAO_SISTEMA,
      encomendas,
      produtos,
      clientes,
    };

    return JSON.stringify(exportacao, null, 2);
  },
};

// ============= CONTROLE DE LANÇAMENTO DE ENCOMENDAS =============
// Chave individual: `${encomendasId}__${produtoIndex}` (dois underscores como separador)
// Armazenado em: nicolina/lancamentos/{chave} = true (ausente = não lançado)

export const lancamentosAPI = {
  listar: async (): Promise<Record<string, boolean>> => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) {
      try {
        const data = localStorage.getItem("nicolina_lancamentos");
        return data ? JSON.parse(data) : {};
      } catch { return {}; }
    }
    try {
      const snapshot = await get(ref(database, "nicolina/lancamentos"));
      const result: Record<string, boolean> = snapshot.exists() ? snapshot.val() : {};
      localStorage.setItem("nicolina_lancamentos", JSON.stringify(result));
      return result;
    } catch {
      try {
        const data = localStorage.getItem("nicolina_lancamentos");
        return data ? JSON.parse(data) : {};
      } catch { return {}; }
    }
  },

  marcar: async (chave: string, lancado: boolean): Promise<void> => {
    const atualizarLocal = (lancado: boolean) => {
      try {
        const current: Record<string, boolean> = JSON.parse(localStorage.getItem("nicolina_lancamentos") || "{}");
        if (lancado) current[chave] = true; else delete current[chave];
        localStorage.setItem("nicolina_lancamentos", JSON.stringify(current));
      } catch {}
    };
    atualizarLocal(lancado);
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return;
    try {
      if (lancado) {
        await set(ref(database, `nicolina/lancamentos/${chave}`), true);
      } else {
        await remove(ref(database, `nicolina/lancamentos/${chave}`));
      }
    } catch (error) {
      console.error("Erro ao marcar lançamento:", error);
      throw error;
    }
  },

  marcarVarios: async (chaves: string[], lancado: boolean): Promise<void> => {
    if (chaves.length === 0) return;
    try {
      const current: Record<string, boolean> = JSON.parse(localStorage.getItem("nicolina_lancamentos") || "{}");
      for (const chave of chaves) {
        if (lancado) current[chave] = true; else delete current[chave];
      }
      localStorage.setItem("nicolina_lancamentos", JSON.stringify(current));
    } catch {}
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return;
    try {
      const updates: Record<string, boolean | null> = {};
      for (const chave of chaves) {
        updates[`nicolina/lancamentos/${chave}`] = lancado ? true : null;
      }
      await update(ref(database), updates);
    } catch (error) {
      console.error("Erro ao marcar vários lançamentos:", error);
      throw error;
    }
  },

  observar: (callback: (lancamentos: Record<string, boolean>) => void): (() => void) => {
    if (!isFirebaseConfigured() || !isDatabaseAvailable()) return () => {};
    return onValue(ref(database, "nicolina/lancamentos"), (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : {});
    });
  },
};

// Exportar função para verificar status
export const verificarStatusBancoDados = () => {
  const configurado = isFirebaseConfigured();
  const temDadosLocal = migracaoAPI.verificarDadosLocalStorage();
  
  return {
    firebaseConfigurado: configurado,
    temDadosLocalStorage: temDadosLocal,
    usandoFirebase: configurado && isDatabaseAvailable(),
    usandoLocalStorage: !configurado || !isDatabaseAvailable(),
  };
};

// Exportar localStorageAPI para uso direto quando necessário (ex: migração)
export { localStorageAPI };