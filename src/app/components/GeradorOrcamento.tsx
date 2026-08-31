import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Plus, Printer, Trash2, User, Package, Settings, Save, BarChart3, Calendar, History, ArrowLeft, Filter, X, FileSpreadsheet, Lock, Unlock, RefreshCw, Percent, DollarSign, Info } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";
import {
  clientesAPI,
  produtosOrcamentoAPI,
  orcamentosAPI,
  type Cliente,
  type ProdutoOrcamento,
  type ItemOrcamento,
} from "../services/api";
import { isFirebaseConfigured } from "../services/firebase";
import { InputMonetario } from "./InputMonetario";

interface OrcamentoHistorico {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpj?: string;
  clienteEndereco?: string;
  dataInicial: string;
  dataFinal: string;
  valorTotal: number;
  itens: Array<{
    id: string;
    produtoNome: string;
    quantidade: number;
    unidade: string;
    precoUnitario: number;
    valorTotal: number;
  }>;
  status: string;
  criadoEm?: number;
}

// Componente de Painel de Histórico Inline
function PainelHistorico({ onFechar }: { onFechar: () => void }) {
  console.log("🎯 PainelHistorico: Renderizando...");
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoHistorico[]>([]);
  const [orcamentosFiltrados, setOrcamentosFiltrados] = useState<OrcamentoHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Filtros
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("todos");
  const [mesSelecionado, setMesSelecionado] = useState<string>("todos");
  const [anoSelecionado, setAnoSelecionado] = useState<string>(new Date().getFullYear().toString());
  const [dataInicialFiltro, setDataInicialFiltro] = useState<string>("");
  const [dataFinalFiltro, setDataFinalFiltro] = useState<string>("");
  const [produtoFiltro, setProdutoFiltro] = useState<string>("todos");
  
  // Lista de produtos únicos
  const [produtosUnicos, setProdutosUnicos] = useState<string[]>([]);
  
  // Resumo
  const [resumo, setResumo] = useState({
    valorTotal: 0,
    quantidadeCompras: 0,
    produtoMaisComprado: "-",
    quantidadeTotal: 0,
  });

  useEffect(() => {
    carregarDados();

    // Re-load whenever another computer creates/updates/deletes an orcamento
    const handleOrcamentoAtualizado = () => carregarDados();
    window.addEventListener("orcamento-atualizado", handleOrcamentoAtualizado);
    return () => window.removeEventListener("orcamento-atualizado", handleOrcamentoAtualizado);
  }, []);

  useEffect(() => {
    if (!carregando) {
      aplicarFiltros();
    }
  }, [clienteSelecionado, mesSelecionado, anoSelecionado, dataInicialFiltro, dataFinalFiltro, produtoFiltro, orcamentos, carregando]);

  const carregarDados = async () => {
    console.log("📊 Carregando dados do histórico...");
    try {
      setCarregando(true);
      
      const [clientesData, orcamentosData] = await Promise.all([
        clientesAPI.listar(),
        orcamentosAPI.listar(),
      ]);
      
      console.log("🔍 Dados brutos recebidos:", { 
        clientesData, 
        orcamentosData,
        totalClientes: clientesData?.length || 0,
        totalOrcamentos: orcamentosData?.length || 0
      });
      
      const clientesValidos = Array.isArray(clientesData) ? clientesData : [];
      const orcamentosValidos = Array.isArray(orcamentosData) ? orcamentosData : [];
      
      // Log detalhado dos orçamentos
      if (orcamentosValidos.length > 0) {
        console.log("📋 Orçamentos encontrados:", orcamentosValidos.length);
        orcamentosValidos.forEach((orc, index) => {
          console.log(`  ${index + 1}. Orçamento ID: ${orc.id?.substring(0, 8)}...`);
          console.log(`     Cliente: ${orc.clienteNome}`);
          console.log(`     Data Inicial: ${orc.dataInicial}`);
          console.log(`     Data Final: ${orc.dataFinal}`);
          console.log(`     Valor Total: R$ ${orc.valorTotal?.toFixed(2) || '0.00'}`);
          console.log(`     Itens: ${orc.itens?.length || 0}`);
          if (orc.itens && orc.itens.length > 0) {
            orc.itens.forEach((item, idx) => {
              console.log(`       ${idx + 1}. ${item.produtoNome} - ${item.quantidade} ${item.unidade} - R$ ${item.valorTotal?.toFixed(2)}`);
            });
          }
        });
      } else {
        console.warn("⚠️ Nenhum orçamento encontrado no banco de dados!");
      }
      
      setClientes(clientesValidos);
      setOrcamentos(orcamentosValidos);
      
      // Extrair produtos únicos
      const produtosSet = new Set<string>();
      orcamentosValidos.forEach((orc) => {
        if (Array.isArray(orc.itens)) {
          orc.itens.forEach((item) => {
            if (item && item.produtoNome) {
              produtosSet.add(item.produtoNome);
            }
          });
        }
      });
      setProdutosUnicos(Array.from(produtosSet).sort());
      
      console.log("✅ Dados carregados:", { clientes: clientesValidos.length, orcamentos: orcamentosValidos.length, produtos: produtosSet.size });
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      toast.error("Erro ao carregar histórico");
      setClientes([]);
      setOrcamentos([]);
    } finally {
      setCarregando(false);
    }
  };

  const aplicarFiltros = () => {
    console.log("🔍 Aplicando filtros...", { clienteSelecionado, mesSelecionado, anoSelecionado, dataInicialFiltro, dataFinalFiltro, produtoFiltro });
    
    let resultado = [...orcamentos];

    if (clienteSelecionado !== "todos") {
      resultado = resultado.filter((orc) => orc.clienteId === clienteSelecionado);
    }

    if (mesSelecionado || anoSelecionado) {
      resultado = resultado.filter((orc) => {
        try {
          const dataInicial = new Date(orc.dataInicial);
          const mesOrc = String(dataInicial.getMonth() + 1).padStart(2, "0");
          const anoOrc = dataInicial.getFullYear().toString();

          const matchMes = mesSelecionado !== "todos" ? mesOrc === mesSelecionado : true;
          const matchAno = anoSelecionado ? anoOrc === anoSelecionado : true;

          return matchMes && matchAno;
        } catch {
          return false;
        }
      });
    }

    if (dataInicialFiltro || dataFinalFiltro) {
      resultado = resultado.filter((orc) => {
        try {
          const dataInicial = new Date(orc.dataInicial);
          const dataFinal = new Date(orc.dataFinal);
          const dataIniFiltro = dataInicialFiltro ? new Date(dataInicialFiltro) : null;
          const dataFinFiltro = dataFinalFiltro ? new Date(dataFinalFiltro) : null;

          const matchIni = dataIniFiltro ? dataInicial >= dataIniFiltro : true;
          const matchFin = dataFinFiltro ? dataFinal <= dataFinFiltro : true;

          return matchIni && matchFin;
        } catch {
          return false;
        }
      });
    }

    if (produtoFiltro !== "todos") {
      resultado = resultado.filter((orc) => {
        return Array.isArray(orc.itens) && orc.itens.some((item) => item.produtoNome === produtoFiltro);
      });
    }

    setOrcamentosFiltrados(resultado);
    calcularResumo(resultado);
    console.log("✅ Filtros aplicados:", resultado.length, "orçamentos");
  };

  const calcularResumo = (orcamentosFiltrados: OrcamentoHistorico[]) => {
    const valorTotal = orcamentosFiltrados.reduce((acc, orc) => acc + (orc.valorTotal || 0), 0);
    const quantidadeCompras = orcamentosFiltrados.length;

    const produtosContagem: Record<string, { quantidade: number; nome: string }> = {};
    
    orcamentosFiltrados.forEach((orc) => {
      if (Array.isArray(orc.itens)) {
        orc.itens.forEach((item) => {
          if (item && item.produtoNome) {
            if (!produtosContagem[item.produtoNome]) {
              produtosContagem[item.produtoNome] = {
                quantidade: 0,
                nome: item.produtoNome,
              };
            }
            produtosContagem[item.produtoNome].quantidade += item.quantidade || 0;
          }
        });
      }
    });

    const produtoMaisComprado = Object.values(produtosContagem).sort((a, b) => b.quantidade - a.quantidade)[0];
    const quantidadeTotal = Object.values(produtosContagem).reduce((acc, prod) => acc + prod.quantidade, 0);

    setResumo({
      valorTotal,
      quantidadeCompras,
      produtoMaisComprado: produtoMaisComprado?.nome || "-",
      quantidadeTotal,
    });
  };

  const limparFiltros = () => {
    setClienteSelecionado("todos");
    setMesSelecionado("todos");
    setAnoSelecionado(new Date().getFullYear().toString());
    setDataInicialFiltro("");
    setDataFinalFiltro("");
    setProdutoFiltro("todos");
  };

  const exportarCSV = () => {
    if (orcamentosFiltrados.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Data,Cliente,Produto,Quantidade,Unidade,Valor Unitário,Valor Total,Nº Orçamento\n";

    orcamentosFiltrados.forEach((orc) => {
      if (Array.isArray(orc.itens)) {
        orc.itens.forEach((item) => {
          const linha = [
            new Date(orc.dataInicial + "T12:00:00").toLocaleDateString("pt-BR"),
            `"${orc.clienteNome}"`,
            `"${item.produtoNome}"`,
            item.quantidade.toFixed(2),
            item.unidade,
            item.precoUnitario.toFixed(2),
            item.valorTotal.toFixed(2),
            `"${orc.id.substring(0, 8)}"`,
          ].join(",");
          csv += linha + "\n";
        });
      }
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_compras_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Histórico exportado com sucesso!");
  };

  const exportarExcel = () => {
    if (orcamentosFiltrados.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const worksheetData = [
      ["Data", "Cliente", "Produto", "Quantidade", "Unidade", "Valor Unitário", "Valor Total", "Nº Orçamento"],
    ];

    orcamentosFiltrados.forEach((orc) => {
      if (Array.isArray(orc.itens)) {
        orc.itens.forEach((item) => {
          worksheetData.push([
            new Date(orc.dataInicial + "T12:00:00").toLocaleDateString("pt-BR"),
            orc.clienteNome,
            item.produtoNome,
            item.quantidade.toFixed(2),
            item.unidade,
            item.precoUnitario.toFixed(2),
            item.valorTotal.toFixed(2),
            orc.id.substring(0, 8),
          ]);
        });
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico de Compras");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_compras_${new Date().toISOString().split("T")[0]}.xlsx`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Histórico exportado com sucesso!");
  };

  const getMesesDisponiveis = () => {
    return [
      { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
      { value: "03", label: "Março" }, { value: "04", label: "Abril" },
      { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
      { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
      { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
      { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
    ];
  };

  const getAnosDisponiveis = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let i = anoAtual; i >= anoAtual - 5; i--) {
      anos.push(i.toString());
    }
    return anos;
  };

  const excluirOrcamentoHistorico = async (id: string, clienteNome: string) => {
    if (!confirm(`Deseja realmente excluir este orçamento de "${clienteNome}"?`)) {
      return;
    }

    try {
      await orcamentosAPI.excluir(id);
      toast.success("Orçamento excluído com sucesso!");

      // Atualizar lista imediatamente
      const novosOrcamentos = orcamentos.filter(orc => orc.id !== id);
      setOrcamentos(novosOrcamentos);
      setOrcamentosFiltrados(novosOrcamentos);
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast.error("Erro ao excluir orçamento");
    }
  };

  console.log("🎨 Renderizando interface com", orcamentosFiltrados.length, "orçamentos filtrados");

  return (
    <div className="space-y-6" id="print-area">
      {/* Título para impressão */}
      <div className="hidden print:block text-center mb-4" id="print-titulo">
        <h1 className="text-2xl font-bold">NICOLINA - GESTÃO DE ENCOMENDAS</h1>
        <h2 className="text-xl font-semibold mt-2">Histórico de Compras por Cliente</h2>
        <p className="text-sm mt-1">
          Gerado em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
        </p>
      </div>

      {/* Header com botão Voltar */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📊 Histórico de Compras por Cliente
          </h2>
          <p className="text-muted-foreground">
            Visualize detalhadamente os produtos comprados por cliente, mês a mês
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="default" className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir PDF
          </Button>
          <Button onClick={onFechar} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Orçamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-primary" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtroCliente">Cliente</Label>
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                <SelectTrigger id="filtroCliente">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroMes">Mês</Label>
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger id="filtroMes">
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Meses</SelectItem>
                  {getMesesDisponiveis().map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroAno">Ano</Label>
              <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                <SelectTrigger id="filtroAno">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {getAnosDisponiveis().map((ano) => (
                    <SelectItem key={ano} value={ano}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroDataInicial">Data Inicial</Label>
              <Input
                type="date"
                id="filtroDataInicial"
                value={dataInicialFiltro}
                onChange={(e) => setDataInicialFiltro(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroDataFinal">Data Final</Label>
              <Input
                type="date"
                id="filtroDataFinal"
                value={dataFinalFiltro}
                onChange={(e) => setDataFinalFiltro(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroProduto">Produto</Label>
              <Select value={produtoFiltro} onValueChange={setProdutoFiltro}>
                <SelectTrigger id="filtroProduto">
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Produtos</SelectItem>
                  {produtosUnicos.map((produto) => (
                    <SelectItem key={produto} value={produto}>
                      {produto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 md:col-span-2">
              <Button onClick={limparFiltros} variant="outline" className="flex-1">
                Limpar
              </Button>
              <Button onClick={exportarExcel} variant="default" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {resumo.valorTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma de todos os orçamentos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nº de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resumo.quantidadeCompras}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Orçamentos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produto Mais Comprado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-600 truncate">
              {resumo.produtoMaisComprado}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Maior volume no período
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quantidade Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {resumo.quantidadeTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens comprados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card id="print-tabela">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg">
            Detalhamento de Compras ({orcamentosFiltrados.length} orçamentos)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6" id="print-content">
          {carregando ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" />
              <p className="text-lg font-semibold text-muted-foreground">
                Carregando...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Aguarde enquanto os dados são carregados
              </p>
            </div>
          ) : orcamentosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-semibold text-muted-foreground">
                Nenhum registro encontrado
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Ajuste os filtros ou verifique se há orçamentos salvos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="print-table-container">
              <Table id="tabela-historico">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                    <TableHead className="text-right">Valor Unitário</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center w-16">Nº</TableHead>
                    <TableHead className="text-center w-24 no-print">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentosFiltrados.map((orcamento, indexOrcamento) => (
                    <React.Fragment key={orcamento.id}>
                      {Array.isArray(orcamento.itens) && orcamento.itens.map((item, index) => (
                        <TableRow key={`${orcamento.id}-${item.id}`}>
                          {index === 0 && (
                            <TableCell rowSpan={orcamento.itens.length} className="font-medium border-r">
                              {new Date(orcamento.dataInicial + "T12:00:00").toLocaleDateString("pt-BR")}
                            </TableCell>
                          )}
                          {index === 0 && (
                            <TableCell rowSpan={orcamento.itens.length} className="font-medium border-r">
                              {orcamento.clienteNome}
                            </TableCell>
                          )}
                          <TableCell>{item.produtoNome}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {item.quantidade.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">{item.unidade}</TableCell>
                          <TableCell className="text-right">
                            R$ {item.precoUnitario.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            R$ {item.valorTotal.toFixed(2)}
                          </TableCell>
                          {index === 0 && (
                            <TableCell rowSpan={orcamento.itens.length} className="border-l text-center font-semibold text-muted-foreground">
                              {indexOrcamento + 1}
                            </TableCell>
                          )}
                          {index === 0 && (
                            <TableCell rowSpan={orcamento.itens.length} className="text-center no-print">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => excluirOrcamentoHistorico(orcamento.id, orcamento.clienteNome)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={6} className="text-right">
                          Subtotal do Orçamento:
                        </TableCell>
                        <TableCell className="text-right text-primary">
                          R$ {orcamento.valorTotal.toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="no-print"></TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                  
                  <TableRow className="bg-primary/10 border-t-2 border-primary">
                    <TableCell colSpan={6} className="text-right font-bold text-lg">
                      TOTAL GERAL:
                    </TableCell>
                    <TableCell className="text-right font-bold text-xl text-primary">
                      R$ {resumo.valorTotal.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="no-print"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TIPOS E FUNÇÕES DE DISTRIBUIÇÃO
// ============================================================

interface ItemLocal {
  id: string;
  produtoId: string;
  produtoNome: string;
  precoUnitario: number;
  unidade: string;
  quantidade: number;
  valorTotal: number;
  fixado: boolean;       // true = travado (não redistribuído automaticamente)
  proporcaoKg: number;   // percentual de proporção para modo "proporcao" (KG only)
}

// Arredonda para 2 casas decimais financeiras
const r2 = (v: number) => Math.round(v * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// REGRA DE DISTRIBUIÇÃO — PRECISÃO INTERNA
//
// Para itens KG livres NÃO-ÚLTIMO:
//   1. alloc   = valor proporcional calculado pelo algoritmo
//   2. quantidade = parseFloat((alloc / preço).toFixed(3))  ← 3 casas decimais
//   3. valorTotal = quantidade × preço  (ex: 1.131 × 49.50 = 55.9845)
//   4. Exibição: valorTotal.toFixed(2) → "55.98"
//
// Para o ÚLTIMO item KG livre:
//   1. valorTotal = meta − soma(valorTotal de todos os outros itens)  ← residual exato
//   2. quantidade = valorTotal / preço  (precisão total do JS)
//   3. Exibição: valorTotal.toFixed(2) → "224.02"
//
// Garantia: soma(valorTotal) = meta  (algebricamente exata, sem correção posterior)
// ─────────────────────────────────────────────────────────────────────────────

// Arredonda quantidade KG para 3 casas decimais (padrão de entrada do usuário)
const qtd3 = (v: number) => parseFloat(v.toFixed(3));

// Constrói um item livre com quantidade e valorTotal calculados corretamente.
// isLast=true → recebe o residual exato para fechar a meta.
function buildItemLivre(
  item: ItemLocal,
  alloc: number,
  residual: number,
  isLast: boolean
): ItemLocal {
  if (item.precoUnitario <= 0) return { ...item, quantidade: 0, valorTotal: 0 };
  if (isLast) {
    // Último item: valorTotal = residual exato; quantidade derivada dele
    const quantidade = residual / item.precoUnitario;
    return { ...item, quantidade, valorTotal: residual };
  }
  // Demais: quantidade arredondada a 3 decimais; valorTotal = quantidade × preço
  const quantidade = qtd3(alloc / item.precoUnitario);
  const valorTotal = quantidade * item.precoUnitario;
  return { ...item, quantidade, valorTotal };
}

// Distribui o valor restante igualmente entre os itens KG livres.
function distribuirQuantidades(items: ItemLocal[], meta: number): ItemLocal[] {
  if (items.length === 0) return items;

  const fixados = items.filter((i) => i.unidade !== "kg" || i.fixado);
  const livres  = items.filter((i) => i.unidade === "kg" && !i.fixado);

  if (livres.length === 0) return items;

  const valorFixado   = fixados.reduce((acc, i) => acc + i.valorTotal, 0);
  const valorRestante = Math.max(0, meta - valorFixado);
  const valorPorItem  = valorRestante / livres.length;

  let somaAlocada = 0; // soma dos valorTotal dos itens não-últimos
  const livresAtualizados: ItemLocal[] = livres.map((item, idx) => {
    const isLast = idx === livres.length - 1;
    const atualizado = buildItemLivre(item, valorPorItem, valorRestante - somaAlocada, isLast);
    if (!isLast) somaAlocada += atualizado.valorTotal;
    return atualizado;
  });

  const livresMap = new Map(livresAtualizados.map((i) => [i.id, i]));
  return items.map((item) =>
    item.unidade === "kg" && !item.fixado ? livresMap.get(item.id)! : item
  );
}

// Distribui o valor restante proporcionalmente (via proporcaoKg) entre os itens KG livres.
function distribuirPorProporcao(
  items: ItemLocal[],
  meta: number,
  prioridadePaoDoce: boolean
): ItemLocal[] {
  if (items.length === 0) return items;

  const fixados = items.filter((i) => i.unidade !== "kg" || i.fixado);
  const livres  = items.filter((i) => i.unidade === "kg" && !i.fixado);

  if (livres.length === 0) return items;

  const valorFixado   = fixados.reduce((acc, i) => acc + i.valorTotal, 0);
  const valorRestante = Math.max(0, meta - valorFixado);
  const somaProps     = livres.reduce((acc, i) => acc + (i.proporcaoKg || 0), 0);

  if (somaProps <= 0) return distribuirQuantidades(items, meta);

  let somaAlocada = 0;
  let livresAtualizados: ItemLocal[] = livres.map((item, idx) => {
    const isLast = idx === livres.length - 1;
    const prop   = (item.proporcaoKg || 0) / somaProps;
    const alloc  = valorRestante * prop;
    const atualizado = buildItemLivre(item, alloc, valorRestante - somaAlocada, isLast);
    if (!isLast) somaAlocada += atualizado.valorTotal;
    return atualizado;
  });

  // Pão de Doce priority: garante que seja o maior em quantidade.
  // Transfere valor do doador → PD mantendo soma = meta.
  if (prioridadePaoDoce && livresAtualizados.length > 1) {
    const pdIdx = livresAtualizados.findIndex((i) =>
      i.produtoNome.toLowerCase().replace(/\s+/g, " ").includes("pão de doce") ||
      i.produtoNome.toLowerCase().replace(/\s+/g, " ").includes("pao de doce")
    );
    if (pdIdx >= 0) {
      const pd        = livresAtualizados[pdIdx];
      const maxOutros = Math.max(
        ...livresAtualizados.filter((_, i) => i !== pdIdx).map((i) => i.quantidade)
      );
      if (pd.quantidade <= maxOutros && pd.precoUnitario > 0) {
        // PD precisa de pelo menos maxOutros + 0.001 de valor
        const valorNovoPd = (maxOutros + 0.001) * pd.precoUnitario;
        const excesso     = valorNovoPd - pd.valorTotal;
        const doadores    = livresAtualizados
          .map((item, i) => ({ item, i }))
          .filter(({ i }) => i !== pdIdx && livresAtualizados[i].valorTotal > excesso + 0.01);
        if (doadores.length > 0) {
          const { item: doador, i: diIdx } = doadores[doadores.length - 1];
          // Doador cede exatamente o excesso → soma total inalterada
          const novoValorDoador = doador.valorTotal - excesso;
          const novaQtdDoador   = qtd3(novoValorDoador / doador.precoUnitario);
          livresAtualizados[diIdx] = {
            ...doador,
            quantidade: novaQtdDoador,
            valorTotal: novaQtdDoador * doador.precoUnitario,
          };
          const novaQtdPd = qtd3(valorNovoPd / pd.precoUnitario);
          livresAtualizados[pdIdx] = {
            ...pd,
            quantidade: novaQtdPd,
            valorTotal: novaQtdPd * pd.precoUnitario,
          };
        }
      }
    }
  }

  const livresMap = new Map(livresAtualizados.map((i) => [i.id, i]));
  return items.map((item) =>
    item.unidade === "kg" && !item.fixado ? livresMap.get(item.id)! : item
  );
}

const isPaoDoce = (nome: string) =>
  nome.toLowerCase().replace(/\s+/g, " ").includes("pão de doce") ||
  nome.toLowerCase().replace(/\s+/g, " ").includes("pao de doce");

// Aplica o modo de distribuição correto.
// A soma dos valorTotal de todos os itens é sempre igual à meta por construção.
function distribuir(
  items: ItemLocal[],
  meta: number,
  modo: "automatico" | "proporcao",
  prioridadePaoDoce: boolean
): ItemLocal[] {
  if (modo === "proporcao") return distribuirPorProporcao(items, meta, prioridadePaoDoce);

  if (prioridadePaoDoce) {
    const livres = items.filter((i) => i.unidade === "kg" && !i.fixado);
    const hasPd  = livres.some((i) => isPaoDoce(i.produtoNome));
    if (hasPd && livres.length > 1) {
      const numOutros   = livres.filter((i) => !isPaoDoce(i.produtoNome)).length;
      const propPorOutro = numOutros > 0 ? 20 / numOutros : 0;
      const itemsComProp = items.map((i) => {
        if (i.unidade !== "kg" || i.fixado) return i;
        return { ...i, proporcaoKg: isPaoDoce(i.produtoNome) ? 80 : propPorOutro };
      });
      return distribuirPorProporcao(itemsComProp, meta, false);
    }
  }

  return distribuirQuantidades(items, meta);
}

export function GeradorOrcamento() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtosOrcamento, setProdutosOrcamento] = useState<ProdutoOrcamento[]>([]);

  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [orcamentosSalvos, setOrcamentosSalvos] = useState<OrcamentoHistorico[]>([]);
  const [orcamentoEmEdicaoId, setOrcamentoEmEdicaoId] = useState<string | null>(null);

  // Dados do Cliente
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [clienteNome, setClienteNome] = useState<string>("");
  const [clienteCnpj, setClienteCnpj] = useState<string>("");
  const [clienteEndereco, setClienteEndereco] = useState<string>("");

  // Datas — iniciam no mês anterior
  const calcularDatasIniciais = () => {
    const hoje = new Date();
    const ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return {
      ini: ini.toISOString().split("T")[0],
      fim: fim.toISOString().split("T")[0],
    };
  };
  const datasIniciais = calcularDatasIniciais();
  const [dataInicial, setDataInicial] = useState<string>(datasIniciais.ini);
  const [dataFinal, setDataFinal] = useState<string>(datasIniciais.fim);

  // Produto para adicionar
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>("");
  const [quantidadeNaoKg, setQuantidadeNaoKg] = useState<string>("");
  const [proporcaoKgInput, setProporcaoKgInput] = useState<string>("");

  // Meta Financeira — modo valor ou percentual
  const [metaFinanceira, setMetaFinanceira] = useState<number>(0);
  const [metaModo, setMetaModo] = useState<"valor" | "percentual">("valor");
  const [metaPercentual, setMetaPercentual] = useState<number>(0);
  const [faturamentoPeriodo, setFaturamentoPeriodo] = useState<number>(0);

  // Modo de distribuição: automático (original) ou por proporção (novo)
  const [modoDist, setModoDist] = useState<"automatico" | "proporcao">("automatico");

  // Opção de prioridade Pão de Doce
  const [prioridadePaoDoce, setPrioridadePaoDoce] = useState<boolean>(false);

  // Itens com distribuição
  const [itens, setItens] = useState<ItemLocal[]>([]);

  // ---- helpers de cálculo ----
  const metaEfetiva = metaModo === "percentual"
    ? r2(faturamentoPeriodo * metaPercentual / 100)
    : metaFinanceira;

  const aplicarDistribuicao = useCallback(
    (novosItens: ItemLocal[], meta: number) =>
      distribuir(novosItens, meta, modoDist, prioridadePaoDoce),
    [modoDist, prioridadePaoDoce]
  );

  // Recalcula faturamento do período quando datas mudam
  useEffect(() => {
    if (!dataInicial || !dataFinal) return;
    calcularFaturamentoPeriodo();
  }, [dataInicial, dataFinal, orcamentosSalvos]);

  // Recalcula meta efetiva quando percentual ou faturamento mudam (modo percentual)
  useEffect(() => {
    if (metaModo === "percentual" && itens.length > 0) {
      const nova = r2(faturamentoPeriodo * metaPercentual / 100);
      if (nova > 0) {
        setItens((prev) => distribuir(prev, nova, modoDist, prioridadePaoDoce));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaPercentual, faturamentoPeriodo, metaModo]);

  // Redistribui quando modo ou prioridade mudam
  useEffect(() => {
    if (itens.length > 0 && metaEfetiva > 0) {
      setItens(aplicarDistribuicao(itens, metaEfetiva));
    }
  }, [modoDist, prioridadePaoDoce]);

  useEffect(() => {
    carregarDados();
    // Only seed example products when Firebase is NOT configured (local mode).
    // When Firebase IS configured, products live in the shared cloud database;
    // auto-seeding would overwrite real data with examples on a fresh connection.
    inicializarProdutosOrcamento();

    // Real-time orcamentos — fires on any create/edit/delete from any computer
    const unsubscribe = orcamentosAPI.observar((data) => {
      setOrcamentosSalvos(data);
    });

    // Reload when another computer changes the product catalog
    const reloadProdutos = async () => {
      const data = await produtosOrcamentoAPI.listar();
      setProdutosOrcamento(data);
    };
    // Reload when another computer adds/edits/removes a client
    const reloadClientes = async () => {
      const data = await clientesAPI.listar();
      setClientes(data);
    };

    window.addEventListener('produtos-orcamento-atualizados', reloadProdutos);
    window.addEventListener('clientes-atualizados', reloadClientes);

    return () => {
      unsubscribe();
      window.removeEventListener('produtos-orcamento-atualizados', reloadProdutos);
      window.removeEventListener('clientes-atualizados', reloadClientes);
    };
  }, []);

  const calcularFaturamentoPeriodo = () => {
    if (!dataInicial || !dataFinal || orcamentosSalvos.length === 0) {
      setFaturamentoPeriodo(0);
      return;
    }
    // Include orçamentos whose dataInicial falls within (or on) the selected period
    const total = orcamentosSalvos
      .filter((o) => o.dataInicial >= dataInicial && o.dataInicial <= dataFinal)
      .reduce((acc, o) => acc + (o.valorTotal || 0), 0);
    setFaturamentoPeriodo(r2(total));
  };

  const carregarDados = async () => {
    try {
      const [clientesData, produtosData] = await Promise.all([
        clientesAPI.listar(),
        produtosOrcamentoAPI.listar(),
      ]);
      setClientes(clientesData);
      setProdutosOrcamento(produtosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  const inicializarProdutosOrcamento = async () => {
    // When Firebase is configured, products are managed in the shared cloud database.
    // Auto-seeding would replace real products with example ones on a fresh connection.
    // Only seed when running in pure localStorage mode (Firebase not configured).
    if (isFirebaseConfigured()) return;

    try {
      const produtosExistentes = await produtosOrcamentoAPI.listar();
      if (produtosExistentes.length === 0) {
        const produtosExemplo = [
          { nome_produto: "Pão de Sal", preco_unitario: 15.0, unidade: "kg" as const, referencia_abreviada: "kg" },
          { nome_produto: "Pão de Doce", preco_unitario: 18.5, unidade: "kg" as const, referencia_abreviada: "kg" },
          { nome_produto: "Bolo Simples", preco_unitario: 35.0, unidade: "un" as const, referencia_abreviada: "un" },
          { nome_produto: "Torta Salgada", preco_unitario: 45.0, unidade: "un" as const, referencia_abreviada: "un" },
        ];
        await Promise.all(produtosExemplo.map((p) => produtosOrcamentoAPI.criar(p)));
        const atualizados = await produtosOrcamentoAPI.listar();
        setProdutosOrcamento(atualizados);
      }
    } catch (error) {
      console.error("Erro ao inicializar produtos:", error);
    }
  };

  const carregarOrcamentosSalvos = async () => {
    try {
      const data = await orcamentosAPI.listar();
      setOrcamentosSalvos(data);
    } catch (error) {
      console.error("Erro ao carregar orçamentos salvos:", error);
      toast.error("Erro ao carregar orçamentos salvos");
    }
  };

  const reabrirOrcamento = (orcamento: OrcamentoHistorico) => {
    setOrcamentoEmEdicaoId(orcamento.id);
    setClienteSelecionado(orcamento.clienteId);
    setClienteNome(orcamento.clienteNome);
    setClienteCnpj(orcamento.clienteCnpj || "");
    setClienteEndereco(orcamento.clienteEndereco || "");
    setDataInicial(orcamento.dataInicial);
    setDataFinal(orcamento.dataFinal);
    setMetaFinanceira(orcamento.valorTotal);
    // Restore new fields if present
    const orc = orcamento as any;
    if (orc.metaModo) setMetaModo(orc.metaModo);
    if (orc.metaPercentual) setMetaPercentual(orc.metaPercentual);
    if (orc.modoDist) setModoDist(orc.modoDist);
    if (orc.prioridadePaoDoce !== undefined) setPrioridadePaoDoce(orc.prioridadePaoDoce);
    const itensConvertidos: ItemLocal[] = orcamento.itens.map((item) => ({
      id: item.id,
      produtoId: item.id,
      produtoNome: item.produtoNome,
      precoUnitario: item.precoUnitario,
      unidade: item.unidade,
      quantidade: item.quantidade,
      valorTotal: item.valorTotal,
      fixado: true,
      proporcaoKg: (item as any).proporcaoKg || 0,
    }));
    setItens(itensConvertidos);
    toast.success("Orçamento reaberto para edição! Ao salvar, o mesmo orçamento será atualizado.");
  };

  const imprimirOrcamentoSalvo = (orcamento: OrcamentoHistorico) => {
    reabrirOrcamento(orcamento);
    setTimeout(() => window.print(), 300);
  };

  const excluirOrcamento = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir o orçamento de "${nome}"?`)) return;
    try {
      await orcamentosAPI.excluir(id);
      toast.success("Orçamento excluído com sucesso!");
      await carregarOrcamentosSalvos();
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast.error("Erro ao excluir orçamento");
    }
  };

  const handleSelecionarCliente = (clienteId: string) => {
    setClienteSelecionado(clienteId);
    if (clienteId === "novo") {
      setClienteNome("");
      setClienteCnpj("");
      setClienteEndereco("");
      return;
    }
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente) {
      setClienteNome(cliente.nome || "");
      setClienteCnpj(cliente.cnpj || "");
      setClienteEndereco(cliente.endereco || "");
    }
  };

  const handleMetaChange = (novoValor: number) => {
    setMetaFinanceira(novoValor);
    if (itens.length > 0) {
      setItens(aplicarDistribuicao(itens, novoValor));
    }
  };

  const handlePercentualChange = (pct: number) => {
    setMetaPercentual(pct);
    const nova = r2(faturamentoPeriodo * pct / 100);
    if (itens.length > 0 && nova > 0) {
      setItens((prev) => distribuir(prev, nova, modoDist, prioridadePaoDoce));
    }
  };

  const adicionarItem = () => {
    if (!produtoSelecionado) {
      toast.error("Selecione um produto");
      return;
    }
    const produto = produtosOrcamento.find((p) => p.id === produtoSelecionado);
    if (!produto) return;
    if (itens.some((i) => i.produtoId === produto.id)) {
      toast.error("Este produto já foi adicionado à nota");
      return;
    }

    const isKg = produto.unidade === "kg";
    let quantidadeInicial = 0;
    if (!isKg) {
      const qtd = parseFloat(quantidadeNaoKg || "0");
      if (qtd <= 0) {
        toast.error(`Informe a quantidade de ${produto.unidade} para este produto`);
        return;
      }
      quantidadeInicial = produto.unidade === "un" ? Math.round(qtd) : parseFloat(qtd.toFixed(3));
    }

    const propKg = isKg ? (parseFloat(proporcaoKgInput || "0") || 0) : 0;

    const novoItem: ItemLocal = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      produtoId: produto.id,
      produtoNome: produto.nome_produto,
      precoUnitario: produto.preco_unitario,
      unidade: produto.unidade,
      quantidade: quantidadeInicial,
      valorTotal: quantidadeInicial * produto.preco_unitario,
      fixado: !isKg,
      proporcaoKg: propKg,
    };

    const novosItens = [...itens, novoItem];
    setItens(aplicarDistribuicao(novosItens, metaEfetiva));
    setProdutoSelecionado("");
    setQuantidadeNaoKg("");
    setProporcaoKgInput("");

    if (isKg) {
      toast.success("Produto KG adicionado! Quantidade calculada automaticamente.");
    } else {
      toast.success("Produto adicionado! Produtos KG redistribuídos.");
    }
  };

  const removerItem = (id: string) => {
    const semItem = itens.filter((i) => i.id !== id);
    setItens(aplicarDistribuicao(semItem, metaEfetiva));
  };

  const atualizarQuantidade = (id: string, novaQuantidade: number) => {
    const itensAtualizados = itens.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          quantidade: novaQuantidade,
          valorTotal: novaQuantidade * item.precoUnitario,
          fixado: true,
        };
      }
      return item;
    });
    setItens(aplicarDistribuicao(itensAtualizados, metaEfetiva));
  };

  const atualizarProporcao = (id: string, novaProporcao: number) => {
    setItens(itens.map((item) =>
      item.id === id ? { ...item, proporcaoKg: novaProporcao } : item
    ));
  };

  const toggleTravar = (id: string) => {
    const item = itens.find((i) => i.id === id);
    if (!item || item.unidade !== "kg") return;
    const novos = itens.map((i) =>
      i.id === id ? { ...i, fixado: !i.fixado } : i
    );
    setItens(aplicarDistribuicao(novos, metaEfetiva));
  };

  const redistribuirKg = () => {
    setItens(
      aplicarDistribuicao(
        itens.map((i) => ({ ...i, fixado: i.unidade !== "kg" ? true : false })),
        metaEfetiva
      )
    );
    toast.success(
      modoDist === "proporcao"
        ? "Redistribuído pelas proporções configuradas."
        : "Quantidades KG redistribuídas automaticamente."
    );
  };

  const salvarOrcamento = async () => {
    if (!clienteSelecionado) { toast.error("Selecione um cliente"); return; }
    if (!dataInicial) { toast.error("Informe a data inicial"); return; }
    if (!dataFinal) { toast.error("Informe a data final"); return; }
    if (itens.length === 0) { toast.error("Adicione pelo menos um item ao orçamento"); return; }

    try {
      const itensParaSalvar = itens.map((item) => ({
        id: item.id,
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        proporcao: 0,
        proporcaoKg: item.proporcaoKg,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        unidade: item.unidade,
        valorTotal: item.valorTotal,
        travado: item.fixado,
      }));

      const orcamento: Record<string, unknown> = {
        clienteId: clienteSelecionado,
        clienteNome,
        clienteCnpj: clienteCnpj || "",
        clienteEndereco: clienteEndereco || "",
        dataInicial,
        dataFinal,
        valorTotal: somaValoresItens,
        metaFinanceira: metaEfetiva,
        metaModo,
        modoDist,
        prioridadePaoDoce,
        itens: itensParaSalvar,
        alocacaoAtual: 0,
        status: "salvo",
        // Only include percentual fields when in percentual mode — Firebase rejects undefined values
        ...(metaModo === "percentual" && {
          metaPercentual,
          faturamentoPeriodo,
        }),
      };

      if (orcamentoEmEdicaoId) {
        await orcamentosAPI.atualizar(orcamentoEmEdicaoId, orcamento as any);
        toast.success("Orçamento atualizado com sucesso!");
      } else {
        await orcamentosAPI.criar(orcamento as any);
        toast.success("Orçamento salvo com sucesso!");
      }

      // Manual reload ensures same-computer update in localStorage-only mode.
      // In Firebase mode the real-time observer (set up at mount) also handles cross-computer sync.
      await carregarOrcamentosSalvos();
      limparFormulario();
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      toast.error("Erro ao salvar orçamento");
    }
  };

  const limparFormulario = () => {
    setOrcamentoEmEdicaoId(null);
    setClienteSelecionado("");
    setClienteNome("");
    setClienteCnpj("");
    setClienteEndereco("");
    const d = calcularDatasIniciais();
    setDataInicial(d.ini);
    setDataFinal(d.fim);
    setProdutoSelecionado("");
    setQuantidadeNaoKg("");
    setProporcaoKgInput("");
    setItens([]);
    setMetaFinanceira(0);
    setMetaModo("valor");
    setMetaPercentual(0);
    setModoDist("automatico");
    setPrioridadePaoDoce(false);
  };

  const novoOrcamento = () => {
    limparFormulario();
    toast.success("Formulário limpo! Você pode criar um novo orçamento.");
  };

  const formatarQuantidade = (quantidade: number, unidade: string): string => {
    if (unidade === "un") return Math.round(quantidade).toString();
    return quantidade.toFixed(3);
  };

  // Parse a YYYY-MM-DD string as LOCAL date (not UTC).
  // new Date("2026-05-01") → UTC midnight → shows as 30/04 in Brazil (UTC-3).
  // Appending T12:00:00 anchors it at local noon, safe for any UTC-N timezone.
  const parseDateLocal = (iso: string) => new Date(iso + "T12:00:00");
  const fmtDate = (iso: string) => iso ? parseDateLocal(iso).toLocaleDateString("pt-BR") : "-";

  const somaValoresItens = itens.reduce((acc, i) => acc + i.valorTotal, 0);
  const diferenca = metaEfetiva - somaValoresItens;
  const percentualAtingido = metaEfetiva > 0 ? (somaValoresItens / metaEfetiva) * 100 : 0;
  const metaAtingida = Math.abs(diferenca) <= 0.01 && metaEfetiva > 0 && itens.length > 0;
  const produtoSelecionadoObj = produtosOrcamento.find((p) => p.id === produtoSelecionado);

  // Soma das proporções KG (para indicador no modo proporção)
  const somaProporcoesKg = itens
    .filter((i) => i.unidade === "kg" && !i.fixado)
    .reduce((acc, i) => acc + (i.proporcaoKg || 0), 0);

  if (mostrarHistorico) {
    return <PainelHistorico onFechar={() => setMostrarHistorico(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* All interactive content is hidden during print — only orcamento-print-area renders */}
      <div className="print:hidden">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">💼 Gerador de Orçamento por Meta Financeira</h2>
          <p className="text-muted-foreground">
            Defina a meta, selecione os produtos — o sistema distribui as quantidades automaticamente.
          </p>
          {orcamentoEmEdicaoId && (
            <div className="mt-2 inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Editando orçamento existente
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {orcamentoEmEdicaoId && (
            <Button onClick={novoOrcamento} variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </Button>
          )}
          <Button onClick={() => navigate("/gerenciar-produtos-orcamento")} variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Gerenciar Produtos
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button onClick={() => navigate("/resumo-orcamentos")} variant="outline" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Resumo
          </Button>
          <Button onClick={() => setMostrarHistorico(true)} variant="outline" className="gap-2">
            <History className="w-4 h-4" />
            Histórico
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== COLUNA ESQUERDA ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Período */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Período do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicial" className="text-sm font-semibold">DATA INICIAL *</Label>
                  <Input id="dataInicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} className="no-print" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFinal" className="text-sm font-semibold">DATA FINAL *</Label>
                  <Input id="dataFinal" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} className="no-print" />
                </div>
              </div>
              {metaModo === "percentual" && faturamentoPeriodo > 0 && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Faturamento no período: <strong className="ml-1">R$ {faturamentoPeriodo.toFixed(2)}</strong>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Dados do Cliente */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente" className="text-sm font-semibold">RAZÃO SOCIAL / NOME *</Label>
                  <Select value={clienteSelecionado} onValueChange={handleSelecionarCliente}>
                    <SelectTrigger id="cliente" className="no-print">
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-sm font-semibold">CNPJ / CPF</Label>
                  <Input id="cnpj" value={clienteCnpj} onChange={(e) => setClienteCnpj(e.target.value)} placeholder="__.___.___/____-__" readOnly={clienteSelecionado !== "novo"} className="no-print" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-sm font-semibold">ENDEREÇO DE FATURAMENTO</Label>
                <Input id="endereco" value={clienteEndereco} onChange={(e) => setClienteEndereco(e.target.value)} placeholder="Rua, número - Cidade, UF" readOnly={clienteSelecionado !== "novo"} className="no-print" />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de distribuição */}
          <Card className="no-print border-2 border-dashed border-primary/30">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="w-4 h-4 text-primary" />
                Configurações de Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">MODO DE DISTRIBUIÇÃO</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={modoDist === "automatico" ? "default" : "outline"}
                      onClick={() => setModoDist("automatico")}
                      className="flex-1 gap-2"
                    >
                      ⚡ Automático
                    </Button>
                    <Button
                      size="sm"
                      variant={modoDist === "proporcao" ? "default" : "outline"}
                      onClick={() => setModoDist("proporcao")}
                      className="flex-1 gap-2"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Por Proporção
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {modoDist === "automatico"
                      ? "Distribui igualmente entre produtos KG livres."
                      : "Distribui conforme a proporção (%) definida em cada produto KG."}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">OPÇÕES AVANÇADAS</Label>
                  <label className="flex items-center gap-2 cursor-pointer select-none p-2 rounded border hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={prioridadePaoDoce}
                      onChange={(e) => setPrioridadePaoDoce(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">
                      🍞 Prioridade Pão de Doce
                      <span className="block text-xs text-muted-foreground">
                        Garante quantidade maior que outros KG
                      </span>
                    </span>
                  </label>
                </div>
              </div>
              {modoDist === "proporcao" && itens.some((i) => i.unidade === "kg" && !i.fixado) && (
                <div className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${
                  Math.abs(somaProporcoesKg - 100) < 0.1
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                }`}>
                  <Percent className="w-3 h-3 flex-shrink-0" />
                  Soma das proporções KG livres: <strong className="ml-1">{somaProporcoesKg.toFixed(1)}%</strong>
                  {Math.abs(somaProporcoesKg - 100) >= 0.1 && (
                    <span className="ml-1">(o sistema normaliza automaticamente para 100%)</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adicionar Produto */}
          <Card className="no-print">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                Adicionar Produto à Nota
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="produto" className="text-sm font-semibold">PRODUTO / SERVIÇO</Label>
                  <Select value={produtoSelecionado} onValueChange={(v) => { setProdutoSelecionado(v); setQuantidadeNaoKg(""); setProporcaoKgInput(""); }}>
                    <SelectTrigger id="produto">
                      <SelectValue placeholder="Selecione um produto do catálogo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosOrcamento
                        .filter((p) => !itens.some((i) => i.produtoId === p.id))
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome_produto} — R$ {p.preco_unitario.toFixed(2)} / {p.unidade}
                            {p.unidade === "kg" ? " 🔵" : " 🟡"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">VALOR UNITÁRIO</Label>
                  <Input
                    value={produtoSelecionadoObj ? `R$ ${produtoSelecionadoObj.preco_unitario.toFixed(2)} / ${produtoSelecionadoObj.unidade}` : ""}
                    readOnly placeholder="—" className="bg-muted text-muted-foreground"
                  />
                </div>
              </div>

              {/* Campo quantidade — não-KG */}
              {produtoSelecionadoObj && produtoSelecionadoObj.unidade !== "kg" && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700 mb-2">
                    ⚠️ Produto <strong>{produtoSelecionadoObj.unidade.toUpperCase()}</strong> — informe a quantidade manualmente.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">QUANTIDADE ({produtoSelecionadoObj.unidade.toUpperCase()}) *</Label>
                      <Input
                        type="number" min="0"
                        step={produtoSelecionadoObj.unidade === "un" ? "1" : "0.001"}
                        value={quantidadeNaoKg}
                        onChange={(e) => setQuantidadeNaoKg(e.target.value)}
                        placeholder="0" autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">VALOR TOTAL ESTIMADO</Label>
                      <Input
                        value={quantidadeNaoKg && parseFloat(quantidadeNaoKg) > 0
                          ? `R$ ${(parseFloat(quantidadeNaoKg) * produtoSelecionadoObj.preco_unitario).toFixed(2)}`
                          : "—"}
                        readOnly className="bg-muted text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campo KG — proporção opcional */}
              {produtoSelecionadoObj && produtoSelecionadoObj.unidade === "kg" && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-700 mb-2">
                    🔵 Produto <strong>KG</strong> — quantidade calculada automaticamente para atingir a meta.
                  </p>
                  {modoDist === "proporcao" && (
                    <div className="mt-2 space-y-1">
                      <Label className="text-xs font-semibold text-blue-800">
                        PROPORÇÃO (%) — opcional
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" min="0" max="100" step="0.1"
                          value={proporcaoKgInput}
                          onChange={(e) => setProporcaoKgInput(e.target.value)}
                          placeholder="Ex: 40"
                          className="w-28 h-8 text-sm"
                        />
                        <span className="text-xs text-blue-700">% do saldo restante</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-4 flex-wrap">
                <Button onClick={adicionarItem} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Produto
                </Button>
                {itens.some((i) => i.unidade === "kg") && (
                  <Button onClick={redistribuirKg} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {modoDist === "proporcao" ? "Redistribuir pela Proporção" : "Redistribuir KG"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Itens */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg flex items-center justify-between flex-wrap gap-2">
                <span>Itens do Orçamento</span>
                <div className="flex gap-3 text-xs font-normal text-muted-foreground no-print">
                  <span>🔵 KG livre</span>
                  <span>🟡 Manual</span>
                  <span><Lock className="w-3 h-3 inline" /> Travado</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {itens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>📊 Nenhum produto adicionado</p>
                  <p className="text-sm mt-2">Defina a meta e adicione produtos para começar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-10 no-print">🔒</TableHead>
                        <TableHead className="text-center w-36">QUANTIDADE</TableHead>
                        <TableHead className="text-center w-16">UNID.</TableHead>
                        <TableHead>PRODUTO</TableHead>
                        <TableHead className="text-right">VL. UNITÁRIO</TableHead>
                        {modoDist === "proporcao" && (
                          <TableHead className="text-center w-24 no-print">PROP. %</TableHead>
                        )}
                        <TableHead className="text-right">TOTAL</TableHead>
                        <TableHead className="text-center no-print w-16">AÇÕES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => {
                        const isKg = item.unidade === "kg";
                        const travado = item.fixado;
                        const rowBg = !isKg ? "bg-amber-50/40 dark:bg-amber-950/10" : travado ? "bg-blue-50/60 dark:bg-blue-950/20" : "";
                        return (
                          <TableRow key={item.id} className={rowBg}>
                            {/* Cadeado */}
                            <TableCell className="text-center no-print">
                              {isKg ? (
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => toggleTravar(item.id)}
                                  className={`h-7 w-7 p-0 ${travado ? "text-blue-600 hover:text-blue-700" : "text-muted-foreground hover:text-foreground"}`}
                                  title={travado ? "Clique para liberar distribuição" : "Clique para travar quantidade"}
                                >
                                  {travado ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </Button>
                              ) : (
                                <Lock className="w-3.5 h-3.5 mx-auto text-amber-400" title="Produto manual — quantidade sempre fixa" />
                              )}
                            </TableCell>

                            {/* Quantidade */}
                            <TableCell className="text-center">
                              <Input
                                key={`${item.id}-${item.quantidade}`}
                                type="number" min="0"
                                step={item.unidade === "un" ? "1" : "0.001"}
                                defaultValue={item.unidade === "un" ? Math.round(item.quantidade) : item.quantidade.toFixed(3)}
                                className="w-24 text-center no-print"
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const final = item.unidade === "un" ? Math.round(val) : val;
                                  if (Math.abs(final - item.quantidade) > 0.0001) {
                                    atualizarQuantidade(item.id, final);
                                  }
                                }}
                              />
                              <span className="print:block hidden text-sm font-semibold">
                                {formatarQuantidade(item.quantidade, item.unidade)}
                              </span>
                            </TableCell>

                            <TableCell className="text-center font-medium">{item.unidade}</TableCell>
                            <TableCell className="font-medium">{item.produtoNome}</TableCell>
                            <TableCell className="text-right text-sm">
                              R$ {item.precoUnitario.toFixed(2)}/{item.unidade}
                            </TableCell>

                            {/* Proporção KG (modo proporção) */}
                            {modoDist === "proporcao" && (
                              <TableCell className="text-center no-print">
                                {isKg ? (
                                  <Input
                                    key={`prop-${item.id}`}
                                    type="number" min="0" max="100" step="0.1"
                                    defaultValue={item.proporcaoKg > 0 ? item.proporcaoKg : ""}
                                    placeholder="—"
                                    className="w-20 text-center h-7 text-xs"
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      if (Math.abs(val - item.proporcaoKg) > 0.01) {
                                        atualizarProporcao(item.id, val);
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            )}

                            <TableCell className="text-right font-semibold text-primary">
                              R$ {item.valorTotal.toFixed(2)}
                            </TableCell>

                            <TableCell className="text-center no-print">
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => removerItem(item.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-primary/10 border-t-2 border-primary">
                        <TableCell colSpan={modoDist === "proporcao" ? 6 : 5} className="text-right font-bold text-lg">
                          TOTAL GERAL:
                        </TableCell>
                        <TableCell className="text-right font-bold text-xl text-primary">
                          R$ {somaValoresItens.toFixed(2)}
                        </TableCell>
                        <TableCell className="no-print" />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== COLUNA DIREITA — META FINANCEIRA ===== */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-xl text-center">META FINANCEIRA DA NOTA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Toggle modo meta */}
              <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setMetaModo("valor")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-sm font-semibold transition-all ${
                    metaModo === "valor" ? "bg-white text-primary shadow" : "text-white/70 hover:text-white"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Valor (R$)
                </button>
                <button
                  onClick={() => setMetaModo("percentual")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-sm font-semibold transition-all ${
                    metaModo === "percentual" ? "bg-white text-primary shadow" : "text-white/70 hover:text-white"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  Percentual (%)
                </button>
              </div>

              {/* Input meta */}
              {metaModo === "valor" ? (
                <div className="text-center">
                  <Label className="text-sm opacity-90 block mb-2">Valor da Meta (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold">R$</span>
                    <InputMonetario
                      id="metaFinanceira"
                      valor={metaFinanceira}
                      onChange={handleMetaChange}
                      className="text-4xl font-bold text-center h-16 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <Label className="text-sm opacity-90 block mb-2">Percentual da Meta (%)</Label>
                    <div className="relative">
                      <Input
                        type="number" min="0" max="200" step="0.1"
                        value={metaPercentual || ""}
                        onChange={(e) => handlePercentualChange(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 80"
                        className="text-4xl font-bold text-center h-16 bg-white/10 border-white/30 text-white placeholder:text-white/50 pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl font-bold opacity-70">%</span>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-80">Faturamento do período:</span>
                      <span className="font-bold">R$ {faturamentoPeriodo.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Percentual informado:</span>
                      <span className="font-bold">{metaPercentual.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-t border-white/20 pt-1">
                      <span className="opacity-80">Meta calculada:</span>
                      <span className="font-bold text-yellow-300">R$ {metaEfetiva.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumo financeiro */}
              <div className="border-t border-white/20 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-90">Meta definida:</span>
                  <span className="font-bold">R$ {metaEfetiva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-90">Valor distribuído:</span>
                  <span className="font-bold">R$ {somaValoresItens.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-90">Diferença:</span>
                  <span className={`font-bold ${diferenca < 0 ? "text-red-300" : metaAtingida ? "text-green-300" : "text-yellow-300"}`}>
                    {diferenca < 0 ? "−" : ""}R$ {Math.abs(diferenca).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/20 pt-2">
                  <span className="opacity-90">% Atingido:</span>
                  <span className={`font-bold text-lg ${percentualAtingido > 100 ? "text-red-300" : metaAtingida ? "text-green-300" : ""}`}>
                    {percentualAtingido.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="border-t border-white/20 pt-3">
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${percentualAtingido > 100 ? "bg-red-400" : metaAtingida ? "bg-green-400" : "bg-blue-300"}`}
                    style={{ width: `${Math.min(percentualAtingido, 100)}%` }}
                  />
                </div>
                {metaAtingida && (
                  <p className="text-xs mt-2 text-green-100 bg-green-600/30 p-2 rounded text-center font-semibold">
                    ✅ Meta atingida com sucesso.
                  </p>
                )}
                {somaValoresItens > metaEfetiva && metaEfetiva > 0 && !metaAtingida && (
                  <p className="text-xs mt-2 text-red-100 bg-red-600/30 p-2 rounded text-center font-semibold">
                    ⚠️ Excedeu a meta em R$ {Math.abs(diferenca).toFixed(2)}.
                  </p>
                )}
                {itens.length > 0 && !metaAtingida && metaEfetiva > 0 && somaValoresItens < metaEfetiva && (
                  <p className="text-xs mt-2 text-yellow-100 bg-yellow-600/20 p-2 rounded text-center">
                    Faltam R$ {diferenca.toFixed(2)} para atingir a meta.
                  </p>
                )}
              </div>

              {/* Legenda */}
              {itens.length > 0 && metaEfetiva > 0 && (
                <div className="border-t border-white/20 pt-3 text-xs space-y-1 opacity-80">
                  <p>🔵 {itens.filter((i) => i.unidade === "kg" && !i.fixado).length} KG em distribuição {modoDist === "proporcao" ? "por proporção" : "automática"}</p>
                  <p><Lock className="w-3 h-3 inline mr-1" />{itens.filter((i) => i.unidade === "kg" && i.fixado).length} KG travado(s)</p>
                  <p>🟡 {itens.filter((i) => i.unidade !== "kg").length} produto(s) com quantidade manual</p>
                  {modoDist === "proporcao" && (
                    <p>∑ {somaProporcoesKg.toFixed(1)}% proporções KG livres</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={salvarOrcamento}
            disabled={!metaAtingida || itens.length === 0}
            className={`w-full mt-4 gap-2 py-6 text-lg font-semibold shadow-lg transition-all ${
              metaAtingida && itens.length > 0
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
            }`}
            size="lg"
          >
            <Save className="w-5 h-5" />
            {orcamentoEmEdicaoId ? "Atualizar Orçamento" : "Salvar Orçamento"}
          </Button>
          {!metaAtingida && itens.length > 0 && metaEfetiva > 0 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              O total deve ser igual à meta financeira para salvar.
            </p>
          )}
        </div>
      </div>

      {/* Orçamentos Salvos */}
      {orcamentosSalvos.length > 0 && (
        <Card className="no-print">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              Orçamentos Salvos ({orcamentosSalvos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orcamentosSalvos.slice().sort((a: any, b: any) => {
                const ta = a.criadoEm ? new Date(a.criadoEm).getTime() : 0;
                const tb = b.criadoEm ? new Date(b.criadoEm).getTime() : 0;
                return tb - ta;
              }).map((orc) => {
                const orcEx = orc as any;
                return (
                  <Card key={orc.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {orc.clienteNome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Período:</span>
                          <span className="font-medium text-xs">
                            {new Date(orc.dataInicial + "T12:00:00").toLocaleDateString("pt-BR")} a {new Date(orc.dataFinal + "T12:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor Total:</span>
                          <span className="font-bold text-primary">R$ {orc.valorTotal.toFixed(2)}</span>
                        </div>
                        {orcEx.metaModo === "percentual" && orcEx.metaPercentual && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Meta:</span>
                            <span className="text-xs font-medium">{orcEx.metaPercentual}% do faturamento</span>
                          </div>
                        )}
                        {orcEx.modoDist && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Distribuição:</span>
                            <span className="text-xs">{orcEx.modoDist === "proporcao" ? "Por proporção" : "Automática"}</span>
                          </div>
                        )}
                        {orc.criadoEm && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Criado em:</span>
                            <span className="text-xs">{new Date(orc.criadoEm).toLocaleDateString("pt-BR")}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Itens:</span>
                          <span className="font-medium">{orc.itens.length}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button onClick={() => reabrirOrcamento(orc)} variant="outline" size="sm" className="flex-1 gap-2">
                          <Package className="w-4 h-4" />
                          Abrir
                        </Button>
                        <Button onClick={() => imprimirOrcamentoSalvo(orc)} variant="default" size="sm" className="flex-1 gap-2">
                          <Printer className="w-4 h-4" />
                          Imprimir
                        </Button>
                        <Button onClick={() => excluirOrcamento(orc.id, orc.clienteNome)} variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      </div>{/* end print:hidden wrapper */}

      {/* Área de Impressão — only content visible during print */}
      <div id="orcamento-print-area" className="hidden print:block">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">NICOLINA - GESTÃO DE ENCOMENDAS</h1>
          <h2 className="text-xl font-semibold mt-2">Orçamento</h2>
          <p className="text-sm mt-1">Gerado em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
        </div>
        <div className="mb-6 p-4 border-2 border-gray-300 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Cliente:</p>
              <p className="font-bold">{clienteNome}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">CNPJ/CPF:</p>
              <p className="font-medium">{clienteCnpj || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-semibold text-gray-600">Endereço:</p>
              <p className="font-medium">{clienteEndereco || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Data Inicial:</p>
              <p className="font-medium">{fmtDate(dataInicial)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Data Final:</p>
              <p className="font-medium">{fmtDate(dataFinal)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Meta:</p>
              <p className="font-medium">
                R$ {metaEfetiva.toFixed(2)}
                {metaModo === "percentual" && ` (${metaPercentual}% do faturamento)`}
              </p>
            </div>
          </div>
        </div>
        {itens.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="border border-gray-400 p-2 text-center">Quantidade</th>
                  <th className="border border-gray-400 p-2 text-center">Unidade</th>
                  <th className="border border-gray-400 p-2 text-left">Produto</th>
                  <th className="border border-gray-400 p-2 text-right">Valor Unitário</th>
                  <th className="border border-gray-400 p-2 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2 text-center font-semibold">{formatarQuantidade(item.quantidade, item.unidade)}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.unidade}</td>
                    <td className="border border-gray-300 p-2">{item.produtoNome}</td>
                    <td className="border border-gray-300 p-2 text-right">R$ {item.precoUnitario.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right font-semibold text-primary">R$ {item.valorTotal.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={4} className="border border-gray-400 p-3 text-right text-lg">TOTAL GERAL:</td>
                  <td className="border border-gray-400 p-3 text-right text-xl text-primary">R$ {somaValoresItens.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}