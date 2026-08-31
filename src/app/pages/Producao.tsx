// ✅ VERSÃO 2.85.0 - BUSCA SEM ACENTOS EM TODAS AS PÁGINAS
import React, { useState, useEffect } from "react";
import { produtosAPI, encomendasAPI, type Produto, type Encomenda } from "../services/api";
import { startsWithText } from "../../lib/normalizeText";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Download, Printer, Factory, Filter, X, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { exportarParaExcel } from "../utils/exportacao";

interface ItemProducao {
  dataProducao: string;
  dataEntrega: string;
  produtoId: string;
  produtoNome: string;
  categoria: string;
  responsavel: string;
  quantidade: number;
  peso: number;
  numeroPedidos: number;
}

export default function Producao() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itensProducao, setItensProducao] = useState<ItemProducao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const hoje = new Date();
  const seteDiasDepois = new Date(hoje);
  seteDiasDepois.setDate(seteDiasDepois.getDate() + 7);
  
  const [dataInicial, setDataInicial] = useState(hoje.toISOString().split("T")[0]);
  const [dataFinal, setDataFinal] = useState(seteDiasDepois.toISOString().split("T")[0]);
  const [filtroProduto, setFiltroProduto] = useState<string[]>([]);
  const [filtroResponsavel, setFiltroResponsavel] = useState<"" | "Padeiro" | "Confeiteiro">("");
  const [produtosAberto, setProdutosAberto] = useState(false); // ✅ Começa fechado
  const [buscaProduto, setBuscaProduto] = useState(""); // 🔍 Campo de busca de produtos
  const [responsavelAberto, setResponsavelAberto] = useState(false); // 🧑‍🍳 Controle do collapsible de responsável

  // 📐 Função para formatar quantidade com ou sem decimal
  const formatarQuantidade = (quantidade: number): string => {
    // Se a quantidade for inteira (1, 2, 50, 200), mostra sem decimal
    if (Number.isInteger(quantidade)) {
      return quantidade.toString();
    }
    
    // Se tiver decimal (1.5, 2.5), mostra com 1 casa decimal
    return quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  useEffect(() => {
    carregarDados();
    
    const handleAtualizar = () => {
      carregarDados();
    };
    window.addEventListener('encomendas-atualizadas', handleAtualizar);
    window.addEventListener('produtos-atualizados', handleAtualizar);
    window.addEventListener('encomenda-atualizada', handleAtualizar);
    window.addEventListener('clientes-atualizados', handleAtualizar);

    return () => {
      window.removeEventListener('encomendas-atualizadas', handleAtualizar);
      window.removeEventListener('produtos-atualizados', handleAtualizar);
      window.removeEventListener('encomenda-atualizada', handleAtualizar);
      window.removeEventListener('clientes-atualizados', handleAtualizar);
    };
  }, []);

  useEffect(() => {
    calcularProducao();
  }, [encomendas, produtos]);

  const carregarDados = async () => {
    try {
      const [encomendasData, produtosData] = await Promise.all([
        encomendasAPI.listar(),
        produtosAPI.listar(),
      ]);
      setEncomendas(encomendasData);
      setProdutos(produtosData.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
    }
  };

  const calcularDataProducao = (dataEntrega: string, diasAntecedencia: number = 1): string => {
    const dataEntregaObj = new Date(dataEntrega + "T00:00:00");
    const dataProducaoObj = new Date(dataEntregaObj);
    dataProducaoObj.setDate(dataProducaoObj.getDate() - diasAntecedencia);
    return dataProducaoObj.toISOString().split("T")[0];
  };

  const calcularProducao = () => {
    const itens: ItemProducao[] = [];

    encomendas.forEach((encomenda) => {
      const items = (encomenda as any).itens || encomenda.produtos || [];
      
      items.forEach((item: any) => {
        const produto = produtos.find((p) => p.id === item.produtoId);
        
        if (!produto) return;

        const diasAntecedencia = produto.diasAntecedenciaProducao || 1;
        const dataProducao = calcularDataProducao(encomenda.data, diasAntecedencia);
        const categoria = produto.categoria || "Sem Categoria";
        const pesoTotalItem = item.pesoTotal || item.pesoTotalKg || 0;

        itens.push({
          dataProducao,
          dataEntrega: encomenda.data,
          produtoId: item.produtoId,
          produtoNome: item.produtoNome,
          categoria,
          responsavel: produto.responsavelProducao || "",
          quantidade: item.quantidade,
          peso: pesoTotalItem,
          numeroPedidos: 1,
        });
      });
    });

    const itensAgrupados = new Map<string, ItemProducao>();

    itens.forEach((item) => {
      const chave = `${item.dataProducao}|${item.dataEntrega}|${item.produtoId}`;
      const existente = itensAgrupados.get(chave);

      if (existente) {
        existente.quantidade += item.quantidade;
        existente.peso += item.peso;
        existente.numeroPedidos += 1;
      } else {
        itensAgrupados.set(chave, { ...item });
      }
    });

    const itensArray = Array.from(itensAgrupados.values()).sort((a, b) => {
      const dataCompare = a.dataProducao.localeCompare(b.dataProducao);
      if (dataCompare !== 0) return dataCompare;
      
      const categoriaCompare = a.categoria.localeCompare(b.categoria);
      if (categoriaCompare !== 0) return categoriaCompare;
      
      return a.produtoNome.localeCompare(b.produtoNome);
    });

    setItensProducao(itensArray);
  };

  const exportarExcel = () => {
    if (itensProducao.length === 0) {
      toast.error("Nenhum item para exportar");
      return;
    }

    exportarParaExcel({
      nomeArquivo: "Producao",
      nomePlanilha: "Produção",
      dados: itensProducao.map((item) => ({
        "Data de Produção": new Date(item.dataProducao + "T00:00").toLocaleDateString("pt-BR"),
        "Produto": item.produtoNome,
        "Categoria": item.categoria,
        "Responsável": item.responsavel || "-",
        "Quantidade": item.quantidade,
        "Peso (kg)": item.peso.toFixed(3),
        "Nº Pedidos": item.numeroPedidos,
        "Data de Entrega": new Date(item.dataEntrega + "T00:00").toLocaleDateString("pt-BR"),
        "Observação": "",
      })),
      colunas: [
        { header: "Data de Produção", key: "dataProducao", width: 15 },
        { header: "Produto", key: "produto", width: 30 },
        { header: "Categoria", key: "categoria", width: 20 },
        { header: "Responsável", key: "responsavel", width: 15 },
        { header: "Quantidade", key: "quantidade", width: 12 },
        { header: "Peso (kg)", key: "peso", width: 12 },
        { header: "Nº Pedidos", key: "numeroPedidos", width: 12 },
        { header: "Data de Entrega", key: "dataEntrega", width: 15 },
        { header: "Observação", key: "observacao", width: 30 },
      ],
    });
  };

  const imprimirPaisagem = () => {
    if (itensFiltrados.length === 0) {
      toast.error("Não há dados para imprimir");
      return;
    }
    
    // Criar estilo com orientação paisagem
    const styleElement = document.createElement('style');
    styleElement.id = 'print-orientation-paisagem';
    styleElement.textContent = `
      @media print {
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
      }
    `;
    
    // Adicionar ao head (remover se já existir)
    const existente = document.getElementById('print-orientation-paisagem');
    if (existente) existente.remove();
    document.head.appendChild(styleElement);
    
    // Executar impressão após pequeno delay
    setTimeout(() => {
      window.print();
      // Remover estilo após impressão
      setTimeout(() => {
        const el = document.getElementById('print-orientation-paisagem');
        if (el) el.remove();
      }, 1000);
    }, 100);
  };

  const imprimirRetrato = () => {
    if (itensFiltrados.length === 0) {
      toast.error("Não há dados para imprimir");
      return;
    }
    
    // Criar estilo com orientação retrato
    const styleElement = document.createElement('style');
    styleElement.id = 'print-orientation-retrato';
    styleElement.textContent = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
      }
    `;
    
    // Adicionar ao head (remover se já existir)
    const existente = document.getElementById('print-orientation-retrato');
    if (existente) existente.remove();
    document.head.appendChild(styleElement);
    
    // Executar impressão após pequeno delay
    setTimeout(() => {
      window.print();
      // Remover estilo após impressão
      setTimeout(() => {
        const el = document.getElementById('print-orientation-retrato');
        if (el) el.remove();
      }, 1000);
    }, 100);
  };

  const formatarDataCurta = (dataISO: string): string => {
    const data = new Date(dataISO + "T00:00");
    return data.toLocaleDateString("pt-BR");
  };

  const itensFiltrados = itensProducao.filter(item => {
    if (item.dataProducao < dataInicial || item.dataProducao > dataFinal) {
      return false;
    }

    if (filtroResponsavel && item.responsavel !== filtroResponsavel) {
      return false;
    }

    if (filtroProduto.length > 0 && !filtroProduto.includes(item.produtoId)) {
      return false;
    }

    return true;
  });

  const produtosNoPeriodo = Array.from(
    new Map(
      itensProducao
        .filter(item => item.dataProducao >= dataInicial && item.dataProducao <= dataFinal)
        .map(item => {
          const produtoCompleto = produtos.find(p => p.id === item.produtoId);
          return [
            item.produtoId, 
            { 
              id: item.produtoId, 
              nome: item.produtoNome, 
              categoria: item.categoria,
              responsavelProducao: produtoCompleto?.responsavelProducao || ""
            }
          ];
        })
    ).values()
  ).sort((a, b) => a.nome.localeCompare(b.nome));

  const agruparPorData = () => {
    const grupos = new Map<string, ItemProducao[]>();
    
    itensFiltrados.forEach((item) => {
      const existente = grupos.get(item.dataProducao);
      if (existente) {
        existente.push(item);
      } else {
        grupos.set(item.dataProducao, [item]);
      }
    });

    return Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const calcularTotais = () => {
    return {
      quantidadeTotal: itensFiltrados.reduce((sum, item) => sum + item.quantidade, 0),
      pesoTotal: itensFiltrados.reduce((sum, item) => sum + item.peso, 0),
      pedidosTotal: itensFiltrados.reduce((sum, item) => sum + item.numeroPedidos, 0),
      datasProducao: new Set(itensFiltrados.map(item => item.dataProducao)).size,
    };
  };

  const gruposPorData = agruparPorData();
  const totais = calcularTotais();

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            🏭 Planejamento de Produção
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Organize a produção por intervalo de datas
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={exportarExcel} variant="outline" className="gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button onClick={imprimirPaisagem} variant="outline" className="gap-2 text-sm">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Paisagem</span>
            <span className="sm:hidden">Paisagem</span>
          </Button>
          <Button onClick={imprimirRetrato} variant="outline" className="gap-2 text-sm">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Retrato</span>
            <span className="sm:hidden">Retrato</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-2 no-print">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Filter className="w-6 h-6 text-primary" />
            Filtros de Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <div className="space-y-2">
              <Label htmlFor="dataInicial" className="text-sm font-semibold flex items-center gap-2">
                📅 Data Inicial de Produção
              </Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="font-semibold max-w-[160px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFinal" className="text-sm font-semibold flex items-center gap-2">
                📅 Data Final de Produção
              </Label>
              <Input
                id="dataFinal"
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="font-semibold max-w-[160px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2 mb-4 md:mb-0">
              <Collapsible open={responsavelAberto} onOpenChange={setResponsavelAberto}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    🧑‍🍳 Responsável
                  </Label>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-9 p-0 hover:bg-muted"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          responsavelAberto ? "rotate-180" : ""
                        }`}
                      />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="border rounded-md bg-background p-3 mt-2">
                    <div className="flex flex-col gap-1">
                      <label
                        className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors border-b border-border/50"
                      >
                        <input
                          type="checkbox"
                          checked={filtroResponsavel === "Padeiro"}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFiltroResponsavel("Padeiro");
                            } else {
                              setFiltroResponsavel("");
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="flex-1 text-sm">🍞 Padeiro</span>
                        {filtroResponsavel === "Padeiro" && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </label>

                      <label
                        className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filtroResponsavel === "Confeiteiro"}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFiltroResponsavel("Confeiteiro");
                            } else {
                              setFiltroResponsavel("");
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="flex-1 text-sm">🧁 Confeiteiro</span>
                        {filtroResponsavel === "Confeiteiro" && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </label>
                    </div>
                  </div>

                  {filtroResponsavel && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold"
                      >
                        {filtroResponsavel === "Padeiro" ? "🍞 Padeiro" : "🧁 Confeiteiro"}
                        <button
                          onClick={() => setFiltroResponsavel("")}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="space-y-2 md:col-span-3 mt-4 md:mt-0">
              <Collapsible open={produtosAberto} onOpenChange={setProdutosAberto}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    🍞 Produtos (Seleção Múltipla)
                  </Label>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-9 p-0 hover:bg-muted"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          produtosAberto ? "rotate-180" : ""
                        }`}
                      />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  {/* 🔍 Campo de busca de produtos */}
                  <div className="mt-2 mb-2">
                    <Input
                      type="text"
                      placeholder="🔍 Buscar produto... (digite até 3 letras)"
                      value={buscaProduto}
                      onChange={(e) => setBuscaProduto(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="border rounded-md bg-background p-3 max-h-64 overflow-y-auto">
                    {produtosNoPeriodo.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Nenhum produto disponível
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {produtosNoPeriodo
                          .filter(prod => {
                            if (!buscaProduto) return true;
                            // Filtra por até 3 primeiras letras (ou mais se digitou mais)
                            return startsWithText(prod.nome, buscaProduto);
                          })
                          .map(prod => (
                          <label
                            key={prod.id}
                            className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors border-b border-border/50 last:border-0"
                          >
                            <input
                              type="checkbox"
                              checked={filtroProduto.includes(prod.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFiltroProduto([...filtroProduto, prod.id]);
                                } else {
                                  setFiltroProduto(filtroProduto.filter(id => id !== prod.id));
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="flex-1 text-sm">{prod.nome}</span>
                            {filtroProduto.includes(prod.id) && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </label>
                        ))}
                        {produtosNoPeriodo.filter(prod => {
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
                  
                  {filtroProduto.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filtroProduto.map(prodId => {
                        const prod = produtosNoPeriodo.find(p => p.id === prodId);
                        if (!prod) return null;
                        return (
                          <span
                            key={prodId}
                            className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold"
                          >
                            {prod.nome}
                            <button
                              onClick={() => setFiltroProduto(filtroProduto.filter(id => id !== prodId))}
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
                        onClick={() => setFiltroProduto([])}
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
          </div>

          {(filtroResponsavel || filtroProduto.length > 0) && (
            <div className="flex justify-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setFiltroResponsavel("");
                  setFiltroProduto([]);
                  toast.success("Filtros limpos!");
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpar todos os filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="print-only">
        <h2 className="text-2xl font-bold mb-4">🏭 Planejamento de Produção</h2>
        <p className="text-sm mb-4 font-semibold">
          Período: {formatarDataCurta(dataInicial)} até {formatarDataCurta(dataFinal)}
        </p>
        {filtroResponsavel && (
          <p className="text-sm mb-2">
            <strong>Responsável:</strong> {filtroResponsavel}
          </p>
        )}
        {filtroProduto.length > 0 && (
          <p className="text-sm mb-4">
            <strong>Produtos Filtrados:</strong> {filtroProduto.map(id => produtosNoPeriodo.find(p => p.id === id)?.nome).filter(Boolean).join(', ')}
          </p>
        )}

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="text-left p-2 border border-black">Data Produão</th>
              <th className="text-left p-2 border border-black">Produto</th>
              <th className="text-left p-2 border border-black">Categoria</th>
              <th className="text-center p-2 border border-black">Quantidade</th>
              <th className="text-center p-2 border border-black">Peso (kg)</th>
              <th className="text-center p-2 border border-black">Pedidos</th>
              <th className="text-left p-2 border border-black">Data Entrega</th>
            </tr>
          </thead>
          <tbody>
            {itensFiltrados.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="p-2 border border-black">{formatarDataCurta(item.dataProducao)}</td>
                <td className="p-2 border border-black">{item.produtoNome}</td>
                <td className="p-2 border border-black">{item.categoria}</td>
                <td className="p-2 text-center border border-black">{item.quantidade}</td>
                <td className="p-2 text-center border border-black">{item.peso.toFixed(3)}</td>
                <td className="p-2 text-center border border-black">{item.numeroPedidos}</td>
                <td className="p-2 border border-black">{formatarDataCurta(item.dataEntrega)}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-200">
              <td colSpan={3} className="p-2 text-right border border-black">Total:</td>
              <td className="p-2 text-center border border-black">{totais.quantidadeTotal} un</td>
              <td className="p-2 text-center border border-black">{totais.pesoTotal.toFixed(3)} kg</td>
              <td className="p-2 text-center border border-black">{totais.pedidosTotal}</td>
              <td className="p-2 border border-black"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {itensFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Factory className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Nenhum item para produzir neste período
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione outro intervalo de datas ou cadastre encomendas
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {gruposPorData.map(([dataProducao, items]) => {
            const totalQtd = items.reduce((sum, item) => sum + item.quantidade, 0);
            const totalPeso = items.reduce((sum, item) => sum + item.peso, 0);
            const totalPedidos = items.reduce((sum, item) => sum + item.numeroPedidos, 0);

            return (
              <Card key={dataProducao} className="no-print">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Factory className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-normal">Produção</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatarDataCurta(dataProducao)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total do Dia</p>
                      <p className="text-2xl font-bold text-primary">{totalQtd} un</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto touch-pan-x">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full min-w-[700px]">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-semibold whitespace-nowrap">Categoria</th>
                            <th className="text-left p-3 font-semibold whitespace-nowrap">Produto</th>
                            <th className="text-center p-3 font-semibold whitespace-nowrap">Quantidade</th>
                            <th className="text-center p-3 font-semibold whitespace-nowrap">Peso (kg)</th>
                            <th className="text-center p-3 font-semibold whitespace-nowrap">Pedidos</th>
                            <th className="text-center p-3 font-semibold whitespace-nowrap">Entrega</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index} className="border-t hover:bg-muted/50">
                              <td className="p-3 text-sm text-muted-foreground">
                                {item.categoria}
                              </td>
                              <td className="p-3 font-medium">{item.produtoNome}</td>
                              <td className="p-3 text-center text-lg font-semibold">
                                {formatarQuantidade(item.quantidade)}
                              </td>
                              <td className="p-3 text-center font-semibold text-primary">
                                {item.peso.toFixed(3)}
                              </td>
                              <td className="p-3 text-center font-medium">
                                {item.numeroPedidos}
                              </td>
                              <td className="p-3 text-center text-sm">
                                {formatarDataCurta(item.dataEntrega)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t bg-muted/50 font-bold">
                            <td colSpan={2} className="p-3 text-right">
                              Total do Dia:
                            </td>
                            <td className="p-3 text-center text-lg">
                              {totalQtd} un
                            </td>
                            <td className="p-3 text-center text-lg text-primary">
                              {totalPeso.toFixed(3)} kg
                            </td>
                            <td className="p-3 text-center text-lg">
                              {totalPedidos}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}

      {itensProducao.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Dias de Produção</p>
                <p className="text-3xl font-bold text-primary">
                  {totais.datasProducao}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Quantidade Total</p>
                <p className="text-3xl font-bold text-primary">
                  {totais.quantidadeTotal} un
                </p>
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
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Nº de Pedidos</p>
                <p className="text-3xl font-bold text-primary">
                  {totais.pedidosTotal}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          
          /* Container principal */
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
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
    </div>
  );
}