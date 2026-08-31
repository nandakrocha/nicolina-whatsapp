import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
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
import { Calendar, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  clientesAPI,
  orcamentosAPI,
  type Cliente,
} from "../services/api";

interface OrcamentoHistorico {
  id: string;
  clienteId: string;
  clienteNome: string;
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

export function HistoricoComprasCliente() {
  console.log("🎯 HistoricoComprasCliente: Renderizando...");
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoHistorico[]>([]);
  const [orcamentosFiltrados, setOrcamentosFiltrados] = useState<OrcamentoHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Filtros
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("todos");
  const [mesSelecionado, setMesSelecionado] = useState<string>("");
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
      
      const clientesValidos = Array.isArray(clientesData) ? clientesData : [];
      const orcamentosValidos = Array.isArray(orcamentosData) ? orcamentosData : [];
      
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

          const matchMes = mesSelecionado ? mesOrc === mesSelecionado : true;
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
    setMesSelecionado("");
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
            new Date(orc.dataInicial).toLocaleDateString("pt-BR"),
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

  console.log("🎨 Renderizando interface com", orcamentosFiltrados.length, "orçamentos filtrados");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          📊 Histórico de Compras por Cliente
        </h2>
        <p className="text-muted-foreground">
          Visualize detalhadamente os produtos comprados por cliente, mês a mês
        </p>
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
                  <SelectItem value="">Todos os Meses</SelectItem>
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
              <input
                type="date"
                id="filtroDataInicial"
                value={dataInicialFiltro}
                onChange={(e) => setDataInicialFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroDataFinal">Data Final</Label>
              <input
                type="date"
                id="filtroDataFinal"
                value={dataFinalFiltro}
                onChange={(e) => setDataFinalFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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

            <div className="flex items-end gap-2">
              <Button onClick={limparFiltros} variant="outline" className="flex-1">
                Limpar
              </Button>
              <Button onClick={exportarCSV} variant="default" className="gap-2">
                <Download className="w-4 h-4" />
                CSV
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
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg">
            Detalhamento de Compras ({orcamentosFiltrados.length} orçamentos)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                    <TableHead className="text-right">Valor Unitário</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Nº Orçamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentosFiltrados.map((orcamento) => (
                    <React.Fragment key={orcamento.id}>
                      {Array.isArray(orcamento.itens) && orcamento.itens.map((item, index) => (
                        <TableRow key={`${orcamento.id}-${item.id}`}>
                          {index === 0 && (
                            <TableCell rowSpan={orcamento.itens.length} className="font-medium border-r">
                              {new Date(orcamento.dataInicial).toLocaleDateString("pt-BR")}
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
                            <TableCell rowSpan={orcamento.itens.length} className="border-l">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {orcamento.id.substring(0, 8)}
                              </code>
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