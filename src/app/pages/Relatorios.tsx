import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { FileText, Download, Printer, Filter, LayoutGrid, List, X, Check, ChevronDown, ChevronUp, CheckSquare, Square, CheckCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  encomendasAPI,
  clientesAPI,
  produtosAPI,
  lancamentosAPI,
  type Encomenda,
  type Cliente,
  type Produto,
} from "../services/api";
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
import { startsWithText } from "../../lib/normalizeText";

// ✅ FIX: Ordem de inicialização corrigida para evitar TDZ (Temporal Dead Zone)

interface ItemEncomenda {
  produtoId: string;
  produtoNome: string;
  produtoCodigo?: string; // Código do produto
  quantidade: number;
  observacao?: string;
  pesoPorUnidadeKg: number;
  pesoTotalKg: number;
}

export default function Relatorios() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // 💾 PERSISTÊNCIA: Carregar estado salvo do localStorage
  const carregarEstadoSalvo = () => {
    try {
      const estadoSalvo = localStorage.getItem('relatorios-estado');
      if (estadoSalvo) {
        return JSON.parse(estadoSalvo);
      }
    } catch (error) {
      console.error('Erro ao carregar estado salvo:', error);
    }
    return null;
  };

  const estadoInicial = carregarEstadoSalvo();
  
  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);
  
  const [tipoRelatorio, setTipoRelatorio] = useState<"dia" | "periodo" | "cliente">(
    estadoInicial?.tipoRelatorio || "periodo"
  );
  const [modoVisualizacao, setModoVisualizacao] = useState<"card" | "lista">(
    estadoInicial?.modoVisualizacao || "card"
  );
  const [mostrarFiltros, setMostrarFiltros] = useState(estadoInicial?.mostrarFiltros ?? false);
  
  // Filtros - AJUSTADO: período de 30 dias por padrão
  const [dataInicio, setDataInicio] = useState(
    estadoInicial?.dataInicio || trintaDiasAtras.toISOString().split("T")[0]
  );
  const [dataFim, setDataFim] = useState(
    estadoInicial?.dataFim || hoje.toISOString().split("T")[0]
  );
  const [clienteFiltro, setClienteFiltro] = useState(estadoInicial?.clienteFiltro || "");
  const [produtosFiltro, setProdutosFiltro] = useState<string[]>(
    estadoInicial?.produtosFiltro || []
  ); // ✅ AGORA É ARRAY
  const [horaFiltro, setHoraFiltro] = useState(estadoInicial?.horaFiltro || "");
  const [ordenacao, setOrdenacao] = useState<"data" | "cliente" | "hora">(
    estadoInicial?.ordenacao || "data"
  );
  const [listaProdutosAberta, setListaProdutosAberta] = useState(
    estadoInicial?.listaProdutosAberta ?? false
  ); // ✅ Controle do collapsible
  const [buscaProduto, setBuscaProduto] = useState(""); // 🔍 Campo de busca de produtos

  // ============ CONTROLE DE LANÇAMENTO ============
  const [lancamentos, setLancamentos] = useState<Record<string, boolean>>({});
  const [filtroLancamento, setFiltroLancamento] = useState<"todos" | "lancados" | "nao_lancados">("todos");
  const [confirmacaoLancDia, setConfirmacaoLancDia] = useState<{
    tipo: "lancar" | "desfazer";
    clienteId: string;
    clienteNome: string;
    data: string;
  } | null>(null);

  useEffect(() => {
    carregarDados();
    console.log("📊 Relatórios inicializado - carregando dados...");
    
    // 🔥 LISTENER PARA ATUALIZAÇÃO INSTANTÂNEA
    const handleAtualizar = () => {
      carregarDados();
    };
    window.addEventListener('encomenda-atualizada', handleAtualizar);
    window.addEventListener('clientes-atualizados', handleAtualizar);
    window.addEventListener('produtos-atualizados', handleAtualizar);

    return () => {
      window.removeEventListener('encomenda-atualizada', handleAtualizar);
      window.removeEventListener('clientes-atualizados', handleAtualizar);
      window.removeEventListener('produtos-atualizados', handleAtualizar);
    };
  }, []);

  // 💾 PERSISTÊNCIA: Salvar estado sempre que houver mudanças
  useEffect(() => {
    const estadoParaSalvar = {
      tipoRelatorio,
      modoVisualizacao,
      mostrarFiltros,
      dataInicio,
      dataFim,
      clienteFiltro,
      produtosFiltro,
      horaFiltro,
      ordenacao,
      listaProdutosAberta,
    };
    
    try {
      localStorage.setItem('relatorios-estado', JSON.stringify(estadoParaSalvar));
      console.log('💾 Estado dos relatórios salvo:', estadoParaSalvar);
    } catch (error) {
      console.error('Erro ao salvar estado:', error);
    }
  }, [
    tipoRelatorio,
    modoVisualizacao,
    mostrarFiltros,
    dataInicio,
    dataFim,
    clienteFiltro,
    produtosFiltro,
    horaFiltro,
    ordenacao,
    listaProdutosAberta,
  ]);

  useEffect(() => {
    lancamentosAPI.listar().then(setLancamentos);
    const unsub = lancamentosAPI.observar(setLancamentos);
    return () => unsub();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      console.log("🔄 Carregando dados do servidor para relatórios...");
      const [encomendasData, clientesData, produtosData] = await Promise.all([
        encomendasAPI.listar(),
        clientesAPI.listar(),
        produtosAPI.listar(),
      ]);
      console.log("✅ Dados carregados para relatórios:", {
        encomendas: encomendasData.length,
        clientes: clientesData.length,
        produtos: produtosData.length,
      });
      console.log("📊 DADOS COMPLETOS:", {
        encomendas: encomendasData,
        clientes: clientesData,
        produtos: produtosData,
      });
      setEncomendas(encomendasData);
      setClientes(clientesData.sort((a, b) => a.nome.localeCompare(b.nome)));
      setProdutos(produtosData.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  };

  // Função auxiliar para obter código do produto
  const obterCodigoProduto = (produtoId: string): string | undefined => {
    const produto = produtos.find(p => p.id === produtoId);
    console.log(`🔍 Buscando código para produto ID ${produtoId}:`, produto?.codigo || "NÃO ENCONTRADO");
    return produto?.codigo;
  };

  // Função auxiliar para formatar nome do produto com código
  const formatarNomeProduto = (produtoNome: string, produtoId: string): string => {
    const codigo = obterCodigoProduto(produtoId);
    return codigo ? `${codigo} - ${produtoNome}` : produtoNome;
  };

  // ============ HELPERS DE LANÇAMENTO ============
  const lancamentoKey = (encId: string, idx: number) => `${encId}__${idx}`;

  const marcarItemLancado = async (encId: string, idx: number, lancado: boolean) => {
    const chave = lancamentoKey(encId, idx);
    setLancamentos(prev => {
      const next = { ...prev };
      if (lancado) next[chave] = true; else delete next[chave];
      return next;
    });
    try {
      await lancamentosAPI.marcar(chave, lancado);
    } catch {
      toast.error("Erro ao salvar status de lançamento.");
    }
  };

  const getChavesDia = (clienteId: string, data: string): string[] => {
    const chaves: string[] = [];
    encomendas.filter(e => e.clienteId === clienteId && e.data === data).forEach(enc => {
      (enc.produtos || []).forEach((_, i) => chaves.push(lancamentoKey(enc.id, i)));
    });
    return chaves;
  };

  const executarLancamentoDia = async (clienteId: string, clienteNome: string, data: string, tipo: "lancar" | "desfazer") => {
    const chaves = getChavesDia(clienteId, data);
    if (chaves.length === 0) return;
    const lancado = tipo === "lancar";
    setLancamentos(prev => {
      const next = { ...prev };
      for (const chave of chaves) { if (lancado) next[chave] = true; else delete next[chave]; }
      return next;
    });
    try {
      await lancamentosAPI.marcarVarios(chaves, lancado);
      toast.success(lancado
        ? `${chaves.length} item(s) de ${clienteNome} marcado(s) como lançado(s).`
        : `Lançamento de ${clienteNome} desfeito.`);
    } catch {
      toast.error("Erro ao salvar lançamentos.");
    }
  };

  const getProgressoDia = (clienteId: string, data: string): { total: number; lancados: number } => {
    let total = 0, lancados = 0;
    encomendas.filter(e => e.clienteId === clienteId && e.data === data).forEach(enc => {
      (enc.produtos || []).forEach((_, i) => {
        total++;
        if (lancamentos[lancamentoKey(enc.id, i)]) lancados++;
      });
    });
    return { total, lancados };
  };

  const getProdutosParaRender = (encomenda: Encomenda) =>
    (encomenda.produtos || [])
      .map((produto, originalIndex) => ({ produto, originalIndex }))
      .filter(({ originalIndex }) => {
        if (filtroLancamento !== "todos") {
          const lancado = !!lancamentos[lancamentoKey(encomenda.id, originalIndex)];
          if (filtroLancamento === "lancados" && !lancado) return false;
          if (filtroLancamento === "nao_lancados" && lancado) return false;
        }
        return true;
      });

  const filtrarEncomendas = () => {
    let filtradas = [...encomendas];

    // Filtro por data
    if (tipoRelatorio === "dia") {
      filtradas = filtradas.filter((e) => e.data === dataInicio);
    } else {
      filtradas = filtradas.filter(
        (e) => e.data >= dataInicio && e.data <= dataFim
      );
    }

    // Filtro por cliente
    if (clienteFiltro) {
      filtradas = filtradas.filter((e) => e.clienteId === clienteFiltro);
    }

    // Filtro por produto
    if (produtosFiltro.length > 0) {
      filtradas = filtradas.filter((e) =>
        (e.produtos || []).some((item) => produtosFiltro.includes(item.produtoId))
      );
    }

    // Filtro por hora
    if (horaFiltro) {
      filtradas = filtradas.filter((e) => e.hora === horaFiltro);
    }

    // Filtro por lançamento (nível de encomenda: mostra se tem ao menos um item correspondente)
    if (filtroLancamento !== "todos") {
      filtradas = filtradas.filter(enc =>
        (enc.produtos || []).some((_, idx) => {
          const lancado = !!lancamentos[`${enc.id}__${idx}`];
          return filtroLancamento === "lancados" ? lancado : !lancado;
        })
      );
    }

    // Ordenação
    if (ordenacao === "data") {
      filtradas.sort((a, b) => {
        const dataCompare = a.data.localeCompare(b.data);
        return dataCompare !== 0 ? dataCompare : a.hora.localeCompare(b.hora);
      });
    } else if (ordenacao === "cliente") {
      filtradas.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome));
    } else if (ordenacao === "hora") {
      filtradas.sort((a, b) => a.hora.localeCompare(b.hora));
    }

    return filtradas;
  };

  const encomendasFiltradas = filtrarEncomendas();

  // Agrupar encomendas por cliente
  const agruparPorCliente = () => {
    const agrupamento = new Map<string, { cliente: Cliente; encomendas: Encomenda[] }>();
    
    encomendasFiltradas.forEach((encomenda) => {
      if (!agrupamento.has(encomenda.clienteId)) {
        const cliente = clientes.find(c => c.id === encomenda.clienteId);
        if (cliente) {
          agrupamento.set(encomenda.clienteId, {
            cliente,
            encomendas: []
          });
        }
      }
      agrupamento.get(encomenda.clienteId)?.encomendas.push(encomenda);
    });

    return Array.from(agrupamento.values()).sort((a, b) => 
      a.cliente.nome.localeCompare(b.cliente.nome)
    );
  };

  const clientesAgrupados = agruparPorCliente();

  const calcularTotais = () => {
    const totais = {
      encomendas: encomendasFiltradas.length,
      clientes: new Set(encomendasFiltradas.map((e) => e.clienteId)).size,
      itens: encomendasFiltradas.reduce((acc, e) => acc + (e.produtos || []).length, 0),
      pesoTotal: encomendasFiltradas.reduce(
        (acc, e) =>
          acc + (e.produtos || []).reduce((sum, item) => sum + item.pesoTotalKg, 0),
        0
      ),
    };
    return totais;
  };

  const totais = calcularTotais();

  const exportarExcel = () => {
    const dadosExcel = [];

    encomendasFiltradas.forEach((encomenda) => {
      (encomenda.produtos || []).forEach((item, index) => {
        const codigo = obterCodigoProduto(item.produtoId);
        dadosExcel.push({
          Data: new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR"),
          Hora: encomenda.hora,
          Cliente: encomenda.clienteNome,
          "Código Produto": codigo || "",
          Produto: item.produtoNome,
          Quantidade: item.quantidade,
          Observação: item.observacao || "",
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Encomendas");
    XLSX.writeFile(wb, `Relatorio_Encomendas_${dataInicio.replace(/-/g, "")}.xlsx`);
    toast.success("Relatório exportado com sucesso!");
  };

  const imprimir = () => {
    if (encomendasFiltradas.length === 0) {
      toast.error("Não há dados para imprimir");
      return;
    }
    
    // Executar impressão após pequeno delay
    setTimeout(() => {
      window.print();
    }, 100);
    
    toast.success("Preparando impressão...");
  };

  const gerarHorarios = () => {
    const horarios = [];
    for (let h = 6; h <= 21; h++) {
      horarios.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return horarios;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📈 Relatórios
          </h1>
          <p className="text-muted-foreground">
            Visualize e exporte relatórios detalhados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportarExcel} variant="outline" className="gap-2" disabled={carregando}>
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button onClick={imprimir} variant="outline" className="gap-2" disabled={carregando}>
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {carregando && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </CardContent>
        </Card>
      )}

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
            >
              {mostrarFiltros ? "Fechar" : "Abrir"} Filtros
            </Button>
          </div>
        </CardHeader>
        {mostrarFiltros && (
          <CardContent>
            <div className="space-y-6">
              {/* Tipo de Relatório */}
              <div>
                <Label className="text-base font-semibold">Tipo de Relatório</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button
                    variant={tipoRelatorio === "dia" ? "default" : "outline"}
                    onClick={() => setTipoRelatorio("dia")}
                    className="flex-1 min-w-[120px]"
                  >
                    Por Dia
                  </Button>
                  <Button
                    variant={tipoRelatorio === "periodo" ? "default" : "outline"}
                    onClick={() => setTipoRelatorio("periodo")}
                    className="flex-1 min-w-[120px]"
                  >
                    Por Período
                  </Button>
                  <Button
                    variant={tipoRelatorio === "cliente" ? "default" : "outline"}
                    onClick={() => setTipoRelatorio("cliente")}
                    className="flex-1 min-w-[120px]"
                  >
                    Por Cliente
                  </Button>
                </div>
              </div>

              {/* Filtros de Data */}
              <div>
                <Label className="text-base font-semibold">Período</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {tipoRelatorio === "dia" ? (
                    <div>
                      <Label htmlFor="data">Data</Label>
                      <Input
                        id="data"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => {
                          setDataInicio(e.target.value);
                          setDataFim(e.target.value);
                        }}
                        className="mt-1"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="dataInicio">Data Início</Label>
                        <Input
                          id="dataInicio"
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataFim">Data Fim</Label>
                        <Input
                          id="dataFim"
                          type="date"
                          value={dataFim}
                          onChange={(e) => setDataFim(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cliente, Hora e Status de Lançamento */}
              <div>
                <Label className="text-base font-semibold">Filtros Adicionais</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <select
                      id="cliente"
                      value={clienteFiltro}
                      onChange={(e) => setClienteFiltro(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
                    >
                      <option value="">Todos</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="hora">Hora</Label>
                    <select
                      id="hora"
                      value={horaFiltro}
                      onChange={(e) => setHoraFiltro(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
                    >
                      <option value="">Todas</option>
                      {gerarHorarios().map((hora) => (
                        <option key={hora} value={hora}>
                          {hora}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="filtroLancamento">Status de Lançamento</Label>
                    <select
                      id="filtroLancamento"
                      value={filtroLancamento}
                      onChange={(e) => setFiltroLancamento(e.target.value as "todos" | "lancados" | "nao_lancados")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
                    >
                      <option value="todos">Todos</option>
                      <option value="lancados">Lançados</option>
                      <option value="nao_lancados">Não Lançados</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* LISTA DE PRODUTOS COM COLLAPSIBLE */}
              <div>
                <Collapsible open={listaProdutosAberta} onOpenChange={setListaProdutosAberta}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-semibold text-base"
                    >
                      <span>Produtos (Seleção Múltipla)</span>
                      <div className="flex items-center gap-2">
                        {produtosFiltro.length > 0 && (
                          <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                            {produtosFiltro.length}
                          </span>
                        )}
                        {listaProdutosAberta ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    {/* 🔍 Campo de busca de produtos */}
                    <div className="mb-2">
                      <Input
                        type="text"
                        placeholder="🔍 Buscar produto... (digite até 3 letras)"
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="border rounded-md bg-background p-3 max-h-64 overflow-y-auto">
                      {produtos.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Nenhum produto disponível
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {produtos
                            .filter(prod => {
                              if (!buscaProduto) return true;
                              // Filtra por até 3 primeiras letras (ou mais se digitou mais)
                              return startsWithText(prod.nome, buscaProduto);
                            })
                            .map((prod) => (
                            <label
                              key={prod.id}
                              className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={produtosFiltro.includes(prod.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProdutosFiltro([...produtosFiltro, prod.id]);
                                  } else {
                                    setProdutosFiltro(produtosFiltro.filter(id => id !== prod.id));
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="flex-1 text-sm">{prod.nome}</span>
                              {produtosFiltro.includes(prod.id) && (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </label>
                          ))}
                          {produtos.filter(prod => {
                            if (!buscaProduto) return true;
                            return startsWithText(prod.nome, buscaProduto);
                          }).length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              Nenhum produto encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Tags dos produtos selecionados */}
                    {produtosFiltro.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {produtosFiltro.map(prodId => {
                          const prod = produtos.find(p => p.id === prodId);
                          if (!prod) return null;
                          return (
                            <span
                              key={prodId}
                              className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold"
                            >
                              {prod.nome}
                              <button
                                onClick={() => setProdutosFiltro(produtosFiltro.filter(id => id !== prodId))}
                                className="hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProdutosFiltro([])}
                          className="text-xs gap-1 h-6"
                        >
                          <X className="w-3 h-3" />
                          Limpar todos
                        </Button>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Ordenação */}
              <div>
                <Label className="text-base font-semibold">Ordenar Por</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={ordenacao === "data" ? "default" : "outline"}
                    onClick={() => setOrdenacao("data")}
                    className="flex-1 min-w-[100px]"
                  >
                    Data
                  </Button>
                  <Button
                    size="sm"
                    variant={ordenacao === "cliente" ? "default" : "outline"}
                    onClick={() => setOrdenacao("cliente")}
                    className="flex-1 min-w-[100px]"
                  >
                    Cliente
                  </Button>
                  <Button
                    size="sm"
                    variant={ordenacao === "hora" ? "default" : "outline"}
                    onClick={() => setOrdenacao("hora")}
                    className="flex-1 min-w-[100px]"
                  >
                    Hora
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de Encomendas - DETALHAMENTO */}
      <div className="space-y-4 no-print"> {/* Visualização na tela */}
        {/* Botões de Visualização */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {tipoRelatorio === "cliente" ? "Encomendas por Cliente" : "Encomendas - Detalhamento"}
          </h2>
          {tipoRelatorio !== "cliente" && (
            <div className="flex gap-2 no-print">
              <Button
                variant={modoVisualizacao === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setModoVisualizacao("card")}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Cards
              </Button>
              <Button
                variant={modoVisualizacao === "lista" ? "default" : "outline"}
                size="sm"
                onClick={() => setModoVisualizacao("lista")}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                Lista
              </Button>
            </div>
          )}
        </div>

        {/* VISUALIZAÇÃO POR CLIENTE */}
        {tipoRelatorio === "cliente" ? (
          clientesAgrupados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhuma encomenda encontrada com os filtros selecionados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {clientesAgrupados.map(({ cliente, encomendas }) => {
                const totalPesoCliente = encomendas.reduce(
                  (acc, enc) => acc + enc.produtos.reduce((sum, p) => sum + p.pesoTotalKg, 0),
                  0
                );
                const totalEncomendas = encomendas.length;
                
                return (
                  <Card key={cliente.id} className="border-2 border-primary/20">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl text-primary flex items-center gap-2">
                            👤 {cliente.nome}
                            {cliente.codigo && (
                              <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                {cliente.codigo}
                              </span>
                            )}
                          </CardTitle>
                          {cliente.telefone && (
                            <p className="text-sm text-muted-foreground mt-1">
                              📱 {cliente.telefone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total de Encomendas</p>
                          <p className="text-3xl font-bold text-primary">{totalEncomendas}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Peso Total: {totalPesoCliente.toFixed(3)} kg
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {encomendas.map((encomenda) => {
                          const data = new Date(encomenda.data + "T00:00");
                          const diaMes = data.toLocaleDateString("pt-BR", { 
                            day: "2-digit", 
                            month: "short",
                            year: "numeric"
                          });
                          const pesoTotal = encomenda.produtos.reduce((sum, p) => sum + p.pesoTotalKg, 0);
                          
                          return (
                            <div key={encomenda.id} className="border rounded-lg p-4 bg-muted/30">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/10 rounded-full px-3 py-1">
                                    <span className="text-sm font-semibold text-primary">
                                      📅 {diaMes}
                                    </span>
                                  </div>
                                  <div className="bg-primary/10 rounded-full px-3 py-1">
                                    <span className="text-sm font-semibold text-primary">
                                      🕒 {encomenda.hora}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Peso da Encomenda</p>
                                  <p className="text-lg font-bold text-primary">{pesoTotal.toFixed(3)} kg</p>
                                </div>
                              </div>
                              
                              <div className="border rounded-lg overflow-hidden bg-background">
                                <table className="w-full text-sm">
                                  <thead className="bg-primary/5">
                                    <tr>
                                      <th className="text-left p-3 font-semibold w-[35%]">Produto</th>
                                      <th className="text-center p-3 font-semibold w-[10%]">Qtd</th>
                                      <th className="text-center p-3 font-semibold w-[15%]">Peso Un. (kg)</th>
                                      <th className="text-center p-3 font-semibold w-[15%]">Peso Total (kg)</th>
                                      <th className="text-left p-3 font-semibold w-[25%]">Observação</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {encomenda.produtos.map((item, index) => {
                                      const codigo = obterCodigoProduto(item.produtoId);
                                      return (
                                        <tr key={index} className="border-t hover:bg-muted/50">
                                          <td className="p-3">
                                            <div className="flex items-center gap-2">
                                              {codigo ? (
                                                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded min-w-[60px] inline-block text-center">
                                                  {codigo}
                                                </span>
                                              ) : (
                                                <span className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 min-w-[60px] inline-block text-center" title="Produto sem código cadastrado">
                                                  SEM CÓDIGO
                                                </span>
                                              )}
                                              <span className="font-medium">{item.produtoNome}</span>
                                            </div>
                                          </td>
                                          <td className="p-3 text-center font-bold">{item.quantidade}</td>
                                          <td className="p-3 text-center text-muted-foreground">
                                            {item.pesoPorUnidadeKg.toFixed(3)}
                                          </td>
                                          <td className="p-3 text-center font-semibold text-primary">
                                            {item.pesoTotalKg.toFixed(3)}
                                          </td>
                                          <td className="p-3 text-muted-foreground text-sm">
                                            {item.observacao || "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : encomendasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma encomenda encontrada com os filtros selecionados
              </p>
            </CardContent>
          </Card>
        ) : modoVisualizacao === "card" ? (
          /* Visualização em Cards */
          <div className="space-y-4">
            {encomendasFiltradas.map((encomenda) => {
              const data = new Date(encomenda.data + "T00:00");
              const diaMes = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
              return (
                <Card key={encomenda.id} className="print-break-inside-avoid">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-primary mb-1">
                          {encomenda.clienteNome}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          📅 {diaMes} às {encomenda.hora}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-sm font-semibold">
                          Peso Total:{" "}
                          {encomenda.produtos
                            .reduce((sum, item) => sum + item.pesoTotalKg, 0)
                            .toFixed(3)}{" "}
                          kg
                        </p>
                        {(() => {
                          const prog = getProgressoDia(encomenda.clienteId, encomenda.data);
                          const tudo = prog.lancados >= prog.total && prog.total > 0;
                          return (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tudo ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                                {prog.lancados}/{prog.total} lançados
                              </span>
                              {!tudo ? (
                                <button
                                  className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                                  onClick={() => setConfirmacaoLancDia({ tipo: "lancar", clienteId: encomenda.clienteId, clienteNome: encomenda.clienteNome, data: encomenda.data })}
                                >
                                  <CheckCheck className="w-3 h-3" />
                                  Lançar dia
                                </button>
                              ) : (
                                <button
                                  className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 hover:underline font-semibold"
                                  onClick={() => setConfirmacaoLancDia({ tipo: "desfazer", clienteId: encomenda.clienteId, clienteNome: encomenda.clienteNome, data: encomenda.data })}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Desfazer
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-semibold w-[30%]">Produto</th>
                            <th className="text-center p-3 font-semibold w-[8%]">Qtd</th>
                            <th className="text-center p-3 font-semibold w-[13%]">Peso Un. (kg)</th>
                            <th className="text-center p-3 font-semibold w-[13%]">Peso Total (kg)</th>
                            <th className="text-left p-3 font-semibold w-[22%]">Observação</th>
                            <th className="text-center p-3 font-semibold w-[14%]">Lançado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getProdutosParaRender(encomenda).map(({ produto: item, originalIndex }) => {
                            const codigo = obterCodigoProduto(item.produtoId);
                            const lancado = !!lancamentos[lancamentoKey(encomenda.id, originalIndex)];
                            return (
                            <tr key={originalIndex} className={`border-t ${lancado ? "bg-green-50/50 dark:bg-green-950/10" : ""}`}>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {codigo ? (
                                    <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded min-w-[60px] inline-block text-center">
                                      {codigo}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 min-w-[60px] inline-block text-center" title="Produto sem código cadastrado">
                                      SEM CÓDIGO
                                    </span>
                                  )}
                                  {item.produtoNome}
                                </div>
                              </td>
                              <td className="p-3 text-center font-bold">{item.quantidade}</td>
                              <td className="p-3 text-center text-muted-foreground">
                                {item.pesoPorUnidadeKg.toFixed(3)}
                              </td>
                              <td className="p-3 text-center font-semibold text-primary">
                                {item.pesoTotalKg.toFixed(3)}
                              </td>
                              <td className="p-3 text-muted-foreground text-sm">
                                {item.observacao || "-"}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => marcarItemLancado(encomenda.id, originalIndex, !lancado)}
                                  className="flex items-center justify-center w-full"
                                  title={lancado ? "Clique para desmarcar" : "Clique para marcar como lançado"}
                                >
                                  {lancado
                                    ? <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    : <Square className="w-5 h-5 text-muted-foreground" />
                                  }
                                </button>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Visualização em Lista (Tabela) */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto touch-pan-x">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold whitespace-nowrap">Cliente</th>
                      <th className="text-center p-3 text-sm font-semibold whitespace-nowrap">Data</th>
                      <th className="text-center p-3 text-sm font-semibold whitespace-nowrap">Hora</th>
                      <th className="text-left p-3 text-sm font-semibold whitespace-nowrap">Produto</th>
                      <th className="text-center p-3 text-sm font-semibold whitespace-nowrap">Qtd</th>
                      <th className="text-left p-3 text-sm font-semibold whitespace-nowrap">Observação</th>
                      <th className="text-center p-3 text-sm font-semibold whitespace-nowrap">Peso (kg)</th>
                      <th className="text-center p-3 text-sm font-semibold whitespace-nowrap">Lançado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let prevGrupoKey = "";
                      return encomendasFiltradas.flatMap((encomenda, encIndex) => {
                        const rows: JSX.Element[] = [];
                        const grupoKey = `${encomenda.clienteId}__${encomenda.data}`;
                        const ehNovoGrupo = grupoKey !== prevGrupoKey;
                        prevGrupoKey = grupoKey;
                        const produtosParaRender = getProdutosParaRender(encomenda);
                        if (produtosParaRender.length === 0) return rows;
                        const data = new Date(encomenda.data + "T00:00");
                        const diaMes = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

                        if (encIndex > 0) {
                          rows.push(
                            <tr key={`separator-${encomenda.id}`}>
                              <td colSpan={8} className="p-0">
                                <div className="border-t-4 border-primary/20"></div>
                              </td>
                            </tr>
                          );
                        }

                        if (ehNovoGrupo) {
                          const prog = getProgressoDia(encomenda.clienteId, encomenda.data);
                          const tudo = prog.lancados >= prog.total && prog.total > 0;
                          rows.push(
                            <tr key={`grupo-${grupoKey}-${encIndex}`} className="bg-muted/40">
                              <td colSpan={8} className="px-3 py-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {encomenda.clienteNome} · {diaMes}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${tudo ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                                      {prog.lancados}/{prog.total}
                                    </span>
                                    {!tudo ? (
                                      <button
                                        className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                                        onClick={() => setConfirmacaoLancDia({ tipo: "lancar", clienteId: encomenda.clienteId, clienteNome: encomenda.clienteNome, data: encomenda.data })}
                                      >
                                        <CheckCheck className="w-3 h-3" />
                                        Lançar dia
                                      </button>
                                    ) : (
                                      <button
                                        className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 hover:underline font-semibold"
                                        onClick={() => setConfirmacaoLancDia({ tipo: "desfazer", clienteId: encomenda.clienteId, clienteNome: encomenda.clienteNome, data: encomenda.data })}
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        Desfazer
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        produtosParaRender.forEach(({ produto, originalIndex }, i) => {
                          const codigo = obterCodigoProduto(produto.produtoId);
                          const lancado = !!lancamentos[lancamentoKey(encomenda.id, originalIndex)];
                          rows.push(
                            <tr key={`${encomenda.id}-${originalIndex}`} className={`border-t hover:bg-muted/30 ${lancado ? "bg-green-50/30 dark:bg-green-950/10" : ""}`}>
                              {i === 0 && (
                                <>
                                  <td className="p-3 font-bold text-primary bg-primary/5" rowSpan={produtosParaRender.length}>
                                    {encomenda.clienteNome}
                                  </td>
                                  <td className="p-3 text-center bg-primary/5" rowSpan={produtosParaRender.length}>
                                    📅 {diaMes}
                                  </td>
                                  <td className="p-3 text-center font-medium bg-primary/5" rowSpan={produtosParaRender.length}>
                                    {encomenda.hora}
                                  </td>
                                </>
                              )}
                              <td className="p-3 font-medium">
                                <div className="flex items-center gap-2">
                                  {codigo ? (
                                    <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded min-w-[60px] inline-block text-center">
                                      {codigo}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 min-w-[60px] inline-block text-center" title="Produto sem código cadastrado">
                                      SEM CÓDIGO
                                    </span>
                                  )}
                                  {produto.produtoNome}
                                </div>
                              </td>
                              <td className="p-3 text-center font-bold">{produto.quantidade}</td>
                              <td className="p-3 text-muted-foreground">{produto.observacao || "-"}</td>
                              <td className="p-3 text-center font-medium">{produto.pesoTotalKg.toFixed(3)}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => marcarItemLancado(encomenda.id, originalIndex, !lancado)}
                                  className="flex items-center justify-center w-full"
                                  title={lancado ? "Clique para desmarcar" : "Clique para marcar como lançado"}
                                >
                                  {lancado
                                    ? <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    : <Square className="w-5 h-5 text-muted-foreground" />
                                  }
                                </button>
                              </td>
                            </tr>
                          );
                        });

                        return rows;
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resumo - TOTALIZADORES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Encomendas</p>
              <p className="text-3xl font-bold text-primary">{totais.encomendas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Clientes</p>
              <p className="text-3xl font-bold text-primary">{totais.clientes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Produtos</p>
              <p className="text-3xl font-bold text-primary">{totais.itens}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Peso Total</p>
              <p className="text-3xl font-bold text-primary">
                {totais.pesoTotal.toFixed(2)} kg
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Versão para Impressão */}
      <div className="print-only">
        <h2 className="text-2xl font-bold mb-4">📈 Relatório de Encomendas</h2>
        <p className="text-sm mb-4 font-semibold">
          Período: {new Date(dataInicio + "T00:00").toLocaleDateString("pt-BR")} até{" "}
          {new Date(dataFim + "T00:00").toLocaleDateString("pt-BR")}
        </p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="text-left p-2 border border-black">Data</th>
              <th className="text-left p-2 border border-black">Hora</th>
              <th className="text-left p-2 border border-black">Cliente</th>
              <th className="text-left p-2 border border-black">Produto</th>
              <th className="text-center p-2 border border-black">Quantidade</th>
              <th className="text-left p-2 border border-black">Observação</th>
            </tr>
          </thead>
          <tbody>
            {encomendasFiltradas.flatMap((encomenda) =>
              encomenda.produtos.map((item, index) => {
                const codigo = obterCodigoProduto(item.produtoId);
                return (
                <tr key={`${encomenda.id}-${index}`} className="border-b border-gray-300">
                  <td className="p-2 border border-black">
                    {new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-2 border border-black">{encomenda.hora}</td>
                  <td className="p-2 border border-black">{encomenda.clienteNome}</td>
                  <td className="p-2 border border-black">
                    {codigo ? `[${codigo}] ${item.produtoNome}` : item.produtoNome}
                  </td>
                  <td className="p-2 text-center border border-black">{item.quantidade}</td>
                  <td className="p-2 border border-black">{item.observacao || "-"}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* AlertDialog de Confirmação de Lançamento */}
      <AlertDialog open={!!confirmacaoLancDia} onOpenChange={(open) => { if (!open) setConfirmacaoLancDia(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmacaoLancDia?.tipo === "lancar" ? "Lançar dia inteiro" : "Desfazer lançamento do dia"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmacaoLancDia?.tipo === "lancar"
                ? `Deseja marcar todos os itens de "${confirmacaoLancDia?.clienteNome}" do dia ${confirmacaoLancDia ? new Date(confirmacaoLancDia.data + "T00:00").toLocaleDateString("pt-BR") : ""} como lançados?`
                : `Deseja desfazer o lançamento de todos os itens de "${confirmacaoLancDia?.clienteNome}" do dia ${confirmacaoLancDia ? new Date(confirmacaoLancDia.data + "T00:00").toLocaleDateString("pt-BR") : ""}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmacaoLancDia(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmacaoLancDia) {
                  executarLancamentoDia(confirmacaoLancDia.clienteId, confirmacaoLancDia.clienteNome, confirmacaoLancDia.data, confirmacaoLancDia.tipo);
                  setConfirmacaoLancDia(null);
                }
              }}
            >
              {confirmacaoLancDia?.tipo === "lancar" ? "Lançar" : "Desfazer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          
          .print-break-inside-avoid {
            page-break-inside: avoid;
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
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}