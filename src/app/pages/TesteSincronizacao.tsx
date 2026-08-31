import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { clientesAPI, type Cliente } from "../services/api";
import { RefreshCw, Zap, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";

export default function TesteSincronizacao() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [sincronizacoes, setSincronizacoes] = useState<string[]>([]);
  const [contadorSinc, setContadorSinc] = useState(0);

  useEffect(() => {
    carregarClientes();

    // Listener para sincronização
    const handleAtualizar = (event?: CustomEvent) => {
      const timestamp = new Date().toLocaleTimeString('pt-BR');
      const mensagem = `🔄 Sincronização recebida às ${timestamp}`;
      
      console.log(`%c${mensagem}`, "background: #084d6e; color: white; font-weight: bold; padding: 4px 8px;");
      
      setSincronizacoes(prev => [mensagem, ...prev.slice(0, 9)]);
      setContadorSinc(prev => prev + 1);
      
      // Recarregar dados
      carregarClientes();
      
      toast.success("Sincronização detectada!", {
        description: "Lista atualizada automaticamente"
      });
    };

    window.addEventListener('clientes-atualizados', handleAtualizar as any);
    window.addEventListener('encomenda-atualizada', handleAtualizar as any);

    console.log("%c🎧 TESTE DE SINCRONIZAÇÃO: Listeners registrados!", "background: #00cc00; color: white; font-weight: bold; padding: 8px;");

    return () => {
      window.removeEventListener('clientes-atualizados', handleAtualizar as any);
      window.removeEventListener('encomenda-atualizada', handleAtualizar as any);
    };
  }, []);

  const carregarClientes = async () => {
    try {
      const dados = await clientesAPI.listar();
      setClientes(dados.sort((a, b) => a.nome.localeCompare(b.nome)));
      console.log(`✅ Clientes carregados: ${dados.length}`);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
    }
  };

  const adicionarCliente = async () => {
    if (!novoNome.trim()) {
      toast.error("Digite um nome para o cliente");
      return;
    }

    try {
      await clientesAPI.criar({
        nome: novoNome,
        endereco: "Teste de Sincronização",
        nomeContato: "Teste",
      });
      
      toast.success("Cliente criado!", {
        description: "Aguarde a sincronização..."
      });
      
      setNovoNome("");
      
      // Aguardar um pouco e recarregar
      setTimeout(carregarClientes, 500);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao criar cliente");
    }
  };

  const excluirCliente = async (id: string, nome: string) => {
    try {
      await clientesAPI.excluir(id);
      
      toast.success(`Cliente "${nome}" excluído!`, {
        description: "Aguarde a sincronização..."
      });
      
      setTimeout(carregarClientes, 500);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente");
    }
  };

  const forcarAtualizacao = () => {
    carregarClientes();
    toast.info("Recarregando manualmente...");
  };

  const dispararEvento = () => {
    window.dispatchEvent(new CustomEvent('clientes-atualizados'));
    toast.info("Evento de sincronização disparado manualmente!");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔄 Teste de Sincronização em Tempo Real</h1>
        <p className="text-muted-foreground">
          Ferramenta para testar a sincronização automática entre múltiplas abas
        </p>
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {clientes.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Clientes Cadastrados
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {contadorSinc}
              </div>
              <div className="text-sm text-muted-foreground">
                Sincronizações Detectadas
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-8 w-8 text-orange-500 animate-pulse" />
              </div>
              <div className="text-sm text-muted-foreground">
                Sincronização Ativa
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Ações de Teste</CardTitle>
          <CardDescription>
            Use estas ações para testar a sincronização em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={forcarAtualizacao} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar Manualmente
            </Button>
            <Button onClick={dispararEvento} variant="outline" className="gap-2">
              <Zap className="h-4 w-4" />
              Disparar Evento Teste
            </Button>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="novoNome" className="mb-2 block">
              Adicionar Cliente de Teste
            </Label>
            <div className="flex gap-2">
              <Input
                id="novoNome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome do cliente..."
                onKeyDown={(e) => e.key === "Enter" && adicionarCliente()}
              />
              <Button onClick={adicionarCliente} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Abra esta página em 2 abas diferentes. Adicione um cliente em uma aba e veja aparecer na outra!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Sincronizações */}
      <Card>
        <CardHeader>
          <CardTitle>📡 Histórico de Sincronizações</CardTitle>
          <CardDescription>
            Últimas 10 sincronizações detectadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sincronizacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma sincronização detectada ainda</p>
              <p className="text-sm mt-2">Adicione ou edite um cliente para testar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sincronizacoes.map((msg, index) => (
                <div
                  key={index}
                  className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-mono">{msg}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>👥 Clientes Atuais ({clientes.length})</CardTitle>
          <CardDescription>
            Esta lista é atualizada automaticamente quando há mudanças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {clientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum cliente cadastrado</p>
              </div>
            ) : (
              clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-primary">{cliente.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {cliente.endereco || "Sem endereço"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => excluirCliente(cliente.id, cliente.nome)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            📋 Como Testar a Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
            <p>Abra esta página em <strong>duas abas diferentes</strong> do navegador</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
            <p>Na <strong>Aba 1</strong>, adicione um novo cliente usando o formulário acima</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
            <p>Observe a <strong>Aba 2</strong> - o novo cliente deve aparecer <strong>automaticamente</strong> em alguns segundos</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
            <p>Você verá uma notificação verde e o contador de sincronizações aumentará</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">5.</span>
            <p>Teste também excluindo clientes - a exclusão sincroniza em tempo real!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
