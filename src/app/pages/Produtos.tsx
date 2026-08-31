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
import { Search, Plus, Edit2, Trash2, Package, Download, Printer, AlertCircle, LayoutGrid, List, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { produtosAPI, type Produto } from "../services/api";
import { normalizeText, containsText } from "../../lib/normalizeText";
import { exportarParaExcel, imprimirPagina } from "../utils/exportacao";
import { InputMonetario } from "../components/InputMonetario";

// ✅ VERSÃO 2.85.0 - BUSCA SEM ACENTOS EM TODAS AS PÁGINAS
const categoriasPredefinidas = [
  "Pão de Sal",
  "Pão de Doce",
  "Mini Sal",
  "Mini Doce",
  "Confeitaria",
  "Padaria",
  "Mercearia",
  "Bebidas",
  "À produzir",
];

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtro, setFiltro] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [produtoAtual, setProdutoAtual] = useState<Partial<Produto>>({});
  const [pesoGramas, setPesoGramas] = useState<string>("");
  const [carregando, setCarregando] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState<"card" | "lista">("card");
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<string | null>(null);
  const [ordenacaoAlfabetica, setOrdenacaoAlfabetica] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    carregarProdutos();
    
    // 🔥 LISTENER PARA ATUALIZAÇÃO INSTANTÂNEA
    const handleAtualizar = () => {
      carregarProdutos();
    };
    window.addEventListener('encomenda-atualizada', handleAtualizar);
    window.addEventListener('produtos-atualizados', handleAtualizar);
    
    return () => {
      window.removeEventListener('encomenda-atualizada', handleAtualizar);
      window.removeEventListener('produtos-atualizados', handleAtualizar);
    };
  }, []);

  useEffect(() => {
    if (produtoAtual.pesoPorUnidadeKg) {
      setPesoGramas((produtoAtual.pesoPorUnidadeKg * 1000).toFixed(0));
    } else {
      setPesoGramas("");
    }
  }, [produtoAtual.pesoPorUnidadeKg]);

  const carregarProdutos = async () => {
    try {
      setCarregando(true);
      const dados = await produtosAPI.listar();
      setProdutos(dados.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos do servidor");
    } finally {
      setCarregando(false);
    }
  };

  const salvarProduto = async () => {
    if (!produtoAtual.nome?.trim()) {
      toast.error("Preencha o nome do produto");
      return;
    }

    const pesoKg = pesoGramas ? parseFloat(pesoGramas) / 1000 : 0;

    // Limpar valores NaN antes de salvar
    const produtoData: any = {
      ...produtoAtual,
      pesoPorUnidadeKg: pesoKg,
    };

    // Remove preco se for NaN ou undefined
    if (produtoData.preco === undefined || isNaN(produtoData.preco)) {
      delete produtoData.preco;
    }

    try {
      if (produtoAtual.id) {
        await produtosAPI.atualizar(produtoAtual.id, produtoData);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await produtosAPI.criar(produtoData);
        toast.success("Produto cadastrado com sucesso!");
      }
      setModoEdicao(false);
      setProdutoAtual({});
      setPesoGramas("");
      await carregarProdutos();
      
      // 🔥 DISPARAR EVENTO PARA SINCRONIZAR OUTRAS PÁGINAS
      window.dispatchEvent(new CustomEvent('produtos-atualizados'));
      console.log("🔄 Evento 'produtos-atualizados' disparado - sincronizando Produção e Separação");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto");
    }
  };

  const editarProduto = (produto: Produto) => {
    setProdutoAtual(produto);
    setModoEdicao(true);

    // Scroll suave para o topo - rola o container principal, não a janela
    requestAnimationFrame(() => {
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        mainContainer.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  };

  const excluirProduto = async (id: string) => {
    try {
      await produtosAPI.excluir(id);
      toast.success("Produto excluído com sucesso!");
      setProdutoParaExcluir(null);
      await carregarProdutos();
      
      // 🔥 DISPARAR EVENTO PARA SINCRONIZAR OUTRAS PÁGINAS
      window.dispatchEvent(new CustomEvent('produtos-atualizados'));
      console.log("🔄 Evento 'produtos-atualizados' disparado - sincronizando Produção e Separação");
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast.error("Erro ao excluir produto");
    }
  };

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setProdutoAtual({});
    setPesoGramas("");
  };

  const produtosFiltrados = produtos
    .filter(
      (p) => {
        // Se não há filtro, mostra todos
        if (!filtro || filtro.trim() === "") return true;
        
        // Busca no nome, categoria e descrição
        return (
          containsText(p.nome, filtro) ||
          containsText(p.categoria, filtro) ||
          containsText(p.descricao, filtro)
        );
      }
    )
    .sort((a, b) => {
      if (ordenacaoAlfabetica === "asc") {
        return a.nome.localeCompare(b.nome, "pt-BR");
      } else if (ordenacaoAlfabetica === "desc") {
        return b.nome.localeCompare(a.nome, "pt-BR");
      }
      return 0;
    });

  const exportarExcel = () => {
    exportarParaExcel({
      nomeArquivo: "Produtos",
      nomePlanilha: "Produtos",
      dados: produtosFiltrados.map((p) => ({
        Código: p.codigo || "",
        Nome: p.nome,
        Categoria: p.categoria || "",
        Descrição: p.descricao || "",
        "Peso por Unidade (kg)": (p.pesoPorUnidadeKg || 0).toFixed(3),
        "Peso por Unidade (g)": ((p.pesoPorUnidadeKg || 0) * 1000).toFixed(0),
        Preço: p.preco ? `R$ ${p.preco.toFixed(2)}` : "",
        Responsável: p.responsavelProducao || "",
        "Dias Antecedência": p.diasAntecedenciaProducao || 1,
      })),
      colunas: [
        { header: "Código", key: "codigo", width: 10 },
        { header: "Nome", key: "nome", width: 30 },
        { header: "Categoria", key: "categoria", width: 20 },
        { header: "Descrição", key: "descricao", width: 30 },
        { header: "Peso (kg)", key: "pesoKg", width: 12 },
        { header: "Peso (g)", key: "pesoG", width: 12 },
        { header: "Preço", key: "preco", width: 12 },
        { header: "Responsável", key: "responsavel", width: 15 },
        { header: "Dias Antecedência", key: "dias", width: 15 },
      ],
    });
  };

  const imprimir = () => {
    imprimirPagina();
  };

  // Função para atualizar produtos sem responsável
  const migrarProdutosExistentes = async () => {
    try {
      let atualizados = 0;
      const promises = produtos.map(async (produto) => {
        // Se o produto não tem o campo responsavelProducao, adicionar como vazio
        if (produto.responsavelProducao === undefined) {
          await produtosAPI.atualizar(produto.id, {
            ...produto,
            responsavelProducao: ""
          });
          atualizados++;
        }
      });
      
      await Promise.all(promises);
      
      if (atualizados > 0) {
        toast.success(`${atualizados} produto(s) atualizado(s) com sucesso!`);
        carregarProdutos();
      } else {
        toast.info("Todos os produtos já estão atualizados!");
      }
    } catch (error) {
      console.error("Erro ao migrar produtos:", error);
      toast.error("Erro ao atualizar produtos");
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🍞 Produtos
          </h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de produtos da padaria
          </p>
        </div>
        <Button
          onClick={() => setModoEdicao(true)}
          className="gap-2"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </Button>
      </div>

      {/* Alerta para produtos sem categoria */}
      {produtos.filter((p) => !p.categoria).length > 0 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950 no-print">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Produtos sem categoria detectados
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  {produtos.filter((p) => !p.categoria).length} produto(s) não têm categoria definida. 
                  Isso impede que sejam contabilizados corretamente no Dashboard.
                </p>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  📋 Produtos sem categoria: {produtos.filter((p) => !p.categoria).map((p) => p.nome).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário */}
      {modoEdicao && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle>
              {produtoAtual.id ? "Editar Produto" : "Novo Produto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={produtoAtual.nome || ""}
                  onChange={(e) =>
                    setProdutoAtual({ ...produtoAtual, nome: e.target.value })
                  }
                  placeholder="Ex: Pão Francês"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="codigo">Código do Produto</Label>
                <Input
                  id="codigo"
                  value={produtoAtual.codigo || ""}
                  onChange={(e) =>
                    setProdutoAtual({ ...produtoAtual, codigo: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex: P001, B001"
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Opcional - Aparecerá nas encomendas e relatórios
                </p>
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={produtoAtual.categoria}
                  onValueChange={(valor) =>
                    setProdutoAtual({ ...produtoAtual, categoria: valor })
                  }
                >
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasPredefinidas.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="diasAntecedencia">
                  Dias de Antecedência (Produção)
                </Label>
                <Select
                  value={String(produtoAtual.diasAntecedenciaProducao ?? 1)}
                  onValueChange={(valor) =>
                    setProdutoAtual({ 
                      ...produtoAtual, 
                      diasAntecedenciaProducao: parseInt(valor) 
                    })
                  }
                >
                  <SelectTrigger id="diasAntecedencia">
                    <SelectValue placeholder="Produzir 1 dia antes" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="0">🎯 Produzir no dia</SelectItem>
                    <SelectItem value="1">Produzir 1 dia antes da entrega</SelectItem>
                    <SelectItem value="2">Produzir 2 dias antes da entrega</SelectItem>
                    <SelectItem value="3">Produzir 3 dias antes da entrega</SelectItem>
                    <SelectItem value="7">Produzir 1 semana antes da entrega</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsavelProducao">
                  👨‍🍳 Responsável pela Produção
                </Label>
                <Select
                  value={produtoAtual.responsavelProducao}
                  onValueChange={(valor) =>
                    setProdutoAtual({ 
                      ...produtoAtual, 
                      responsavelProducao: valor as "Padeiro" | "Confeiteiro"
                    })
                  }
                >
                  <SelectTrigger id="responsavelProducao">
                    <SelectValue placeholder="Não especificado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Padeiro">👨‍🍳 Padeiro</SelectItem>
                    <SelectItem value="Confeiteiro">🧁 Confeiteiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pesoGramas">Peso por Unidade (gramas)</Label>
                <Input
                  id="pesoGramas"
                  type="number"
                  value={pesoGramas}
                  onChange={(e) => setPesoGramas(e.target.value)}
                  placeholder="Ex: 50"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="preco">Preço (R$)</Label>
                <InputMonetario
                  id="preco"
                  valor={produtoAtual.preco || 0}
                  onChange={(novoValor) => {
                    setProdutoAtual({
                      ...produtoAtual,
                      preco: novoValor > 0 ? novoValor : undefined,
                    });
                  }}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={produtoAtual.descricao || ""}
                  onChange={(e) =>
                    setProdutoAtual({ ...produtoAtual, descricao: e.target.value })
                  }
                  placeholder="Descrição opcional do produto"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={cancelarEdicao}>
                Cancelar
              </Button>
              <Button onClick={salvarProduto}>
                {produtoAtual.id ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de Filtros */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex items-center justify-between no-print">
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
          
          {/* Botão de ordenação alfabética */}
          <Button
            variant={ordenacaoAlfabetica ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (ordenacaoAlfabetica === null) {
                setOrdenacaoAlfabetica("asc");
                toast.success("Ordenado A → Z");
              } else if (ordenacaoAlfabetica === "asc") {
                setOrdenacaoAlfabetica("desc");
                toast.success("Ordenado Z → A");
              } else {
                setOrdenacaoAlfabetica(null);
                toast.success("Ordenação padrão");
              }
            }}
            className="gap-2"
          >
            {ordenacaoAlfabetica === "asc" ? (
              <ArrowUpAZ className="w-4 h-4" />
            ) : ordenacaoAlfabetica === "desc" ? (
              <ArrowDownAZ className="w-4 h-4" />
            ) : (
              <ArrowUpAZ className="w-4 h-4 opacity-50" />
            )}
            {ordenacaoAlfabetica === "asc" 
              ? "A → Z" 
              : ordenacaoAlfabetica === "desc" 
              ? "Z → A" 
              : "Ordenar"}
          </Button>

          <Button
            onClick={migrarProdutosExistentes}
            variant="outline"
            size="sm"
            className="gap-2 border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Package className="w-4 h-4" />
            Atualizar Produtos
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

      {/* Lista de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </CardContent>
        </Card>
      ) : modoVisualizacao === "card" ? (
        // Visualização em Cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtosFiltrados.map((produto) => (
            <Card 
              key={produto.id} 
              className={`hover:shadow-lg transition-shadow ${!produto.categoria ? 'border-amber-500 border-2' : ''}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {produto.codigo && (
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded min-w-[60px] inline-block text-center">
                          {produto.codigo}
                        </span>
                      )}
                      <h3 className="font-bold text-lg text-primary">
                        {produto.nome}
                      </h3>
                      {!produto.categoria && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded">
                          Sem categoria
                        </span>
                      )}
                    </div>
                    {produto.categoria && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {produto.categoria}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 no-print">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editarProduto(produto)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProdutoParaExcluir(produto.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {produto.descricao && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {produto.descricao}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {produto.responsavelProducao && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsável:</span>
                      <span className="font-medium">
                        {produto.responsavelProducao === "Padeiro" ? "👨‍🍳 Padeiro" : "🧁 Confeiteiro"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso:</span>
                    <span className="font-medium">
                      {((produto.pesoPorUnidadeKg || 0) * 1000).toFixed(0)}g ({(produto.pesoPorUnidadeKg || 0).toFixed(3)}kg)
                    </span>
                  </div>
                  {produto.preco && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="font-medium text-primary">
                        R$ {produto.preco.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Visualização em Lista (Tabela)
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Nome</th>
                    <th className="text-left p-3 text-sm font-semibold">Categoria</th>
                    <th className="text-left p-3 text-sm font-semibold">Descrição</th>
                    <th className="text-center p-3 text-sm font-semibold">Peso (g)</th>
                    <th className="text-center p-3 text-sm font-semibold">Peso (kg)</th>
                    <th className="text-center p-3 text-sm font-semibold">Preço</th>
                    <th className="text-center p-3 text-sm font-semibold no-print">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((produto) => (
                    <tr
                      key={produto.id}
                      className={`border-t hover:bg-muted/30 ${!produto.categoria ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
                    >
                      <td className="p-3 font-bold text-primary">
                        <div className="flex items-center gap-2">
                          {produto.codigo && (
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded min-w-[60px] inline-block text-center">
                              {produto.codigo}
                            </span>
                          )}
                          {produto.nome}
                          {!produto.categoria && (
                            <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded">
                              Sem categoria
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {produto.categoria || <span className="text-amber-600 font-medium">⚠️ Não definida</span>}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {produto.descricao || "-"}
                      </td>
                      <td className="p-3 text-center font-medium">
                        {((produto.pesoPorUnidadeKg || 0) * 1000).toFixed(0)}g
                      </td>
                      <td className="p-3 text-center">
                        {(produto.pesoPorUnidadeKg || 0).toFixed(3)}kg
                      </td>
                      <td className="p-3 text-center font-medium text-primary">
                        {produto.preco ? `R$ ${produto.preco.toFixed(2)}` : "-"}
                      </td>
                      <td className="p-3 text-center no-print">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editarProduto(produto)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProdutoParaExcluir(produto.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Versão para Impressão */}
      <div className="print-only">
        <h2 className="text-2xl font-bold mb-4">📦 Lista de Produtos</h2>
        <p className="text-sm mb-4 font-semibold">
          Total de Produtos: {produtosFiltrados.length}
        </p>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="text-left p-2 border border-gray-300">Produto</th>
              <th className="text-left p-2 border border-gray-300">Categoria</th>
              <th className="text-center p-2 border border-gray-300">Peso (g)</th>
              <th className="text-center p-2 border border-gray-300">Peso (kg)</th>
              <th className="text-center p-2 border border-gray-300">Preço</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((produto) => (
              <tr key={produto.id} className="border-b border-gray-300">
                <td className="p-2 border border-gray-300">{produto.nome}</td>
                <td className="p-2 border border-gray-300">{produto.categoria || "Não definida"}</td>
                <td className="text-center p-2 border border-gray-300">
                  {((produto.pesoPorUnidadeKg || 0) * 1000).toFixed(0)}g
                </td>
                <td className="text-center p-2 border border-gray-300">
                  {(produto.pesoPorUnidadeKg || 0).toFixed(3)}kg
                </td>
                <td className="text-center p-2 border border-gray-300">
                  {produto.preco ? `R$ ${produto.preco.toFixed(2)}` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alert Dialog para confirmação de exclusão */}
      <AlertDialog open={!!produtoParaExcluir} onOpenChange={() => setProdutoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente excluir este produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => produtoParaExcluir && excluirProduto(produtoParaExcluir)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}