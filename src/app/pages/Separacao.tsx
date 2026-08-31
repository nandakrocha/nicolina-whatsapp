// ✅ VERSÃO 2.60.12 - SEPARAÇÃO COM FILTRO DE CATEGORIAS (LAYOUT OTIMIZADO)
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Printer, FileSpreadsheet, Package, Calendar, Filter, CheckSquare, Square, Check } from "lucide-react";
import { toast } from "sonner";
import { encomendasAPI, produtosAPI, Encomenda, Produto } from "../services/api";
import { exportarParaExcel, imprimirRetrato } from "../utils/exportacao";

interface ItemSeparacao {
  dataProducao: string;
  dataEntrega: string;
  produtoId: string;
  produtoNome: string;
  categoria: string;
  clienteId: string;
  clienteNome: string;
  quantidade: number;
  peso: number;
  observacao: string;
}

export default function SeparacaoPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itensSeparacao, setItensSeparacao] = useState<ItemSeparacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // 💾 PERSISTIR ESTADO AO SAIR E RETORNAR
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const salva = localStorage.getItem('separacao-data-selecionada');
    return salva || new Date().toISOString().split('T')[0];
  });
  
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<string[]>(() => {
    const salva = localStorage.getItem('separacao-categorias-filtradas');
    return salva ? JSON.parse(salva) : [];
  });

  // 💾 SALVAR NO LOCALSTORAGE QUANDO ALTERAR
  useEffect(() => {
    localStorage.setItem('separacao-data-selecionada', dataSelecionada);
  }, [dataSelecionada]);

  useEffect(() => {
    localStorage.setItem('separacao-categorias-filtradas', JSON.stringify(categoriasFiltradas));
  }, [categoriasFiltradas]);

  // 📐 Função para formatar quantidade com ou sem decimal baseado no peso do produto
  const formatarQuantidade = (quantidade: number, produtoId: string): string => {
    const produto = produtos.find(p => p.id === produtoId);
    const temPeso = produto?.pesoPorUnidadeKg && produto.pesoPorUnidadeKg > 0;
    
    console.log(`📐 Formatando quantidade: ${quantidade} | Produto: ${produto?.nome} | Peso: ${produto?.pesoPorUnidadeKg} | Tem peso: ${temPeso}`);
    
    // Se a quantidade for inteira (1, 2, 50, 200), mostra sem decimal
    if (Number.isInteger(quantidade)) {
      return quantidade.toString();
    }
    
    // Se tiver decimal (1.5, 2.5), mostra com 1 casa decimal
    return quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  useEffect(() => {
    carregarDados();
    
    // 🔄 SINCRONIZAÇÃO AUTOMÁTICA COM PRODUÇÃO
    const handleAtualizar = () => {
      console.log("🔄 Sincronizando Separação com Produção...");
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
    // Recalcular quando a data selecionada mudar
    if (encomendas.length > 0 && produtos.length > 0) {
      calcularSeparacao(encomendas, produtos);
    }
  }, [dataSelecionada]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      console.log("🔄 Carregando dados para separação...");

      // Carregar encomendas e produtos
      const [encomendasData, produtosData] = await Promise.all([
        encomendasAPI.listar(),
        produtosAPI.listar(),
      ]);

      setEncomendas(encomendasData);
      setProdutos(produtosData.sort((a, b) => a.nome.localeCompare(b.nome)));

      // Calcular automaticamente
      calcularSeparacao(encomendasData, produtosData);
      
      console.log("✅ Dados carregados com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  };

  const calcularSeparacao = (encomendasData: Encomenda[], produtosData: Produto[]) => {
    /**
     * 🔄 LÓGICA DE SINCRONIZAÇÃO COM PRODUÇÃO:
     * - Produção HOJE = Produtos que serão produzidos HOJE
     * - Separação HOJE = MESMOS produtos da Produção HOJE
     * - Mostra TODOS os produtos (não apenas pães)
     * 
     * Exemplo:
     * - Data Selecionada: 17/03/2026 (HOJE)
     * - Mostra: Produtos que serão PRODUZIDOS em 17/03/2026
     * - Para: Entregas diversas (18/03, 19/03, etc. - depende dos dias de antecedência)
     */
    const dataSelecionadaObj = new Date(dataSelecionada + "T00:00:00");

    console.log(`📅 SEPARAÇÃO SINCRONIZADA COM PRODUÇÃO`);
    console.log(`  🗓️  Data da Separação: ${dataSelecionada}`);
    console.log(`  🔗 Mostrando TODOS os produtos que serão PRODUZIDOS HOJE`);

    // Array para armazenar todos os itens
    const itensArray: ItemSeparacao[] = [];

    encomendasData.forEach((encomenda) => {
      encomenda.produtos.forEach((item) => {
        const produto = produtosData.find((p) => p.id === item.produtoId);
        if (!produto) return;

        const diasAntecedencia = produto.diasAntecedenciaProducao || 1;
        
        // Calcular data de produção
        const dataEntregaEnc = new Date(encomenda.data + "T00:00:00");
        const dataProducaoEnc = new Date(dataEntregaEnc);
        dataProducaoEnc.setDate(dataProducaoEnc.getDate() - diasAntecedencia);
        const dataProducaoStr = dataProducaoEnc.toISOString().split('T')[0];
        
        // Se a data de produção for HOJE (data selecionada), incluir
        if (dataProducaoStr === dataSelecionada) {
          itensArray.push({
            dataProducao: dataProducaoStr,
            dataEntrega: encomenda.data,
            produtoId: produto.id || "",
            produtoNome: produto.nome,
            categoria: produto.categoria || "Sem categoria",
            clienteId: encomenda.clienteId,
            clienteNome: encomenda.clienteNome,
            quantidade: item.quantidade,
            peso: (produto.pesoPorUnidadeKg || 0) * item.quantidade,
            observacao: item.observacao || "",
          });
        }
      });
    });

    // Agrupar por produto e somar quantidades
    const itensAgrupados = new Map<string, ItemSeparacao>();
    
    itensArray.forEach((item) => {
      const chave = `${item.produtoId}-${item.clienteId}-${item.dataEntrega}`;
      const existente = itensAgrupados.get(chave);
      
      if (existente) {
        existente.quantidade += item.quantidade;
        existente.peso += item.peso;
      } else {
        itensAgrupados.set(chave, { ...item });
      }
    });

    // Converter para array e ordenar
    const itensFinal = Array.from(itensAgrupados.values()).sort((a, b) => {
      // Ordenar por categoria, depois por produto
      const categoriaCompare = a.categoria.localeCompare(b.categoria);
      if (categoriaCompare !== 0) return categoriaCompare;
      
      const produtoCompare = a.produtoNome.localeCompare(b.produtoNome);
      if (produtoCompare !== 0) return produtoCompare;
      
      return a.clienteNome.localeCompare(b.clienteNome);
    });

    setItensSeparacao(itensFinal);
    console.log(`📦 Itens para separação: ${itensFinal.length}`);
  };

  const exportarExcel = () => {
    if (itensSeparacao.length === 0) {
      toast.error("Nenhum item para exportar");
      return;
    }

    exportarParaExcel({
      nomeArquivo: "Separacao",
      nomePlanilha: "Separação",
      dados: itensSeparacao.map((item) => ({
        "Data de Separação": new Date(item.dataProducao + "T00:00").toLocaleDateString("pt-BR"),
        "Cliente": item.clienteNome,
        "Produto": item.produtoNome,
        "Categoria": item.categoria,
        "Quantidade": item.quantidade,
        "Peso (kg)": item.peso.toFixed(3),
        "Data de Entrega": new Date(item.dataEntrega + "T00:00").toLocaleDateString("pt-BR"),
        "Observação": item.observacao,
      })),
      colunas: [
        { header: "Data de Separação", key: "dataSeparacao", width: 18 },
        { header: "Cliente", key: "cliente", width: 30 },
        { header: "Produto", key: "produto", width: 30 },
        { header: "Categoria", key: "categoria", width: 20 },
        { header: "Quantidade", key: "quantidade", width: 12 },
        { header: "Peso (kg)", key: "peso", width: 12 },
        { header: "Data de Entrega", key: "dataEntrega", width: 18 },
        { header: "Observação", key: "observacao", width: 30 },
      ],
    });
  };

  const imprimir = () => {
    if (itensFiltrados.length === 0) {
      toast.error("Não há dados para imprimir");
      return;
    }
    
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const formatarDataCurta = (dataISO: string): string => {
    const data = new Date(dataISO + "T00:00");
    return data.toLocaleDateString("pt-BR");
  };

  // Agrupar por categoria
  const agruparPorCategoria = () => {
    const grupos = new Map<string, ItemSeparacao[]>();
    
    itensSeparacao.forEach((item) => {
      const existente = grupos.get(item.categoria);
      if (existente) {
        existente.push(item);
      } else {
        grupos.set(item.categoria, [item]);
      }
    });

    return Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const gruposPorCategoria = agruparPorCategoria();

  const calcularTotais = () => {
    return {
      quantidadeTotal: itensSeparacao.reduce((sum, item) => sum + item.quantidade, 0),
      pesoTotal: itensSeparacao.reduce((sum, item) => sum + item.peso, 0),
      clientesUnicos: new Set(itensSeparacao.map(item => item.clienteId)).size,
      produtosUnicos: new Set(itensSeparacao.map(item => item.produtoId)).size,
    };
  };

  const totais = calcularTotais();

  // Obter todas as categorias disponíveis
  const categoriasDisponiveis = Array.from(new Set(itensSeparacao.map(item => item.categoria))).sort();

  // Itens filtrados baseado nas categorias selecionadas
  const itensFiltrados = categoriasFiltradas.length === 0
    ? itensSeparacao
    : itensSeparacao.filter(item => categoriasFiltradas.includes(item.categoria));

  // Grupos filtrados
  const gruposFiltrados = gruposPorCategoria.filter(([categoria]) => 
    categoriasFiltradas.length === 0 || categoriasFiltradas.includes(categoria)
  );

  // Totais filtrados
  const totaisFiltrados = {
    quantidadeTotal: itensFiltrados.reduce((sum, item) => sum + item.quantidade, 0),
    pesoTotal: itensFiltrados.reduce((sum, item) => sum + item.peso, 0),
    clientesUnicos: new Set(itensFiltrados.map(item => item.clienteId)).size,
    produtosUnicos: new Set(itensFiltrados.map(item => item.produtoId)).size,
  };

  // Funções do filtro de categorias
  const toggleCategoria = (categoria: string) => {
    setCategoriasFiltradas(prev => {
      if (prev.includes(categoria)) {
        return prev.filter(c => c !== categoria);
      } else {
        return [...prev, categoria];
      }
    });
  };

  const selecionarTodasCategorias = () => {
    setCategoriasFiltradas(categoriasDisponiveis);
  };

  const limparSelecao = () => {
    setCategoriasFiltradas([]);
  };

  const todasSelecionadas = categoriasFiltradas.length === categoriasDisponiveis.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📦 Separação de Produtos
          </h1>
          <p className="text-muted-foreground">
            Produtos para separar no dia selecionado (sincronizado com Produção)
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Label htmlFor="data-separacao" className="text-sm font-medium">
            Data da Separação:
          </Label>
          <Input
            id="data-separacao"
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="flex gap-2 no-print">
        <Button onClick={exportarExcel} variant="outline" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Excel
        </Button>
        <Button onClick={imprimir} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimir Retrato
        </Button>
      </div>

      {/* Filtro de Categorias */}
      {!carregando && itensSeparacao.length > 0 && (
        <Card className="no-print">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <CardTitle>Filtrar por Categoria</CardTitle>
              </div>
              <div className="flex gap-2">
                {categoriasFiltradas.length < categoriasDisponiveis.length ? (
                  <Button
                    onClick={selecionarTodasCategorias}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Selecionar Todas
                  </Button>
                ) : (
                  <Button
                    onClick={limparSelecao}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Limpar Seleção
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {categoriasDisponiveis.map((categoria) => {
                const isSelected = categoriasFiltradas.includes(categoria);
                return (
                  <label
                    key={categoria}
                    className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCategoriasFiltradas([...categoriasFiltradas, categoria]);
                        } else {
                          setCategoriasFiltradas(categoriasFiltradas.filter(c => c !== categoria));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                    />
                    <span className="text-sm font-medium select-none leading-tight flex-1">
                      {categoria}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </label>
                );
              })}
            </div>
            {categoriasFiltradas.length > 0 && (
              <div className="mt-3 p-2 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  📋 {categoriasFiltradas.length} {categoriasFiltradas.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}: {categoriasFiltradas.join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabela para impressão */}
      <div className="print-only">
        <h2 className="text-2xl font-bold mb-4">📦 Separação de Produtos</h2>
        <p className="text-sm mb-4 font-semibold">
          Data da Separação: {formatarDataCurta(dataSelecionada)}
        </p>
        {categoriasFiltradas.length > 0 && (
          <p className="text-sm mb-2 font-medium">
            Categorias: {categoriasFiltradas.join(', ')}
          </p>
        )}

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="text-left p-2 border border-black">Categoria</th>
              <th className="text-left p-2 border border-black">Produto</th>
              <th className="text-left p-2 border border-black">Cliente</th>
              <th className="text-center p-2 border border-black">Quantidade</th>
              <th className="text-left p-2 border border-black">Observação</th>
              <th className="text-center p-2 border border-black">Peso (kg)</th>
              <th className="text-left p-2 border border-black">Entrega</th>
            </tr>
          </thead>
          <tbody>
            {itensFiltrados.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="p-2 border border-black">{item.categoria}</td>
                <td className="p-2 border border-black">{item.produtoNome}</td>
                <td className="p-2 border border-black">{item.clienteNome}</td>
                <td className="p-2 text-center border border-black">{formatarQuantidade(item.quantidade, item.produtoId)}</td>
                <td className="p-2 border border-black text-sm">{item.observacao || "-"}</td>
                <td className="p-2 text-center border border-black">{item.peso.toFixed(3)}</td>
                <td className="p-2 border border-black">{formatarDataCurta(item.dataEntrega)}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-200">
              <td colSpan={3} className="p-2 border border-black text-right">TOTAL:</td>
              <td className="p-2 text-center border border-black">{formatarQuantidade(totais.quantidadeTotal, '')}</td>
              <td className="p-2 border border-black"></td>
              <td className="p-2 text-center border border-black">{totais.pesoTotal.toFixed(3)}</td>
              <td className="p-2 border border-black"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {carregando ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando dados de separação...</p>
          </CardContent>
        </Card>
      ) : itensSeparacao.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold text-muted-foreground">
              Nenhum produto para separar nesta data
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              📅 Data selecionada: {formatarDataCurta(dataSelecionada)}
            </p>
            <p className="text-sm text-muted-foreground">
              💡 Procurando produtos com produção em: {formatarDataCurta(dataSelecionada)}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabelas por Categoria */}
          {gruposFiltrados.map(([categoria, items]) => {
            const totalQtd = items.reduce((sum, item) => sum + item.quantidade, 0);
            const totalPeso = items.reduce((sum, item) => sum + item.peso, 0);

            return (
              <Card key={categoria} className="no-print">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-normal">Categoria</p>
                        <p className="text-2xl font-bold text-primary">{categoria}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-primary">{totalQtd} un</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto touch-pan-x -mx-4 sm:mx-0">
                    <div className="border rounded-lg overflow-hidden min-w-full">
                      <table className="w-full min-w-[700px] table-fixed">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-semibold text-sm w-[25%]">Produto</th>
                            <th className="text-left p-3 font-semibold text-sm w-[20%]">Cliente</th>
                            <th className="text-center p-3 font-semibold text-sm w-[12%]">Quantidade</th>
                            <th className="text-left p-3 font-semibold text-sm w-[18%] hidden lg:table-cell">Observação</th>
                            <th className="text-center p-3 font-semibold text-sm w-[12%]">Peso (kg)</th>
                            <th className="text-center p-3 font-semibold text-sm w-[13%]">Entrega</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index} className="border-t hover:bg-muted/50 transition-colors">
                              <td className="p-3 font-medium text-sm truncate">{item.produtoNome}</td>
                              <td className="p-3 text-sm text-muted-foreground truncate">{item.clienteNome}</td>
                              <td className="p-3 text-center">
                                <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm">
                                  {formatarQuantidade(item.quantidade, item.produtoId)}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground truncate hidden lg:table-cell" title={item.observacao || "-"}>{item.observacao || "-"}</td>
                              <td className="p-3 text-center text-sm font-medium">{item.peso.toFixed(3)}</td>
                              <td className="p-3 text-center">
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                  {formatarDataCurta(item.dataEntrega)}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-primary/20 bg-primary/5 font-semibold">
                            <td className="p-3 text-sm" colSpan={2}>Total {categoria}</td>
                            <td className="p-3 text-center text-primary text-sm">{totalQtd} un</td>
                            <td className="p-3 hidden lg:table-cell"></td>
                            <td className="p-3 text-center text-primary text-sm">{totalPeso.toFixed(3)} kg</td>
                            <td className="p-3"></td>
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

      {/* Estilos de impressão */}
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
            margin-top: 12px !important;
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