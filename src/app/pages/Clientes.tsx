import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Users, Download, Printer, LayoutGrid, List, User } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { clientesAPI, type Cliente } from "../services/api";
import { containsText } from "../../lib/normalizeText";
import { exportarParaExcel, imprimirPagina } from "../utils/exportacao";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [clienteAtual, setClienteAtual] = useState<Partial<Cliente>>({});
  const [carregando, setCarregando] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState<"card" | "lista">("card");
  const [clienteParaExcluir, setClienteParaExcluir] = useState<string | null>(null);

  useEffect(() => {
    carregarClientes();
    
    // 🔥 LISTENER PARA ATUALIZAÇÃO INSTANTÂNEA
    const handleAtualizar = () => {
      console.log("%c🔄 [CLIENTES] Sincronização detectada! Recarregando lista...", "background: #084d6e; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
      carregarClientes();
    };
    window.addEventListener('encomenda-atualizada', handleAtualizar);
    window.addEventListener('clientes-atualizados', handleAtualizar);
    
    console.log("%c🎧 [CLIENTES] Listeners de sincronização registrados!", "background: #00cc00; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
    
    return () => {
      console.log("%c❌ [CLIENTES] Removendo listeners de sincronização", "background: #ff6600; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
      window.removeEventListener('encomenda-atualizada', handleAtualizar);
      window.removeEventListener('clientes-atualizados', handleAtualizar);
    };
  }, []);

  const carregarClientes = async () => {
    try {
      setCarregando(true);
      const dados = await clientesAPI.listar();
      console.log("🔍 [CLIENTES] Dados carregados:", dados);
      console.log("🔍 [CLIENTES] Total de clientes:", dados.length);
      console.log("🔍 [CLIENTES] Primeiros 5 clientes:", dados.slice(0, 5));
      
      // Garantir que dados é um array válido
      if (!Array.isArray(dados)) {
        console.error("❌ [CLIENTES] Dados não são um array:", typeof dados);
        setClientes([]);
        return;
      }
      
      // Ordenar e definir os clientes
      const clientesOrdenados = dados.sort((a, b) => a.nome.localeCompare(b.nome));
      console.log("🔍 [CLIENTES] Clientes ordenados:", clientesOrdenados.length);
      setClientes(clientesOrdenados);
      
      // Log após setState
      setTimeout(() => {
        console.log("🔍 [CLIENTES] Estado atualizado. Total no estado:", clientes.length);
      }, 100);
      
    } catch (error) {
      console.error("❌ Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes do servidor");
    } finally {
      setCarregando(false);
    }
  };

  const salvarCliente = async () => {
    if (!clienteAtual.nome?.trim()) {
      toast.error("Preencha o nome do cliente");
      return;
    }

    try {
      if (clienteAtual.id) {
        await clientesAPI.atualizar(clienteAtual.id, clienteAtual);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await clientesAPI.criar(clienteAtual);
        toast.success("Cliente cadastrado com sucesso!");
      }
      setModoEdicao(false);
      setClienteAtual({});
      carregarClientes();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente");
    }
  };

  const editarCliente = (cliente: Cliente) => {
    setClienteAtual(cliente);
    setModoEdicao(true);
    
    // Scroll suave para o topo - rola o container principal, não a janela
    requestAnimationFrame(() => {
      // Identifica o container principal que tem overflow-auto
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        mainContainer.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
      } else {
        // Fallback para window.scrollTo se não encontrar o container
        window.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
      }
    });
  };

  const excluirCliente = async (id: string) => {
    try {
      await clientesAPI.excluir(id);
      toast.success("Cliente excluído com sucesso!");
      setClienteParaExcluir(null);
      carregarClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente");
    }
  };

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setClienteAtual({});
  };

  const clientesFiltrados = clientes.filter((c) => {
    // Se não houver filtro, mostra todos
    if (!filtro || filtro.trim() === "") {
      return true;
    }
    
    // Busca em múltiplos campos
    return (
      containsText(c.nome, filtro) ||
      containsText(c.endereco, filtro) ||
      containsText(c.cnpj, filtro) ||
      containsText(c.codigo, filtro) ||
      containsText(c.nomeContato, filtro) ||
      containsText(c.telefone, filtro) ||
      containsText(c.email, filtro)
    );
  });
  
  // Log de depuração para entender o problema
  console.log("🔍 [CLIENTES] Estado atual:", {
    totalClientes: clientes.length,
    filtroAtivo: filtro,
    filtroVazio: !filtro || filtro.trim() === "",
    clientesFiltrados: clientesFiltrados.length,
    primeirosClientes: clientes.slice(0, 3).map(c => ({ id: c.id, nome: c.nome })),
    primeirosClientesFiltrados: clientesFiltrados.slice(0, 3).map(c => ({ id: c.id, nome: c.nome })),
  });

  const exportarExcel = () => {
    exportarParaExcel({
      nomeArquivo: "Clientes",
      nomePlanilha: "Clientes",
      dados: clientesFiltrados.map((c) => ({
        Nome: c.nome,
        Código: c.codigo || "",
        Contato: c.nomeContato || "",
        Endereço: c.endereco || "",
        "CNPJ/CPF": c.cnpj || "",
      })),
      colunas: [
        { header: "Nome", key: "nome", width: 30 },
        { header: "Código", key: "codigo", width: 15 },
        { header: "Contato", key: "contato", width: 25 },
        { header: "Endereço", key: "endereco", width: 35 },
        { header: "CNPJ/CPF", key: "cnpj", width: 20 },
      ],
    });
  };

  const imprimir = () => {
    imprimirPagina();
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando clientes...</p>
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
            👥 Clientes
            <span className="text-lg font-normal text-muted-foreground">
              ({clientes.length} total)
            </span>
          </h1>
          <p className="text-muted-foreground">
            Gerencie a base de clientes da padaria
          </p>
        </div>
        <Button
          onClick={() => setModoEdicao(true)}
          className="gap-2"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </Button>
      </div>

      {/* Formulário */}
      {modoEdicao && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle>
              {clienteAtual.id ? "Editar Cliente" : "Novo Cliente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="flex items-center gap-2">
                  🏢 Nome do Cliente *
                </Label>
                <Input
                  id="nome"
                  value={clienteAtual.nome || ""}
                  onChange={(e) =>
                    setClienteAtual({ ...clienteAtual, nome: e.target.value })
                  }
                  placeholder="Ex: Padaria Silva"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nomeContato" className="flex items-center gap-2">
                  👤 Nome do Contato
                </Label>
                <Input
                  id="nomeContato"
                  value={clienteAtual.nomeContato || ""}
                  onChange={(e) =>
                    setClienteAtual({ ...clienteAtual, nomeContato: e.target.value })
                  }
                  placeholder="Ex: João Silva"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="codigo">Código (Opcional)</Label>
                <Input
                  id="codigo"
                  value={clienteAtual.codigo || ""}
                  onChange={(e) =>
                    setClienteAtual({ ...clienteAtual, codigo: e.target.value })
                  }
                  placeholder="Ex: CLI-001"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={clienteAtual.endereco || ""}
                  onChange={(e) =>
                    setClienteAtual({ ...clienteAtual, endereco: e.target.value })
                  }
                  placeholder="Ex: Rua das Flores, 123"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ/CPF</Label>
                <Input
                  id="cnpj"
                  value={clienteAtual.cnpj || ""}
                  onChange={(e) =>
                    setClienteAtual({ ...clienteAtual, cnpj: e.target.value })
                  }
                  placeholder="Ex: 12.345.678/0001-99"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={cancelarEdicao}>
                Cancelar
              </Button>
              <Button onClick={salvarCliente}>
                {clienteAtual.id ? "Atualizar" : "Salvar"}
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
                placeholder="Buscar clientes..."
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

      {/* Lista de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      ) : modoVisualizacao === "card" ? (
        // Visualização em Cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-primary mb-2">
                      {cliente.nome}
                    </h3>
                    {cliente.codigo && (
                      <p className="text-xs text-muted-foreground/60 bg-muted/30 px-2 py-1 rounded inline-block">
                        Código: {cliente.codigo}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 no-print">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editarCliente(cliente)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setClienteParaExcluir(cliente.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {cliente.nomeContato && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">👤</span>
                      <span className="font-medium">{cliente.nomeContato}</span>
                    </div>
                  )}
                  {cliente.endereco && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">📍</span>
                      <span className="text-muted-foreground">{cliente.endereco}</span>
                    </div>
                  )}
                  {cliente.cnpj && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">🆔</span>
                      <span className="text-muted-foreground">{cliente.cnpj}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Visualização em Lista (Tabela)
        <Card className="print:hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Nome</th>
                    <th className="text-left p-3 text-sm font-semibold">Endereço</th>
                    <th className="text-left p-3 text-sm font-semibold">CNPJ/CPF</th>
                    <th className="text-center p-3 text-sm font-semibold no-print">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-t hover:bg-muted/30"
                    >
                      <td className="p-3">
                        <div className="font-bold text-primary">{cliente.nome}</div>
                        {cliente.codigo && (
                          <div className="text-xs text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded inline-block mt-1">
                            {cliente.codigo}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {cliente.endereco || "-"}
                      </td>
                      <td className="p-3">{cliente.cnpj || "-"}</td>
                      <td className="p-3 text-center no-print">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editarCliente(cliente)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setClienteParaExcluir(cliente.id)}
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">👥 Lista de Clientes</h2>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            Total de Clientes: {clientesFiltrados.length}
          </p>
        </div>

        {/* Tabela para Impressão */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="text-left p-2 border border-gray-300 font-semibold">Nome</th>
              <th className="text-left p-2 border border-gray-300 font-semibold">Contato</th>
              <th className="text-left p-2 border border-gray-300 font-semibold">Endereço</th>
              <th className="text-left p-2 border border-gray-300 font-semibold">CNPJ/CPF</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((cliente) => (
              <tr key={cliente.id} className="border-b border-gray-300">
                <td className="p-2 border border-gray-300">
                  <div className="font-semibold">{cliente.nome}</div>
                  {cliente.codigo && (
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-0.5">
                      {cliente.codigo}
                    </div>
                  )}
                </td>
                <td className="p-2 border border-gray-300">
                  {cliente.nomeContato || "-"}
                </td>
                <td className="p-2 border border-gray-300">
                  {cliente.endereco || "-"}
                </td>
                <td className="p-2 border border-gray-300">
                  {cliente.cnpj || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alert Dialog para confirmação de exclusão */}
      <AlertDialog open={!!clienteParaExcluir} onOpenChange={() => setClienteParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente excluir este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clienteParaExcluir && excluirCliente(clienteParaExcluir)}
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
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}