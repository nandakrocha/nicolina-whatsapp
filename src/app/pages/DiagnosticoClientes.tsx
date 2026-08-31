import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, CheckCircle2, Database, RefreshCw, Download, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DiagnosticoClientes() {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [verificando, setVerificando] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    realizarDiagnostico();
  }, []);

  const realizarDiagnostico = () => {
    setVerificando(true);
    
    try {
      // Verificar localStorage
      const clientesLocal = localStorage.getItem("nicolina_clientes");
      
      let dadosLocal: any[] = [];
      if (clientesLocal) {
        try {
          dadosLocal = JSON.parse(clientesLocal);
        } catch (e) {
          console.error("Erro ao fazer parse dos clientes:", e);
        }
      }

      // Verificar todos os itens do localStorage que contêm "nicolina" ou "cliente"
      const todasChaves: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave && (chave.includes("nicolina") || chave.includes("cliente"))) {
          const valor = localStorage.getItem(chave);
          todasChaves.push({
            chave,
            tamanho: valor?.length || 0,
            preview: valor?.substring(0, 100),
          });
        }
      }

      const resultado = {
        timestamp: new Date().toISOString(),
        localStorage: {
          nicolina_clientes: {
            existe: !!clientesLocal,
            quantidade: dadosLocal.length,
            dados: dadosLocal,
            tamanhoBytes: clientesLocal?.length || 0,
          },
          todasChavesNicolina: todasChaves,
        },
        resumo: {
          totalClientes: dadosLocal.length,
          primeiroCliente: dadosLocal[0] || null,
          ultimoCliente: dadosLocal[dadosLocal.length - 1] || null,
        },
      };

      console.log("🔍 DIAGNÓSTICO COMPLETO:", resultado);
      setDiagnostico(resultado);
      setClientes(dadosLocal);
      
      if (dadosLocal.length > 0) {
        toast.success(`✅ Encontrados ${dadosLocal.length} clientes no localStorage!`);
      } else {
        toast.warning("⚠️ Nenhum cliente encontrado!");
      }
    } catch (error) {
      console.error("❌ Erro no diagnóstico:", error);
      toast.error("Erro ao realizar diagnóstico");
    } finally {
      setVerificando(false);
    }
  };

  const exportarDados = () => {
    if (!diagnostico) return;
    
    const dataStr = JSON.stringify(diagnostico, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diagnostico-clientes-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Diagnóstico exportado!");
  };

  const limparDuplicados = () => {
    if (!diagnostico) return;
    
    try {
      const clientesUnicos = new Map();
      
      clientes.forEach((cliente) => {
        // Usar nome como chave (considerando nome único)
        if (!clientesUnicos.has(cliente.nome)) {
          clientesUnicos.set(cliente.nome, cliente);
        } else {
          // Se já existe, mantém o mais recente
          const existente = clientesUnicos.get(cliente.nome);
          if (new Date(cliente.atualizadoEm || cliente.criadoEm) > new Date(existente.atualizadoEm || existente.criadoEm)) {
            clientesUnicos.set(cliente.nome, cliente);
          }
        }
      });
      
      const clientesLimpos = Array.from(clientesUnicos.values());
      localStorage.setItem("nicolina_clientes", JSON.stringify(clientesLimpos));
      
      toast.success(`✅ Duplicados removidos! ${clientes.length} → ${clientesLimpos.length}`);
      realizarDiagnostico();
    } catch (error) {
      console.error("Erro ao limpar duplicados:", error);
      toast.error("Erro ao limpar duplicados");
    }
  };

  const forcarRecarregamento = () => {
    // Disparar evento de atualização
    window.dispatchEvent(new CustomEvent('clientes-atualizados'));
    toast.success("Evento de atualização disparado!");
    
    setTimeout(() => {
      window.location.href = "/clientes";
    }, 500);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔍 Diagnóstico de Clientes</h1>
        <p className="text-muted-foreground">
          Ferramenta avançada para investigar e recuperar dados de clientes
        </p>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={realizarDiagnostico} disabled={verificando}>
            {verificando ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Diagnóstico
              </>
            )}
          </Button>
          <Button onClick={exportarDados} variant="outline" disabled={!diagnostico}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Diagnóstico
          </Button>
          <Button onClick={limparDuplicados} variant="outline" disabled={!diagnostico || clientes.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Duplicados
          </Button>
          <Button onClick={forcarRecarregamento} variant="default" disabled={!diagnostico || clientes.length === 0}>
            <Eye className="h-4 w-4 mr-2" />
            Forçar Exibição na Página
          </Button>
        </CardContent>
      </Card>

      {/* Resumo */}
      {diagnostico && (
        <>
          <Card className={clientes.length > 0 ? "border-green-500" : "border-orange-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {clientes.length > 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                )}
                Resumo do Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {clientes.length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Clientes Encontrados
                  </div>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {diagnostico.localStorage.nicolina_clientes.tamanhoBytes}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    Bytes no LocalStorage
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {diagnostico.localStorage.todasChavesNicolina.length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Chaves Nicolina no Storage
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Todas as Chaves */}
          <Card>
            <CardHeader>
              <CardTitle>🔑 Todas as Chaves do Sistema</CardTitle>
              <CardDescription>
                Dados armazenados no localStorage relacionados ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnostico.localStorage.todasChavesNicolina.map((item: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-semibold">{item.chave}</span>
                      <span className="text-xs text-muted-foreground">{item.tamanho} bytes</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-background p-2 rounded overflow-x-auto">
                      {item.preview}...
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          {clientes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>👥 Clientes Encontrados ({clientes.length})</CardTitle>
                <CardDescription>
                  Todos os clientes armazenados no localStorage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {clientes.map((cliente, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-muted/50">
                      <div className="font-bold text-primary">{cliente.nome}</div>
                      <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2 mt-2">
                        {cliente.nomeContato && (
                          <div>
                            <span className="font-medium">Contato:</span> {cliente.nomeContato}
                          </div>
                        )}
                        {cliente.telefone && (
                          <div>
                            <span className="font-medium">Telefone:</span> {cliente.telefone}
                          </div>
                        )}
                        {cliente.endereco && (
                          <div className="col-span-2">
                            <span className="font-medium">Endereço:</span> {cliente.endereco}
                          </div>
                        )}
                        {cliente.cnpj && (
                          <div>
                            <span className="font-medium">CNPJ:</span> {cliente.cnpj}
                          </div>
                        )}
                        {cliente.email && (
                          <div>
                            <span className="font-medium">Email:</span> {cliente.email}
                          </div>
                        )}
                        <div className="col-span-2 text-xs">
                          <span className="font-medium">ID:</span> <code>{cliente.id}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle>🔬 Dados Técnicos (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-96">
                {JSON.stringify(diagnostico, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">💡 O que fazer?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>✅ Se encontrou clientes:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Clique em "Forçar Exibição na Página" para ir direto para /clientes</li>
            <li>Se houver duplicados, clique em "Limpar Duplicados" primeiro</li>
            <li>Se ainda não aparecer, exporte o diagnóstico e me envie</li>
          </ol>

          <p className="pt-2">
            <strong>⚠️ Se não encontrou clientes:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Vá em /restaurar-clientes-completo</li>
            <li>Crie a base completa de 20 clientes</li>
            <li>Volte aqui e verifique novamente</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
