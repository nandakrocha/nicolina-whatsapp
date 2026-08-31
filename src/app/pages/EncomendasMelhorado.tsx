import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Combobox } from "../components/ui/combobox";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { encomendasAPI, produtosAPI, clientesAPI, type Encomenda, type Produto, type Cliente, type ProdutoEncomenda } from "../services/api";
import { Plus, Save, Trash2, Edit2, X, Download, Printer, Copy, Filter, ArrowUpDown, Clock, ChevronDown, Check } from "lucide-react";
import { AutenticacaoModal } from "../components/AutenticacaoModal";
import { exportarParaExcel, imprimirPagina, estiloImpressaoPadrao } from "../utils/exportacao";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const STATUS_CONFIG = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", emoji: "⏳" },
  em_producao: { label: "Em Produção", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", emoji: "👨‍" },
  pronto: { label: "Pronto", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", emoji: "✅" },
  entregue: { label: "Entregue", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", emoji: "🎉" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", emoji: "❌" },
};

  export default function EncomendasMelhorado() {

  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    const fetchEncomendas = async () => {
      try {
        const response = await encomendasAPI.listar();
        setEncomendas(response);
      } catch (error) {
        toast.error("Erro ao carregar encomendas: " + (error instanceof Error ? error.message : ""));
      }
    };

    const fetchProdutos = async () => {
      try {
        const response = await produtosAPI.listar();
        setProdutos(response.sort((a, b) => a.nome.localeCompare(b.nome)));
      } catch (error) {
        toast.error("Erro ao carregar produtos: " + (error instanceof Error ? error.message : ""));
      }
    };

    const fetchClientes = async () => {
      try {
        const response = await clientesAPI.listar();
        setClientes(response.sort((a, b) => a.nome.localeCompare(b.nome)));
      } catch (error) {
        toast.error("Erro ao carregar clientes: " + (error instanceof Error ? error.message : ""));
      }
    };

    fetchEncomendas();
    fetchProdutos();
    fetchClientes();

    // 🔄 SINCRONIZAÇÃO AUTOMÁTICA COM PRODUTOS
    const handleAtualizar = () => {
      console.log("🔄 Sincronizando Encomendas com Produtos...");
      fetchEncomendas();
      fetchProdutos();
      fetchClientes();
    };

    window.addEventListener('produtos-atualizados', handleAtualizar);
    window.addEventListener('encomendas-atualizadas', handleAtualizar);
    window.addEventListener('encomenda-atualizada', handleAtualizar);

    return () => {
      window.removeEventListener('produtos-atualizados', handleAtualizar);
      window.removeEventListener('encomendas-atualizadas', handleAtualizar);
      window.removeEventListener('encomenda-atualizada', handleAtualizar);
    };
  }, []);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<"data_asc" | "data_desc" | "cliente" | "peso" | "horario">("data_desc");
  const [encomendaParaExcluir, setEncomendaParaExcluir] = useState<Encomenda | null>(null);
  const [mostrarConfirmacaoExclusao, setMostrarConfirmacaoExclusao] = useState(false);
  
  // Estados para Autenticação
  const [mostrarAutenticacao, setMostrarAutenticacao] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState<{ tipo: 'editar' | 'excluir', encomenda: Encomenda } | null>(null);

  // Estados para Dialog de Duplicação
  const [mostrarDuplicarDialog, setMostrarDuplicarDialog] = useState(false);
  const [encomendaParaDuplicar, setEncomendaParaDuplicar] = useState<Encomenda | null>(null);
  const [duplicarNovaData, setDuplicarNovaData] = useState("");
  const [duplicarNovaHora, setDuplicarNovaHora] = useState("");
  const [duplicarNovaObservacao, setDuplicarNovaObservacao] = useState("");
  
  // Campos do formulário
  const [data, setData] = useState(() => {
    // Retorna a data atual no formato YYYY-MM-DD
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });
  const [hora, setHora] = useState("");
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>([]);
  const [popoverHorariosAberto, setPopoverHorariosAberto] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<Encomenda["status"]>("pendente");
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoEncomenda[]>([]);
  const [produtoAtualId, setProdutoAtualId] = useState("");
  const [quantidadeAtual, setQuantidadeAtual] = useState("");

  const resetarFormulario = () => {
    // Resetar para data atual
    const hoje = new Date();
    setData(hoje.toISOString().split('T')[0]);
    setHora("");
    setHorariosSelecionados([]);
    setClienteId("");
    setObservacao("");
    setStatus("pendente");
    setProdutosSelecionados([]);
    setProdutoAtualId("");
    setQuantidadeAtual("");
    setEditandoId(null);
  };

  const adicionarProduto = () => {
    // 🤖 CORREÇÃO ANDROID: Remover foco antes de processar
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!produtoAtualId || !quantidadeAtual) return;

    const produto = produtos?.find((p: Produto) => p.id === produtoAtualId);
    if (!produto) return;

    const quantidade = parseFloat(quantidadeAtual);
    if (isNaN(quantidade) || quantidade <= 0) return;

    const novoProduto: ProdutoEncomenda = {
      produtoId: produto.id,
      produtoNome: produto.nome,
      quantidade,
      pesoPorUnidadeKg: produto.pesoPorUnidadeKg,
      pesoTotalKg: quantidade * produto.pesoPorUnidadeKg,
    };

    setProdutosSelecionados([...produtosSelecionados, novoProduto]);
    setProdutoAtualId("");
    setQuantidadeAtual("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarProduto();
    }
  };

  const removerProduto = (index: number) => {
    setProdutosSelecionados(produtosSelecionados.filter((_, i) => i !== index));
  };

  const gerarHorarios = () => {
    const horarios = [];
    for (let h = 6; h <= 21; h++) {
      horarios.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return horarios;
  };

  const calcularPesos = () => {
    const pesoTotalKg = produtosSelecionados.reduce((acc, p) => acc + p.pesoTotalKg, 0);
    const pesoTotalGramas = pesoTotalKg * 1000;
    return { pesoTotalKg: parseFloat(pesoTotalKg.toFixed(3)), pesoTotalGramas: parseFloat(pesoTotalGramas.toFixed(1)) };
  };

  const salvarEncomenda = async () => {
    try {
      // 🤖 CORREÇÃO ANDROID: Remover foco de inputs antes de salvar
      // Previne problemas com teclado virtual e valores não sincronizados
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Aguardar um tick para garantir que onChange foi processado
      await new Promise(resolve => setTimeout(resolve, 50));

      const clienteNome = clientes?.find((c: Cliente) => c.id === clienteId)?.nome || "";
      const { pesoTotalKg, pesoTotalGramas } = calcularPesos();

      const encomenda: Partial<Encomenda> = {
        data,
        hora,
        clienteId,
        clienteNome,
        observacao,
        produtos: produtosSelecionados,
        pesoTotalKg,
        pesoTotalGramas,
        status,
      };

      if (editandoId) {
        await encomendasAPI.atualizar(editandoId, encomenda);
        toast.success("Encomenda atualizada com sucesso!");
      } else {
        await encomendasAPI.criar(encomenda);
        toast.success("Encomenda criada com sucesso!");
      }

      resetarFormulario();
      setMostrarFormulario(false);
      const response = await encomendasAPI.listar();
      setEncomendas(response);
    } catch (error) {
      toast.error("Erro ao salvar encomenda: " + (error instanceof Error ? error.message : ""));
    }
  };

  const editarEncomenda = (encomenda: Encomenda) => {
    setEditandoId(encomenda.id);
    setData(encomenda.data || "");
    setHora(encomenda.hora || "");
    setHorariosSelecionados(encomenda.hora ? [encomenda.hora] : []);
    setClienteId(encomenda.clienteId || "");
    setObservacao(encomenda.observacao || "");
    setStatus(encomenda.status || "pendente");
    setProdutosSelecionados(encomenda.produtos || []);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicarEncomenda = (encomenda: Encomenda) => {
    setEncomendaParaDuplicar(encomenda);
    setDuplicarNovaData(encomenda.data || "");
    setDuplicarNovaHora(encomenda.hora || "");
    setDuplicarNovaObservacao(encomenda.observacao || "");
    setMostrarDuplicarDialog(true);
  };

  const confirmarDuplicacao = async () => {
    if (!encomendaParaDuplicar) return;
    try {
      const { pesoTotalKg, pesoTotalGramas } = {
        pesoTotalKg: encomendaParaDuplicar.pesoTotalKg || 0,
        pesoTotalGramas: encomendaParaDuplicar.pesoTotalGramas || 0,
      };
      await encomendasAPI.criar({
        data: duplicarNovaData,
        hora: duplicarNovaHora,
        clienteId: encomendaParaDuplicar.clienteId,
        clienteNome: encomendaParaDuplicar.clienteNome,
        observacao: duplicarNovaObservacao,
        produtos: encomendaParaDuplicar.produtos.map(p => ({ ...p })),
        pesoTotalKg,
        pesoTotalGramas,
        status: "pendente",
      });
      toast.success("Encomenda duplicada com sucesso!");
      setMostrarDuplicarDialog(false);
      setEncomendaParaDuplicar(null);
      const response = await encomendasAPI.listar();
      setEncomendas(response);
    } catch (error) {
      toast.error("Erro ao duplicar encomenda: " + (error instanceof Error ? error.message : ""));
    }
  };

  // Solicitar autenticação antes de excluir
  const solicitarExclusao = (encomenda: Encomenda) => {
    console.log("🔒 Solicitando autenticação para excluir encomenda:", encomenda.id);
    setAcaoPendente({ tipo: 'excluir', encomenda });
    setMostrarAutenticacao(true);
  };

  // Função real de exclusão (executada após autenticação E confirmação)
  const excluirEncomenda = async (id: string) => {
    try {
      console.log("🗑️ Excluindo encomenda do Firebase:", id);
      await encomendasAPI.excluir(id);
      toast.success("Encomenda excluída com sucesso!");
      setEncomendaParaExcluir(null);
      const response = await encomendasAPI.listar();
      setEncomendas(response);
    } catch (error) {
      console.error("❌ Erro ao excluir encomenda:", error);
      toast.error("Erro ao excluir encomenda: " + (error instanceof Error ? error.message : ""));
    }
  };
  
  // Handler para quando a autenticação for bem-sucedida
  const handleAutenticacaoSucesso = () => {
    console.log("✅ Autenticação bem-sucedida!");
    setMostrarAutenticacao(false);
    
    if (acaoPendente) {
      if (acaoPendente.tipo === 'editar') {
        console.log("📝 Abrindo editor...");
        editarEncomenda(acaoPendente.encomenda);
      } else if (acaoPendente.tipo === 'excluir') {
        console.log("⚠️ Abrindo confirmação de exclusão...");
        setEncomendaParaExcluir(acaoPendente.encomenda);
        setMostrarConfirmacaoExclusao(true);
      }
      setAcaoPendente(null);
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

  const alterarStatus = async (id: string, novoStatus: Encomenda["status"]) => {
    try {
      await encomendasAPI.atualizar(id, { status: novoStatus });
      toast.success("Status atualizado!");
      const response = await encomendasAPI.listar();
      setEncomendas(response);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const imprimirEncomenda = (encomenda: Encomenda) => {
    const janelaImpressao = window.open("", "_blank");
    if (!janelaImpressao) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Encomenda - ${encomenda.clienteNome}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #084d6e; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #084d6e; color: white; }
            .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>🍞 Nicolina - Gestão de Encomendas</h1>
          <h2>Encomenda #${encomenda.id.substring(0, 8)}</h2>
          <p><strong>Cliente:</strong> ${encomenda.clienteNome || "Não informado"}</p>
          <p><strong>Data:</strong> ${encomenda.data || "Não informado"}</p>
          <p><strong>Hora:</strong> ${encomenda.hora || "Não informado"}</p>
          <p><strong>Status:</strong> ${STATUS_CONFIG[encomenda.status || "pendente"].label}</p>
          ${encomenda.observacao ? `<p><strong>Observação:</strong> ${encomenda.observacao}</p>` : ""}
          
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Peso Unitário</th>
                <th>Peso Total</th>
              </tr>
            </thead>
            <tbody>
              ${encomenda.produtos?.map(p => `
                <tr>
                  <td>${p.produtoNome}</td>
                  <td>${p.quantidade}</td>
                  <td>${p.pesoPorUnidadeKg} kg</td>
                  <td>${p.pesoTotalKg.toFixed(3)} kg</td>
                </tr>
              `).join("") || ""}
            </tbody>
          </table>
          
          <p class="total">Peso Total: ${encomenda.pesoTotalGramas || 0}g (${(encomenda.pesoTotalKg || 0).toFixed(3)}kg)</p>
          
          <p style="margin-top: 40px; color: #666;">
            Impresso em: ${new Date().toLocaleString("pt-BR")}
          </p>
        </body>
      </html>
    `;

    janelaImpressao.document.write(html);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  // Filtrar e ordenar
  let encomendasFiltradas = encomendas?.filter((e: Encomenda) => {
    // Filtro de status
    const matchStatus = filtroStatus === "todos" || e.status === filtroStatus;

    return matchStatus;
  });

  // Ordenação
  if (encomendasFiltradas) {
    encomendasFiltradas = [...encomendasFiltradas].sort((a, b) => {
      if (ordenacao === "data_asc") {
        return (a.data || "").localeCompare(b.data || "");
      } else if (ordenacao === "data_desc") {
        return (b.data || "").localeCompare(a.data || "");
      } else if (ordenacao === "cliente") {
        return (a.clienteNome || "").localeCompare(b.clienteNome || "");
      } else if (ordenacao === "peso") {
        return (b.pesoTotalKg || 0) - (a.pesoTotalKg || 0);
      } else if (ordenacao === "horario") {
        return (a.hora || "").localeCompare(b.hora || "");
      }
      return 0;
    });
  }

  const exportarExcel = () => {
    if (!encomendasFiltradas || encomendasFiltradas.length === 0) {
      toast.error("Nenhuma encomenda para exportar");
      return;
    }

    let csv = "Data;Hora;Cliente;Observação;Produtos;Peso Total (kg);Status\n";
    encomendasFiltradas.forEach((e: Encomenda) => {
      const produtos = e.produtos?.map(p => `${p.produtoNome} (${p.quantidade})`).join(", ") || "";
      const statusLabel = STATUS_CONFIG[e.status || "pendente"].label;
      csv += `${e.data || ""};${e.hora || ""};${e.clienteNome || ""};${e.observacao || ""};${produtos};${e.pesoTotalKg || 0};${statusLabel}\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `encomendas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Arquivo exportado com sucesso!");
  };

  const { pesoTotalKg, pesoTotalGramas } = calcularPesos();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📦 Encomendas</h1>
          <p className="text-muted-foreground mt-2">Gerencie todas as encomendas da padaria</p>
        </div>
        <Button
          size="lg"
          onClick={(e) => {
            e.preventDefault();
            resetarFormulario();
            setMostrarFormulario(!mostrarFormulario);
          }}
          onTouchEnd={(e) => {
            // 🤖 CORREÇÃO ANDROID: Suporte touch
            e.preventDefault();
            e.stopPropagation();
            resetarFormulario();
            setMostrarFormulario(!mostrarFormulario);
          }}
          className="gap-2"
        >
          {mostrarFormulario ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {mostrarFormulario ? "Cancelar" : "Nova Encomenda"}
        </Button>
      </div>

      {/* Formulário Expansível */}
      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 border-2 border-primary/20">
              <h2 className="text-xl font-semibold mb-4">
                {editandoId ? "Editar Encomenda" : "Nova Encomenda"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="data">Data de Entrega</Label>
                  <Input
                    id="data"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    onBlur={(e) => {
                      // 🤖 CORREÇÃO ANDROID: Garantir que valor foi setado
                      if (e.target.value) {
                        setData(e.target.value);
                      }
                    }}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="hora">Horário de Entrega</Label>
                  
                  {/* Popover de Seleção Múltipla */}
                  <Popover open={popoverHorariosAberto} onOpenChange={setPopoverHorariosAberto}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={popoverHorariosAberto}
                        className="w-full justify-between mt-1 h-10 font-normal"
                      >
                        <div className="flex items-center gap-2 flex-1 overflow-hidden">
                          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          {horariosSelecionados.length === 0 ? (
                            <span className="text-muted-foreground">Selecione um ou mais horários</span>
                          ) : (
                            <span className="truncate">
                              {horariosSelecionados.length === 1 
                                ? horariosSelecionados[0]
                                : `${horariosSelecionados.length} horários selecionados`
                              }
                            </span>
                          )}
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0" align="start">
                      <div className="p-3 border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">Selecionar Horários</span>
                          </div>
                          {horariosSelecionados.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setHorariosSelecionados([]);
                                setHora("");
                              }}
                              onTouchEnd={(e) => {
                                // 🤖 CORREÇÃO ANDROID: Suporte touch
                                e.preventDefault();
                                e.stopPropagation();
                                setHorariosSelecionados([]);
                                setHora("");
                              }}
                              className="h-5 px-2 text-[10px]"
                            >
                              Limpar
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto">
                        <div className="flex flex-col gap-0.5 p-1">
                          {gerarHorarios().map((h) => {
                            const isSelected = horariosSelecionados.includes(h);
                            return (
                              <label
                                key={h}
                                className="flex items-center gap-2 hover:bg-muted rounded px-2 py-1.5 transition-colors cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const novos = [...horariosSelecionados, h].sort();
                                      setHorariosSelecionados(novos);
                                      setHora(h);
                                    } else {
                                      const novos = horariosSelecionados.filter(hr => hr !== h);
                                      setHorariosSelecionados(novos);
                                      if (novos.length > 0) {
                                        setHora(novos[0]);
                                      } else {
                                        setHora("");
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
                      {horariosSelecionados.length > 0 && (
                        <div className="p-2 border-t bg-primary/5">
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-medium">{horariosSelecionados.length} selecionado(s):</span>{" "}
                            <span className="text-primary">{horariosSelecionados.join(", ")}</span>
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Combobox
                    className="mt-1"
                    options={(clientes ?? [])
                      .slice()
                      .sort((a: Cliente, b: Cliente) => {
                        const na = Number(a.codigo);
                        const nb = Number(b.codigo);
                        if (na && nb) return na - nb;
                        if (na) return -1;
                        if (nb) return 1;
                        return a.nome.localeCompare(b.nome);
                      })
                      .map((c: Cliente) => ({
                        value: c.id,
                        label: c.codigo ? `${c.codigo} - ${c.nome}` : c.nome,
                      }))}
                    value={clienteId}
                    onValueChange={setClienteId}
                    placeholder="Selecione um cliente"
                    searchPlaceholder="Buscar por código ou nome..."
                    emptyText="Nenhum cliente encontrado."
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Encomenda["status"])}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.emoji} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Observações adicionais..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* Adicionar Produtos */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Produtos</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="produto">Produto</Label>
                    <Combobox
                      value={produtoAtualId}
                      onValueChange={setProdutoAtualId}
                      options={produtos
                        ?.filter((p: Produto) => p.ativo !== false)
                        .map((produto: Produto) => ({
                          value: produto.id,
                          label: `${produto.nome} (${produto.pesoPorUnidadeKg}kg)`,
                        })) || []}
                      placeholder="Selecione um produto"
                      searchPlaceholder="Digite a primeira letra..."
                      emptyText="Nenhum produto encontrado"
                      className="mt-1"
                      filterByFirstLetter={true}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="quantidade"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quantidadeAtual}
                        onChange={(e) => setQuantidadeAtual(e.target.value)}
                        onBlur={(e) => {
                          // 🤖 CORREÇÃO ANDROID: Garantir sincronização do valor
                          if (e.target.value) {
                            setQuantidadeAtual(e.target.value);
                          }
                        }}
                        placeholder="0"
                        min="0"
                        step="1"
                        onKeyPress={handleKeyPress}
                      />
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          adicionarProduto();
                        }}
                        onTouchEnd={(e) => {
                          // 🤖 CORREÇÃO ANDROID: Suporte explícito a touch events
                          e.preventDefault();
                          adicionarProduto();
                        }}
                        type="button"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de Produtos Adicionados */}
                {produtosSelecionados.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {produtosSelecionados.map((produto, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{produto.produtoNome}</p>
                          <p className="text-sm text-muted-foreground">
                            {produto.quantidade} unidades × {produto.pesoPorUnidadeKg}kg ={" "}
                            {produto.pesoTotalKg.toFixed(3)}kg
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            removerProduto(index);
                          }}
                          onTouchEnd={(e) => {
                            // 🤖 CORREÇÃO ANDROID: Suporte touch
                            e.preventDefault();
                            e.stopPropagation();
                            removerProduto(index);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}

                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-lg font-semibold">
                        Peso Total: {pesoTotalGramas}g ({pesoTotalKg.toFixed(3)}kg)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    salvarEncomenda();
                  }}
                  onTouchEnd={(e) => {
                    // 🤖 CORREÇÃO ANDROID: Suporte explícito a touch events
                    e.preventDefault();
                    e.stopPropagation();
                    salvarEncomenda();
                  }}
                  className="gap-2"
                >
                  <Save className="w-5 h-5" />
                  Salvar Encomenda
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros e Busca */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 flex-wrap flex-1">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.emoji} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botões de Ordenação */}
            <div className="flex gap-2">
              <Button
                variant={ordenacao === "cliente" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrdenacao(ordenacao === "cliente" ? "data_desc" : "cliente")}
                className="gap-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                Alfabética
              </Button>
              
              <Button
                variant={ordenacao === "horario" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrdenacao(ordenacao === "horario" ? "data_desc" : "horario")}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Horário
              </Button>
            </div>

            <Select value={ordenacao} onValueChange={(v: any) => setOrdenacao(v)}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data_desc">Data (mais recente)</SelectItem>
                <SelectItem value="data_asc">Data (mais antiga)</SelectItem>
                <SelectItem value="cliente">Cliente (A-Z)</SelectItem>
                <SelectItem value="peso">Peso (maior)</SelectItem>
                <SelectItem value="horario">Horário (mais cedo)</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportarExcel} className="gap-2">
              <Download className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Encomendas */}
      <div className="space-y-3">
        {encomendasFiltradas?.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma encomenda encontrada</p>
          </Card>
        ) : (
          encomendasFiltradas?.map((encomenda: Encomenda) => {
            const statusConfig = STATUS_CONFIG[encomenda.status || "pendente"];
            return (
              <motion.div
                key={encomenda.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📦</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{encomenda.clienteNome || "Cliente não informado"}</h3>
                            <Select
                              value={encomenda.status || "pendente"}
                              onValueChange={(v) => alterarStatus(encomenda.id, v as Encomenda["status"])}
                            >
                              <SelectTrigger className={`w-auto h-7 text-xs ${statusConfig.color} border-0`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.emoji} {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            <span>📅 {encomenda.data || "Sem data"}</span>
                            <span>🕐 {encomenda.hora || "Sem hora"}</span>
                          </div>
                        </div>
                      </div>

                      {encomenda.observacao && (
                        <p className="text-sm text-muted-foreground mb-2">💬 {encomenda.observacao}</p>
                      )}

                      <div className="space-y-1">
                        {encomenda.produtos?.map((produto, idx) => (
                          <div key={idx} className="text-sm flex justify-between">
                            <span>
                              🍞 {produto.produtoNome} × {produto.quantidade}
                            </span>
                            <span className="text-muted-foreground">{produto.pesoTotalKg?.toFixed(3) || 0}kg</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm font-semibold">
                          ⚖️ Peso Total: {encomenda.pesoTotalGramas || 0}g ({(encomenda.pesoTotalKg || 0).toFixed(3)}kg)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          editarEncomenda(encomenda);
                        }}
                        onTouchEnd={(e) => {
                          // 🤖 CORREÇÃO ANDROID: Suporte touch
                          e.preventDefault();
                          e.stopPropagation();
                          editarEncomenda(encomenda);
                        }}
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          duplicarEncomenda(encomenda);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          duplicarEncomenda(encomenda);
                        }}
                        className="gap-1 text-xs"
                        title="Duplicar Encomenda"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          imprimirEncomenda(encomenda);
                        }}
                        onTouchEnd={(e) => {
                          // 🤖 CORREÇÃO ANDROID: Suporte touch
                          e.preventDefault();
                          e.stopPropagation();
                          imprimirEncomenda(encomenda);
                        }}
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          solicitarExclusao(encomenda);
                        }}
                        onTouchEnd={(e) => {
                          // 🤖 CORREÇÃO ANDROID: Suporte touch
                          e.preventDefault();
                          e.stopPropagation();
                          solicitarExclusao(encomenda);
                        }}
                        title="Excluir (Requer Senha)"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Dialog de Duplicar Encomenda */}
      <Dialog open={mostrarDuplicarDialog} onOpenChange={setMostrarDuplicarDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Copy className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Duplicar Encomenda</DialogTitle>
            <DialogDescription className="text-center">
              Informe a nova data e horário. Todos os demais dados serão copiados da encomenda original.
            </DialogDescription>
          </DialogHeader>
          {encomendaParaDuplicar && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-semibold">{encomendaParaDuplicar.clienteNome || "Cliente não informado"}</p>
                {encomendaParaDuplicar.produtos?.map((p, i) => (
                  <p key={i} className="text-muted-foreground">🍞 {p.produtoNome} × {p.quantidade}</p>
                ))}
                {encomendaParaDuplicar.observacao && (
                  <p className="text-muted-foreground">💬 {encomendaParaDuplicar.observacao}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duplicar-data">Nova Data</Label>
                  <Input
                    id="duplicar-data"
                    type="date"
                    value={duplicarNovaData}
                    onChange={(e) => setDuplicarNovaData(e.target.value)}
                    onBlur={(e) => { if (e.target.value) setDuplicarNovaData(e.target.value); }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="duplicar-hora">Novo Horário</Label>
                  <Select value={duplicarNovaHora} onValueChange={setDuplicarNovaHora}>
                    <SelectTrigger className="mt-1" id="duplicar-hora">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {gerarHorarios().map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="duplicar-obs">Observação</Label>
                <Textarea
                  id="duplicar-obs"
                  value={duplicarNovaObservacao}
                  onChange={(e) => setDuplicarNovaObservacao(e.target.value)}
                  placeholder="Observações adicionais..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={(e) => { e.preventDefault(); setMostrarDuplicarDialog(false); setEncomendaParaDuplicar(null); }}
                  onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setMostrarDuplicarDialog(false); setEncomendaParaDuplicar(null); }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={(e) => { e.preventDefault(); confirmarDuplicacao(); }}
                  onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); confirmarDuplicacao(); }}
                  className="gap-2"
                  disabled={!duplicarNovaData}
                >
                  <Copy className="w-4 h-4" />
                  Duplicar Encomenda
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Autenticação */}
      <AutenticacaoModal
        aberto={mostrarAutenticacao}
        onFechar={() => {
          setMostrarAutenticacao(false);
          setAcaoPendente(null);
        }}
        onSucesso={handleAutenticacaoSucesso}
        titulo="Autenticação Necessária"
        descricao="Digite o código e senha de um usuário autorizado para excluir esta encomenda"
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
                  <p className="font-semibold">Cliente: {encomendaParaExcluir.clienteNome}</p>
                  <p className="text-sm">Data: {new Date(encomendaParaExcluir.data + "T00:00").toLocaleDateString("pt-BR")}</p>
                  <p className="text-sm">Hora: {encomendaParaExcluir.hora}</p>
                  <p className="text-sm">Itens: {encomendaParaExcluir.produtos.length} produto(s)</p>
                  <p className="text-sm">Peso Total: {encomendaParaExcluir.pesoTotalGramas}g</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                cancelarExclusao();
              }}
              onTouchEnd={(e) => {
                // 🤖 CORREÇÃO ANDROID: Suporte touch
                e.preventDefault();
                e.stopPropagation();
                cancelarExclusao();
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                confirmarExclusao();
              }}
              onTouchEnd={(e) => {
                // 🤖 CORREÇÃO ANDROID: Suporte touch
                e.preventDefault();
                e.stopPropagation();
                confirmarExclusao();
              }}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Encomenda
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}