import React, { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ArrowLeft, TrendingUp, TrendingDown, Users, DollarSign, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import { orcamentosAPI, clientesAPI, type Orcamento } from "../services/api";
import { toast } from "sonner";

interface EstatisticaCliente {
  clienteId: string;
  clienteNome: string;
  quantidadeOrcamentos: number;
  valorTotalComprado: number;
  mediaPorOrcamento: number;
  ultimaCompra: string;
}

interface ComparacaoMensal {
  mesAtual: {
    total: number;
    quantidade: number;
    ticketMedio: number;
    clientes: number;
  };
  mesAnterior: {
    total: number;
    quantidade: number;
  };
  crescimento: {
    percentual: number;
    valorAbsoluto: number;
    tipo: "aumento" | "diminuicao";
  };
}

export default function ResumoOrcamentos() {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticaCliente[]>([]);
  const [comparacao, setComparacao] = useState<ComparacaoMensal | null>(null);
  
  // Filtros
  const [mesSelecionado, setMesSelecionado] = useState<string>(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [clienteFiltro, setClienteFiltro] = useState<string>("todos");
  const [dataInicialFiltro, setDataInicialFiltro] = useState<string>("");
  const [dataFinalFiltro, setDataFinalFiltro] = useState<string>("");
  
  // Lista de clientes únicos
  const [clientesUnicos, setClientesUnicos] = useState<{id: string, nome: string}[]>([]);

  useEffect(() => {
    carregarDados();

    // Re-sync whenever another computer creates/updates/deletes an orçamento
    const handleAtualizado = () => carregarDados();
    window.addEventListener("orcamento-atualizado", handleAtualizado);
    return () => window.removeEventListener("orcamento-atualizado", handleAtualizado);
  }, []);

  useEffect(() => {
    calcularEstatisticas();
  }, [orcamentos, mesSelecionado, clienteFiltro, dataInicialFiltro, dataFinalFiltro]);

  const carregarDados = async () => {
    try {
      const orcamentosData = await orcamentosAPI.listar();
      setOrcamentos(orcamentosData);
      
      // Extrair clientes únicos
      const clientesMap = new Map();
      orcamentosData.forEach(orc => {
        if (!clientesMap.has(orc.clienteId)) {
          clientesMap.set(orc.clienteId, {
            id: orc.clienteId,
            nome: orc.clienteNome
          });
        }
      });
      setClientesUnicos(Array.from(clientesMap.values()));
      
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  const calcularEstatisticas = () => {
    let orcamentosFiltrados = [...orcamentos];
    
    // Filtrar por cliente
    if (clienteFiltro !== "todos") {
      orcamentosFiltrados = orcamentosFiltrados.filter(
        orc => orc.clienteId === clienteFiltro
      );
    }
    
    // Filtrar por período personalizado
    if (dataInicialFiltro && dataFinalFiltro) {
      orcamentosFiltrados = orcamentosFiltrados.filter(orc => {
        const dataOrc = orc.dataInicial;
        return dataOrc >= dataInicialFiltro && dataOrc <= dataFinalFiltro;
      });
    } else {
      // Filtrar por mês/ano
      const [ano, mes] = mesSelecionado.split('-');
      orcamentosFiltrados = orcamentosFiltrados.filter(orc => {
        const dataOrc = new Date(orc.dataInicial + 'T00:00:00');
        return dataOrc.getFullYear() === parseInt(ano) && 
               (dataOrc.getMonth() + 1) === parseInt(mes);
      });
    }
    
    // Calcular estatísticas por cliente
    const estatisticasMap = new Map<string, EstatisticaCliente>();
    
    orcamentosFiltrados.forEach(orc => {
      const clienteId = orc.clienteId;
      
      if (!estatisticasMap.has(clienteId)) {
        estatisticasMap.set(clienteId, {
          clienteId,
          clienteNome: orc.clienteNome,
          quantidadeOrcamentos: 0,
          valorTotalComprado: 0,
          mediaPorOrcamento: 0,
          ultimaCompra: orc.dataInicial,
        });
      }
      
      const estatistica = estatisticasMap.get(clienteId)!;
      estatistica.quantidadeOrcamentos++;
      estatistica.valorTotalComprado += orc.valorTotal;
      
      // Atualizar última compra
      if (orc.dataInicial > estatistica.ultimaCompra) {
        estatistica.ultimaCompra = orc.dataInicial;
      }
    });
    
    // Calcular médias
    estatisticasMap.forEach(est => {
      est.mediaPorOrcamento = est.valorTotalComprado / est.quantidadeOrcamentos;
    });
    
    const estatisticasArray = Array.from(estatisticasMap.values());
    setEstatisticas(estatisticasArray);
    
    // Calcular comparação mensal
    calcularComparacaoMensal(orcamentosFiltrados);
  };

  const calcularComparacaoMensal = (orcamentosDoMes: Orcamento[]) => {
    // Mês atual
    const totalMesAtual = orcamentosDoMes.reduce((sum, orc) => sum + orc.valorTotal, 0);
    const quantidadeMesAtual = orcamentosDoMes.length;
    const clientesUnicosMesAtual = new Set(orcamentosDoMes.map(orc => orc.clienteId)).size;
    const ticketMedio = quantidadeMesAtual > 0 ? totalMesAtual / quantidadeMesAtual : 0;
    
    // Mês anterior
    const [ano, mes] = mesSelecionado.split('-');
    const dataAtual = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    const mesAnterior = new Date(dataAtual);
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    
    const anoAnterior = mesAnterior.getFullYear();
    const mesAnteriorNum = mesAnterior.getMonth() + 1;
    
    const orcamentosMesAnterior = orcamentos.filter(orc => {
      const dataOrc = new Date(orc.dataInicial + 'T00:00:00');
      return dataOrc.getFullYear() === anoAnterior && 
             (dataOrc.getMonth() + 1) === mesAnteriorNum;
    });
    
    const totalMesAnterior = orcamentosMesAnterior.reduce((sum, orc) => sum + orc.valorTotal, 0);
    const quantidadeMesAnterior = orcamentosMesAnterior.length;
    
    // Calcular crescimento
    const diferencaValor = totalMesAtual - totalMesAnterior;
    const percentualCrescimento = totalMesAnterior > 0 
      ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100 
      : 0;
    
    setComparacao({
      mesAtual: {
        total: totalMesAtual,
        quantidade: quantidadeMesAtual,
        ticketMedio,
        clientes: clientesUnicosMesAtual,
      },
      mesAnterior: {
        total: totalMesAnterior,
        quantidade: quantidadeMesAnterior,
      },
      crescimento: {
        percentual: Math.abs(percentualCrescimento),
        valorAbsoluto: Math.abs(diferencaValor),
        tipo: diferencaValor >= 0 ? "aumento" : "diminuicao",
      },
    });
  };

  const limparFiltros = () => {
    const hoje = new Date();
    setMesSelecionado(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
    setClienteFiltro("todos");
    setDataInicialFiltro("");
    setDataFinalFiltro("");
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Voltar para administração (onde foi aberto)
                // Mantém a sessão ativa sem pedir nova autenticação
                navigate("/administracao");
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">📊 Resumo de Orçamentos</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Análise de vendas e desempenho por cliente
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mês/Ano</Label>
              <Input
                id="mes"
                type="month"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
                <SelectTrigger id="cliente">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {clientesUnicos.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataInicial">Data Inicial</Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicialFiltro}
                onChange={(e) => setDataInicialFiltro(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataFinal">Data Final</Label>
              <Input
                id="dataFinal"
                type="date"
                value={dataFinalFiltro}
                onChange={(e) => setDataFinalFiltro(e.target.value)}
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={limparFiltros}
            className="mt-4"
          >
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      {comparacao && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Vendido */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vendido
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {comparacao.mesAtual.total.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-xs mt-2">
                {comparacao.crescimento.tipo === "aumento" ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      +{comparacao.crescimento.percentual.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600 font-semibold">
                      -{comparacao.crescimento.percentual.toFixed(1)}%
                    </span>
                  </>
                )}
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          {/* Quantidade de Orçamentos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Orçamentos Emitidos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {comparacao.mesAtual.quantidade}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {comparacao.mesAnterior.quantidade} no mês anterior
              </p>
            </CardContent>
          </Card>

          {/* Clientes Atendidos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes Atendidos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {comparacao.mesAtual.clientes}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                clientes únicos no período
              </p>
            </CardContent>
          </Card>

          {/* Ticket Médio */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ticket Médio
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {comparacao.mesAtual.ticketMedio.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                por orçamento
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Card de Comparação */}
      {comparacao && (
        <Card className={`border-l-4 ${comparacao.crescimento.tipo === "aumento" ? "border-l-green-600 bg-green-50" : "border-l-red-600 bg-red-50"}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {comparacao.crescimento.tipo === "aumento" ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className="text-lg font-semibold">
                  {comparacao.crescimento.tipo === "aumento" ? "Vendas aumentaram" : "Vendas diminuíram"} {comparacao.crescimento.percentual.toFixed(1)}% em relação ao mês anterior
                </p>
                <p className="text-sm text-muted-foreground">
                  Diferença de R$ {comparacao.crescimento.valorAbsoluto.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {estatisticas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>📊 Nenhum orçamento encontrado para o período selecionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Qtd. Orçamentos</TableHead>
                    <TableHead className="text-right">Total Comprado</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead className="text-center">Última Compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estatisticas
                    .sort((a, b) => b.valorTotalComprado - a.valorTotalComprado)
                    .map((est) => (
                      <TableRow key={est.clienteId}>
                        <TableCell className="font-medium">
                          {est.clienteNome}
                        </TableCell>
                        <TableCell className="text-center">
                          {est.quantidadeOrcamentos}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          R$ {est.valorTotalComprado.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {est.mediaPorOrcamento.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {new Date(est.ultimaCompra + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}