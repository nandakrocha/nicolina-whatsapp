import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { isFirebaseConfigured, isDatabaseAvailable } from "../services/firebase";
import { encomendasAPI, produtosAPI, clientesAPI } from "../services/api";
import { Database, HardDrive, RefreshCw, CheckCircle2, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface DiagnosticoInfo {
  firebaseConfigurado: boolean;
  firebaseDisponivel: boolean;
  encomendasLocalStorage: number;
  encomendasFirebase: number;
  produtosLocalStorage: number;
  produtosFirebase: number;
  clientesLocalStorage: number;
  clientesFirebase: number;
  modoAtual: "Firebase" | "LocalStorage";
}

export function DiagnosticoArmazenamento() {
  const [diagnostico, setDiagnostico] = useState<DiagnosticoInfo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const executarDiagnostico = async () => {
    setCarregando(true);
    
    try {
      // Verificar Firebase
      const firebaseConfigurado = isFirebaseConfigured();
      const firebaseDisponivel = isDatabaseAvailable();
      
      // Contar dados no LocalStorage
      const encomendasLocal = JSON.parse(localStorage.getItem("nicolina_encomendas") || "[]");
      const produtosLocal = JSON.parse(localStorage.getItem("nicolina_produtos") || "[]");
      const clientesLocal = JSON.parse(localStorage.getItem("nicolina_clientes") || "[]");
      
      // Tentar buscar dados do Firebase (se configurado)
      let encomendasFb = 0;
      let produtosFb = 0;
      let clientesFb = 0;
      
      if (firebaseConfigurado && firebaseDisponivel) {
        try {
          const encomendas = await encomendasAPI.listar();
          const produtos = await produtosAPI.listar();
          const clientes = await clientesAPI.listar();
          
          encomendasFb = encomendas.length;
          produtosFb = produtos.length;
          clientesFb = clientes.length;
        } catch (error) {
          console.error("Erro ao buscar dados do Firebase:", error);
        }
      }
      
      setDiagnostico({
        firebaseConfigurado,
        firebaseDisponivel,
        encomendasLocalStorage: encomendasLocal.length,
        encomendasFirebase: encomendasFb,
        produtosLocalStorage: produtosLocal.length,
        produtosFirebase: produtosFb,
        clientesLocalStorage: clientesLocal.length,
        clientesFirebase: clientesFb,
        modoAtual: (firebaseConfigurado && firebaseDisponivel) ? "Firebase" : "LocalStorage",
      });
      
    } catch (error) {
      console.error("Erro no diagnóstico:", error);
      toast.error("Erro ao executar diagnóstico");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    executarDiagnostico();
  }, []);
  
  const limparLocalStorage = () => {
    try {
      // Limpar apenas as chaves relacionadas ao sistema
      localStorage.removeItem("nicolina_encomendas");
      localStorage.removeItem("nicolina_produtos");
      localStorage.removeItem("nicolina_clientes");
      localStorage.removeItem("nicolina_usuarios");
      
      toast.success("Dados do LocalStorage limpos com sucesso!");
      setMostrarConfirmacao(false);
      
      // Atualizar diagnóstico
      setTimeout(() => {
        executarDiagnostico();
      }, 500);
    } catch (error) {
      console.error("Erro ao limpar LocalStorage:", error);
      toast.error("Erro ao limpar dados do LocalStorage");
    }
  };

  if (carregando || !diagnostico) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Analisando armazenamento...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Diagnóstico de Armazenamento
        </CardTitle>
        <CardDescription>
          Verifique onde seus dados estão sendo salvos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status do Firebase */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Conexão Firebase
          </h3>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Firebase Configurado</span>
              {diagnostico.firebaseConfigurado ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Sim
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Não
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Firebase Online</span>
              {diagnostico.firebaseDisponivel ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Desconectado
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Modo de Armazenamento Atual */}
        <div className="p-4 rounded-lg bg-[#084d6e]/10 border-2 border-[#084d6e]">
          <div className="flex items-center gap-3">
            {diagnostico.modoAtual === "Firebase" ? (
              <>
                <Database className="h-8 w-8 text-[#084d6e]" />
                <div>
                  <p className="font-bold text-[#084d6e]">Modo Ativo: Firebase ☁️</p>
                  <p className="text-sm text-muted-foreground">
                    Dados salvos automaticamente na nuvem
                  </p>
                </div>
              </>
            ) : (
              <>
                <HardDrive className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-bold text-orange-600">Modo Ativo: LocalStorage 💾</p>
                  <p className="text-sm text-muted-foreground">
                    Dados salvos apenas no navegador
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Comparação de Dados */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            📊 Dados por Local
          </h3>
          
          <div className="space-y-2">
            {/* Encomendas */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <span className="text-sm font-medium">Encomendas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">LocalStorage</p>
                  <p className="text-sm font-bold">{diagnostico.encomendasLocalStorage}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Firebase</p>
                  <p className="text-sm font-bold text-[#084d6e]">{diagnostico.encomendasFirebase}</p>
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍞</span>
                <span className="text-sm font-medium">Produtos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">LocalStorage</p>
                  <p className="text-sm font-bold">{diagnostico.produtosLocalStorage}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Firebase</p>
                  <p className="text-sm font-bold text-[#084d6e]">{diagnostico.produtosFirebase}</p>
                </div>
              </div>
            </div>

            {/* Clientes */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <span className="text-sm font-medium">Clientes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">LocalStorage</p>
                  <p className="text-sm font-bold">{diagnostico.clientesLocalStorage}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Firebase</p>
                  <p className="text-sm font-bold text-[#084d6e]">{diagnostico.clientesFirebase}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta se não estiver usando Firebase */}
        {diagnostico.modoAtual === "LocalStorage" && (
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                  ⚠️ Você está usando apenas LocalStorage
                </p>
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  Seus dados estão salvos apenas neste navegador. Se você limpar o cache ou acessar 
                  de outro dispositivo, os dados não estarão disponíveis.
                </p>
                <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                  👉 Configure o Firebase para ter backup automático na nuvem!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão Atualizar */}
        <Button
          onClick={executarDiagnostico}
          variant="outline"
          className="w-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Diagnóstico
        </Button>
        
        {/* Botão Limpar LocalStorage - Só aparece se tiver dados */}
        {(diagnostico.encomendasLocalStorage > 0 || 
          diagnostico.produtosLocalStorage > 0 || 
          diagnostico.clientesLocalStorage > 0) && (
          <Button
            onClick={() => setMostrarConfirmacao(true)}
            variant="destructive"
            className="w-full gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Dados do LocalStorage
          </Button>
        )}
      </CardContent>
      
      {/* AlertDialog de Confirmação */}
      <AlertDialog open={mostrarConfirmacao} onOpenChange={setMostrarConfirmacao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              ⚠️ Confirmar Limpeza de Dados
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                Esta ação é IRREVERSÍVEL!
              </p>
              <p>
                Você está prestes a deletar todos os dados salvos no LocalStorage do navegador:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>📦 {diagnostico.encomendasLocalStorage} encomendas</li>
                <li>🍞 {diagnostico.produtosLocalStorage} produtos</li>
                <li>👥 {diagnostico.clientesLocalStorage} clientes</li>
              </ul>
              <p className="text-sm font-medium text-destructive">
                ⚠️ Certifique-se de que você já migrou esses dados para o Firebase ou fez um backup antes de continuar!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={limparLocalStorage}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, Limpar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}