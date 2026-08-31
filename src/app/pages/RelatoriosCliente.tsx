import { useState, useEffect } from "react";
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
import { FileText, Download, Printer, User, Calendar, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  encomendasAPI,
  clientesAPI,
  produtosAPI,
  type Encomenda,
  type Cliente,
  type Produto,
  type ProdutoEncomenda,
} from "../services/api";

export default function RelatoriosCliente() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [mesAno, setMesAno] = useState("");
  const [modoVisualizacao, setModoVisualizacao] = useState<"card" | "lista">("card");

  useEffect(() => {
    carregarDados();
    // Definir mês atual
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    setMesAno(mesAtual);

    const reload = () => carregarDados();
    window.addEventListener('encomenda-atualizada', reload);
    window.addEventListener('clientes-atualizados', reload);
    window.addEventListener('produtos-atualizados', reload);
    return () => {
      window.removeEventListener('encomenda-atualizada', reload);
      window.removeEventListener('clientes-atualizados', reload);
      window.removeEventListener('produtos-atualizados', reload);
    };
  }, []);

  const carregarDados = async () => {
    try {
      const [clientesData, encomendasData, produtosData] = await Promise.all([
        clientesAPI.listar(),
        encomendasAPI.listar(),
        produtosAPI.listar(),
      ]);
      setClientes(clientesData.sort((a, b) => a.nome.localeCompare(b.nome)));
      setEncomendas(encomendasData);
      setProdutos(produtosData.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do servidor");
    }
  };

  // Função auxiliar para obter código do produto
  const obterCodigoProduto = (produtoId: string): string | undefined => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.codigo;
  };

  const cliente = clientes.find((c) => c.id === clienteSelecionado);

  const encomendasCliente = encomendas.filter((e) => {
    if (e.clienteId !== clienteSelecionado) return false;
    if (mesAno) {
      const [ano, mes] = mesAno.split("-");
      const dataEncomenda = new Date(e.data + "T00:00");
      if (dataEncomenda.getFullYear() !== parseInt(ano)) return false;
      if (dataEncomenda.getMonth() + 1 !== parseInt(mes)) return false;
    }
    return true;
  });

  // Agrupar por dia
  const encomendasPorDia: { [key: string]: Encomenda[] } = {};
  encomendasCliente.forEach((e) => {
    if (!encomendasPorDia[e.data]) {
      encomendasPorDia[e.data] = [];
    }
    encomendasPorDia[e.data].push(e);
  });

  const diasOrdenados = Object.keys(encomendasPorDia).sort();

  // Calcular totais
  const totalEncomendas = encomendasCliente.length;
  const totalProdutos = encomendasCliente.reduce(
    (acc, e) => acc + e.produtos.length,
    0
  );
  const totalQuantidade = encomendasCliente.reduce(
    (acc, e) => acc + e.quantidadeTotal,
    0
  );

  const exportarExcel = () => {
    if (!cliente) {
      toast.error("Selecione um cliente");
      return;
    }

    const dadosExcel = [];

    // Adicionar cabeçalho com dados do cliente
    dadosExcel.push({
      Cliente: cliente.nome,
      Telefone: cliente.telefone || "",
      Endereço: cliente.endereco || "",
      CNPJ: cliente.cnpj || "",
      Email: cliente.email || "",
    });
    dadosExcel.push({}); // Linha em branco

    // Adicionar dados das encomendas
    encomendasCliente.forEach((encomenda) => {
      encomenda.produtos.forEach((produto, index) => {
        const codigo = obterCodigoProduto(produto.produtoId);
        dadosExcel.push({
          Data: new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR"),
          Hora: encomenda.hora,
          "Código Produto": codigo || "",
          Produto: produto.produtoNome,
          Quantidade: produto.quantidade,
          Observação: produto.observacao || "",
          "Peso por Qtd (kg)": produto.pesoTotalKg.toFixed(3),
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório Cliente");
    XLSX.writeFile(
      wb,
      `Relatorio_${cliente.nome.replace(/ /g, "_")}_${mesAno}.xlsx`
    );
    toast.success("Relatório exportado com sucesso!");
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            👤 Relatório por Cliente
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as encomendas de um cliente específico
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportarExcel}
            variant="outline"
            className="gap-2"
            disabled={!clienteSelecionado}
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button
            onClick={imprimir}
            variant="outline"
            className="gap-2"
            disabled={!clienteSelecionado}
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Selecionar Cliente e Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <Select
                value={clienteSelecionado}
                onValueChange={setClienteSelecionado}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mesAno">Mês/Ano</Label>
              <Input
                id="mesAno"
                type="month"
                value={mesAno}
                onChange={(e) => setMesAno(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatório */}
      {clienteSelecionado && cliente && (
        <>
          {/* Informações do Cliente */}
          <Card className="no-print">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-semibold">{cliente.nome}</p>
                </div>
                {cliente.telefone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-semibold">{cliente.telefone}</p>
                  </div>
                )}
                {cliente.endereco && (
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-semibold">{cliente.endereco}</p>
                  </div>
                )}
                {cliente.cpf && (
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-semibold">{cliente.cpf}</p>
                  </div>
                )}
                {cliente.cnpj && (
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-semibold">{cliente.cnpj}</p>
                  </div>
                )}
                {cliente.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-semibold">{cliente.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Encomendas por Dia - MOVIDO PARA CIMA */}
          {diasOrdenados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Nenhuma encomenda encontrada para o período selecionado
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Botões de Visualização */}
              <div className="flex items-center justify-between no-print">
                <h2 className="text-xl font-semibold">Encomendas - Detalhamento</h2>
                <div className="flex gap-2">
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
              </div>

              {/* Visualização em Cards */}
              {modoVisualizacao === "card" && (
                <div className="space-y-4 no-print">
                  {diasOrdenados.map((dia) => (
                    <Card key={dia}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          {new Date(dia + "T00:00").toLocaleDateString("pt-BR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {encomendasPorDia[dia].map((encomenda) => (
                            <div
                              key={encomenda.id}
                              className="border rounded-lg p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-primary">
                                  Hora: {encomenda.hora}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {encomenda.quantidadeTotal} unidades
                                </span>
                              </div>
                              <div className="space-y-2">
                                {encomenda.produtos.map((produto, idx) => {
                                  const codigo = obterCodigoProduto(produto.produtoId);
                                  return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        {codigo ? (
                                          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                            {codigo}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800" title="Produto sem código cadastrado">
                                            SEM CÓDIGO
                                          </span>
                                        )}
                                        <p className="font-medium">
                                          {produto.produtoNome}
                                        </p>
                                      </div>
                                      {produto.observacao && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {produto.observacao}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold">
                                        {produto.quantidade} un
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {produto.pesoTotalKg.toFixed(3)} kg
                                      </p>
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Visualização em Lista */}
              {modoVisualizacao === "lista" && (
                <Card className="no-print">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-3 text-sm font-semibold">Data</th>
                            <th className="text-center p-3 text-sm font-semibold">Hora</th>
                            <th className="text-left p-3 text-sm font-semibold">Produto</th>
                            <th className="text-center p-3 text-sm font-semibold">Qtd</th>
                            <th className="text-left p-3 text-sm font-semibold">Observação</th>
                            <th className="text-center p-3 text-sm font-semibold">Peso (kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diasOrdenados.flatMap((dia) =>
                            encomendasPorDia[dia].flatMap((encomenda) =>
                              encomenda.produtos.map((produto, idx) => {
                                const codigo = obterCodigoProduto(produto.produtoId);
                                return (
                                <tr key={`${encomenda.id}-${idx}`} className="border-t hover:bg-muted/30">
                                  <td className="p-3">
                                    {new Date(dia + "T00:00").toLocaleDateString("pt-BR")}
                                  </td>
                                  <td className="p-3 text-center">{encomenda.hora}</td>
                                  <td className="p-3 font-medium">
                                    <div className="flex items-center gap-2">
                                      {codigo ? (
                                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                          {codigo}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800" title="Produto sem código cadastrado">
                                          SEM CÓDIGO
                                        </span>
                                      )}
                                      {produto.produtoNome}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center font-bold">{produto.quantidade}</td>
                                  <td className="p-3 text-muted-foreground">
                                    {produto.observacao || "-"}
                                  </td>
                                  <td className="p-3 text-center font-medium">
                                    {produto.pesoTotalKg.toFixed(3)}
                                  </td>
                                </tr>
                                );
                              })
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Versão para Impressão */}
              <div className="print-only">
                <h2 className="text-2xl font-bold mb-4">👤 Relatório por Cliente</h2>
                <div className="mb-4">
                  <p className="text-sm">
                    <strong>Cliente:</strong> {cliente.nome}
                  </p>
                  {cliente.telefone && (
                    <p className="text-sm">
                      <strong>Telefone:</strong> {cliente.telefone}
                    </p>
                  )}
                  <p className="text-sm font-semibold">
                    Período:{" "}
                    {new Date(mesAno + "-01").toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <table className="w-full border-collapse mt-4">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black">
                      <th className="text-left p-2 border border-black">Data</th>
                      <th className="text-left p-2 border border-black">Hora</th>
                      <th className="text-left p-2 border border-black">Produto</th>
                      <th className="text-center p-2 border border-black">Quantidade</th>
                      <th className="text-left p-2 border border-black">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diasOrdenados.flatMap((dia) =>
                      encomendasPorDia[dia].flatMap((encomenda) =>
                        encomenda.produtos.map((produto, idx) => {
                          const codigo = obterCodigoProduto(produto.produtoId);
                          return (
                          <tr key={`${encomenda.id}-${idx}`} className="border-b border-gray-300">
                            <td className="p-2 border border-black">
                              {new Date(dia + "T00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td className="p-2 border border-black">{encomenda.hora}</td>
                            <td className="p-2 border border-black">
                              {codigo ? `[${codigo}] ${produto.produtoNome}` : produto.produtoNome}
                            </td>
                            <td className="p-2 text-center border border-black">
                              {produto.quantidade}
                            </td>
                            <td className="p-2 border border-black">
                              {produto.observacao || "-"}
                            </td>
                          </tr>
                          );
                        })
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Resumo - MOVIDO PARA BAIXO */}
              {diasOrdenados.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Total de Encomendas
                        </p>
                        <p className="text-3xl font-bold text-primary">
                          {totalEncomendas}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Tipos de Produtos
                        </p>
                        <p className="text-3xl font-bold text-primary">
                          {totalProdutos}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Quantidade Total
                        </p>
                        <p className="text-3xl font-bold text-primary">
                          {totalQuantidade}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!clienteSelecionado && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Selecione um cliente para visualizar o relatório
            </p>
          </CardContent>
        </Card>
      )}

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