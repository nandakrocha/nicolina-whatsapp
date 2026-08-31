import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Combobox } from "../components/ui/combobox";
import { Checkbox } from "../components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  Download,
  Printer,
  LayoutGrid,
  List,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Settings,
  ArrowUpAZ,
  Package,
  Clock,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  encomendasAPI,
  clientesAPI,
  produtosAPI,
  usuariosAPI,
  type Encomenda,
  type Cliente,
  type Produto,
  type ProdutoEncomenda,
} from "../services/api";
import { TabelaEncomendas } from "./TabelaEncomendas";
import { AutenticacaoModal } from "../components/AutenticacaoModal";
import { exportarParaExcel, imprimirPagina, estiloImpressaoPadrao } from "../utils/exportacao";
import { authReadyPromise } from "../services/firebase";

export default function EncomendasTabela() {
  // ✅ LOG DE VERSÃO v3.00.0 - IMPRESSÃO PROFISSIONAL A4 COMPLETA
  console.log("%c🔥 EncomendasTabela.tsx v3.00.0 CARREGADO - " + new Date().toLocaleTimeString(), 
    "background: #00ff00; color: black; font-size: 24px; font-weight: bold; padding: 15px;");
  console.log("📋 VERSÃO DO COMPONENTE: 3.00.0 (Impressão Profissional A4 + Agrupamento)");
  console.log("📅 TIMESTAMP:", Date.now());
  console.log("🆕 NOVIDADES:");
  console.log("  ✅ 🖨️ Sistema de impressão COMPLETO para A4 retrato");
  console.log("  ✅ 📄 Margens: 15mm (topo/baixo) + 10mm (laterais)");
  console.log("  ✅ 📊 Cabeçalho com logo, período e data de geração");
  console.log("  ✅ 🎯 Tabela formatada com bordas pretas e fundo cinza");
  console.log("  ✅ 📏 Colunas otimizadas: Cliente, Data, Hora, Produto, Qtd, Obs, Peso");
  console.log("  ✅ 🔢 Linha de total geral destacada");
  console.log("  ✅ 📝 Rodapé com informações do sistema");
  console.log("  ✅ 🔗 Agrupamento automático de encomendas duplicadas");
  console.log("  ✅ 🚫 Menu, botões e filtros OCULTOS na impressão");
  console.log("✅ SISTEMA TOTALMENTE OPERACIONAL!");
  
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState(() => {
    // Iniciar com a data atual
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("all");
  const [filtroProdutos, setFiltroProdutos] = useState<string[]>([]); // Múltiplos produtos
  const [popoverProdutosAberto, setPopoverProdutosAberto] = useState(false);
  const [filtroHora, setFiltroHora] = useState("all");
  const [filtroHorarios, setFiltroHorarios] = useState<string[]>([]); // Múltiplos horários
  const [popoverHorariosAberto, setPopoverHorariosAberto] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroProdutosInput, setFiltroProdutosInput] = useState(""); // guarda o que o usuário digita
  

  // Modo de visualização
  const [modoVisualizacao, setModoVisualizacao] = useState<"card" | "lista">("lista");

  // Formulário
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novoClienteId, setNovoClienteId] = useState("");
  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const [novosProdutos, setNovosProdutos] = useState<ProdutoEncomenda[]>([]);

  // Produto sendo adicionado
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [observacaoProduto, setObservacaoProduto] = useState("");

  // Controle de alterações não salvas
  const [temAlteracoes, setTemAlteracoes] = useState(false);
  const formularioRef = useRef<HTMLDivElement>(null);
  
  // Controle do AlertDialog
  const [encomendaParaExcluir, setEncomendaParaExcluir] = useState<Encomenda | null>(null);
  const [mostrarConfirmacaoExclusao, setMostrarConfirmacaoExclusao] = useState(false);
  
  // ============ AUTENTICAÇÃO PARA EDIÇÃO E EXCLUSÃO ============
  const [mostrarAutenticacao, setMostrarAutenticacao] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState<{ tipo: 'editar' | 'excluir', encomenda: Encomenda } | null>(null);
  const [encomendaPendenteEdicao, setEncomendaPendenteEdicao] = useState<Encomenda | null>(null);
  const [codigoAuth, setCodigoAuth] = useState("");
  const [senhaAuth, setSenhaAuth] = useState("");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  
  // ============ EDIÇÃO INLINE ============
  const [editandoInlineId, setEditandoInlineId] = useState<string | null>(null);
  const [editandoInlineCliente, setEditandoInlineCliente] = useState("");
  const [editandoInlineData, setEditandoInlineData] = useState("");
  const [editandoInlineHora, setEditandoInlineHora] = useState("");
  const [editandoInlineProdutos, setEditandoInlineProdutos] = useState<ProdutoEncomenda[]>([]);
  
  // ============ ADICIONAR PRODUTO NA EDIÇÃO INLINE ============
  const [novoProdutoInlineId, setNovoProdutoInlineId] = useState("");
  const [novoProdutoInlineQtd, setNovoProdutoInlineQtd] = useState("");
  const [novoProdutoInlineObs, setNovoProdutoInlineObs] = useState("");
  
  // ============ IOS / MOBILE SCROLL DETECTION ============
  // Use a DOM ref + passive addEventListener so these listeners NEVER block native scroll.
  // React's synthetic onTouchMove is non-passive in React 18, causing the browser to
  // wait 50-300ms before scrolling — this is the primary mobile scroll freeze bug.
  const formCardRef = useRef<HTMLDivElement>(null);
  const iosScrollingRef = useRef(false);
  const iosTouchStartY = useRef(0);
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const el = formCardRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      iosTouchStartY.current = e.touches[0].clientY;
      iosScrollingRef.current = false;
    };
    const onMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].clientY - iosTouchStartY.current) > 5) {
        iosScrollingRef.current = true;
      }
    };
    // { passive: true } is critical — tells the browser it can scroll immediately
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
    };
  }, [mostrarFormulario]);

  const handleInputFocusIOS = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isIOS && iosScrollingRef.current) {
      e.target.blur();
    }
  };

  // ============ ORDENAÇÃO ============
  const [ordenacao, setOrdenacao] = useState<"cliente" | "alfabetica" | "produto" | "horario" | null>(null);
  
  // ============ CONFIGURAÇÕES DE ESPAÇAMENTO ============
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false);
  const [paddingTabela, setPaddingTabela] = useState<"compacto" | "normal" | "confortavel">("normal");


  useEffect(() => {
    let ativo = true;

    const hoje = new Date();
    setNovaData(hoje.toISOString().split("T")[0]);
    setNovaHora("06:00");

    // Aguarda auth anônima confirmar ANTES do primeiro fetch.
    // Garante isDatabaseAvailable() = true → dados vêm do Firebase, não do localStorage.
    const iniciar = async () => {
      await authReadyPromise;
      if (!ativo) return;
      await carregarDados();
    };
    iniciar();

    // Sincronização em tempo real: recarrega quando Firebase notifica mudança.
    // Um erro no listener NÃO chama setEncomendas([]) — dados já carregados são preservados.
    const reload = () => carregarDados();
    window.addEventListener('encomenda-atualizada', reload);
    window.addEventListener('clientes-atualizados', reload);
    window.addEventListener('produtos-atualizados', reload);
    window.addEventListener('usuarios-atualizados', reload);

    return () => {
      ativo = false;
      window.removeEventListener('encomenda-atualizada', reload);
      window.removeEventListener('clientes-atualizados', reload);
      window.removeEventListener('produtos-atualizados', reload);
      window.removeEventListener('usuarios-atualizados', reload);
    };
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      console.log("🔄 Carregando dados do servidor...");
      const [encomendasData, clientesData, produtosData, usuariosData] = await Promise.all([
        encomendasAPI.listar(),
        clientesAPI.listar(),
        produtosAPI.listar(),
        usuariosAPI.listar(),
      ]);
      console.log("✅ Dados carregados:", {
        encomendas: encomendasData.length,
        clientes: clientesData.length,
        produtos: produtosData.length,
        usuarios: usuariosData.length,
      });
      setEncomendas(encomendasData);
      setClientes(clientesData.sort((a, b) => a.nome.localeCompare(b.nome)));
      setProdutos(produtosData.sort((a, b) => a.nome.localeCompare(b.nome)));
      setUsuarios(usuariosData);
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados. Verifique o console para mais detalhes.");
    } finally {
      setCarregando(false);
    }
  };

  // Função para calcular peso em tempo real
  const calcularPesoAtual = (produtoEncomenda: ProdutoEncomenda) => {
    const produtoAtual = produtos.find((p) => p.id === produtoEncomenda.produtoId);
    if (produtoAtual && produtoAtual.pesoPorUnidadeKg) {
      return (produtoAtual.pesoPorUnidadeKg * produtoEncomenda.quantidade).toFixed(3);
    }
    return (produtoEncomenda.pesoTotalKg || 0).toFixed(3);
  };

  const adicionarProdutoAoFormulario = () => {
    if (!produtoSelecionadoId || !quantidade) {
      toast.error("Selecione um produto e quantidade");
      return;
    }

    const produto = produtos.find((p) => p.id === produtoSelecionadoId);
    if (!produto) return;

    const qtd = parseFloat(quantidade);
    const pesoTotal = produto.pesoPorUnidadeKg * qtd;

    setNovosProdutos([
      ...novosProdutos,
      {
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: qtd,
        pesoPorUnidadeKg: produto.pesoPorUnidadeKg,
        pesoTotalKg: pesoTotal,
        observacao: observacaoProduto,
      },
    ]);

    setProdutoSelecionadoId("");
    setQuantidade("");
    setObservacaoProduto("");
    toast.success("Produto adicionado");
  };

  const removerProdutoDoFormulario = (index: number) => {
    setNovosProdutos(novosProdutos.filter((_, i) => i !== index));
    toast.success("Produto removido");
  };

  const salvarEncomenda = async () => {
    // 🤖 CORREÇÃO ANDROID: Remover foco de inputs antes de salvar
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await new Promise(resolve => setTimeout(resolve, 50));

    // 🔥 SISTEMA DE AGRUPAMENTO AUTOMÁTICO DE ENCOMENDAS
    // Detecta automaticamente se já existe uma encomenda do mesmo cliente, na mesma data e horário.
    // Se existir, agrupa os produtos na encomenda existente ao invés de criar uma nova.
    // Produtos duplicados têm suas quantidades somadas automaticamente.

    if (!novoClienteId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (novosProdutos.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    const cliente = clientes.find((c) => c.id === novoClienteId);
    if (!cliente) return;

    // 🔥 NOVO: Detectar encomenda duplicada (mesmo cliente + mesma data + mesmo horário)
    if (!editandoId) {
      const encomendaExistente = encomendas.find(
        (e) =>
          e.clienteId === novoClienteId &&
          e.data === novaData &&
          e.hora === novaHora
      );

      if (encomendaExistente) {
        console.log("🔍 Encomenda duplicada detectada:", {
          cliente: cliente.nome,
          data: novaData,
          hora: novaHora,
          encomendaExistenteId: encomendaExistente.id,
        });

        console.log("📦 Produtos na encomenda existente:", encomendaExistente.produtos);
        console.log("➕ Produtos a serem adicionados:", novosProdutos);

        // Combinar produtos da encomenda existente com os novos
        const produtosCombinados = [...encomendaExistente.produtos];

        // Adicionar cada novo produto
        for (const novoProduto of novosProdutos) {
          // Verificar se o produto já existe na encomenda
          const indexExistente = produtosCombinados.findIndex(
            (p) => p.produtoId === novoProduto.produtoId
          );

          if (indexExistente >= 0) {
            // Se já existe, somar a quantidade
            produtosCombinados[indexExistente] = {
              ...produtosCombinados[indexExistente],
              quantidade: produtosCombinados[indexExistente].quantidade + novoProduto.quantidade,
              pesoTotalKg: produtosCombinados[indexExistente].pesoTotalKg + novoProduto.pesoTotalKg,
              observacao: produtosCombinados[indexExistente].observacao
                ? `${produtosCombinados[indexExistente].observacao} | ${novoProduto.observacao || ''}`
                : novoProduto.observacao || '',
            };
          } else {
            // Se não existe, adicionar como novo
            produtosCombinados.push(novoProduto);
          }
        }

        const quantidadeTotal = produtosCombinados.reduce((acc, p) => acc + p.quantidade, 0);

        console.log("✅ Produtos combinados:", produtosCombinados);
        console.log("📊 Quantidade total após agrupamento:", quantidadeTotal);

        // Atualizar a encomenda existente com os produtos combinados
        try {
          await encomendasAPI.atualizar(encomendaExistente.id, {
            produtos: produtosCombinados,
            quantidadeTotal,
          });

          // Criar mensagem detalhada
          const produtosAdicionadosNomes = novosProdutos.map(p => `${p.produtoNome} (${p.quantidade}x)`).join(', ');
          
          toast.success(
            <div className="space-y-1">
              <p className="font-bold">🔗 Encomenda Agrupada com Sucesso!</p>
              <p className="text-sm">
                Cliente: <strong>{cliente.nome}</strong>
              </p>
              <p className="text-sm">
                Data/Hora: <strong>{new Date(novaData + 'T12:00:00').toLocaleDateString('pt-BR')} às {novaHora}</strong>
              </p>
              <p className="text-sm">
                Produtos adicionados: <strong>{produtosAdicionadosNomes}</strong>
              </p>
            </div>,
            { duration: 6000 }
          );

          // Disparar eventos customizados para atualizar outras páginas
          window.dispatchEvent(new Event('encomendas-atualizadas'));
          console.log("✅ Evento 'encomendas-atualizadas' disparado (agrupamento)");

          cancelarFormulario();
          carregarDados();
          return;
        } catch (error) {
          console.error("Erro ao agrupar produtos na encomenda existente:", error);
          toast.error("Erro ao agrupar produtos");
          return;
        }
      }
    }

    // Se não é edição e não há duplicata, criar nova encomenda
    const quantidadeTotal = novosProdutos.reduce((acc, p) => acc + p.quantidade, 0);

    const encomendaData: any = {
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone || "",
      data: novaData,
      hora: novaHora,
      produtos: novosProdutos,
      quantidadeTotal,
    };

    try {
      if (editandoId) {
        await encomendasAPI.atualizar(editandoId, encomendaData);
        toast.success("Encomenda atualizada com sucesso!");
      } else {
        await encomendasAPI.criar(encomendaData);
        toast.success("Encomenda criada com sucesso!");
      }
      
      // Disparar eventos customizados para atualizar outras páginas
      window.dispatchEvent(new Event('encomendas-atualizadas'));
      console.log("✅ Evento 'encomendas-atualizadas' disparado");
      
      cancelarFormulario();
      carregarDados();
    } catch (error) {
      console.error("Erro ao salvar encomenda:", error);
      toast.error("Erro ao salvar encomenda");
    }
  };

  const iniciarEdicao = (encomenda: Encomenda) => {
    console.log("🔧 Editando encomenda:", encomenda.id);
    setEditandoId(encomenda.id);
    setNovoClienteId(encomenda.clienteId);
    setNovaData(encomenda.data);
    setNovaHora(encomenda.hora);
    setNovosProdutos([...encomenda.produtos]);
    setMostrarFormulario(true);
    setTemAlteracoes(false);
    
    // Scroll para o topo após um pequeno delay
    setTimeout(() => {
      console.log("📜 Fazendo scroll para o topo");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Solicitar autenticação antes de excluir
  const solicitarExclusao = (encomenda: Encomenda) => {
    console.log("🔒 Solicitando autenticação para excluir encomenda:", encomenda.id);
    setAcaoPendente({ tipo: 'excluir', encomenda });
    setMostrarAutenticacao(true);
  };

  const excluirEncomenda = async (id: string) => {
    try {
      await encomendasAPI.excluir(id);
      toast.success("Encomenda excluída com sucesso!");
      setEncomendaParaExcluir(null);
      
      // Disparar eventos customizados para atualizar outras páginas
      window.dispatchEvent(new Event('encomendas-atualizadas'));
      console.log("✅ Evento 'encomendas-atualizadas' disparado (exclusão)");
      
      carregarDados();
    } catch (error) {
      console.error("Erro ao excluir encomenda:", error);
      toast.error("Erro ao excluir encomenda");
    }
  };
  
  // Confirmar exclusão após autenticação
  const confirmarExclusao = async () => {
    if (encomendaParaExcluir) {
      setMostrarConfirmacaoExclusao(false);
      await excluirEncomenda(encomendaParaExcluir.id);
      setEncomendaParaExcluir(null);
    }
  };
  
  // Cancelar exclusão
  const cancelarExclusao = () => {
    console.log("❌ Exclusão cancelada pelo usuário");
    setMostrarConfirmacaoExclusao(false);
    setEncomendaParaExcluir(null);
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setNovoClienteId("");
    setNovaData(new Date().toISOString().split("T")[0]);
    setNovaHora("06:00");
    setNovosProdutos([]);
    setProdutoSelecionadoId("");
    setQuantidade("");
    setObservacaoProduto("");
  };

  // Duplicar: salva a encomenda atual como novo registro independente e mantém o formulário aberto
  const duplicarEncomendaFormulario = async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!novoClienteId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (novosProdutos.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    const cliente = clientes.find((c) => c.id === novoClienteId);
    if (!cliente) return;

    const quantidadeTotal = novosProdutos.reduce((acc, p) => acc + p.quantidade, 0);

    try {
      await encomendasAPI.criar({
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteTelefone: cliente.telefone || "",
        data: novaData,
        hora: novaHora,
        produtos: novosProdutos.map(p => ({ ...p })),
        quantidadeTotal,
      });

      toast.success("Encomenda duplicada! Altere a data/hora e clique novamente para criar outra.");
      window.dispatchEvent(new Event('encomendas-atualizadas'));
      carregarDados();
      // Mantém o formulário aberto com cliente e produtos — apenas limpa campos auxiliares
      setProdutoSelecionadoId("");
      setQuantidade("");
      setObservacaoProduto("");
    } catch (error) {
      console.error("Erro ao duplicar encomenda:", error);
      toast.error("Erro ao duplicar encomenda");
    }
  };

  // ============ FUNÇÕES DE AUTENTICAÇÃO ============
  const solicitarAutenticacao = (encomenda: Encomenda) => {
    console.log("🔐 Solicitando autenticação para editar encomenda:", encomenda.id);
    setAcaoPendente({ tipo: 'editar', encomenda });
    setMostrarAutenticacao(true);
  };

  // Handler para quando a autenticação for bem-sucedida
  const handleAutenticacaoSucesso = () => {
    console.log("✅ Autenticação bem-sucedida!");
    setMostrarAutenticacao(false);
    
    if (acaoPendente) {
      if (acaoPendente.tipo === 'editar') {
        console.log("📝 Abrindo editor inline...");
        iniciarEdicaoInline(acaoPendente.encomenda);
      } else if (acaoPendente.tipo === 'excluir') {
        console.log("⚠️ Abrindo confirmação de exclusão...");
        setEncomendaParaExcluir(acaoPendente.encomenda);
        setMostrarConfirmacaoExclusao(true);
      }
      setAcaoPendente(null);
    }
  };

  const cancelarAutenticacao = () => {
    setMostrarAutenticacao(false);
    setAcaoPendente(null);
    setCodigoAuth("");
    setSenhaAuth("");
  };

  // ============ FUNÇÕES DE EDIÇÃO INLINE ============
  const iniciarEdicaoInline = (encomenda: Encomenda) => {
    console.log("🟢 [INLINE] Iniciando edição inline:", encomenda.id);
    setEditandoInlineId(encomenda.id);
    setEditandoInlineCliente(encomenda.clienteId);
    setEditandoInlineData(encomenda.data);
    setEditandoInlineHora(encomenda.hora);
    setEditandoInlineProdutos([...encomenda.produtos]);
  };

  const cancelarEdicaoInline = () => {
    console.log("❌ [INLINE] Cancelando edição inline");
    setEditandoInlineId(null);
    setEditandoInlineCliente("");
    setEditandoInlineData("");
    setEditandoInlineHora("");
    setEditandoInlineProdutos([]);
  };

  const salvarEdicaoInline = async () => {
    // 🤖 CORREÇÃO ANDROID: Remover foco de inputs antes de salvar
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await new Promise(resolve => setTimeout(resolve, 50));

    console.log("💾 [INLINE] Salvando edição inline:", editandoInlineId);

    if (!editandoInlineCliente) {
      toast.error("Selecione um cliente");
      return;
    }
    if (editandoInlineProdutos.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    const cliente = clientes.find((c) => c.id === editandoInlineCliente);
    if (!cliente) return;

    const quantidadeTotal = editandoInlineProdutos.reduce((acc, p) => acc + p.quantidade, 0);

    const encomendaData: any = {
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone || "",
      data: editandoInlineData,
      hora: editandoInlineHora,
      produtos: editandoInlineProdutos,
      quantidadeTotal,
    };

    try {
      await encomendasAPI.atualizar(editandoInlineId!, encomendaData);
      toast.success("Encomenda atualizada com sucesso!");
      
      // Disparar eventos customizados para atualizar outras páginas
      window.dispatchEvent(new Event('encomendas-atualizadas'));
      console.log("✅ Evento 'encomendas-atualizadas' disparado (edição inline)");
      
      cancelarEdicaoInline();
      carregarDados();
    } catch (error) {
      console.error("Erro ao salvar encomenda:", error);
      toast.error("Erro ao salvar encomenda");
    }
  };

  const removerProdutoEdicaoInline = (index: number) => {
    setEditandoInlineProdutos(editandoInlineProdutos.filter((_, i) => i !== index));
    toast.success("Produto removido");
  };

  const adicionarProdutoEdicaoInline = () => {
    if (!novoProdutoInlineId || !novoProdutoInlineQtd) {
      toast.error("Selecione um produto e quantidade");
      return;
    }

    const produto = produtos.find((p) => p.id === novoProdutoInlineId);
    if (!produto) return;

    const qtd = parseFloat(novoProdutoInlineQtd);
    const pesoTotal = produto.pesoPorUnidadeKg * qtd;

    setEditandoInlineProdutos([
      ...editandoInlineProdutos,
      {
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: qtd,
        pesoPorUnidadeKg: produto.pesoPorUnidadeKg,
        pesoTotalKg: pesoTotal,
        observacao: novoProdutoInlineObs,
      },
    ]);

    setNovoProdutoInlineId("");
    setNovoProdutoInlineQtd("");
    setNovoProdutoInlineObs("");
    toast.success("Produto adicionado");
  };



  // Filtrar encomendas
  const encomendasFiltradas = encomendas.filter((e) => {
    // Filtro de data: se só tem data início, filtra pela data exata OU maior/igual
    // Se tem data fim também, filtra pelo intervalo
    if (filtroDataInicio && !filtroDataFim) {
      // Apenas data início: mostra essa data em diante
      if (e.data < filtroDataInicio) return false;
    } else if (filtroDataInicio && filtroDataFim) {
      // Intervalo: entre data início e fim
      if (e.data < filtroDataInicio || e.data > filtroDataFim) return false;
    } else if (!filtroDataInicio && filtroDataFim) {
      // Apenas data fim: até essa data
      if (e.data > filtroDataFim) return false;
    }
    
    if (filtroCliente !== "all" && e.clienteId !== filtroCliente) return false;
    
    // Filtro de produto: se há múltiplos selecionados, verifica se a encomenda tem pelo menos um deles
    if (filtroProdutos.length > 0) {
      const temProdutoSelecionado = (e.produtos || []).some((p) => 
        filtroProdutos.includes(p.produtoId)
      );
      if (!temProdutoSelecionado) return false;
    }
    
    // Filtro de horário: se há múltiplos selecionados, usa eles, senão usa o select individual
    if (filtroHorarios.length > 0) {
      // Verifica se o horário da encomenda está na lista de horários selecionados
      if (!filtroHorarios.includes(e.hora)) return false;
    } else if (filtroHora !== "all" && e.hora !== filtroHora) {
      return false;
    }

    return true;
  });
  
  // Função para normalizar strings (remove acentos e converte para minúsculas)
  const normalizarString = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Função para calcular total de quantidade considerando filtro de produtos
  const calcularQuantidadeTotal = () => {
    return encomendasFiltradas.reduce((total, enc) => {
      return total + (enc.produtos || []).reduce((sum, p) => {
        // Se há filtro de produtos, soma apenas os produtos selecionados
        if (filtroProdutos.length > 0) {
          return filtroProdutos.includes(p.produtoId) ? sum + p.quantidade : sum;
        }
        // Sem filtro, soma tudo
        return sum + p.quantidade;
      }, 0);
    }, 0);
  };
  
  // Função para calcular total por produto específico (ignora acentos e maiúsculas)
  const calcularTotalPorNomeProduto = (nomeProduto: string) => {
    const nomeBuscaNormalizado = normalizarString(nomeProduto);
    
    return encomendasFiltradas.reduce((total, enc) => {
      return total + (enc.produtos || []).reduce((sum, p) => {
        // Normaliza o nome do produto do banco para comparação
        const nomeProdutoNormalizado = normalizarString(p.produtoNome);
        
        // Verifica se os nomes correspondem (sem acentos e case-insensitive)
        if (nomeProdutoNormalizado === nomeBuscaNormalizado) {
          // Se há filtro de produtos, considera apenas se estiver no filtro
          if (filtroProdutos.length > 0) {
            return filtroProdutos.includes(p.produtoId) ? sum + p.quantidade : sum;
          }
          // Sem filtro, soma
          return sum + p.quantidade;
        }
        return sum;
      }, 0);
    }, 0);
  };
  
  // Função para filtrar produtos visíveis na tabela
  // Se há apenas 1 produto selecionado, mostra apenas ele
  // Se há múltiplos ou nenhum, mostra todos
  const filtrarProdutosVisiveis = (produtos: any[]) => {
    if (filtroProdutos.length === 1) {
      return produtos.filter(p => filtroProdutos.includes(p.produtoId));
    }
    return produtos;
  };
  
  // Ordenar encomendas
  const encomendasOrdenadas = [...encomendasFiltradas].sort((a, b) => {
    if (ordenacao === "cliente") {
      return a.clienteNome.localeCompare(b.clienteNome);
    } else if (ordenacao === "horario") {
      return a.hora.localeCompare(b.hora);
    } else if (ordenacao === "produto") {
      const produtoA = a.produtos[0]?.produtoNome || "";
      const produtoB = b.produtos[0]?.produtoNome || "";
      return produtoA.localeCompare(produtoB);
    }
    return 0; // Sem ordenação
  });

  const exportarExcel = () => {
    const dadosExcel = [];
    encomendasFiltradas.forEach((encomenda) => {
      filtrarProdutosVisiveis(encomenda.produtos || []).forEach((produto) => {
        dadosExcel.push({
          Data: new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR"),
          Hora: encomenda.hora,
          Cliente: encomenda.clienteNome,
          Produto: produto.produtoNome,
          Quantidade: produto.quantidade,
          "Peso Total (kg)": produto.pesoTotalKg?.toFixed(3) || "0.000",
          Observação: produto.observacao || "",
        });
      });
    });

    exportarParaExcel({
      nomeArquivo: "Encomendas",
      nomePlanilha: "Encomendas",
      dados: dadosExcel,
      colunas: [
        { header: "Data", key: "data", width: 12 },
        { header: "Hora", key: "hora", width: 10 },
        { header: "Cliente", key: "cliente", width: 30 },
        { header: "Produto", key: "produto", width: 30 },
        { header: "Quantidade", key: "quantidade", width: 12 },
        { header: "Peso Total (kg)", key: "pesoTotal", width: 15 },
        { header: "Observação", key: "observacao", width: 40 },
      ],
    });
  };

  const imprimir = () => {
    if (encomendasFiltradas.length === 0) {
      toast.error("Não há dados para imprimir");
      return;
    }
    
    setTimeout(() => {
      window.print();
    }, 100);
  };
  
  // Função auxiliar para obter o padding baseado na configuração
  const getPadding = () => {
    switch (paddingTabela) {
      case "compacto":
        return "p-2";
      case "confortavel":
        return "p-4";
      default:
        return "p-3";
    }
  };

  const horariosDisponiveis = Array.from({ length: 16 }, (_, i) => {
    const hora = i + 6;
    return `${String(hora).padStart(2, "0")}:00`;
  });

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando encomendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================ ESTILOS DE IMPRESSÃO ================ */}
      <style>{`
        @media print {
          /* ========== FORÇAR VISIBILIDADE ========== */
          /* Sobrescreve o print.css problemático */
          body, body * {
            visibility: visible !important;
          }
          
          /* Ocultar elementos não necessários */
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Mostrar apenas conteúdo de impressão */
          .print-only {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
          }
          
          /* Resetar body */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Configuração da página */
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          /* Tabela de impressão */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          
          table thead {
            display: table-header-group !important;
          }
          
          table tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          
          table th,
          table td {
            border: 1px solid #000 !important;
            padding: 8px !important;
            font-size: 10pt !important;
          }
          
          table th {
            background-color: #084d6e !important;
            color: white !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          table tbody tr:nth-child(even) {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          table tbody tr:last-child {
            background-color: #e0e0e0 !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📦 Encomendas
          </h1>
          <p className="text-muted-foreground">
            Gerencie todas as encomendas da padaria
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setMostrarFormulario(true)}
            className="gap-2"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Nova Encomenda
          </Button>
        </div>
      </div>

      {/* Formulário */}
      {mostrarFormulario && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editandoId ? "Editar Encomenda" : "Nova Encomenda"}</span>
              <Button variant="ghost" size="sm" onClick={cancelarFormulario}>
                <X className="w-5 h-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-6"
            ref={formCardRef}
          >
            {/* 🔥 AVISO DE ENCOMENDA EXISTENTE */}
            {!editandoId && novoClienteId && novaData && novaHora && (() => {
              const encomendaExistente = encomendas.find(
                (e) => e.clienteId === novoClienteId && e.data === novaData && e.hora === novaHora
              );
              if (encomendaExistente) {
                const cliente = clientes.find((c) => c.id === novoClienteId);
                return (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full p-2 flex-shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2">
                          <span>🔗 Encomenda Existente Detectada</span>
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                          Já existe uma encomenda de <strong>{cliente?.nome}</strong> para{" "}
                          <strong>{new Date(novaData + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> às{" "}
                          <strong>{novaHora}</strong>.
                        </p>
                        <div className="bg-white dark:bg-blue-900/30 rounded p-3 space-y-1">
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Produtos atuais nesta encomenda:
                          </p>
                          {encomendaExistente.produtos.map((p, idx) => (
                            <p key={idx} className="text-xs text-blue-700 dark:text-blue-300">
                              • {p.produtoNome} - <strong>{p.quantidade}x</strong>
                              {p.observacao && ` (${p.observacao})`}
                            </p>
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mt-3">
                          ✅ Ao salvar, os produtos serão <strong>adicionados automaticamente</strong> a esta encomenda!
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Dados Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cliente">Cliente *</Label>
                <Combobox
                  className="mt-1"
                  options={clientes
                    .slice()
                    .sort((a, b) => {
                      const na = Number(a.codigo);
                      const nb = Number(b.codigo);
                      if (na && nb) return na - nb;
                      if (na) return -1;
                      if (nb) return 1;
                      return a.nome.localeCompare(b.nome);
                    })
                    .map((c) => ({
                      value: c.id,
                      label: c.codigo ? `${c.codigo} - ${c.nome}` : c.nome,
                    }))}
                  value={novoClienteId}
                  onValueChange={setNovoClienteId}
                  placeholder="Selecione um cliente"
                  searchPlaceholder="Buscar por código ou nome..."
                  emptyText="Nenhum cliente encontrado."
                />
              </div>

              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) setNovaData(e.target.value);
                  }}
                  className="mt-1"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                />
              </div>

              <div>
                <Label htmlFor="hora">Hora *</Label>
                <Select value={novaHora} onValueChange={setNovaHora}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosDisponiveis.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Adicionar Produtos */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold mb-4">Adicionar Produtos</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="produto">Produto</Label>
                  <Combobox
  value={produtoSelecionadoId}
  onValueChange={setProdutoSelecionadoId}
  options={produtos.map((p) => ({
    value: p.id,
    label: p.nome,
  }))}
  placeholder="Selecione"
  searchPlaceholder="Digite o nome do produto..."
  emptyText="Nenhum produto encontrado"
  className="mt-1"
  filterByFirstLetter={false}
/>
                </div>

                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    onBlur={(e) => {
                      // 🤖 CORREÇÃO ANDROID: Garantir sincronização
                      if (e.target.value) setQuantidade(e.target.value);
                    }}
                    onFocus={handleInputFocusIOS}
                    placeholder="0"
                    className="mt-1"
                    style={{ touchAction: "manipulation" } as React.CSSProperties}
                  />
                </div>

                <div>
                  <Label htmlFor="observacao">Observação</Label>
                  <Input
                    id="observacao"
                    value={observacaoProduto}
                    onChange={(e) => setObservacaoProduto(e.target.value)}
                    onFocus={handleInputFocusIOS}
                    placeholder="Opcional"
                    className="mt-1"
                    style={{ touchAction: "manipulation" } as React.CSSProperties}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={adicionarProdutoAoFormulario}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Produtos Adicionados */}
            {novosProdutos.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">Produto</th>
                      <th className="text-center p-3 text-sm font-semibold">Qtd</th>
                      <th className="text-left p-3 text-sm font-semibold">Observação</th>
                      <th className="text-center p-3 text-sm font-semibold">Peso (kg)</th>
                      <th className="text-center p-3 text-sm font-semibold w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {novosProdutos.map((produto, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 font-medium">{produto.produtoNome}</td>
                        <td className="p-3 text-center font-bold">{produto.quantidade}</td>
                        <td className="p-3 text-muted-foreground">
                          {produto.observacao || "-"}
                        </td>
                        <td className="p-3 text-center font-medium">
                          {calcularPesoAtual(produto)}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerProdutoDoFormulario(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/50">
                      <td className="p-3 text-right font-semibold">
                        Total de Quantidade:
                      </td>
                      <td className="p-3 text-center font-bold text-primary text-lg">
                        {novosProdutos.reduce((acc, p) => acc + p.quantidade, 0)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 justify-between flex-wrap">
              {!editandoId ? (
                <Button
                  variant="outline"
                  onClick={duplicarEncomendaFormulario}
                  className="gap-2 border-primary text-primary hover:bg-primary/10"
                  style={{ touchAction: "manipulation" }}
                >
                  <Copy className="w-4 h-4" />
                  Duplicar Encomenda
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelarFormulario}>
                  Cancelar
                </Button>
                <Button
                  onClick={salvarEncomenda}
                  className="gap-2"
                  style={{ touchAction: "manipulation" }}
                >
                  <Save className="w-4 h-4" />
                  {editandoId ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Configurações */}
      <Dialog open={mostrarConfiguracoes} onOpenChange={setMostrarConfiguracoes}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações da Tabela
            </DialogTitle>
            <DialogDescription>
              Ajuste o espaçamento e a visualização da tabela de encomendas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Espaçamento das Células</Label>
              <p className="text-sm text-muted-foreground">
                Escolha o nível de espaçamento interno das células da tabela
              </p>
              
              <div className="grid gap-3">
                <label
                  className={`flex items-center justify-between gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paddingTabela === "compacto"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="padding"
                      value="compacto"
                      checked={paddingTabela === "compacto"}
                      onChange={(e) => setPaddingTabela(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-semibold">Compacto</div>
                      <div className="text-sm text-muted-foreground">
                        Menor espaçamento (p-2) - Mais conteúdo visível
                      </div>
                    </div>
                  </div>
                  {paddingTabela === "compacto" && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </label>

                <label
                  className={`flex items-center justify-between gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paddingTabela === "normal"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="padding"
                      value="normal"
                      checked={paddingTabela === "normal"}
                      onChange={(e) => setPaddingTabela(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-semibold">Normal (Recomendado)</div>
                      <div className="text-sm text-muted-foreground">
                        Espaçamento equilibrado (p-3) - Padrão do sistema
                      </div>
                    </div>
                  </div>
                  {paddingTabela === "normal" && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </label>

                <label
                  className={`flex items-center justify-between gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paddingTabela === "confortavel"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="padding"
                      value="confortavel"
                      checked={paddingTabela === "confortavel"}
                      onChange={(e) => setPaddingTabela(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-semibold">Confortável</div>
                      <div className="text-sm text-muted-foreground">
                        Maior espaçamento (p-4) - Melhor legibilidade
                      </div>
                    </div>
                  </div>
                  {paddingTabela === "confortavel" && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setMostrarConfiguracoes(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                toast.success("Configurações aplicadas com sucesso!");
                setMostrarConfiguracoes(false);
              }}
            >
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filtros */}
      <Card className="no-print">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Avançados
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="gap-2"
              style={{ touchAction: "manipulation" }}
            >
              {mostrarFiltros ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Fechar Filtros
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Abrir Filtros
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {mostrarFiltros && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filtroCliente">Cliente</Label>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filtroDataInicio">Data Início</Label>
                <Input
                  id="filtroDataInicio"
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  onBlur={(e) => { if (e.target.value) setFiltroDataInicio(e.target.value); }}
                  className="mt-1"
                  style={{ touchAction: 'manipulation' }}
                />
              </div>

              <div>
                <Label htmlFor="filtroDataFim">Data Fim</Label>
                <Input
                  id="filtroDataFim"
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  onBlur={(e) => { if (e.target.value) setFiltroDataFim(e.target.value); }}
                  className="mt-1"
                  style={{ touchAction: 'manipulation' }}
                />
              </div>

              <div>
                <Label htmlFor="filtroProduto">Produto</Label>
                
                {/* Popover de Seleção Múltipla */}
                <Popover open={popoverProdutosAberto} onOpenChange={setPopoverProdutosAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverProdutosAberto}
                      className="w-full justify-between mt-1 h-10 font-normal"
                      style={{ touchAction: "manipulation" }}
                    >
                      <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {filtroProdutos.length === 0 ? (
                          <span className="text-muted-foreground">Todos os produtos</span>
                        ) : (
                          <span className="truncate">
                            {filtroProdutos.length === 1
                              ? produtos.find(p => p.id === filtroProdutos[0])?.nome
                              : `${filtroProdutos.length} produtos selecionados`
                            }
                          </span>
                        )}
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[220px] p-0"
                    align="start"
                    onInteractOutside={(e) => {
                      // 🤖 ANDROID: evita fechamento falso por touch fora
                      const target = e.target as HTMLElement;
                      if (target && target.closest('[data-radix-popper-content-wrapper]')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="p-3 border-b bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">Selecionar Produtos</span>
                        </div>
                        {filtroProdutos.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiltroProdutos([])}
                            className="h-5 px-2 text-[10px]"
                            style={{ touchAction: "manipulation" }}
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                      <div className="flex flex-col gap-0.5 p-1">
                        {produtos.map((p) => {
                          const isSelected = filtroProdutos.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center gap-2 hover:bg-muted rounded px-2 py-1.5 transition-colors cursor-pointer"
                              style={{ touchAction: "manipulation" }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFiltroProdutos([...filtroProdutos, p.id]);
                                  } else {
                                    setFiltroProdutos(filtroProdutos.filter(id => id !== p.id));
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="flex-1 text-sm">{p.nome}</span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="filtroHora">Horário</Label>
                
                {/* Popover de Seleção Múltipla */}
                <Popover open={popoverHorariosAberto} onOpenChange={setPopoverHorariosAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverHorariosAberto}
                      className="w-full justify-between mt-1 h-10 font-normal"
                      style={{ touchAction: "manipulation" }}
                    >
                      <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {filtroHorarios.length === 0 ? (
                          <span className="text-muted-foreground">Todos os horários</span>
                        ) : (
                          <span className="truncate">
                            {filtroHorarios.length === 1
                              ? filtroHorarios[0]
                              : `${filtroHorarios.length} horários selecionados`
                            }
                          </span>
                        )}
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[220px] p-0"
                    align="start"
                    onInteractOutside={(e) => {
                      // 🤖 ANDROID: evita fechamento falso por touch fora
                      const target = e.target as HTMLElement;
                      if (target && target.closest('[data-radix-popper-content-wrapper]')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="p-3 border-b bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">Selecionar Horários</span>
                        </div>
                        {filtroHorarios.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setFiltroHorarios([]); setFiltroHora("all"); }}
                            className="h-5 px-2 text-[10px]"
                            style={{ touchAction: "manipulation" }}
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                      <div className="flex flex-col gap-0.5 p-1">
                        {horariosDisponiveis.map((h) => {
                          const isSelected = filtroHorarios.includes(h);
                          return (
                            <label
                              key={h}
                              className="flex items-center gap-2 hover:bg-muted rounded px-2 py-1.5 transition-colors cursor-pointer"
                              style={{ touchAction: "manipulation" }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const novos = [...filtroHorarios, h].sort();
                                    setFiltroHorarios(novos);
                                    setFiltroHora(h);
                                  } else {
                                    const novos = filtroHorarios.filter(hr => hr !== h);
                                    setFiltroHorarios(novos);
                                    if (novos.length === 0) {
                                      setFiltroHora("all");
                                    } else {
                                      setFiltroHora(novos[0]);
                                    }
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="flex-1 text-xs">{h}</span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    {filtroHorarios.length > 0 && (
                      <div className="p-2 border-t bg-primary/5">
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-medium">{filtroHorarios.length} selecionado(s):</span>{" "}
                          <span className="text-primary">{filtroHorarios.join(", ")}</span>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

            </div>
          </CardContent>
        )}
      </Card>

    {/* Toolbar */}
      <div className="space-y-4 no-print">
        {/* Card de Resumo */}
        {encomendasFiltradas.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hidden">
            <CardContent className="py-2 px-4">
              <div className="flex items-center justify-center overflow-hidden">
                <div className="flex items-center gap-1 sm:gap-3 md:gap-4 lg:gap-6">
                  {/* Pão de sal */}
                  <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">🥖</div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Pão sal</p>
                      <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                        {calcularTotalPorNomeProduto("Pão de sal")}
                      </p>
                    </div>
                  </div>
                  <div className="border-l border-primary/30 h-7 sm:h-10 md:h-12"></div>
                  
                  {/* Mini sal */}
                  <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">🥖</div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Mini sal</p>
                      <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                        {calcularTotalPorNomeProduto("Mini sal")}
                      </p>
                    </div>
                  </div>
                  <div className="border-l border-primary/30 h-7 sm:h-10 md:h-12"></div>
                  
                  {/* Pão de doce */}
                  <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">🍯</div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Pão doce</p>
                      <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                        {calcularTotalPorNomeProduto("Pão de doce")}
                      </p>
                    </div>
                  </div>
                  <div className="border-l border-primary/30 h-7 sm:h-10 md:h-12"></div>
                  
                  {/* Mini doce */}
                  <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">🍯</div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Mini doce</p>
                      <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                        {calcularTotalPorNomeProduto("Mini doce")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
          <Button
            variant={modoVisualizacao === "lista" ? "default" : "outline"}
            size="sm"
            onClick={() => setModoVisualizacao("lista")}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            Lista
          </Button>
          <div className="border-l border-border mx-1"></div>
          <Button
            variant={ordenacao === "cliente" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrdenacao(ordenacao === "cliente" ? null : "cliente")}
            className="gap-2"
          >
            <ArrowUpAZ className="w-4 h-4" />
            Alfabética
          </Button>
          <Button
            variant={ordenacao === "horario" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrdenacao(ordenacao === "horario" ? null : "horario")}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            Horário
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={exportarExcel}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button onClick={imprimir} variant="outline" size="sm" className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>
      </div>

      {/* Lista de Encomendas */}
      {encomendasFiltradas.length === 0 ? (
        <Card className="no-print">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma encomenda encontrada</p>
          </CardContent>
        </Card>
      ) : modoVisualizacao === "card" ? (
        // Visualização em Cards
        <div className="space-y-4 no-print">
          {encomendasOrdenadas.map((encomenda) => {
            const produtosVisiveis = filtrarProdutosVisiveis(encomenda.produtos || []);
            return (
            <Card key={encomenda.id}>
              <CardContent className="pt-6">
                {/* Header do Card - Cliente em Destaque */}
                <div className="mb-4 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-2">
                        📅 {encomenda.clienteNome}
                      </h3>
                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full font-medium">
                          <Calendar className="w-4 h-4" />
                          {new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR")}
                        </span>
                        <span className="px-3 py-1 bg-primary/10 rounded-full font-medium">
                          🕐 {encomenda.hora}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 no-print flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => iniciarEdicao(encomenda)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => solicitarExclusao(encomenda)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tabela de Produtos */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold">Produto</th>
                        <th className="text-center p-3 text-sm font-semibold">Quantidade</th>
                        <th className="text-left p-3 text-sm font-semibold">Observação</th>
                        <th className="text-center p-3 text-sm font-semibold">Peso p/ Qtd (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosVisiveis.map((produto, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3 font-medium">{produto.produtoNome}</td>
                          <td className="p-3 text-center font-bold text-lg">{produto.quantidade}</td>
                          <td className="p-3 text-muted-foreground">{produto.observacao || "-"}</td>
                          <td className="p-3 text-center font-medium">{calcularPesoAtual(produto)}</td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/50">
                        <td className="p-3 text-right font-semibold">Total de Quantidade:</td>
                        <td className="p-3 text-center font-bold text-primary text-xl">
                          {produtosVisiveis.reduce((sum, p) => sum + p.quantidade, 0)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      ) : (
        // Visualização em Lista (Tabela Única)
        <Card className="no-print">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className={`text-left ${getPadding()} text-sm font-semibold`}>Cliente</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold`}>Data</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold`}>Hora</th>
                    <th className={`text-left ${getPadding()} text-sm font-semibold`}>Produto</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold`}>Qtd</th>
                    <th className={`text-left ${getPadding()} text-sm font-semibold`}>Observação</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold`}>Peso (kg)</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold no-print`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {encomendasOrdenadas.flatMap((encomenda, encIndex) => {
                    const rows: React.ReactNode[] = [];
                    const produtosParaRender = filtrarProdutosVisiveis(encomenda.produtos || []);

                    // Adiciona as linhas de produtos
                    produtosParaRender.forEach((produto, renderIndex) => {
                      rows.push(
                        <tr key={`${encomenda.id}-${renderIndex}`} className="border-t hover:bg-muted/30">
                          {renderIndex === 0 && (
                            <>
                              <td
                                className={`${getPadding()} font-bold text-primary bg-primary/5`}
                                rowSpan={produtosParaRender.length}
                              >
                                📅 {encomenda.clienteNome}
                              </td>
                              <td
                                className={`${getPadding()} text-center bg-primary/5`}
                                rowSpan={produtosParaRender.length}
                              >
                                {new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR")}
                              </td>
                              <td
                                className={`${getPadding()} text-center font-medium bg-primary/5`}
                                rowSpan={produtosParaRender.length}
                              >
                                {encomenda.hora}
                              </td>
                            </>
                          )}
                          <td className={`${getPadding()} font-medium`}>{produto.produtoNome}</td>
                          <td className={`${getPadding()} text-center font-bold`}>{produto.quantidade}</td>
                          <td className={`${getPadding()} text-muted-foreground`}>
                            {produto.observacao || "-"}
                          </td>
                          <td className={`${getPadding()} text-center font-medium`}>
                            {calcularPesoAtual(produto)}
                          </td>
                          {renderIndex === 0 && (
                            <td
                              className={`${getPadding()} text-center no-print bg-primary/5`}
                              rowSpan={produtosParaRender.length}
                            >
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => solicitarAutenticacao(encomenda)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => solicitarExclusao(encomenda)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    });
                    
                    // ============ LINHA DE EDIÇÃO INLINE ============
                    if (editandoInlineId === encomenda.id) {
                      rows.push(
                        <tr key={`edit-inline-${encomenda.id}`} className="bg-yellow-50 border-2 border-yellow-400">
                          <td colSpan={8} className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-primary">
                                  ✏️ Editando Encomenda
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelarEdicaoInline}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Dados Básicos */}
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label>Cliente</Label>
                                  <Combobox
                                    className="mt-1"
                                    options={clientes
                                      .slice()
                                      .sort((a, b) => {
                                        const na = Number(a.codigo);
                                        const nb = Number(b.codigo);
                                        if (na && nb) return na - nb;
                                        if (na) return -1;
                                        if (nb) return 1;
                                        return a.nome.localeCompare(b.nome);
                                      })
                                      .map((c) => ({
                                        value: c.id,
                                        label: c.codigo ? `${c.codigo} - ${c.nome}` : c.nome,
                                      }))}
                                    value={editandoInlineCliente}
                                    onValueChange={setEditandoInlineCliente}
                                    placeholder="Selecione um cliente"
                                    searchPlaceholder="Buscar por código ou nome..."
                                    emptyText="Nenhum cliente encontrado."
                                  />
                                </div>

                                <div>
                                  <Label>Data</Label>
                                  <Input
                                    type="date"
                                    value={editandoInlineData}
                                    onChange={(e) => setEditandoInlineData(e.target.value)}
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label>Hora</Label>
                                  <Select
                                    value={editandoInlineHora}
                                    onValueChange={setEditandoInlineHora}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {horariosDisponiveis.map((h) => (
                                        <SelectItem key={h} value={h}>
                                          {h}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Lista de Produtos */}
                              <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-muted">
                                    <tr>
                                      <th className="text-left p-2 text-sm">Produto</th>
                                      <th className="text-center p-2 text-sm">Qtd</th>
                                      <th className="text-left p-2 text-sm">Observação</th>
                                      <th className="text-center p-2 text-sm">Peso (kg)</th>
                                      <th className="text-center p-2 text-sm w-20">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {editandoInlineProdutos.map((produto, idx) => (
                                      <tr key={idx} className="border-t">
                                        <td className="p-2">{produto.produtoNome}</td>
                                        <td className="p-2 text-center">
                                          <Input
                                            type="number"
                                            value={produto.quantidade}
                                            onChange={(e) => {
                                              const novaQtd = parseInt(e.target.value) || 0;
                                              const produtosAtualizados = [...editandoInlineProdutos];
                                              produtosAtualizados[idx] = {
                                                ...produtosAtualizados[idx],
                                                quantidade: novaQtd
                                              };
                                              setEditandoInlineProdutos(produtosAtualizados);
                                            }}
                                            className="w-20 text-center font-bold"
                                            min="0"
                                          />
                                        </td>
                                        <td className="p-2">
                                          <Input
                                            type="text"
                                            value={produto.observacao || ""}
                                            onChange={(e) => {
                                              const produtosAtualizados = [...editandoInlineProdutos];
                                              produtosAtualizados[idx] = {
                                                ...produtosAtualizados[idx],
                                                observacao: e.target.value
                                              };
                                              setEditandoInlineProdutos(produtosAtualizados);
                                            }}
                                            placeholder="Observação..."
                                            className="w-full text-sm"
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          {calcularPesoAtual(produto)}
                                        </td>
                                        <td className="p-2 text-center">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removerProdutoEdicaoInline(idx)}
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Adicionar Novo Produto - DESTAQUE VERDE */}
                              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-950/30 shadow-md">
                                <h3 className="font-bold mb-4 text-green-700 dark:text-green-300 flex items-center gap-2 text-lg">
                                  <Plus className="w-5 h-5" />
                                  ➕ Adicionar Mais Produtos ao Pedido
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <Label htmlFor="produto" className="font-semibold">Produto *</Label>
                                    <Select
                                      value={novoProdutoInlineId}
                                      onValueChange={setNovoProdutoInlineId}
                                    >
                                      <SelectTrigger className="mt-1 border-2 border-green-300 focus:border-green-500">
                                        <SelectValue placeholder="Selecione o produto..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {produtos.map((p) => (
                                          <SelectItem key={p.id} value={p.id}>
                                            {p.nome}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="quantidade" className="font-semibold">Quantidade *</Label>
                                    <Input
                                      id="quantidade"
                                      type="number"
                                      value={novoProdutoInlineQtd}
                                      onChange={(e) => setNovoProdutoInlineQtd(e.target.value)}
                                      placeholder="0"
                                      className="mt-1 border-2 border-green-300 focus:border-green-500"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="observacao" className="font-semibold">Observação</Label>
                                    <Input
                                      id="observacao"
                                      value={novoProdutoInlineObs}
                                      onChange={(e) => setNovoProdutoInlineObs(e.target.value)}
                                      placeholder="Ex: Sem açúcar, recheio extra..."
                                      className="mt-1 border-2 border-green-300 focus:border-green-500"
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <Button
                                      onClick={adicionarProdutoEdicaoInline}
                                      className="w-full bg-green-600 hover:bg-green-700 font-bold"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Adicionar
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-2 italic">
                                  💡 Após adicionar todos os produtos, clique em "Salvar Alterações" no final da página
                                </p>
                              </div>

                              {/* Botões de Ação */}
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={cancelarEdicaoInline}>
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={salvarEdicaoInline}
                                  className="gap-2"
                                  style={{ touchAction: "manipulation" }}
                                >
                                  <Save className="w-4 h-4" />
                                  Salvar Alterações
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    return rows;
                  })}

                  {/* Linha de Totais */}
                  <tr className="border-t-4 border-primary bg-primary/10">
                    <td colSpan={4} className="p-4 text-right font-bold text-lg">
                      TOTAL GERAL:
                    </td>
                    <td className="p-4 text-center font-bold text-primary text-2xl">
                      {calcularQuantidadeTotal()}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Versão para Impressão */}
      <div className="print-only">
        {/* Cabeçalho */}
        <div style={{ marginBottom: '20px', borderBottom: '3px solid #084d6e', paddingBottom: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '20pt', color: '#084d6e', fontWeight: 'bold' }}>
            📦 Nicolina - Lista de Encomendas
          </h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '9pt', color: '#666' }}>
            Período: {filtroDataInicio ? new Date(filtroDataInicio + 'T00:00').toLocaleDateString('pt-BR') : 'Todas'} até {filtroDataFim ? new Date(filtroDataFim + 'T00:00').toLocaleDateString('pt-BR') : 'Todas'} | 
            Gerado em: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Tabela */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="text-left p-2 border border-black" style={{ width: '12%' }}>Cliente</th>
              <th className="text-center p-2 border border-black" style={{ width: '10%' }}>Data</th>
              <th className="text-center p-2 border border-black" style={{ width: '7%' }}>Hora</th>
              <th className="text-left p-2 border border-black" style={{ width: '30%' }}>Produto</th>
              <th className="text-center p-2 border border-black" style={{ width: '8%' }}>Qtd</th>
              <th className="text-left p-2 border border-black" style={{ width: '25%' }}>Observação</th>
              <th className="text-center p-2 border border-black" style={{ width: '8%' }}>Peso (kg)</th>
            </tr>
          </thead>
          <tbody>
            {encomendasOrdenadas.flatMap((encomenda, encIndex) => {
              const produtosVisiveis = filtrarProdutosVisiveis(encomenda.produtos || []);
              const rows = [];
              
              // Linha separadora entre clientes (exceto antes do primeiro)
              if (encIndex > 0) {
                rows.push(
                  <tr key={`separator-print-${encomenda.id}`}>
                    <td colSpan={7} style={{ padding: 0, borderTop: '2px solid #333', height: '2px' }}></td>
                  </tr>
                );
              }
              
              // Linhas de produtos
              produtosVisiveis.forEach((produto, index) => {
                rows.push(
                  <tr key={`print-${encomenda.id}-${index}`}>
                    {index === 0 ? (
                      <>
                        <td className="p-2 border border-black" rowSpan={produtosVisiveis.length} style={{ fontWeight: 'bold', verticalAlign: 'top' }}>
                          {encomenda.clienteNome}
                        </td>
                        <td className="p-2 text-center border border-black" rowSpan={produtosVisiveis.length} style={{ verticalAlign: 'top' }}>
                          {new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-2 text-center border border-black" rowSpan={produtosVisiveis.length} style={{ fontWeight: 'bold', verticalAlign: 'top' }}>
                          {encomenda.hora}
                        </td>
                      </>
                    ) : null}
                    <td className="p-2 border border-black">{produto.produtoNome}</td>
                    <td className="p-2 text-center border border-black" style={{ fontWeight: 'bold' }}>{produto.quantidade}</td>
                    <td className="p-2 border border-black" style={{ fontSize: '8pt' }}>{produto.observacao || "-"}</td>
                    <td className="p-2 text-center border border-black">{calcularPesoAtual(produto)}</td>
                  </tr>
                );
              });
              
              return rows;
            })}
            
            {/* Linha de Totais */}
            <tr className="border-t-4 border-black bg-gray-200">
              <td colSpan={4} className="p-3 text-right font-bold border border-black" style={{ fontSize: '11pt' }}>
                TOTAL GERAL:
              </td>
              <td className="p-3 text-center font-bold border border-black" style={{ fontSize: '14pt' }}>
                {calcularQuantidadeTotal()}
              </td>
              <td colSpan={2} className="border border-black"></td>
            </tr>
          </tbody>
        </table>

        {/* Rodapé */}
        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ccc', fontSize: '7pt', color: '#666', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>Nicolina - Gestão de Encomendas | Sistema de Produção de Padaria</p>
        </div>
      </div>

      {/* Modal de Autenticação */}
      <AutenticacaoModal
        aberto={mostrarAutenticacao}
        onFechar={() => {
          setMostrarAutenticacao(false);
          setAcaoPendente(null);
        }}
        onSucesso={handleAutenticacaoSucesso}
        titulo="Autenticação Necessária"
        descricao={
          acaoPendente?.tipo === 'editar'
            ? "Digite o código e senha de um usuário autorizado para editar esta encomenda"
            : "Digite o código e senha de um usuário autorizado para excluir esta encomenda"
        }
      />

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={mostrarConfirmacaoExclusao} onOpenChange={setMostrarConfirmacaoExclusao}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Deseja realmente excluir esta encomenda?</DialogTitle>
            <DialogDescription className="text-center">
              Esta ação não pode ser desfeita. A encomenda será permanentemente removida.
              {encomendaParaExcluir && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-left">
                  <p className="font-semibold">Cliente: {clientes.find(c => c.id === encomendaParaExcluir.clienteId)?.nome || 'N/A'}</p>
                  <p className="text-sm">Data: {new Date(encomendaParaExcluir.data + "T00:00").toLocaleDateString("pt-BR")}</p>
                  <p className="text-sm">Hora: {encomendaParaExcluir.horario}</p>
                  <p className="text-sm">Itens: {encomendaParaExcluir.produtos.length} produto(s)</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={cancelarExclusao}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarExclusao} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Excluir Encomenda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}