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
import { Plus, Trash2, Edit2, Save, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
  produtosOrcamentoAPI,
  type ProdutoOrcamento,
} from "../services/api";
import { InputMonetario } from "../components/InputMonetario";

export default function GerenciarProdutosOrcamento() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<ProdutoOrcamento[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  // Formulário de novo produto
  const [novoProduto, setNovoProduto] = useState({
    nome_produto: "",
    preco_unitario: 0,
    unidade: "kg" as "kg" | "un",
  });

  // Formulário de edição
  const [produtoEditando, setProdutoEditando] = useState<ProdutoOrcamento | null>(null);

  useEffect(() => {
    carregarProdutos();
    const reload = () => carregarProdutos();
    window.addEventListener('produtos-orcamento-atualizados', reload);
    return () => window.removeEventListener('produtos-orcamento-atualizados', reload);
  }, []);

  const carregarProdutos = async () => {
    try {
      const data = await produtosOrcamentoAPI.listar();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    }
  };

  const adicionarProduto = async () => {
    if (!novoProduto.nome_produto.trim()) {
      toast.error("Digite o nome do produto");
      return;
    }

    if (novoProduto.preco_unitario <= 0) {
      toast.error("Digite um preço válido");
      return;
    }

    try {
      await produtosOrcamentoAPI.criar({
        nome_produto: novoProduto.nome_produto,
        preco_unitario: novoProduto.preco_unitario,
        unidade: novoProduto.unidade,
        referencia_abreviada: novoProduto.unidade,
      });

      toast.success("Produto adicionado com sucesso!");
      setNovoProduto({
        nome_produto: "",
        preco_unitario: 0,
        unidade: "kg",
      });
      carregarProdutos();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast.error("Erro ao adicionar produto");
    }
  };

  const iniciarEdicao = (produto: ProdutoOrcamento) => {
    setEditandoId(produto.id);
    setProdutoEditando({ ...produto });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setProdutoEditando(null);
  };

  const salvarEdicao = async () => {
    if (!produtoEditando) return;

    if (!produtoEditando.nome_produto.trim()) {
      toast.error("Digite o nome do produto");
      return;
    }

    if (produtoEditando.preco_unitario <= 0) {
      toast.error("Digite um preço válido");
      return;
    }

    try {
      await produtosOrcamentoAPI.atualizar(produtoEditando.id, {
        nome_produto: produtoEditando.nome_produto,
        preco_unitario: produtoEditando.preco_unitario,
        unidade: produtoEditando.unidade,
        referencia_abreviada: produtoEditando.unidade,
      });

      toast.success("Produto atualizado com sucesso!");
      setEditandoId(null);
      setProdutoEditando(null);
      carregarProdutos();
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast.error("Erro ao atualizar produto");
    }
  };

  const excluirProduto = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir o produto "${nome}"?`)) {
      return;
    }

    try {
      await produtosOrcamentoAPI.excluir(id);
      toast.success("Produto excluído com sucesso!");
      carregarProdutos();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast.error("Erro ao excluir produto");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/administracao")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">🛍️ Gerenciar Produtos de Orçamento</h1>
          <p className="text-muted-foreground">
            Catálogo exclusivo para cálculo de orçamentos proporcionais
          </p>
        </div>
      </div>

      {/* Formulário para Adicionar Produto */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-primary" />
            Adicionar Novo Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="nomeProduto" className="text-sm font-semibold">
                NOME DO PRODUTO
              </Label>
              <Input
                id="nomeProduto"
                value={novoProduto.nome_produto}
                onChange={(e) =>
                  setNovoProduto({ ...novoProduto, nome_produto: e.target.value })
                }
                placeholder="Ex: Pão Francês, Bolo de Chocolate..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco" className="text-sm font-semibold">
                PREÇO UNITÁRIO (R$)
              </Label>
              <InputMonetario
                id="preco"
                valor={novoProduto.preco_unitario}
                onChange={(novoValor) =>
                  setNovoProduto({ ...novoProduto, preco_unitario: novoValor })
                }
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade" className="text-sm font-semibold">
                UNIDADE
              </Label>
              <Select
                value={novoProduto.unidade}
                onValueChange={(value: "kg" | "un") =>
                  setNovoProduto({ ...novoProduto, unidade: value })
                }
              >
                <SelectTrigger id="unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg (Quilograma)</SelectItem>
                  <SelectItem value="un">un (Unidade)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={adicionarProduto} className="mt-4 gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg">
            Produtos Cadastrados ({produtos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {produtos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>📦 Nenhum produto cadastrado</p>
              <p className="text-sm mt-2">
                Adicione produtos ao catálogo de orçamentos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PRODUTO</TableHead>
                    <TableHead className="text-right">PREÇO UNITÁRIO</TableHead>
                    <TableHead className="text-center">UNIDADE</TableHead>
                    <TableHead className="text-center">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      {editandoId === produto.id && produtoEditando ? (
                        <>
                          <TableCell>
                            <Input
                              value={produtoEditando.nome_produto}
                              onChange={(e) =>
                                setProdutoEditando({
                                  ...produtoEditando,
                                  nome_produto: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <InputMonetario
                              valor={produtoEditando.preco_unitario}
                              onChange={(novoValor) =>
                                setProdutoEditando({
                                  ...produtoEditando,
                                  preco_unitario: novoValor,
                                })
                              }
                              className="text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={produtoEditando.unidade}
                              onValueChange={(value: "kg" | "un") =>
                                setProdutoEditando({
                                  ...produtoEditando,
                                  unidade: value,
                                  referencia_abreviada: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="un">un</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={salvarEdicao}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelarEdicao}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">
                            {produto.nome_produto}
                          </TableCell>
                          <TableCell className="text-right text-primary font-semibold">
                            R$ {produto.preco_unitario.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              {produto.unidade}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => iniciarEdicao(produto)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => excluirProduto(produto.id, produto.nome_produto)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
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
